"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function VerifyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, email }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
    };

    verify();
  }, [token, email]);

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Verifying email…</CardTitle>
          <CardDescription>Please wait while we confirm your email address.</CardDescription>
        </CardHeader>
        <CardContent>Processing…</CardContent>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Email verified</CardTitle>
          <CardDescription>Your account is ready to use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>Your email has been verified successfully.</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/auth/signin")}>Sign in</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle>Verification failed</CardTitle>
        <CardDescription>The link may be invalid or expired.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertDescription>Request a new verification email by signing in again.</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
