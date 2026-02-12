"use client";

import { useState } from "react";
import { Button, Input, Label, FieldError } from "@/components/ui";

export function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to change password");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 pt-8 border-t border-border" aria-labelledby="password-heading">
      <h2 id="password-heading" className="text-base font-medium text-foreground mb-1">
        Change password
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Enter your current password and choose a new one (at least 8 characters).
      </p>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <div>
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="mt-1"
          />
        </div>
        <FieldError id="password-error">{error}</FieldError>
        {success && <p className="text-sm text-success">Password updated.</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </section>
  );
}
