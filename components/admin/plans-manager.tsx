"use client";

import type { Plan, Provider } from "@prisma/client";
import { useMemo, useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PlansManagerProps {
  plans: (Plan & { provider: Provider })[];
  providers: Provider[];
}

const intervals: Array<{ value: Plan["interval"]; label: string }> = [
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

export function PlansManager({ plans: initialPlans, providers }: PlansManagerProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [form, setForm] = useState({
    providerId: providers[0]?.id ?? "",
    name: "",
    description: "",
    interval: "month" as Plan["interval"],
    priceCents: 1000,
    seatCapacityPerPurchase: 1,
    stripePriceId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = useMemo(() => {
    return Boolean(form.providerId && form.name.trim().length >= 3 && form.description.trim().length >= 10);
  }, [form]);

  const refreshPlans = async () => {
    const response = await fetch("/api/admin/plans");
    const data = await response.json();
    setPlans(data.plans ?? []);
  };

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/plans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            priceCents: Number(form.priceCents),
            seatCapacityPerPurchase: Number(form.seatCapacityPerPurchase),
            stripePriceId: form.stripePriceId || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to create plan.");
        }

        setForm({
          providerId: providers[0]?.id ?? "",
          name: "",
          description: "",
          interval: "month",
          priceCents: 1000,
          seatCapacityPerPurchase: 1,
          stripePriceId: "",
        });
        await refreshPlans();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  const togglePlan = (planId: string, isActive: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/plans/${planId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !isActive }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to update plan.");
        }

        await refreshPlans();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <select
            id="provider"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.providerId}
            onChange={(event) => setForm((previous) => ({ ...previous, providerId: event.target.value }))}
          >
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="interval">Billing interval</Label>
          <select
            id="interval"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.interval}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, interval: event.target.value as Plan["interval"] }))
            }
          >
            {intervals.map((interval) => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Plan name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            placeholder="Plan name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={form.description}
            onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
            placeholder="Describe the plan"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (cents)</Label>
          <Input
            id="price"
            type="number"
            min={100}
            value={form.priceCents}
            onChange={(event) => setForm((previous) => ({ ...previous, priceCents: Number(event.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seat">Seats per purchase</Label>
          <Input
            id="seat"
            type="number"
            min={1}
            value={form.seatCapacityPerPurchase}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, seatCapacityPerPurchase: Number(event.target.value) }))
            }
          />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="stripePriceId">Stripe price ID (optional)</Label>
          <Input
            id="stripePriceId"
            value={form.stripePriceId}
            onChange={(event) => setForm((previous) => ({ ...previous, stripePriceId: event.target.value }))}
            placeholder="price_..."
          />
        </div>
      </div>
      <Button disabled={isPending || !canSubmit} onClick={handleCreate}>
        Create plan
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Interval</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Seats</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>{plan.name}</TableCell>
              <TableCell>{plan.provider.name}</TableCell>
              <TableCell className="capitalize">{plan.interval}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: plan.currency.toUpperCase(),
                }).format(plan.priceCents / 100)}
              </TableCell>
              <TableCell>{plan.seatCapacityPerPurchase}</TableCell>
              <TableCell>{plan.isActive ? "Active" : "Inactive"}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => togglePlan(plan.id, plan.isActive)}
                >
                  {plan.isActive ? "Deactivate" : "Activate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
