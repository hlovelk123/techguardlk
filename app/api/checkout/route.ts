import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { getAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { ensureStripeConfigured, getStripeClient } from "@/lib/stripe";

const checkoutRequestSchema = z.object({
  planId: z.string().cuid(),
  quantity: z.number().int().min(1).max(100).default(1),
});

function resolveBaseUrl(request: NextRequest) {
  return (
    request.headers.get("origin") ??
    env.NEXT_PUBLIC_APP_URL ??
    (env.NODE_ENV === "development" ? "http://localhost:3000" : undefined) ??
    "http://localhost:3000"
  );
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ message: "You must be signed in to checkout." }, { status: 401 });
  }

  try {
    ensureStripeConfigured();
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Stripe configuration missing." },
      { status: 500 },
    );
  }

  let body: z.infer<typeof checkoutRequestSchema>;

  try {
    const json = await request.json();
    body = checkoutRequestSchema.parse(json);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid request payload.",
        details: error instanceof z.ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }

  const [user, plan] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.plan.findFirst({
      where: {
        id: body.planId,
        isActive: true,
        provider: { isActive: true },
      },
      include: {
        provider: true,
      },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  if (!plan) {
    return NextResponse.json({ message: "Plan unavailable." }, { status: 404 });
  }

  if (!plan.stripePriceId) {
    return NextResponse.json(
      {
        message: "Plan is not configured for checkout. Please contact support.",
      },
      { status: 422 },
    );
  }

  const stripe = getStripeClient();

  let stripeCustomerId = user.stripeCustomerId ?? undefined;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: {
        userId: user.id,
      },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId },
    });
  }

  const successUrl = `${resolveBaseUrl(request)}/dashboard?checkout=success`;
  const cancelUrl = `${resolveBaseUrl(request)}/plans/${plan.id}?checkout=cancelled`;

  const amountCents = plan.priceCents * body.quantity;

  const sessionMetadata = {
    userId: user.id,
    planId: plan.id,
    quantity: String(body.quantity),
  } satisfies Record<string, string>;

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: sessionMetadata,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: body.quantity,
      },
    ],
    subscription_data: {
      metadata: sessionMetadata,
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      planId: plan.id,
      amountCents,
      currency: plan.currency,
      status: "pending",
      stripeCheckoutSessionId: stripeSession.id,
    },
  });

  await writeAuditLog({
    action: "order.pending",
    entityType: "order",
    entityId: order.id,
    actorType: "user",
    actorUserId: user.id,
    changes: {
      planId: plan.id,
      amountCents,
      stripeCheckoutSessionId: stripeSession.id,
    },
  });

  return NextResponse.json({ url: stripeSession.url }, { status: 200 });
}
