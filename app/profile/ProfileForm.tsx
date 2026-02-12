"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, FieldError, Select } from "@/components/ui";

const COMMON_TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
];

type Props = {
  initialName: string;
  initialTimezone: string;
  initialGoals: string[];
  email: string;
  createdAt: string;
};

export function ProfileForm({ initialName, initialTimezone, initialGoals, email, createdAt }: Props) {
  const [name, setName] = useState(initialName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [goals, setGoals] = useState<string[]>(initialGoals.slice(0, 3));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { update: updateSession } = useSession();
  const router = useRouter();

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    setTimezone(initialTimezone);
  }, [initialTimezone]);

  useEffect(() => {
    setGoals(initialGoals.slice(0, 3));
  }, [initialGoals]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      const goalsPayload = goals.slice(0, 3).map((g) => (typeof g === "string" ? g.trim() : ""));
      while (goalsPayload.length < 3) goalsPayload.push("");
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          timezone: timezone.trim() || "UTC",
          goals: goalsPayload,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      setName(data.name ?? "");
      setTimezone(data.timezone ?? "UTC");
      if (Array.isArray(data.goals)) setGoals(data.goals.slice(0, 3));
      await updateSession();
      router.refresh();
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  const created = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          placeholder="Your name"
          aria-invalid={!!error}
          aria-errormessage={error ? "profile-error" : undefined}
        />
        <FieldError id="profile-error">{error}</FieldError>
      </div>
      <div>
        <Label>Top 3 goals</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Your main focus areas (shown on the dashboard).
        </p>
        {[0, 1, 2].map((i) => (
          <Input
            key={i}
            type="text"
            value={goals[i] ?? ""}
            onChange={(e) => {
              const next = goals.slice();
              next[i] = e.target.value;
              setGoals(next);
            }}
            maxLength={500}
            placeholder={`Goal ${i + 1}`}
            className="mb-2"
            aria-label={`Goal ${i + 1}`}
          />
        ))}
      </div>
      <div>
        <Label htmlFor="timezone">Time zone</Label>
        <Select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          aria-describedby="timezone-hint"
        >
          {timezone && !COMMON_TIMEZONES.includes(timezone) && (
            <option value={timezone}>{timezone.replace(/_/g, " ")}</option>
          )}
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <p id="timezone-hint" className="mt-1 text-xs text-muted-foreground">
          Used for focus dates, analytics, and review windows.
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Member since {created}</p>
      </div>
      {saved && <p className="text-sm text-success">Profile saved.</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
