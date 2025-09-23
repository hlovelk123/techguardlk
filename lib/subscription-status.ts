import { SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
  incomplete: SubscriptionStatus.past_due,
  incomplete_expired: SubscriptionStatus.expired,
  trialing: SubscriptionStatus.trialing,
  active: SubscriptionStatus.active,
  past_due: SubscriptionStatus.past_due,
  canceled: SubscriptionStatus.canceled,
  unpaid: SubscriptionStatus.past_due,
  paused: SubscriptionStatus.past_due,
};

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  return statusMap[status] ?? SubscriptionStatus.active;
}
