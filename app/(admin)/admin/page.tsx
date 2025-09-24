import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatCurrency } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

function normalizeMrr(priceCents: number, interval: "month" | "year") {
  if (interval === "year") {
    return Math.round(priceCents / 12);
  }
  return priceCents;
}

async function getMetrics() {
  const [activeSubscriptions, failedOrdersLast30, canceledLast90, totalSubscriptions] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: { in: ["active", "trialing"] } },
      include: {
        plan: true,
      },
    }),
    prisma.order.count({
      where: {
        status: "failed",
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.subscription.count({
      where: {
        canceledAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.subscription.count(),
  ]);

  const mrrCents = activeSubscriptions.reduce((acc, subscription) => {
    const base = normalizeMrr(subscription.plan.priceCents, subscription.plan.interval) * subscription.quantity;
    return acc + base;
  }, 0);

  const churnRate = totalSubscriptions === 0 ? 0 : (canceledLast90 / totalSubscriptions) * 100;

  return {
    mrrCents,
    activeCount: activeSubscriptions.length,
    churnRate,
    failedPayments: failedOrdersLast30,
  };
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const metrics = await getMetrics();

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>MRR</CardTitle>
          <CardDescription>Monthly recurring revenue across active subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {formatCurrency(metrics.mrrCents)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active subscriptions</CardTitle>
          <CardDescription>Currently active or trialing subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">{metrics.activeCount}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Churn (90d)</CardTitle>
          <CardDescription>Subscriptions canceled in the last 90 days</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {metrics.churnRate.toFixed(1)}%
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Failed payments (30d)</CardTitle>
          <CardDescription>Orders that failed to bill in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">{metrics.failedPayments}</CardContent>
      </Card>
    </div>
  );
}
