"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, Card, CardContent, CardHeader, CardTitle, PageSkeleton, Button } from "@/components/ui";
import { TASK_MILESTONE_DEFS, FOCUS_MILESTONE_DEFS } from "@/lib/gamification";

type Gamification = {
  completionStreak: number;
  dailyReviewStreak: number;
  focusDaysStreak: number;
  milestones: {
    totalTasksCompleted: number;
    totalFocusMinutes: number;
    reached: string[];
  };
};

function CheckIcon({ unlocked }: { unlocked: boolean }) {
  return (
    <span
      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${
        unlocked ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
      }`}
      aria-hidden
    >
      {unlocked ? "✓" : "—"}
    </span>
  );
}

export default function MilestonesPage() {
  const [data, setData] = useState<Gamification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gamification", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load milestones");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageSkeleton />;
  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Milestones" }]} />
        <p className="text-destructive mt-4">{error || "Failed to load milestones."}</p>
        <Button variant="secondary" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const reachedSet = new Set(data.milestones.reached);
  const { totalTasksCompleted, totalFocusMinutes } = data.milestones;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Milestones", href: "/dashboard/milestones" },
        ]}
      />
      <h1 className="text-xl font-semibold text-foreground mt-2">Milestones & accomplishments</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Track what you’ve unlocked and what’s left. Complete tasks and log focus time to earn milestones.
      </p>

      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task milestones</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-0.5">
              Complete tasks (mark as done) to unlock these. Current total: <strong>{totalTasksCompleted}</strong> tasks.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {TASK_MILESTONE_DEFS.map((def) => {
                const unlocked = reachedSet.has(def.id);
                const progress = Math.min(totalTasksCompleted, def.value);
                const pct = def.value > 0 ? Math.round((progress / def.value) * 100) : 0;
                return (
                  <li
                    key={def.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      unlocked ? "border-success/30 bg-success/5" : "border-border bg-card"
                    }`}
                  >
                    <CheckIcon unlocked={unlocked} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{def.label}</p>
                      <p className="text-sm text-muted-foreground">{def.requirement}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full rounded-full transition-all ${unlocked ? "bg-success" : "bg-primary"}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {progress}/{def.value}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Focus time milestones</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-0.5">
              Log focus sessions to accumulate time. Current total: <strong>{Math.round(totalFocusMinutes / 60 * 10) / 10}h</strong> focus.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {FOCUS_MILESTONE_DEFS.map((def) => {
                const unlocked = reachedSet.has(def.id);
                const progress = Math.min(totalFocusMinutes, def.value);
                const pct = def.value > 0 ? Math.round((progress / def.value) * 100) : 0;
                const progressHours = (progress / 60).toFixed(1);
                const targetHours = def.value / 60;
                return (
                  <li
                    key={def.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      unlocked ? "border-success/30 bg-success/5" : "border-border bg-card"
                    }`}
                  >
                    <CheckIcon unlocked={unlocked} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{def.label}</p>
                      <p className="text-sm text-muted-foreground">{def.requirement}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full rounded-full transition-all ${unlocked ? "bg-success" : "bg-primary"}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {progressHours}h / {targetHours}h
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/analytics">
            <Button variant="secondary" size="sm">
              View analytics
            </Button>
          </Link>
          <Link href="/dashboard/focus">
            <Button variant="secondary" size="sm">
              Daily focus
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
