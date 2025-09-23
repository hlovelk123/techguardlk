"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
  disabled?: boolean;
}

export function CancelSubscriptionButton({ subscriptionId, disabled }: CancelSubscriptionButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "cancel" }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to cancel subscription.");
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
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive/10"
        disabled={isPending || disabled}
        onClick={handleCancel}
      >
        {isPending ? "Cancelling…" : "Cancel at period end"}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
