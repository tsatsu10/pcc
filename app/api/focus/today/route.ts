import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayRangeInUserTimezone } from "@/lib/timezone";

/** Build spec §7.11: score for suggested top 3 — deadline ≤2 days (+3), priority high (+2), effort small/medium (+1). */
function suggestScore(
  task: { deadline: Date | null; effort: string },
  project: { priority: number },
  todayStart: Date
): number {
  let score = 0;
  const twoDaysLater = new Date(todayStart);
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);
  if (task.deadline && task.deadline <= twoDaysLater) score += 3;
  if (project.priority === 3) score += 2;
  const effort = (task.effort || "").toLowerCase();
  if (["xs", "s", "m"].includes(effort)) score += 1;
  return score;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // FR-24: Today in user's timezone
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const tz = user?.timezone ?? "UTC";
  const { start, end } = getTodayRangeInUserTimezone(tz);

  const focusTasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      status: "focus",
      focusDate: { gte: start, lt: end },
    },
    include: { project: true },
    orderBy: { createdAt: "asc" },
  });

  // Backlog = not done, from active or paused projects (FR-14: paused tasks shown but cannot add to focus)
  const backlogRaw = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      status: { not: "done" },
      project: { status: { in: ["active", "paused"] } },
      OR: [
        { status: { in: ["backlog", "postponed"] } },
        {
          status: "focus",
          OR: [
            { focusDate: null },
            { focusDate: { lt: start } },
            { focusDate: { gte: end } },
          ],
        },
      ],
    },
    include: { project: { select: { id: true, name: true, status: true, priority: true } } },
    take: 50,
  });

  // Suggested top 3: sort by score (deadline, priority, effort), then by deadline/createdAt for ties
  const backlogTasks = backlogRaw
    .map((t) => ({
      ...t,
      _score: suggestScore(t, t.project, start),
    }))
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      const aDead = a.deadline?.getTime() ?? Infinity;
      const bDead = b.deadline?.getTime() ?? Infinity;
      if (aDead !== bDead) return aDead - bDead;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .map(({ _score, ...t }) => t);

  const suggestedIds = new Set(backlogTasks.slice(0, 3).map((t) => t.id));

  const activeSession = await prisma.focusSession.findFirst({
    where: { userId: session.user.id, endTime: null },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json({
    focus: focusTasks,
    backlog: backlogTasks,
    suggestedIds: Array.from(suggestedIds),
    date: start.toISOString().slice(0, 10),
    activeSession: activeSession
      ? {
          id: activeSession.id,
          taskId: activeSession.taskId,
          startTime: activeSession.startTime.toISOString(),
          pausedAt: activeSession.pausedAt?.toISOString() ?? null,
          totalPausedMs: activeSession.totalPausedMs,
        }
      : null,
  });
}
