/**
 * FR-28/FR-30: Shared logic for whether daily/weekly/monthly review is required.
 * Uses user timezone for "today" (FR-24).
 */

import type { PrismaClient } from "@prisma/client";
import { getTodayRangeInUserTimezone } from "./timezone";

export type ReviewStatus = {
  dailyRequired: boolean;
  weeklyRequired: boolean;
  monthlyRequired: boolean;
  dailyDone: boolean;
  weeklyLastPeriodEnd: string | null;
  monthlyLastPeriodEnd: string | null;
};

export async function getReviewStatus(prisma: PrismaClient, userId: string): Promise<ReviewStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, onboardingCompletedAt: true },
  });
  const tz = user?.timezone ?? "UTC";
  const { start: dayStart, end: dayEnd } = getTodayRangeInUserTimezone(tz);

  const sevenDaysAgo = new Date(dayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(dayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [focusSessionsToday, dailyReviewToday, lastWeeklyReview, lastMonthlyReview] = await Promise.all([
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
  ]);

  const dailyRequired = focusSessionsToday >= 1 && !dailyReviewToday;

  // FR-30: First weekly due 7 days after onboarding (or after last weekly). Anchor = last weekly period end, or onboarding completion if none yet.
  const weeklyAnchorEnd = lastWeeklyReview?.periodEnd ?? user?.onboardingCompletedAt ?? null;
  const sevenDaysAfterAnchor = weeklyAnchorEnd
    ? new Date(weeklyAnchorEnd.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;
  const weeklyRequired = !sevenDaysAfterAnchor || dayStart >= sevenDaysAfterAnchor;

  const monthlyRequired = !lastMonthlyReview || lastMonthlyReview.periodEnd < thirtyDaysAgo;

  return {
    dailyRequired,
    weeklyRequired,
    monthlyRequired,
    dailyDone: !!dailyReviewToday,
    weeklyLastPeriodEnd: lastWeeklyReview?.periodEnd?.toISOString().slice(0, 10) ?? null,
    monthlyLastPeriodEnd: lastMonthlyReview?.periodEnd?.toISOString().slice(0, 10) ?? null,
  };
}
