import { prisma } from "@/lib/db";
import { getGamification, type GamificationResult } from "@/lib/gamification";
import { MAX_FOCUS_TASKS_PER_DAY } from "@/lib/rules/focus-limit";
import { getTodayRangeInUserTimezone } from "@/lib/timezone";

/** "Today" and period boundaries use the user's timezone (FR-24). */

export type DashboardData = {
  focusCount: number;
  focusTasks: { id: string; title: string }[];
  dailyRequired: boolean;
  weeklyRequired: boolean;
  monthlyRequired: boolean;
  overdueTasks: { id: string; title: string; deadline: string | null; project: { id: string; name: string } }[];
  /** Tasks with deadline in the next 7 days (today inclusive), not done */
  upcomingDeadlines: { id: string; title: string; deadline: string; project: { id: string; name: string } }[];
  activeProjects: { id: string; name: string; taskCount: number }[];
  domains: { id: string; name: string }[];
  backlogCount: number;
  rememberForTomorrow: string | null;
  gamification?: GamificationResult;
};

export type DashboardFilters = {
  domainId?: string;
};

export async function getDashboardData(
  userId: string,
  filters?: DashboardFilters
): Promise<DashboardData> {
  const domainFilter = filters?.domainId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const tz = user?.timezone ?? "UTC";
  const { start: dayStart, end: dayEnd } = getTodayRangeInUserTimezone(tz);
  const sevenDaysEnd = new Date(dayStart);
  sevenDaysEnd.setDate(sevenDaysEnd.getDate() + 8);
  const sevenDaysAgo = new Date(dayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(dayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    focusTasks,
    focusSessionsToday,
    dailyReviewToday,
    lastWeeklyReview,
    lastMonthlyReview,
    lastDailyReview,
    overdueTasks,
    upcomingDeadlinesRaw,
    activeProjectsRaw,
    domains,
    backlogCount,
  ] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        status: "focus",
        focusDate: { gte: dayStart, lt: dayEnd },
      },
      select: { id: true, title: true },
      orderBy: { createdAt: "asc" },
      take: MAX_FOCUS_TASKS_PER_DAY,
    }),
    prisma.focusSession.count({
      where: {
        userId,
        startTime: { gte: dayStart, lt: dayEnd },
      },
    }),
    prisma.review.findFirst({
      where: {
        userId,
        type: "daily",
        periodStart: { lte: dayStart },
        periodEnd: { gte: dayStart },
      },
    }),
    prisma.review.findFirst({
      where: { userId, type: "weekly" },
      orderBy: { periodEnd: "desc" },
    }),
    prisma.review.findFirst({
      where: { userId, type: "monthly" },
      orderBy: { periodEnd: "desc" },
    }),
    prisma.review.findFirst({
      where: { userId, type: "daily" },
      orderBy: { periodEnd: "desc" },
      select: { content: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { not: "done" },
        deadline: { lt: dayStart },
        project: { status: { not: "dropped" }, ...(domainFilter && { domainId: domainFilter }) },
      },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { deadline: "asc" },
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { not: "done" },
        deadline: { gte: dayStart, lt: sevenDaysEnd },
        project: { status: { not: "dropped" }, ...(domainFilter && { domainId: domainFilter }) },
      },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { deadline: "asc" },
      take: 10,
    }),
    prisma.project.findMany({
      where: {
        userId,
        status: "active",
        ...(domainFilter && { domainId: domainFilter }),
      },
      include: {
        tasks: {
          where: { status: { in: ["backlog", "focus"] } },
          select: { id: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.domain.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.task.count({
      where: {
        userId,
        status: { not: "done" },
        project: { status: { not: "dropped" }, ...(domainFilter && { domainId: domainFilter }) },
        OR: [
          { status: { in: ["backlog", "postponed"] } },
          {
            status: "focus",
            OR: [
              { focusDate: null },
              { focusDate: { lt: dayStart } },
              { focusDate: { gte: dayEnd } },
            ],
          },
        ],
      },
    }),
  ]);

  const dailyRequired = focusSessionsToday >= 1 && !dailyReviewToday;
  const weeklyRequired = !lastWeeklyReview || lastWeeklyReview.periodEnd < sevenDaysAgo;
  const monthlyRequired = !lastMonthlyReview || lastMonthlyReview.periodEnd < thirtyDaysAgo;

  const activeProjects = activeProjectsRaw
    .filter((p) => p.tasks.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      taskCount: p.tasks.length,
    }));

  const lastDailyContent = lastDailyReview?.content as { rememberForTomorrow?: string } | null;
  const rememberForTomorrow =
    lastDailyContent?.rememberForTomorrow && String(lastDailyContent.rememberForTomorrow).trim()
      ? String(lastDailyContent.rememberForTomorrow).trim()
      : null;

  const gamification = await getGamification(prisma, userId, tz);

  const upcomingDeadlines = upcomingDeadlinesRaw
    .filter((t) => t.deadline != null)
    .map((t) => ({
      id: t.id,
      title: t.title,
      deadline: t.deadline!.toISOString().slice(0, 10),
      project: t.project,
    }));

  return {
    focusCount: focusTasks.length,
    focusTasks,
    dailyRequired,
    weeklyRequired,
    monthlyRequired,
    domains,
    backlogCount,
    rememberForTomorrow,
    overdueTasks: overdueTasks.map((t) => ({
      id: t.id,
      title: t.title,
      deadline: t.deadline?.toISOString().slice(0, 10) ?? null,
      project: t.project,
    })),
    upcomingDeadlines,
    activeProjects,
    gamification,
  };
}
