"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const REMIND_LATER_KEY = "pcc-review-banner-dismissed";

type DismissedState = { at: number; hours: number };

function getDismissedState(): DismissedState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(REMIND_LATER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { at?: number; hours?: number };
    if (typeof parsed?.at === "number" && typeof parsed?.hours === "number") return { at: parsed.at, hours: parsed.hours };
    const at = Number(parsed?.at ?? raw);
    if (!Number.isNaN(at)) return { at, hours: 2 };
  } catch {
    const at = Number(raw);
    if (!Number.isNaN(at)) return { at, hours: 2 };
  }
  return null;
}

function isDismissed(): boolean {
  const state = getDismissedState();
  if (!state) return false;
  return Date.now() - state.at < state.hours * 60 * 60 * 1000;
}

function setDismissed(hours: number) {
  localStorage.setItem(REMIND_LATER_KEY, JSON.stringify({ at: Date.now(), hours }));
}

type Status = {
  dailyRequired: boolean;
  weeklyRequired: boolean;
  monthlyRequired: boolean;
};

export function ReviewBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [dismissed, setDismissedState] = useState(false);

  useEffect(() => {
    setDismissedState(isDismissed());
  }, []);

  useEffect(() => {
    fetch("/api/review/status")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  function handleRemindLater(hours: number) {
    setDismissed(hours);
    setDismissedState(true);
  }

  if (dismissed) return null;
  if (!status || (!status.dailyRequired && !status.weeklyRequired && !status.monthlyRequired)) return null;

  const dueLabels: string[] = [];
  if (status.dailyRequired) dueLabels.push("daily");
  if (status.weeklyRequired) dueLabels.push("weekly");
  if (status.monthlyRequired) dueLabels.push("monthly");
  const message =
    dueLabels.length >= 3
      ? "Reviews are due."
      : dueLabels.length === 2
        ? "Reviews are due."
        : status.dailyRequired
          ? "You had focus time today — do a quick daily review."
          : status.weeklyRequired
            ? "Your weekly review is due."
            : "Monthly review is due.";

  return (
    <div className="bg-warning/10 border-b border-warning/30 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
      <p className="text-sm text-foreground font-medium">{message}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {status.dailyRequired && (
          <Link
            href="/dashboard/review/daily"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-focus-active px-3 text-sm font-medium text-focus-active-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-active focus-visible:ring-offset-2"
          >
            Do daily review
          </Link>
        )}
        {status.weeklyRequired && (
          <Link
            href="/dashboard/review/weekly"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-focus-active px-3 text-sm font-medium text-focus-active-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-active focus-visible:ring-offset-2"
          >
            Do weekly review
          </Link>
        )}
        {status.monthlyRequired && (
          <Link
            href="/dashboard/review/monthly"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-focus-active px-3 text-sm font-medium text-focus-active-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-active focus-visible:ring-offset-2"
          >
            Do monthly review
          </Link>
        )}
        <span className="inline-flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Remind:</span>
          <button
            type="button"
            onClick={() => handleRemindLater(1)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            1 hour
          </button>
          <button
            type="button"
            onClick={() => handleRemindLater(2)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            2 hours
          </button>
        </span>
      </div>
    </div>
  );
}
