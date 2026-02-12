import Link from "next/link";

type DashboardTodayStripProps = {
  focusCount: number;
  maxFocus: number;
  overdueCount: number;
  dailyReviewDone: boolean;
  weeklyReviewDone: boolean;
};

export function DashboardTodayStrip({
  focusCount,
  maxFocus,
  overdueCount,
  dailyReviewDone,
  weeklyReviewDone,
}: DashboardTodayStripProps) {
  const parts: { label: string; href: string; done?: boolean }[] = [
    { label: `${focusCount}/${maxFocus} focus`, href: "/dashboard/focus", done: focusCount >= maxFocus },
    { label: overdueCount === 0 ? "No overdue" : `${overdueCount} overdue`, href: "/dashboard/tasks", done: overdueCount === 0 },
    { label: dailyReviewDone ? "Daily review done" : "Daily review due", href: "/dashboard/review/daily", done: dailyReviewDone },
    { label: weeklyReviewDone ? "Weekly review done" : "Weekly review due", href: "/dashboard/review/weekly", done: weeklyReviewDone },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm">
      <span className="text-muted-foreground font-medium">Today:</span>
      {parts.map((p) => (
        <Link
          key={p.href + p.label}
          href={p.href}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 transition-colors ${
            p.done
              ? "text-success hover:bg-success/10"
              : "text-foreground hover:bg-accent"
          }`}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
