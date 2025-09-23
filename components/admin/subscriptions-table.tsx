"use client";

import type { Plan, Provider, Subscription, User } from "@prisma/client";
import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SubscriptionsTableProps {
  subscriptions: (Subscription & { user: User; plan: Plan & { provider: Provider } })[];
}

export function AdminSubscriptionsTable({ subscriptions: initial }: SubscriptionsTableProps) {
  const [subscriptions, setSubscriptions] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = async () => {
    const response = await fetch("/api/admin/subscriptions");
    const data = await response.json();
    setSubscriptions(data.subscriptions ?? []);
  };

  const updateQuantity = (subscriptionId: string, quantity: number) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to update subscription");
        }

        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  const cancelSubscription = (subscriptionId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to cancel subscription");
        }

        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Seats</TableHead>
            <TableHead>Renews</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell>{subscription.user.email}</TableCell>
              <TableCell>
                {subscription.plan.name}
                <span className="block text-xs text-muted-foreground">
                  {subscription.plan.provider.name}
                </span>
              </TableCell>
              <TableCell className="capitalize">{subscription.status.replace("_", " ")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-9 w-20"
                    type="number"
                    defaultValue={subscription.quantity}
                    min={1}
                    onBlur={(event) => {
                      const value = Number(event.target.value);
                      if (value !== subscription.quantity && value > 0) {
                        updateQuantity(subscription.id, value);
                      }
                    }}
                  />
                </div>
              </TableCell>
              <TableCell>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => cancelSubscription(subscription.id)}
                >
                  Cancel
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
