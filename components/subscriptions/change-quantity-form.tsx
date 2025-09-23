"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  quantity: z.number().int().min(1).max(100),
});

type FormValues = z.infer<typeof formSchema>;

interface ChangeQuantityFormProps {
  subscriptionId: string;
  defaultQuantity: number;
}

export function ChangeQuantityForm({ subscriptionId, defaultQuantity }: ChangeQuantityFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: defaultQuantity,
    },
  });

  const onSubmit = (values: FormValues) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "change_quantity", quantity: values.quantity }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to update quantity.");
        }

        setSuccess("Quantity updated successfully.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred.");
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="quantity">Seats</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={100}
          {...form.register("quantity", { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">Adjust the number of seats included in this subscription.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating…" : "Update quantity"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending || form.getValues("quantity") === defaultQuantity}
          onClick={() => {
            form.reset({ quantity: defaultQuantity });
            setError(null);
            setSuccess(null);
          }}
        >
          Reset
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
