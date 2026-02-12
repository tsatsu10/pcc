import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { TaskStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const VALID_STATUSES: TaskStatus[] = ["backlog", "focus", "done", "postponed"];

// FR-16: Flexible effort - accepts T-shirt sizes OR time estimates (e.g. "90min", "2h")
const effortSchema = z.string().refine(
  (val) => {
    // T-shirt sizes
    if (["xs", "s", "m", "l", "xl"].includes(val.toLowerCase())) return true;
    // Time formats: "90min", "2h", "1.5h", "30m"
    if (/^\d+(\.\d+)?(h|m|min|hour|hours|minutes)$/i.test(val)) return true;
    return false;
  },
  { message: "Effort must be xs/s/m/l/xl OR time format like '90min' or '2h'" }
);

const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  deadline: z.string().optional(),
  effort: effortSchema.optional(),
  energyLevel: z.enum(["low", "medium", "high"]).optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const domainId = searchParams.get("domainId");
  const status = searchParams.get("status");
  const where: { userId: string; projectId?: string; status?: TaskStatus } = { userId: session.user.id };
  if (projectId) where.projectId = projectId;
  if (status && VALID_STATUSES.includes(status as TaskStatus)) where.status = status as TaskStatus;
  if (domainId) {
    const projectIds = await prisma.project.findMany({
      where: { userId: session.user.id, domainId },
      select: { id: true },
    });
    const ids = projectIds.map((p) => p.id);
    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id, projectId: { in: ids } },
      include: { project: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(tasks);
  }
  const tasks = await prisma.task.findMany({
    where,
    include: { project: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    const { deadline, projectId, ...rest } = parsed.data;
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 400 });
    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        projectId,
        ...rest,
        deadline: deadline ? new Date(deadline) : null,
        effort: rest.effort ?? "m",
        energyLevel: (rest.energyLevel ?? "medium") as "low" | "medium" | "high",
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    console.error("Task create error:", e);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
