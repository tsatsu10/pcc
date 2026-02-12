"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Breadcrumbs, Card, CardContent, CardHeader, CardTitle, PageSkeleton } from "@/components/ui";
import { ReviewIcon } from "@/components/dashboard/DashboardIcons";

type Review = {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  content: Record<string, unknown> | null;
  createdAt: string;
};

function formatPeriod(type: string, periodStart: string, periodEnd: string): string {
  if (type === "daily" && periodStart === periodEnd) return periodStart;
  return `${periodStart} → ${periodEnd}`;
}

function ContentBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

export default function PastReviewViewPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/review/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(setReview)
      .catch(() => setReview(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton className="p-6 sm:p-8 max-w-4xl mx-auto" />;
  if (notFound || !review)
    return (
      <main className="p-6 sm:p-8 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Reviews", href: "/dashboard/review" },
            { label: "Past reviews", href: "/dashboard/review/past" },
            { label: "Review" },
          ]}
        />
        <p className="text-muted-foreground mt-4">Review not found.</p>
        <Link
          href="/dashboard/review/past"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-accent"
        >
          Back to past reviews
        </Link>
      </main>
    );

  const c = review.content ?? {};
  const isDaily = review.type === "daily";
  const isWeekly = review.type === "weekly";
  const isMonthly = review.type === "monthly";

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reviews", href: "/dashboard/review" },
          { label: "Past reviews", href: "/dashboard/review/past" },
          { label: `${review.type} ${formatPeriod(review.type, review.periodStart, review.periodEnd)}` },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4 mt-2">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <ReviewIcon />
          <span className="capitalize">{review.type}</span> review
        </h1>
        <Link
          href="/dashboard/review/past"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-accent"
        >
          ← Past reviews
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mt-0.5">
        {formatPeriod(review.type, review.periodStart, review.periodEnd)} · submitted{" "}
        {new Date(review.createdAt).toLocaleString()}
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDaily && (
            <>
              {c.rememberForTomorrow && (
                <ContentBlock title="Remember for tomorrow">
                  <p className="whitespace-pre-wrap">{String(c.rememberForTomorrow)}</p>
                </ContentBlock>
              )}
              {c.generalComment && (
                <ContentBlock title="General comment">
                  <p className="whitespace-pre-wrap">{String(c.generalComment)}</p>
                </ContentBlock>
              )}
              {typeof c.mood === "number" && (
                <ContentBlock title="Mood / energy">
                  <span>{c.mood}/5</span>
                </ContentBlock>
              )}
              {Array.isArray(c.completed) && (c.completed as { taskId: string; comment: string }[]).length > 0 && (
                <ContentBlock title="Completed tasks">
                  <ul className="list-disc list-inside space-y-1">
                    {(c.completed as { taskId: string; comment: string }[]).map((item, i) => (
                      <li key={i}>
                        <span className="text-muted-foreground">Task</span> — {item.comment || "—"}
                      </li>
                    ))}
                  </ul>
                </ContentBlock>
              )}
              {Array.isArray(c.missed) && (c.missed as { taskId: string; reason: string }[]).length > 0 && (
                <ContentBlock title="Missed tasks (reasons)">
                  <ul className="list-disc list-inside space-y-1">
                    {(c.missed as { taskId: string; reason: string }[]).map((item, i) => (
                      <li key={i}>
                        <span className="text-muted-foreground">Task</span> — {item.reason || "—"}
                      </li>
                    ))}
                  </ul>
                </ContentBlock>
              )}
            </>
          )}
          {(isWeekly || isMonthly) && (
            <>
              {c.bottlenecks && (
                <ContentBlock title="Bottlenecks">
                  <p className="whitespace-pre-wrap">{String(c.bottlenecks)}</p>
                </ContentBlock>
              )}
              {c.priorityNotes && (
                <ContentBlock title="Priority notes">
                  <p className="whitespace-pre-wrap">{String(c.priorityNotes)}</p>
                </ContentBlock>
              )}
              {isMonthly && c.monthlyWins && (
                <ContentBlock title="Monthly wins">
                  <p className="whitespace-pre-wrap">{String(c.monthlyWins)}</p>
                </ContentBlock>
              )}
              {isMonthly && c.focusNextMonth && (
                <ContentBlock title="Focus next month">
                  <p className="whitespace-pre-wrap">{String(c.focusNextMonth)}</p>
                </ContentBlock>
              )}
            </>
          )}
          {!isDaily && !isWeekly && !isMonthly && Object.keys(c).length > 0 && (
            <ContentBlock title="Details">
              <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(c, null, 2)}
              </pre>
            </ContentBlock>
          )}
          {Object.keys(c).length === 0 && (
            <p className="text-sm text-muted-foreground">No content saved for this review.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
