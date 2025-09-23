"use client";

import type { Provider } from "@prisma/client";
import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProvidersManagerProps {
  providers: Provider[];
}

export function ProvidersManager({ providers: initialProviders }: ProvidersManagerProps) {
  const [providers, setProviders] = useState(initialProviders);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshProviders = async () => {
    const response = await fetch("/api/admin/providers");
    const data = await response.json();
    setProviders(data.providers ?? []);
  };

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/providers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to create provider.");
        }

        setName("");
        await refreshProviders();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  const toggleProvider = (providerId: string, isActive: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/providers/${providerId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !isActive }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to update provider.");
        }

        await refreshProviders();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  const deleteProvider = (providerId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/providers/${providerId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Unable to delete provider.");
        }

        await refreshProviders();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Provider name</label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter provider name"
          />
        </div>
        <Button disabled={isPending || !name.trim()} onClick={handleCreate}>
          Create provider
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell>{provider.name}</TableCell>
              <TableCell>{provider.isActive ? "Active" : "Inactive"}</TableCell>
              <TableCell>{new Date(provider.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => toggleProvider(provider.id, provider.isActive)}
                >
                  {provider.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => deleteProvider(provider.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
