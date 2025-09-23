"use client";

import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileSettingsProps {
  name: string | null;
  email: string;
  twoFactorEnabled: boolean;
}

export function ProfileSettings({ name, email, twoFactorEnabled }: ProfileSettingsProps) {
  const [form, setForm] = useState({
    name: name ?? "",
    currentPassword: "",
    newPassword: "",
    twoFactorEnabled,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpUri, setOtpUri] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateProfile = () => {
    setMessage(null);
    setError(null);
    setOtpUri(null);

    startTransition(async () => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
          twoFactorEnabled: form.twoFactorEnabled,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.message ?? "Unable to update profile.");
        return;
      }

      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      if (data.otpUri) {
        setOtpUri(data.otpUri as string);
        setMessage("Two-factor authentication enabled. Scan the URI below.");
      } else {
        setMessage("Profile updated.");
      }
    });
  };

  const exportData = async () => {
    const response = await fetch("/api/profile/export");
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "techguard-export.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/profile/delete", { method: "POST" });
    if (!response.ok) {
      setError("Unable to delete account.");
      return;
    }
    setMessage("Account marked for deletion. Sign out to complete the process.");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            placeholder="Required to change password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          id="twoFactorEnabled"
          type="checkbox"
          checked={form.twoFactorEnabled}
          onChange={(event) => setForm((prev) => ({ ...prev, twoFactorEnabled: event.target.checked }))}
        />
        <Label htmlFor="twoFactorEnabled">Enable TOTP two-factor authentication</Label>
      </div>
      <Button disabled={isPending} onClick={updateProfile}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={exportData}>
          Export data (JSON)
        </Button>
        <Button variant="ghost" className="text-destructive" onClick={deleteAccount}>
          Delete account
        </Button>
      </div>
      {otpUri ? (
        <Alert>
          <AlertDescription>
            Scan this URI with your authenticator app: <code>{otpUri}</code>
          </AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert variant="success">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
