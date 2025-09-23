import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatCurrency, formatSeatCapacity } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Plans | TechGuard",
  description: "Browse plans from curated digital providers and manage your seats with TechGuard.",
};

async function getPlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true, provider: { isActive: true } },
    include: {
      provider: true,
    },
    orderBy: [
      { provider: { name: "asc" } },
      { priceCents: "asc" },
    ],
  });

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceCents: plan.priceCents,
    interval: plan.interval,
    seatCapacityPerPurchase: plan.seatCapacityPerPurchase,
    provider: {
      id: plan.provider.id,
      name: plan.provider.name,
    },
  }));
}

export default async function PlansPage() {
  const plans = await getPlans();

  if (plans.length === 0) {
    notFound();
  }

  return (
    <div className="bg-muted/20 py-16">
      <div className="container space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose the right plan</h1>
          <p className="text-muted-foreground">
            Transparent pricing across premium providers. Purchase once, assign seats instantly.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="flex h-full flex-col rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">
                  {plan.provider.name}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {formatSeatCapacity(plan.seatCapacityPerPurchase)}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">{plan.name}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-6">
                <p className="text-3xl font-bold">
                  {formatCurrency(plan.priceCents)}
                  <span className="text-base font-medium text-muted-foreground"> / {plan.interval}</span>
                </p>
              </div>
              <div className="mt-8">
                <Button asChild className="w-full">
                  <Link href={`/plans/${plan.id}`}>View details</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
