import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayRangeInUserTimezone } from "@/lib/timezone";
import { z } from "zod";

const bodySchema = z.object({
  completed: z.array(z.object({ taskId: z.string().uuid(), comment: z.string() })).optional().default([]),
  missed: z.array(z.object({ taskId: z.string().uuid(), reason: z.string().min(1) })).optional().default([]),
  generalComment: z.string().optional(),
  mood: z.number().min(1).max(5).optional(),
  rememberForTomorrow: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const tz = user?.timezone ?? "UTC";
  const { start: dayStart, end: dayEnd } = getTodayRangeInUserTimezone(tz);

  const tasksWithFocusToday = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      focusDate: { gte: dayStart, lt: dayEnd },
    },
    select: { id: true },
  });

  const focusSessionsToday = await prisma.focusSession.count({
    where: {
      userId: session.user.id,
      startTime: { gte: dayStart, lt: dayEnd },
    },
  });

  // Require focus sessions only when there were focus tasks (so "no tasks" path can still submit)
  if (tasksWithFocusToday.length > 0 && focusSessionsToday < 1)
    return NextResponse.json({ error: "No focus sessions today; daily review not required." }, { status: 400 });

  const existing = await prisma.review.findFirst({
    where: {
      userId: session.user.id,
      type: "daily",
      periodStart: { lte: dayStart },
      periodEnd: { gte: dayStart },
    },
  });
  if (existing)
    return NextResponse.json({ error: "Daily review already submitted for today." }, { status: 400 });

  const allowedTaskIds = new Set(tasksWithFocusToday.map((t) => t.id));
  const submittedTaskIds = [
    ...parsed.data.completed.map((c) => c.taskId),
    ...parsed.data.missed.map((m) => m.taskId),
  ];
  if (submittedTaskIds.some((id) => !allowedTaskIds.has(id)))
    return NextResponse.json({ error: "Invalid task IDs; only today's focus tasks are allowed." }, { status: 400 });

  const content = {
    completed: parsed.data.completed,
    missed: parsed.data.missed,
    generalComment: parsed.data.generalComment ?? null,
    mood: parsed.data.mood ?? null,
    rememberForTomorrow: parsed.data.rememberForTomorrow?.trim() || null,
  };

  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      type: "daily",
      periodStart: dayStart,
      periodEnd: dayStart,
      content,
    },
  });

  return NextResponse.json({
    id: review.id,
    type: review.type,
    periodStart: review.periodStart.toISOString().slice(0, 10),
    periodEnd: review.periodEnd.toISOString().slice(0, 10),
  });
}
