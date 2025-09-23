"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface PurchaseButtonProps {
  planId: string;
}

export function PurchaseButton({ planId }: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId, quantity: 1 }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.url) {
        throw new Error(data?.message ?? "Unable to start checkout. Please try again.");
      }

      window.location.href = data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error during checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button className="w-full" disabled={isLoading} onClick={handleCheckout} size="lg">
        {isLoading ? "Redirecting…" : "Continue to checkout"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
