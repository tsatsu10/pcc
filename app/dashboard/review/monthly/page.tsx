"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, Button, Textarea, EmptyState, PageSkeleton } from "@/components/ui";
import { ProjectsIcon, OverdueIcon } from "@/components/dashboard/DashboardIcons";

type ProjectProgress = {
  id: string;
  name: string;
  domainName: string;
  totalTasks: number;
  doneCount: number;
  overdueCount: number;
  priority: number;
  suggestedPriority: 1 | 2 | 3;
};

type OverdueTask = {
  id: string;
  title: string;
  deadline: string | null;
  project: { id: string; name: string };
};

type MonthlyData = {
  periodStart: string;
  periodEnd: string;
  projectProgress: ProjectProgress[];
  overdueTasks: OverdueTask[];
  focusTimeMinutes?: number;
  totalCompletedInPeriod?: number;
};

const selectClass =
  "h-9 rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

export default function MonthlyReviewPage() {
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bottlenecks, setBottlenecks] = useState("");
  const [priorityNotes, setPriorityNotes] = useState("");
  const [monthlyWins, setMonthlyWins] = useState("");
  const [focusNextMonth, setFocusNextMonth] = useState("");
  const [projectPriorities, setProjectPriorities] = useState<Record<string, 1 | 2 | 3>>({});

  useEffect(() => {
    fetch("/api/review/monthly/data")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        if (d?.projectProgress) {
          const initial: Record<string, 1 | 2 | 3> = {};
          d.projectProgress.forEach((p: ProjectProgress) => {
            initial[p.id] = p.suggestedPriority;
          });
          setProjectPriorities(initial);
        }
        return d;
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/review/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bottlenecks: bottlenecks.trim() || "",
          priorityNotes: priorityNotes.trim() || "",
          projectPriorities: Object.entries(projectPriorities).map(([projectId, priority]) => ({
            projectId,
            priority,
          })),
          monthlyWins: monthlyWins.trim() || "",
          focusNextMonth: focusNextMonth.trim() || "",
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
  if (!data) return <main className="p-6 sm:p-8 max-w-4xl mx-auto"><p className="text-muted-foreground">Could not load monthly review data.</p></main>;

  const summaryParts: string[] = [];
  if (data.totalCompletedInPeriod != null) summaryParts.push(`${data.totalCompletedInPeriod} tasks completed`);
  if (data.focusTimeMinutes != null && data.focusTimeMinutes > 0) summaryParts.push(`${data.focusTimeMinutes} min focus`);

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Review" },
        { label: "Monthly" },
      ]} />
      <h1 className="text-xl font-semibold text-foreground">Monthly review</h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        {data.periodStart} → {data.periodEnd}. Review project progress, adjust priorities, and plan for next month.
        {summaryParts.length > 0 && ` (${summaryParts.join(", ")})`}
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <section>
          <h2 className="font-medium text-foreground mb-2">Project progress</h2>
          {data.projectProgress.length === 0 ? (
            <EmptyState
              icon={<ProjectsIcon />}
              heading="No projects"
              description="Create projects to track progress in monthly reviews."
              action={
                <Link href="/dashboard/projects">
                  <Button size="sm">Create project</Button>
                </Link>
              }
              className="py-4"
            />
          ) : (
            <ul className="space-y-2">
              {data.projectProgress.map((p) => (
                <li key={p.id} className="rounded-lg border border-border bg-card p-3 flex flex-wrap justify-between items-center gap-2 transition-colors hover:bg-accent/30">
                  <div>
                    <Link href={`/dashboard/projects/${p.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{p.name}</Link>
                    <p className="text-xs text-muted-foreground">{p.domainName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {p.doneCount}/{p.totalTasks} done
                      {p.overdueCount > 0 && (
                        <span className="text-destructive ml-1">· {p.overdueCount} overdue</span>
                      )}
                    </span>
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      Priority
                      <select
                        value={projectPriorities[p.id] ?? p.suggestedPriority}
                        onChange={(e) =>
                          setProjectPriorities((prev) => ({
                            ...prev,
                            [p.id]: Number(e.target.value) as 1 | 2 | 3,
                          }))
                        }
                        className={selectClass}
                      >
                        <option value={1}>Low</option>
                        <option value={2}>Medium</option>
                        <option value={3}>High</option>
                      </select>
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-medium text-foreground mb-2">Overdue tasks</h2>
          {data.overdueTasks.length === 0 ? (
            <EmptyState
              variant="celebratory"
              icon={<OverdueIcon />}
              heading="No overdue tasks"
              description="You're on top of things."
              className="py-4"
            />
          ) : (
            <ul className="space-y-2">
              {data.overdueTasks.map((t) => (
                <li key={t.id} className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-sm flex justify-between transition-colors hover:bg-destructive/20">
                  <span className="text-foreground">{t.title}</span>
                  <span className="text-muted-foreground">
                    <Link href={`/dashboard/projects/${t.project.id}`} className="text-primary hover:underline">{t.project.name}</Link>
                    {t.deadline && ` · Due ${new Date(t.deadline).toLocaleDateString()}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <label className="block font-medium mb-2 text-foreground">Bottlenecks</label>
          <Textarea
            value={bottlenecks}
            onChange={(e) => setBottlenecks(e.target.value)}
            rows={3}
            placeholder="What's blocking progress?"
          />
        </section>

        <section>
          <label className="block font-medium mb-2 text-foreground">Priority adjustment notes</label>
          <Textarea
            value={priorityNotes}
            onChange={(e) => setPriorityNotes(e.target.value)}
            rows={3}
            placeholder="Any changes to priorities for next month?"
          />
        </section>

        <section>
          <label className="block font-medium mb-2 text-foreground">Monthly wins</label>
          <Textarea
            value={monthlyWins}
            onChange={(e) => setMonthlyWins(e.target.value)}
            rows={2}
            placeholder="What went well this month?"
          />
        </section>

        <section>
          <label className="block font-medium mb-2 text-foreground">Focus for next month</label>
          <Textarea
            value={focusNextMonth}
            onChange={(e) => setFocusNextMonth(e.target.value)}
            rows={2}
            placeholder="What do you want to focus on next month?"
          />
        </section>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit monthly review"}
          </Button>
          <Link href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-accent">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
