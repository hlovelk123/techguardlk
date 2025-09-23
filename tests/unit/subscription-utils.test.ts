import { describe, expect, it } from "vitest";

import { allocationSummary, monthlyFromAnnual, transitionStatus } from "@/lib/subscription-utils";
import { EntitlementStatus, SubscriptionStatus } from "@prisma/client";

describe("monthlyFromAnnual", () => {
  it("converts annual price to monthly rounding", () => {
    expect(monthlyFromAnnual(12000)).toBe(1000);
    expect(monthlyFromAnnual(9999)).toBe(833);
  });
});

describe("allocationSummary", () => {
  it("calculates assigned and available seats", () => {
    const result = allocationSummary(5, [
      EntitlementStatus.assigned,
      EntitlementStatus.assigned,
      EntitlementStatus.unassigned,
    ]);
    expect(result.assigned).toBe(2);
    expect(result.available).toBe(3);
    expect(result.overProvisioned).toBe(false);
  });

  it("detects over provisioning", () => {
    const result = allocationSummary(1, [
      EntitlementStatus.assigned,
      EntitlementStatus.assigned,
    ]);
    expect(result.overProvisioned).toBe(true);
    expect(result.available).toBe(0);
  });
});

describe("transitionStatus", () => {
  it("handles payment failure and recovery", () => {
    const pastDue = transitionStatus(SubscriptionStatus.active, "payment_failed");
    expect(pastDue).toBe(SubscriptionStatus.past_due);
    const recovered = transitionStatus(pastDue, "payment_caught_up");
    expect(recovered).toBe(SubscriptionStatus.active);
  });

  it("handles cancellation and reactivation", () => {
    const canceled = transitionStatus(SubscriptionStatus.active, "cancel");
    expect(canceled).toBe(SubscriptionStatus.canceled);
    const reactivated = transitionStatus(canceled, "reactivate");
    expect(reactivated).toBe(SubscriptionStatus.active);
  });
});
