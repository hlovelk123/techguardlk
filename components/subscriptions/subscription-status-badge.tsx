import { SubscriptionStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const statusLabel: Record<SubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past Due",
  canceled: "Canceled",
  expired: "Expired",
};

const statusVariant: Record<SubscriptionStatus, "success" | "default" | "warning" | "destructive" | "neutral"> = {
  trialing: "warning",
  active: "success",
  past_due: "warning",
  canceled: "neutral",
  expired: "destructive",
};

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
}

export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  return <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>;
}
