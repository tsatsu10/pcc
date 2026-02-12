/**
 * Gamification: streaks and milestones (no new tables).
 * All day boundaries use user timezone (FR-24).
 */

import type { PrismaClient } from "@prisma/client";
import { getTodayInUserTimezone } from "@/lib/timezone";

export const TASK_MILESTONES = [10, 25, 50, 100] as const;
export const FOCUS_MILESTONE_MINUTES = [600, 3000, 6000] as const; // 10h, 50h, 100h

/** For display: id used in reached[], label, requirement text */
export const TASK_MILESTONE_DEFS = TASK_MILESTONES.map((n) => ({
  id: `${n} tasks`,
  label: `${n} tasks completed`,
  requirement: `Complete ${n} tasks`,
  value: n,
}));
export const FOCUS_MILESTONE_DEFS = FOCUS_MILESTONE_MINUTES.map((mins) => ({
  id: `${mins / 60}h focus`,
  label: `${mins / 60}h total focus time`,
  requirement: `Log ${mins / 60} hours of focus`,
  value: mins,
}));

export type GamificationResult = {
  completionStreak: number;
  dailyReviewStreak: number;
  focusDaysStreak: number;
  milestones: {
    totalTasksCompleted: number;
    totalFocusMinutes: number;
    reached: string[];
  };
};

/**
 * Format a Date to "YYYY-MM-DD" in the given timezone for grouping and streak comparison.
 */
function formatDateInTZ(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Compute current streak: consecutive days ending at "today" in the set of distinct days.
 * daySet: set of "YYYY-MM-DD" strings (in user TZ).
 * todayStr: "YYYY-MM-DD" for today in user TZ.
 * timeZone: user timezone for "previous calendar day" computation.
 * Returns 0 if today is not in the set.
 */
function currentStreakFromDays(daySet: Set<string>, todayStr: string, timeZone: string): number {
  if (!daySet.has(todayStr)) return 0;
  let count = 1;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  let d = new Date(todayStr + "T12:00:00.000Z");
  for (;;) {
    d = new Date(d.getTime() - 24 * 60 * 60 * 1000);
    const prevStr = formatter.format(d);
    if (!daySet.has(prevStr)) break;
    count++;
  }
  return count;
}

export async function getGamification(
  prisma: PrismaClient,
  userId: string,
  timezone: string
): Promise<GamificationResult> {
  const tz = timezone || "UTC";
  const today = getTodayInUserTimezone(tz);
  const todayStr = formatDateInTZ(today, tz);

  const [doneTasks, dailyReviews, completedSessions, totalTasksDone, focusAgg] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: "done" },
      select: { updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.review.findMany({
      where: { userId, type: "daily" },
      select: { periodEnd: true },
      orderBy: { periodEnd: "desc" },
    }),
    prisma.focusSession.findMany({
      where: { userId, endTime: { not: null } },
      select: { endTime: true },
    }),
    prisma.task.count({ where: { userId, status: "done" } }),
    prisma.focusSession.aggregate({
      where: { userId, endTime: { not: null } },
      _sum: { durationMinutes: true },
    }),
  ]);

  const totalFocusMinutes = focusAgg._sum.durationMinutes ?? 0;

  const completionDaySet = new Set(doneTasks.map((t) => formatDateInTZ(t.updatedAt, tz)));
  const dailyReviewDaySet = new Set(dailyReviews.map((r) => formatDateInTZ(r.periodEnd, tz)));
  const focusDaySet = new Set(
    completedSessions
      .filter((s) => s.endTime != null)
      .map((s) => formatDateInTZ(s.endTime!, tz))
  );

  const completionStreak = currentStreakFromDays(completionDaySet, todayStr, tz);
  const dailyReviewStreak = currentStreakFromDays(dailyReviewDaySet, todayStr, tz);
  const focusDaysStreak = currentStreakFromDays(focusDaySet, todayStr, tz);

  const reached: string[] = [];
  for (const m of TASK_MILESTONES) {
    if (totalTasksDone >= m) reached.push(`${m} tasks`);
  }
  for (const mins of FOCUS_MILESTONE_MINUTES) {
    if (totalFocusMinutes >= mins) {
      const hours = mins / 60;
      reached.push(`${hours}h focus`);
    }
  }

  return {
    completionStreak,
    dailyReviewStreak,
    focusDaysStreak,
    milestones: {
      totalTasksCompleted: totalTasksDone,
      totalFocusMinutes,
      reached,
    },
  };
}
