import { notFound } from "next/navigation";

import { CancelSubscriptionButton } from "@/components/subscriptions/cancel-subscription-button";
import { ChangeQuantityForm } from "@/components/subscriptions/change-quantity-form";
import { AssignSeatForm } from "@/components/subscriptions/entitlements/assign-seat-form";
import { EntitlementsTable } from "@/components/subscriptions/entitlements/entitlements-table";
import { ResumeSubscriptionButton } from "@/components/subscriptions/resume-subscription-button";
import { SubscriptionStatusBadge } from "@/components/subscriptions/subscription-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAuthSession } from "@/lib/auth";
import { formatCurrency, formatDate, formatSeatCapacity } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

interface SubscriptionDetailPageProps {
  params: { subscriptionId: string };
}

async function getSubscription(subscriptionId: string, userId: string) {
  return prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
    include: {
      plan: {
        include: {
          provider: true,
        },
      },
      entitlements: {
        orderBy: { createdAt: "asc" },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const session = await getAuthSession();

  if (!session) {
    return null;
  }

  const subscription = await getSubscription(params.subscriptionId, session.user.id);

  if (!subscription) {
    notFound();
  }

  const assignedSeats = subscription.entitlements.filter((seat) => seat.status === "assigned").length;
  const availableSeats = subscription.entitlements.filter((seat) => seat.status === "unassigned").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{subscription.plan.name}</h1>
          <p className="text-muted-foreground">
            {subscription.plan.provider.name} • {formatCurrency(subscription.plan.priceCents)} / {subscription.plan.interval}
          </p>
        </div>
        <SubscriptionStatusBadge status={subscription.status} />
      </div>

      {subscription.cancelAtPeriodEnd ? (
        <Alert variant="warning">
          <AlertTitle>Subscription scheduled for cancellation</AlertTitle>
          <AlertDescription>
            Billing will stop after {formatDate(subscription.currentPeriodEnd)} unless you resume before that date.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seat allocation</CardTitle>
              <CardDescription>
                {formatSeatCapacity(subscription.quantity)} total • {assignedSeats} assigned • {availableSeats} available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ChangeQuantityForm
                subscriptionId={subscription.id}
                defaultQuantity={subscription.quantity}
              />
              <Separator />
              <AssignSeatForm subscriptionId={subscription.id} />
              <Separator />
              <EntitlementsTable
                subscriptionId={subscription.id}
                entitlements={subscription.entitlements}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent billing</CardTitle>
              <CardDescription>Latest payments and invoices for this subscription.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {subscription.orders.length === 0 ? (
                <p className="text-muted-foreground">No completed payments yet.</p>
              ) : (
                subscription.orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{formatCurrency(order.amountCents)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{order.status}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Renews on</span>
                <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Started</span>
                <span className="font-medium">{formatDate(subscription.startDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stripe reference</span>
                <span className="font-mono text-xs">{subscription.stripeSubscriptionId ?? "–"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing actions</CardTitle>
              <CardDescription>
                Cancel to stop billing at the end of the period or resume if previously scheduled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription.cancelAtPeriodEnd ? (
                <ResumeSubscriptionButton subscriptionId={subscription.id} />
              ) : (
                <CancelSubscriptionButton subscriptionId={subscription.id} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
