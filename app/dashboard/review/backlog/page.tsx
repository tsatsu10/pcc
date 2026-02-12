"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, EmptyState, PageSkeleton } from "@/components/ui";

type BacklogItem = {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  createdAt: string;
  daysSitting: number;
  project: { id: string; name: string; status: string };
  domain: { id: string; name: string };
};

type BacklogData = {
  thresholdDays: number;
  cutoffDate: string;
  tasks: BacklogItem[];
};

export default function BacklogReviewPage() {
  const [data, setData] = useState<BacklogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/review/backlog")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;
  if (!data) return <main className="p-6 sm:p-8 max-w-4xl mx-auto"><p className="text-muted-foreground">Could not load backlog review data.</p></main>;

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Review", href: "/dashboard/review/weekly" },
        { label: "Backlog" },
      ]} />
      <h1 className="text-xl font-semibold text-foreground">Monthly Backlog Review</h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        Tasks sitting for {data.thresholdDays}+ days (created before {data.cutoffDate}). Surface stale items and decide: focus, move forward, or drop.
      </p>

      {data.tasks.length === 0 ? (
        <EmptyState
          variant="celebratory"
          heading={`Nothing sitting for ${data.thresholdDays}+ days`}
          description="Good signal. Your backlog is fresh."
          className="mt-6 py-8"
        />
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Consider: add to focus, move the project forward, or drop the project if it no longer serves you.
          </p>
          <ul className="mt-4 space-y-3">
            {data.tasks.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-warning/50 bg-warning/10 p-4 transition-colors hover:bg-warning/20"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/projects/${t.project.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.domain.name} · {t.project.name}
                      {t.project.status === "dropped" && (
                        <span className="ml-1 text-warning">(project dropped)</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-medium text-warning">
                      {t.daysSitting} days
                    </span>
                    <p className="text-xs text-muted-foreground">created {t.createdAt}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/projects/${t.project.id}`}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Open project
                  </Link>
                  <Link href="/dashboard/focus" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                    Today&apos;s Focus
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
