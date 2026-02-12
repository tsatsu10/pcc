/**
 * Shared weekly review stats. All date boundaries use the server's local date
 * (start of day 00:00:00). For multi-timezone support, pass a user timezone later.
 */
import { prisma } from "@/lib/db";

export type WeeklyStats = {
  periodStart: Date;
  periodEnd: Date;
  periodStartStr: string;
  periodEndStr: string;
  projects: Awaited<ReturnType<typeof fetchProjects>>;
  completedInPeriod: Awaited<ReturnType<typeof fetchCompletedInPeriod>>;
  focusResult: { sumMinutes: number; count: number };
  overdueTasks: Awaited<ReturnType<typeof fetchOverdueTasks>>;
  lastWeeklyContent: { bottlenecks?: string; priorityNotes?: string } | null;
};

function getWeekBounds(periodEndParam: string | null): { periodStart: Date; periodEnd: Date; periodEndStr: string; periodStartStr: string } {
  const today = new Date();
  const periodEnd = periodEndParam ? new Date(periodEndParam) : new Date(today);
  periodEnd.setHours(0, 0, 0, 0);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);
  return {
    periodStart,
    periodEnd,
    periodEndStr: periodEnd.toISOString().slice(0, 10),
    periodStartStr: periodStart.toISOString().slice(0, 10),
  };
}

async function fetchProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    include: { domain: true, tasks: true },
    orderBy: { createdAt: "asc" },
  });
}

async function fetchCompletedInPeriod(
  userId: string,
  periodStart: Date,
  periodEndCeiling: Date
) {
  return prisma.task.findMany({
    where: {
      userId,
      status: "done",
      updatedAt: { gte: periodStart, lte: periodEndCeiling },
    },
    include: { project: { include: { domain: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

async function fetchFocusResult(userId: string, periodStart: Date, periodEndCeiling: Date) {
  const r = await prisma.focusSession.aggregate({
    where: {
      userId,
      endTime: { not: null, gte: periodStart, lte: periodEndCeiling },
    },
    _sum: { durationMinutes: true },
    _count: true,
  });
  return { sumMinutes: r._sum.durationMinutes ?? 0, count: r._count };
}

async function fetchOverdueTasks(userId: string, periodEnd: Date) {
  return prisma.task.findMany({
    where: {
      userId,
      status: { not: "done" },
      deadline: { lt: periodEnd },
      project: { status: { not: "dropped" } },
    },
    include: { project: true },
    orderBy: { deadline: "asc" },
  });
}

async function fetchLastWeeklyContent(userId: string, beforePeriodStart: Date) {
  const review = await prisma.review.findFirst({
    where: { userId, type: "weekly", periodEnd: { lt: beforePeriodStart } },
    orderBy: { periodEnd: "desc" },
    select: { content: true },
  });
  return (review?.content as { bottlenecks?: string; priorityNotes?: string } | null) ?? null;
}

/**
 * Load all data needed for the weekly review and for AI insights.
 * periodEndParam: optional "YYYY-MM-DD"; if omitted, uses server's current date as period end.
 */
export async function getWeeklyReviewStats(
  userId: string,
  periodEndParam?: string | null
): Promise<WeeklyStats> {
  const { periodStart, periodEnd, periodEndStr, periodStartStr } = getWeekBounds(periodEndParam ?? null);
  const periodEndCeiling = new Date(periodEnd);
  periodEndCeiling.setHours(23, 59, 59, 999);

  const [projects, completedInPeriod, focusResult, overdueTasks, lastWeeklyContent] = await Promise.all([
    fetchProjects(userId),
    fetchCompletedInPeriod(userId, periodStart, periodEndCeiling),
    fetchFocusResult(userId, periodStart, periodEndCeiling),
    fetchOverdueTasks(userId, periodEnd),
    fetchLastWeeklyContent(userId, periodStart),
  ]);

  return {
    periodStart,
    periodEnd,
    periodStartStr,
    periodEndStr,
    projects,
    completedInPeriod,
    focusResult,
    overdueTasks,
    lastWeeklyContent,
  };
}
