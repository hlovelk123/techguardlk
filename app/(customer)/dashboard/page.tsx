import Link from "next/link";

import { SubscriptionSummaryCard } from "@/components/subscriptions/subscription-summary-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getDashboardData(userId: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: {
      plan: {
        include: {
          provider: true,
        },
      },
      entitlements: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return subscriptions.map((subscription) => {
    const assignedSeats = subscription.entitlements.filter((seat) => seat.status === "assigned").length;

    return {
      id: subscription.id,
      planName: subscription.plan.name,
      providerName: subscription.plan.provider.name,
      status: subscription.status,
      priceCents: subscription.plan.priceCents,
      interval: subscription.plan.interval,
      currentPeriodEnd: subscription.currentPeriodEnd,
      quantity: subscription.quantity,
      assignedSeats,
    };
  });
}

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session) {
    return null;
  }

  const subscriptions = await getDashboardData(session.user.id);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Manage your seat-based subscriptions, assign entitlements to teammates, and keep track of
            billing all from one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/plans">Browse new plans</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/orders">View payment history</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {subscriptions.length === 0 ? (
        <Alert variant="info">
          <AlertTitle>No active subscriptions</AlertTitle>
          <AlertDescription>
            Purchase your first plan to unlock centralized seat assignment and streamlined billing via
            TechGuard.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {subscriptions.map((subscription) => (
            <SubscriptionSummaryCard key={subscription.id} {...subscription} />
          ))}
        </div>
      )}
    </div>
  );
}
