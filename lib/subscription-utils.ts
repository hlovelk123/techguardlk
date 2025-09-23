import { EntitlementStatus, SubscriptionStatus } from "@prisma/client";

export function monthlyFromAnnual(annualCents: number) {
  return Math.round(annualCents / 12);
}

export function allocationSummary(totalSeats: number, entitlements: EntitlementStatus[]) {
  const assigned = entitlements.filter((status) => status === EntitlementStatus.assigned).length;
  const available = totalSeats - assigned;
  return {
    assigned,
    available: available < 0 ? 0 : available,
    overProvisioned: available < 0,
  };
}

export function transitionStatus(current: SubscriptionStatus, event: "payment_failed" | "payment_caught_up" | "cancel" | "reactivate") {
  switch (event) {
    case "payment_failed":
      return SubscriptionStatus.past_due;
    case "payment_caught_up":
      return current === SubscriptionStatus.past_due ? SubscriptionStatus.active : current;
    case "cancel":
      return SubscriptionStatus.canceled;
    case "reactivate":
      return current === SubscriptionStatus.canceled ? SubscriptionStatus.active : current;
    default:
      return current;
  }
}
