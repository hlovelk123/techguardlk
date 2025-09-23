import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PurchaseButton } from "@/app/plans/[planId]/purchase-button";
import { formatCurrency, formatSeatCapacity } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

interface PlanPageProps {
  params: { planId: string };
}

async function getPlan(planId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId, isActive: true },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!plan || !plan.provider?.isActive) {
    return null;
  }

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceCents: plan.priceCents,
    interval: plan.interval,
    seatCapacityPerPurchase: plan.seatCapacityPerPurchase,
    provider: plan.provider,
  };
}

export async function generateMetadata({ params }: PlanPageProps): Promise<Metadata> {
  const plan = await getPlan(params.planId);

  if (!plan) {
    return {
      title: "Plan not found | TechGuard",
    };
  }

  return {
    title: `${plan.name} | TechGuard`,
    description: plan.description,
  };
}

export default async function PlanDetailPage({ params }: PlanPageProps) {
  const plan = await getPlan(params.planId);

  if (!plan) {
    notFound();
  }

  return (
    <div className="bg-muted/20 py-16">
      <div className="container grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-primary">
            {plan.provider.name}
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{plan.name}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{plan.description}</p>
          </div>
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <h2 className="text-lg font-semibold">What&apos;s included</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Seat capacity: {formatSeatCapacity(plan.seatCapacityPerPurchase)}</li>
              <li>• Provider support and governance via TechGuard</li>
              <li>• Centralized entitlement assignment</li>
              <li>• Billing managed securely with Stripe</li>
            </ul>
          </div>
        </div>

        <aside className="h-max rounded-lg border bg-background p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Price</p>
            <p className="text-3xl font-bold">
              {formatCurrency(plan.priceCents)}
              <span className="text-base font-medium text-muted-foreground"> / {plan.interval}</span>
            </p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            You&apos;ll be able to assign up to {formatSeatCapacity(plan.seatCapacityPerPurchase)} after checkout.
          </p>
          <div className="mt-6">
            <PurchaseButton planId={plan.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
