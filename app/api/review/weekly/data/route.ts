import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWeeklyReviewStats } from "@/lib/review-weekly";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getWeeklyReviewStats(session.user.id, null);
  const todayStr = new Date().toDateString();

  const projectProgress = stats.projects.map((p) => {
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

  const overdueTasks = stats.projects.flatMap((p) =>
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

  return NextResponse.json({
    periodStart: stats.periodStartStr,
    periodEnd: stats.periodEndStr,
    projectProgress,
    overdueTasks,
  });
}
