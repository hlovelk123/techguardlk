"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter,useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const requestSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  password: z.string().min(8),
});

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestForm = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
  });

  const handleRequest = requestForm.handleSubmit(async (values) => {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.message ?? "Unable to request reset.");
      return;
    }

    setMessage("Check your email for reset instructions.");
    requestForm.reset();
  });

  const handleReset = resetForm.handleSubmit(async (values) => {
    if (!token) return;
    setError(null);
    setMessage(null);

    const response = await fetch("/api/auth/reset", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password: values.password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.message ?? "Unable to reset password.");
      return;
    }

    setMessage("Password updated. You can now sign in.");
    resetForm.reset();
    router.push("/auth/signin");
  });

  if (token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Enter a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleReset}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" {...resetForm.register("password")} />
            </div>
            <Button className="w-full" type="submit" disabled={resetForm.formState.isSubmitting}>
              {resetForm.formState.isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </form>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {message ? (
            <Alert variant="success">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your email to receive a reset link.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={handleRequest}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...requestForm.register("email")} />
          </div>
          <Button className="w-full" type="submit" disabled={requestForm.formState.isSubmitting}>
            {requestForm.formState.isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {message ? (
          <Alert variant="success">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
