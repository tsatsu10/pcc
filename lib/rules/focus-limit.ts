/**
 * Daily Focus Engine — server-side enforcement.
 * Per spec: max 3 focus tasks per user per day.
 * FR-24: Day range is derived in user timezone (no server TZ dependence).
 * Use in PATCH /api/tasks/:id and POST /api/focus/assign.
 */

import type { PrismaClient } from "@prisma/client";
import { getTodayRangeInUserTimezone } from "@/lib/timezone";

const MAX_FOCUS_TASKS_PER_DAY = 3;

export { MAX_FOCUS_TASKS_PER_DAY };

/**
 * Count focus tasks for "today" in the user's timezone.
 * @param userTimezone - IANA timezone (e.g. "America/New_York"). Default "UTC".
 */
export async function getFocusCountForUserToday(
  prisma: PrismaClient,
  userId: string,
  userTimezone: string = "UTC"
): Promise<number> {
  const { start, end } = getTodayRangeInUserTimezone(userTimezone);
  return prisma.task.count({
    where: {
      userId,
      status: "focus",
      focusDate: { gte: start, lt: end },
    },
  });
}

export function canAssignFocus(count: number): boolean {
  return count < MAX_FOCUS_TASKS_PER_DAY;
}
