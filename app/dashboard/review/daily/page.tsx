"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, Button, Input, Textarea, PageSkeleton } from "@/components/ui";

type TaskItem = {
  id: string;
  title: string;
  project: { id: string; name: string };
};

type DailyData = {
  date: string;
  focusSessionCount: number;
  totalFocusMinutes: number;
  lastRememberForTomorrow: string | null;
  completed: (TaskItem & { project: { id: string; name: string } })[];
  missed: (TaskItem & { status: string; project: { id: string; name: string } })[];
};

const MOOD_OPTIONS = [
  { value: 1, label: "1", emoji: "😩" },
  { value: 2, label: "2", emoji: "😕" },
  { value: 3, label: "3", emoji: "😐" },
  { value: 4, label: "4", emoji: "🙂" },
  { value: 5, label: "5", emoji: "😊" },
];

const MISSED_QUICK_REASONS = [
  "Ran out of time",
  "Reprioritized",
  "Blocked",
  "Postponed to tomorrow",
  "Other",
];

export default function DailyReviewPage() {
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [generalComment, setGeneralComment] = useState("");
  const [completedComments, setCompletedComments] = useState<Record<string, string>>({});
  const [missedReasons, setMissedReasons] = useState<Record<string, string>>({});
  const [mood, setMood] = useState<number | null>(null);
  const [rememberForTomorrow, setRememberForTomorrow] = useState("");

  useEffect(() => {
    fetch("/api/review/daily/data")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) =>
        d
          ? {
              focusSessionCount: d.focusSessionCount ?? 0,
              totalFocusMinutes: d.totalFocusMinutes ?? 0,
              lastRememberForTomorrow: d.lastRememberForTomorrow ?? null,
              ...d,
            }
          : null
      )
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const missedEntries = data?.missed ?? [];
    const missingReasons = missedEntries.filter((t) => !(missedReasons[t.id]?.trim()));
    if (missingReasons.length > 0) {
      setError("Please provide a reason for each missed task.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/review/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: (data?.completed ?? []).map((t) => ({
            taskId: t.id,
            comment: completedComments[t.id] ?? "",
          })),
          missed: (data?.missed ?? []).map((t) => ({
            taskId: t.id,
            reason: missedReasons[t.id]?.trim() ?? "",
          })),
          generalComment: generalComment.trim() || undefined,
          mood: mood ?? undefined,
          rememberForTomorrow: rememberForTomorrow.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Failed to submit review");
        return;
      }
      window.location.href = "/dashboard?review_saved=1";
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!data) return <main className="p-6 sm:p-8 max-w-4xl mx-auto"><p className="text-muted-foreground">Could not load daily review data.</p></main>;

  const hasTasks = data.completed.length > 0 || data.missed.length > 0;
  if (!hasTasks) {
    return (
      <main className="p-6 sm:p-8 max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reviews", href: "/dashboard/review" },
          { label: "Daily" },
        ]} />
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Daily review</h1>
        <p className="text-sm text-muted-foreground mt-1" id="daily-review-why">
          A quick daily check-in helps you stay intentional.
        </p>
        <p className="text-muted-foreground mt-2">No focus tasks were assigned for today. Add an optional note and submit to close today&apos;s check-in.</p>
        {data.lastRememberForTomorrow && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <span className="font-medium text-foreground">Last time you said to remember: </span>
            <span className="text-muted-foreground">{data.lastRememberForTomorrow}</span>
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setError("");
            try {
              const res = await fetch("/api/review/daily", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  generalComment: generalComment.trim() || undefined,
                  mood: mood ?? undefined,
                  rememberForTomorrow: rememberForTomorrow.trim() || undefined,
                }),
              });
              const body = await res.json().catch(() => ({}));
              if (!res.ok) {
                setError(body.error ?? "Failed to submit");
                return;
              }
              window.location.href = "/dashboard?review_saved=1";
            } finally {
              setSubmitting(false);
            }
          }}
          className="mt-6 rounded-xl border border-border bg-card p-5 shadow-pcc space-y-4 max-w-xl"
        >
          <div>
            <span className="block text-sm font-medium text-foreground mb-1.5">Mood / energy (optional)</span>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMood((m) => (m === value ? null : value))}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    mood === value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-accent"
                  }`}
                  title={`${value}/5`}
                >
                  <span aria-hidden>{emoji}</span>
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="no-tasks-remember" className="block text-sm font-medium text-foreground mb-1">Remember for tomorrow (optional)</label>
            <Input
              id="no-tasks-remember"
              value={rememberForTomorrow}
              onChange={(e) => setRememberForTomorrow(e.target.value)}
              placeholder="One line to remind yourself tomorrow"
              maxLength={500}
            />
          </div>
          <Textarea
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            rows={3}
            placeholder="How did today go? (optional)"
          />
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit"}</Button>
            <Link href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-accent">
              Skip
            </Link>
          </div>
        </form>
      </main>
    );
  }

  const completedCount = data.completed.length;
  const missedCount = data.missed.length;
  const summary =
    completedCount > 0 && missedCount > 0
      ? `${completedCount} completed, ${missedCount} missed`
      : completedCount > 0
        ? `${completedCount} completed`
        : `${missedCount} missed`;

  const focusSummary =
    data.focusSessionCount > 0
      ? data.totalFocusMinutes > 0
        ? `You had ${data.focusSessionCount} focus session${data.focusSessionCount === 1 ? "" : "s"} today (${data.totalFocusMinutes} min).`
        : `You had ${data.focusSessionCount} focus session${data.focusSessionCount === 1 ? "" : "s"} today.`
      : null;

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Reviews", href: "/dashboard/review" },
        { label: "Daily" },
      ]} />
      <h1 className="text-2xl font-semibold text-foreground tracking-tight" aria-describedby="daily-review-why">Daily review</h1>
      <p className="text-sm text-muted-foreground mt-1" id="daily-review-why">
        You had focus time today — a quick review helps you learn from it.
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        {data.date} · {summary}. Quick check-in: what got done and what didn&apos;t.
      </p>
      {focusSummary && (
        <p className="text-sm text-foreground mt-2 font-medium">{focusSummary}</p>
      )}
      {data.lastRememberForTomorrow && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <span className="font-medium text-foreground">Last time you said to remember: </span>
          <span className="text-muted-foreground">{data.lastRememberForTomorrow}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {data.completed.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-5 shadow-pcc">
            <h2 className="font-medium text-success mb-3">Completed</h2>
            <ul className="space-y-4">
              {data.completed.map((t) => (
                <li key={t.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="font-medium text-foreground">{t.title}</p>
                  <p className="text-sm text-muted-foreground">
                    <Link href={`/dashboard/projects/${t.project.id}`} className="text-primary hover:underline">{t.project.name}</Link>
                  </p>
                  <label className="sr-only">Comment (optional)</label>
                  <Input
                    value={completedComments[t.id] ?? ""}
                    onChange={(e) => setCompletedComments((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    className="mt-2"
                    placeholder="Note (optional)"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.missed.length > 0 && (
          <section className="rounded-xl border border-warning/40 bg-warning/5 p-5">
            <h2 className="font-medium text-warning mb-3">Missed or skipped</h2>
            <p className="text-sm text-muted-foreground mb-3">Add a short reason for each so you can reflect later.</p>
            <ul className="space-y-4">
              {data.missed.map((t) => (
                <li key={t.id} className="rounded-lg border border-warning/50 bg-card p-4">
                  <p className="font-medium text-foreground">{t.title}</p>
                  <p className="text-sm text-muted-foreground">
                    <Link href={`/dashboard/projects/${t.project.id}`} className="text-primary hover:underline">{t.project.name}</Link>
                    <span className="ml-1">· {t.status}</span>
                  </p>
                  <label className="block text-sm font-medium mt-2 text-foreground">Why? *</label>
                  <div className="flex flex-wrap gap-2 mt-1.5 mb-2">
                    {MISSED_QUICK_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setMissedReasons((prev) => ({ ...prev, [t.id]: reason }))}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          (missedReasons[t.id] ?? "") === reason
                            ? "bg-warning text-warning-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={missedReasons[t.id] ?? ""}
                    onChange={(e) => setMissedReasons((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    required
                    placeholder="Or type your own reason"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card p-5 shadow-pcc">
          <label className="block font-medium mb-2 text-foreground">General comment (optional)</label>
          <Textarea
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            rows={3}
            placeholder="How did the day go? Any patterns or notes for yourself."
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-pcc">
          <span className="block font-medium mb-2 text-foreground">Mood / energy (optional)</span>
          <div className="flex gap-2 flex-wrap">
            {MOOD_OPTIONS.map(({ value, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMood((m) => (m === value ? null : value))}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  mood === value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-accent"
                }`}
                title={`${value}/5`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-pcc">
          <label htmlFor="remember-for-tomorrow" className="block font-medium mb-2 text-foreground">
            Remember for tomorrow (optional)
          </label>
          <Input
            id="remember-for-tomorrow"
            value={rememberForTomorrow}
            onChange={(e) => setRememberForTomorrow(e.target.value)}
            placeholder="One line to remind yourself tomorrow — shown on dashboard and next daily review"
            maxLength={500}
          />
        </section>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit daily review"}
          </Button>
          <Link href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-accent">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
