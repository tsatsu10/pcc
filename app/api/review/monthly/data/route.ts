import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const periodEnd = new Date(today);
  periodEnd.setHours(0, 0, 0, 0);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 30);

  const todayStr = today.toDateString();
  const periodEndForQuery = new Date(periodEnd);
  periodEndForQuery.setHours(23, 59, 59, 999);

  const [projects, completedInPeriod, focusTimeResult] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        domain: true,
        tasks: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.count({
      where: {
        userId: session.user.id,
        status: "done",
        updatedAt: { gte: periodStart, lte: periodEndForQuery },
      },
    }),
    prisma.focusSession.aggregate({
      where: {
        userId: session.user.id,
        endTime: { not: null, gte: periodStart, lte: periodEndForQuery },
      },
      _sum: { durationMinutes: true },
    }),
  ]);

  const projectProgress = projects.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "done").length;
    const overdue = p.tasks.filter(
      (t) => t.deadline && t.status !== "done" && new Date(t.deadline).toDateString() < todayStr
    ).length;
    const completionRate = total > 0 ? done / total : 0;
    let suggestedPriority: 1 | 2 | 3;
    if (overdue > 0) suggestedPriority = 3;
    else if (total > 0 && completionRate >= 0.75) suggestedPriority = 1;
    else suggestedPriority = 2;
    return {
      id: p.id,
      name: p.name,
      domainName: p.domain.name,
      totalTasks: total,
      doneCount: done,
      overdueCount: overdue,
      priority: p.priority,
      suggestedPriority,
    };
  });

  const overdueTasks = projects.flatMap((p) =>
    p.tasks
      .filter(
        (t) =>
          t.deadline &&
          t.status !== "done" &&
          new Date(t.deadline).toDateString() < todayStr
      )
      .map((t) => ({
        id: t.id,
        title: t.title,
        deadline: t.deadline,
        project: { id: p.id, name: p.name },
      }))
  );

  const focusTimeMinutes = focusTimeResult._sum.durationMinutes ?? 0;

  return NextResponse.json({
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
    projectProgress,
    overdueTasks,
    focusTimeMinutes,
    totalCompletedInPeriod: completedInPeriod,
  });
}
