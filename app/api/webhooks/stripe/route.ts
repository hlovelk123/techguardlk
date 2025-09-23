import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { getRequiredEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { ensureStripeConfigured, getStripeClient } from "@/lib/stripe";
import { handleStripeEvent } from "@/lib/stripe/webhook-handlers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    ensureStripeConfigured();
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Stripe not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ message: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      getRequiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid Stripe signature" },
      { status: 400 },
    );
  }

  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { externalId: event.id },
  });

  if (existingEvent?.processedAt) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const webhookEventRecord = existingEvent
    ? await prisma.webhookEvent.update({
        where: { id: existingEvent.id },
        data: {
          payload: JSON.parse(rawBody),
          eventType: event.type,
        },
      })
    : await prisma.webhookEvent.create({
        data: {
          externalId: event.id,
          source: "stripe",
          eventType: event.type,
          payload: JSON.parse(rawBody),
        },
      });

  try {
    await handleStripeEvent(event);
  } catch (error) {
    console.error("Stripe webhook handling failed", error);
    return NextResponse.json(
      { message: "Failed to process webhook." },
      { status: 500 },
    );
  }

  await prisma.webhookEvent.update({
    where: { id: webhookEventRecord.id },
    data: { processedAt: new Date() },
  });

  return NextResponse.json({ received: true });
}
