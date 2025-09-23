import type { Prisma } from "@prisma/client";
import {
  EntitlementStatus,
  OrderStatus,
  SubscriptionStatus,
} from "@prisma/client";
import type Stripe from "stripe";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { mapStripeStatus } from "@/lib/subscription-status";

export type TransactionClient = Prisma.TransactionClient;

export async function syncEntitlements(
  tx: TransactionClient,
  subscriptionId: string,
  targetQuantity: number,
) {
  const entitlements = await tx.entitlement.findMany({
    where: { subscriptionId },
    orderBy: { createdAt: "asc" },
  });

  if (entitlements.length === targetQuantity) {
    return;
  }

  if (entitlements.length < targetQuantity) {
    const toCreate = targetQuantity - entitlements.length;
    await tx.entitlement.createMany({
      data: Array.from({ length: toCreate }, () => ({
        subscriptionId,
        status: EntitlementStatus.unassigned,
      })),
    });
    return;
  }

  const toRevoke = entitlements.slice(targetQuantity);
  if (toRevoke.length > 0) {
    await tx.entitlement.updateMany({
      where: { id: { in: toRevoke.map((item) => item.id) } },
      data: { status: EntitlementStatus.revoked },
    });
  }
}

function getSubscriptionQuantity(subscription: Stripe.Subscription, fallback: number) {
  const stripeQuantity = subscription.items.data[0]?.quantity;
  return stripeQuantity ?? fallback;
}

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price?.id ?? undefined;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.current_period_end ?? subscription.start_date;
}

function extractSubscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const parent = invoice.parent as Stripe.Invoice.Parent | null | undefined;
  const subscriptionRef = parent?.subscription_details?.subscription;

  if (!subscriptionRef) {
    return undefined;
  }

  return typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;
}

export async function syncSubscriptionFromStripe(
  tx: TransactionClient,
  params: {
    subscription: Stripe.Subscription;
    userId: string;
    planId: string;
    orderId?: string;
    fallbackQuantity?: number;
  },
) {
  const { subscription, userId, planId, orderId, fallbackQuantity } = params;
  const stripeSubscriptionId = subscription.id;
  const quantity = getSubscriptionQuantity(subscription, fallbackQuantity ?? 1);
  const priceId = getSubscriptionPriceId(subscription);

  const currentPeriodEndEpoch = getSubscriptionPeriodEnd(subscription);

  const subscriptionData = {
    userId,
    planId,
    status: mapStripeStatus(subscription.status),
    quantity,
    priceId: priceId ?? null,
    stripeSubscriptionId,
    startDate: new Date(subscription.start_date * 1000),
    currentPeriodEnd: new Date(currentPeriodEndEpoch * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    canceledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  } satisfies Parameters<typeof tx.subscription.upsert>[0]["update"];

  const dbSubscription = await tx.subscription.upsert({
    where: { stripeSubscriptionId },
    update: subscriptionData,
    create: subscriptionData,
  });

  if (orderId) {
    await tx.order.update({
      where: { id: orderId },
      data: { subscriptionId: dbSubscription.id, status: OrderStatus.paid },
    });
  }

  await syncEntitlements(tx, dbSubscription.id, quantity);

  await writeAuditLog({
    action: "subscription.sync",
    entityType: "subscription",
    entityId: dbSubscription.id,
    actorType: "system",
    changes: {
      status: dbSubscription.status,
      quantity,
      stripeSubscriptionId,
    },
    client: tx,
  });
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const stripe = getStripeClient();

  if (!session.subscription) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
    expand: ["items.data.price"],
  });

  const metadata = session.metadata ?? {};
  const orderId = metadata.orderId ?? undefined;
  const planId = metadata.planId ?? undefined;
  const userId = metadata.userId ?? undefined;
  const quantityFromMetadata = metadata.quantity ? Number(metadata.quantity) : undefined;

  if (!planId || !userId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { stripeCheckoutSessionId: session.id },
      include: {
        plan: true,
      },
    });

    if (order && order.status !== OrderStatus.paid) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.paid,
        },
      });

      await writeAuditLog({
        action: "order.paid",
        entityType: "order",
        entityId: order.id,
        actorType: "system",
        changes: {
          stripeCheckoutSessionId: session.id,
          amountCents: order.amountCents,
        },
        client: tx,
      });
    }

    await syncSubscriptionFromStripe(tx, {
      subscription,
      userId,
      planId,
      orderId: order?.id ?? orderId,
      fallbackQuantity: quantityFromMetadata,
    });
  });
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = extractSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    return;
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });

  await prisma.$transaction(async (tx) => {
    const dbSubscription = await tx.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!dbSubscription) {
      return;
    }

    await syncSubscriptionFromStripe(tx, {
      subscription,
      userId: dbSubscription.userId,
      planId: dbSubscription.planId,
    });
  });
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = extractSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const dbSubscription = await tx.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!dbSubscription) {
      return;
    }

    await tx.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: SubscriptionStatus.past_due,
      },
    });

    await writeAuditLog({
      action: "subscription.payment_failed",
      entityType: "subscription",
      entityId: dbSubscription.id,
      changes: {
        stripeInvoiceId: invoice.id,
      },
      client: tx,
    });
  });
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existing) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await syncSubscriptionFromStripe(tx, {
      subscription,
      userId: existing.userId,
      planId: existing.planId,
    });
  });
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existing) {
      return;
    }

    await tx.subscription.update({
      where: { id: existing.id },
      data: {
        status: SubscriptionStatus.canceled,
        canceledAt: new Date(),
      },
    });

    await tx.entitlement.updateMany({
      where: { subscriptionId: existing.id },
      data: { status: EntitlementStatus.revoked },
    });

    await writeAuditLog({
      action: "subscription.canceled",
      entityType: "subscription",
      entityId: existing.id,
      client: tx,
      changes: {
        stripeSubscriptionId: subscription.id,
      },
    });
  });
}

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event);
      break;
    default:
      break;
  }
}
