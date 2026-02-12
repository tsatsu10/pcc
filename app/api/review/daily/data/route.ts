import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayRangeInUserTimezone } from "@/lib/timezone";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const tz = user?.timezone ?? "UTC";
  const { start: dayStart, end: dayEnd } = getTodayRangeInUserTimezone(tz);

  const [tasksWithFocusToday, focusStats, lastDailyWithRemember] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: session.user.id,
        focusDate: { gte: dayStart, lt: dayEnd },
      },
      include: { project: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.focusSession.aggregate({
      where: {
        userId: session.user.id,
        startTime: { gte: dayStart, lt: dayEnd },
      },
      _count: true,
      _sum: { durationMinutes: true },
    }),
    prisma.review.findFirst({
      where: {
        userId: session.user.id,
        type: "daily",
        periodEnd: { lt: dayStart },
      },
      orderBy: { periodEnd: "desc" },
      select: { content: true },
    }),
  ]);

  const completed = tasksWithFocusToday.filter((t) => t.status === "done");
  const missed = tasksWithFocusToday.filter((t) => t.status === "focus" || t.status === "postponed");

  const content = lastDailyWithRemember?.content as { rememberForTomorrow?: string } | null;
  const lastRememberForTomorrow =
    content?.rememberForTomorrow && String(content.rememberForTomorrow).trim()
      ? String(content.rememberForTomorrow).trim()
      : null;

  return NextResponse.json({
    date: dayStart.toISOString().slice(0, 10),
    focusSessionCount: focusStats._count,
    totalFocusMinutes: focusStats._sum.durationMinutes ?? 0,
    lastRememberForTomorrow,
    completed: completed.map((t) => ({
      id: t.id,
      title: t.title,
      project: { id: t.project.id, name: t.project.name },
    })),
    missed: missed.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      project: { id: t.project.id, name: t.project.name },
    })),
  });
}
