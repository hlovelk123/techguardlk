import Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { mapStripeStatus } from "@/lib/subscription-status";

const statuses: Array<[Stripe.Subscription.Status, string]> = [
  ["active", "active"],
  ["trialing", "trialing"],
  ["past_due", "past_due"],
  ["canceled", "canceled"],
  ["incomplete", "past_due"],
  ["unpaid", "past_due"],
];

describe("mapStripeStatus", () => {
  it.each(statuses)("maps %s", (status, expected) => {
    expect(mapStripeStatus(status)).toBe(expected);
  });

  it("defaults to active for unknown statuses", () => {
    expect(mapStripeStatus("unknown" as Stripe.Subscription.Status)).toBe("active");
  });
});
