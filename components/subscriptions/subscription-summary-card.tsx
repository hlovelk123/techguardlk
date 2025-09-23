import { SubscriptionStatus } from "@prisma/client";
import Link from "next/link";

import { SubscriptionStatusBadge } from "@/components/subscriptions/subscription-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatSeatCapacity } from "@/lib/formatters";

interface SubscriptionSummaryCardProps {
  id: string;
  planName: string;
  providerName: string;
  status: SubscriptionStatus;
  priceCents: number;
  interval: string;
  currentPeriodEnd: Date;
  quantity: number;
  assignedSeats: number;
}

export function SubscriptionSummaryCard({
  id,
  planName,
  providerName,
  status,
  priceCents,
  interval,
  currentPeriodEnd,
  quantity,
  assignedSeats,
}: SubscriptionSummaryCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{planName}</CardTitle>
            <CardDescription>{providerName}</CardDescription>
          </div>
          <SubscriptionStatusBadge status={status} />
        </div>
        <div className="text-2xl font-semibold">
          {formatCurrency(priceCents)}
          <span className="text-base font-medium text-muted-foreground"> / {interval}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Seats</span>
            <p className="font-medium">{formatSeatCapacity(quantity)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Assigned</span>
            <p className="font-medium">
              {assignedSeats} / {quantity}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Renews on</span>
            <p className="font-medium">{formatDate(currentPeriodEnd)}</p>
          </div>
        </div>
        <Separator />
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground">
          Subscription ID
          <span className="block font-mono text-foreground">{id}</span>
        </div>
        <Button asChild>
          <Link href={`/subscriptions/${id}`}>Manage</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
