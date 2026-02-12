import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DAYS_THRESHOLD = 60;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_THRESHOLD);
  cutoff.setHours(0, 0, 0, 0);

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      status: { not: "done" },
      createdAt: { lte: cutoff },
    },
    include: {
      project: { include: { domain: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const items = tasks.map((t) => {
    const created = new Date(t.createdAt);
    const daysSitting = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      deadline: t.deadline,
      createdAt: t.createdAt.toISOString().slice(0, 10),
      daysSitting,
      project: {
        id: t.project.id,
        name: t.project.name,
        status: t.project.status,
      },
      domain: {
        id: t.project.domain.id,
        name: t.project.domain.name,
      },
    };
  });

  return NextResponse.json({
    thresholdDays: DAYS_THRESHOLD,
    cutoffDate: cutoff.toISOString().slice(0, 10),
    tasks: items,
  });
}
