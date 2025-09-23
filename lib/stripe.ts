import Stripe from "stripe";

import { env, getRequiredEnv } from "@/lib/env";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-08-27.basil";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!stripeClient) {
    const secretKey = getRequiredEnv("STRIPE_SECRET_KEY");
    stripeClient = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
    });
  }

  return stripeClient;
}

export function ensureStripeConfigured() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.");
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook secret missing. Set STRIPE_WEBHOOK_SECRET in your environment.");
  }
}
