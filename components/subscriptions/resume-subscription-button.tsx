"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ResumeSubscriptionButtonProps {
  subscriptionId: string;
  disabled?: boolean;
}

export function ResumeSubscriptionButton({ subscriptionId, disabled }: ResumeSubscriptionButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleResume = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "resume" }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to resume subscription.");
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
        className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
        disabled={isPending || disabled}
        onClick={handleResume}
      >
        {isPending ? "Resuming…" : "Resume billing"}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
