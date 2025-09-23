"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface UnassignSeatButtonProps {
  subscriptionId: string;
  entitlementId: string;
}

export function UnassignSeatButton({ subscriptionId, entitlementId }: UnassignSeatButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUnassign = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/subscriptions/${subscriptionId}/entitlements/${entitlementId}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to unassign seat.");
        }

        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred.");
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        className="text-sm text-muted-foreground hover:text-destructive"
        disabled={isPending}
        onClick={handleUnassign}
      >
        {isPending ? "Removing…" : "Unassign"}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
