import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { syncSubscriptionFromStripe } from "@/lib/stripe/webhook-handlers";

const updateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("change_quantity"),
    quantity: z.number().int().min(1).max(100),
  }),
  z.object({
    action: z.literal("cancel"),
  }),
  z.object({
    action: z.literal("resume"),
  }),
]);

export async function GET(
  _request: NextRequest,
  { params }: { params: { subscriptionId: string } },
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: params.subscriptionId,
      userId: session.user.id,
    },
    include: {
      plan: {
        include: {
          provider: true,
        },
      },
      entitlements: {
        orderBy: { createdAt: "asc" },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!subscription) {
    return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
  }

  return NextResponse.json({ subscription });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { subscriptionId: string } },
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      id: params.subscriptionId,
      userId: session.user.id,
    },
  });

  if (!dbSubscription) {
    return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
  }

  if (!dbSubscription.stripeSubscriptionId) {
    return NextResponse.json(
      { message: "Subscription is not linked to Stripe." },
      { status: 400 },
    );
  }

  let body: z.infer<typeof updateSchema>;

  try {
    const json = await request.json();
    body = updateSchema.parse(json);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid request payload",
        details: error instanceof z.ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }

  const stripe = getStripeClient();

  let updatedStripeSubscription: Stripe.Subscription | null = null;

  switch (body.action) {
    case "change_quantity": {
      const subscription = await stripe.subscriptions.retrieve(dbSubscription.stripeSubscriptionId, {
        expand: ["items.data"],
      });

      const item = subscription.items.data[0];
      if (!item) {
        return NextResponse.json(
          { message: "Unable to locate subscription item." },
          { status: 400 },
        );
      }

      await stripe.subscriptionItems.update(item.id, {
        quantity: body.quantity,
      });

      updatedStripeSubscription = await stripe.subscriptions.retrieve(subscription.id, {
        expand: ["items.data.price"],
      });
      break;
    }
    case "cancel": {
      updatedStripeSubscription = await stripe.subscriptions.update(
        dbSubscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
          expand: ["items.data.price"],
        },
      );
      break;
    }
    case "resume": {
      updatedStripeSubscription = await stripe.subscriptions.update(
        dbSubscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
          expand: ["items.data.price"],
        },
      );
      break;
    }
    default:
      break;
  }

  if (!updatedStripeSubscription) {
    return NextResponse.json({ message: "Unable to update subscription" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await syncSubscriptionFromStripe(tx, {
      subscription: updatedStripeSubscription!,
      userId: dbSubscription.userId,
      planId: dbSubscription.planId,
    });
  });

  const freshSubscription = await prisma.subscription.findUnique({
    where: { id: dbSubscription.id },
    include: {
      plan: {
        include: {
          provider: true,
        },
      },
      entitlements: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ subscription: freshSubscription });
}
