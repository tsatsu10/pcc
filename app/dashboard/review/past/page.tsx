"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, Card, CardContent, CardHeader, CardTitle, EmptyState, PageSkeleton } from "@/components/ui";
import { ReviewIcon } from "@/components/dashboard/DashboardIcons";

type ReviewItem = {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
};

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function formatPeriod(type: string, periodStart: string, periodEnd: string): string {
  if (type === "daily" && periodStart === periodEnd) return periodStart;
  return `${periodStart} → ${periodEnd}`;
}

export default function PastReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const url = typeFilter
      ? `/api/review?type=${encodeURIComponent(typeFilter)}&limit=50`
      : "/api/review?limit=50";
    fetch(url)
      .then((r) => (r.ok ? r.json() : { reviews: [] }))
      .then((data) => setReviews(data.reviews ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reviews", href: "/dashboard/review" },
          { label: "Past reviews" },
        ]}
      />
      <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mt-2">
        <ReviewIcon />
        Past reviews
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        View and reflect on your previous daily, weekly, and monthly reviews.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="past-type-filter" className="text-sm text-muted-foreground">
          Type:
        </label>
        <select
          id="past-type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 w-[140px] rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <PageSkeleton className="mt-6" />
      ) : reviews.length === 0 ? (
        <EmptyState
          className="mt-6"
          heading="No past reviews"
          description="Complete daily, weekly, or monthly reviews to see them here."
        />
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {reviews.map((r) => (
                <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/dashboard/review/past/${r.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg py-2 px-2 -mx-2 hover:bg-accent transition-colors"
                  >
                    <span className="font-medium capitalize text-foreground">{r.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatPeriod(r.type, r.periodStart, r.periodEnd)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
