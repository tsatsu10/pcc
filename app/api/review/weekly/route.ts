import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const projectPrioritySchema = z.object({
  projectId: z.string().uuid(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const bodySchema = z.object({
  bottlenecks: z.string().optional().default(""),
  priorityNotes: z.string().optional().default(""),
  projectPriorities: z.array(projectPrioritySchema).optional().default([]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const today = new Date();
  const periodEnd = new Date(today);
  periodEnd.setHours(0, 0, 0, 0);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);

  const lastWeekly = await prisma.review.findFirst({
    where: { userId: session.user.id, type: "weekly" },
    orderBy: { periodEnd: "desc" },
  });
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  if (lastWeekly && lastWeekly.periodEnd >= sevenDaysAgo)
    return NextResponse.json(
      { error: "A weekly review was already submitted within the last 7 days." },
      { status: 400 }
    );

  const content = {
    bottlenecks: parsed.data.bottlenecks,
    priorityNotes: parsed.data.priorityNotes,
  };

  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      type: "weekly",
      periodStart,
      periodEnd,
      content,
    },
  });

  if (parsed.data.projectPriorities.length > 0) {
    await Promise.all(
      parsed.data.projectPriorities.map(({ projectId, priority }) =>
        prisma.project.updateMany({
          where: { id: projectId, userId: session.user.id },
          data: { priority },
        })
      )
    );
  }

  return NextResponse.json({
    id: review.id,
    type: review.type,
    periodStart: review.periodStart.toISOString().slice(0, 10),
    periodEnd: review.periodEnd.toISOString().slice(0, 10),
  });
}
