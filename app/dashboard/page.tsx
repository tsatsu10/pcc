import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDashboardData } from "@/lib/dashboard";
import { MAX_FOCUS_TASKS_PER_DAY } from "@/lib/rules/focus-limit";
import { Breadcrumbs, Button, Card, CardContent } from "@/components/ui";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { DashboardTodayStrip } from "@/components/dashboard/DashboardTodayStrip";
import { DashboardStreaks } from "@/components/dashboard/DashboardStreaks";
import { QuickAddTask } from "@/components/dashboard/QuickAddTask";
import { SuccessParamToasts } from "@/components/dashboard/SuccessParamToasts";
import { MilestoneToasts } from "@/components/dashboard/MilestoneToasts";
import { NextActionCard } from "@/components/dashboard/NextActionCard";
import { Suspense } from "react";


export default async function DashboardPage({
  searchParams = {},
}: {
  searchParams?: Promise<{ domain?: string; review_saved?: string; onboarding?: string }> | { domain?: string; review_saved?: string; onboarding?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompletedAt: true, name: true, goals: true },
  });
  if (!user?.onboardingCompletedAt) redirect("/onboarding");

  const params = searchParams && typeof (searchParams as Promise<unknown>).then === "function"
    ? await (searchParams as Promise<{ domain?: string; review_saved?: string; onboarding?: string }>)
    : (searchParams as { domain?: string; review_saved?: string; onboarding?: string }) ?? {};
  const domainId = typeof params.domain === "string" ? params.domain : undefined;
  const reviewSaved = params.review_saved === "1";
  const onboardingDone = params.onboarding === "1";

  const data = await getDashboardData(session.user.id, { domainId });

  const reviewsDue = data.dailyRequired || data.weeklyRequired || data.monthlyRequired;

  const userGoals: string[] = Array.isArray(user?.goals)
    ? (user.goals as string[]).filter((g) => typeof g === "string" && g.trim()).slice(0, 3)
    : [];

  const firstName = user?.name?.trim()
    ? user.name.split(/\s+/)[0]
    : null;
  const today = new Date();
  const dateFormatted = today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <SuccessParamToasts reviewSaved={reviewSaved} onboarding={onboardingDone} />
      <MilestoneToasts />
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      <section aria-labelledby="dashboard-today-heading" className="mb-6">
        <h2 id="dashboard-today-heading" className="sr-only">Today</h2>
        <DashboardTodayStrip
          focusCount={data.focusCount}
          maxFocus={MAX_FOCUS_TASKS_PER_DAY}
          overdueCount={data.overdueTasks.length}
          dailyReviewDone={!data.dailyRequired}
          weeklyReviewDone={!data.weeklyRequired}
        />
        <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
          <NextActionCard
            data={{
              focusCount: data.focusCount,
              focusTasks: data.focusTasks,
              dailyRequired: data.dailyRequired,
              weeklyRequired: data.weeklyRequired,
              monthlyRequired: data.monthlyRequired,
              overdueCount: data.overdueTasks.length,
              backlogCount: data.backlogCount,
            }}
          />
          <Card className="border-focus-active/40 bg-focus-active/5 shadow-pcc-md">
            <CardContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">Max 3 tasks. Complete or postpone one to free a slot.</p>
              {data.focusTasks.length > 0 && (
                <ul className="text-sm space-y-1 text-foreground">
                  {data.focusTasks.map((t) => (
                    <li key={t.id} className="truncate">· {t.title}</li>
                  ))}
                </ul>
              )}
              <Link href="/dashboard/focus">
                <Button variant="focus" size="default">
                  {data.focusCount === 0 ? "Choose focus tasks" : data.focusCount < MAX_FOCUS_TASKS_PER_DAY ? "Choose focus tasks" : "View focus tasks"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <DashboardStreaks gamification={data.gamification} />
      {data.rememberForTomorrow && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Remember: </span>
          <span className="text-muted-foreground">{data.rememberForTomorrow}</span>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Good {getTimeOfDayGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{dateFormatted}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={null}>
            <DashboardFilters domains={data.domains} />
          </Suspense>
          <QuickAddTask />
        </div>
      </div>

      {userGoals.length > 0 && (
        <section className="mb-6 rounded-lg border border-border bg-card p-4 shadow-pcc" aria-labelledby="dashboard-goals-heading">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 id="dashboard-goals-heading" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Focus areas
            </h2>
            <Link href="/profile" className="text-xs text-primary hover:underline">
              Edit in profile
            </Link>
          </div>
          <ul className="space-y-2">
            {userGoals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-muted-foreground font-medium tabular-nums shrink-0">{i + 1}.</span>
                <span>{goal}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="dashboard-rest-heading" className="space-y-4">
        <h2 id="dashboard-rest-heading" className="sr-only">More</h2>
        <DashboardCards
          data={data}
          reviewsDue={reviewsDue}
          maxFocus={MAX_FOCUS_TASKS_PER_DAY}
          hideCardIds={["next-action", "focus"]}
        />
      </section>
    </main>
  );
}

function getTimeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
