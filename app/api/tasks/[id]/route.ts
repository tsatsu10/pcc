import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFocusCountForUserToday, MAX_FOCUS_TASKS_PER_DAY } from "@/lib/rules/focus-limit";
import { getTodayInUserTimezone } from "@/lib/timezone";
import { z } from "zod";

// FR-16: Flexible effort - accepts T-shirt sizes OR time estimates
const effortSchema = z.string().refine(
  (val) => {
    if (["xs", "s", "m", "l", "xl"].includes(val.toLowerCase())) return true;
    if (/^\d+(\.\d+)?(h|m|min|hour|hours|minutes)$/i.test(val)) return true;
    return false;
  },
  { message: "Effort must be xs/s/m/l/xl OR time format like '90min' or '2h'" }
);

const focusGoalMinutesSchema = z.number().int().min(1).max(240).optional().nullable();

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  projectId: z.string().uuid().optional(),
  deadline: z.string().optional().nullable(),
  effort: effortSchema.optional(),
  energyLevel: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["backlog", "focus", "done", "postponed"]).optional(),
  focusGoalMinutes: focusGoalMinutesSchema,
});

/**
 * GET /api/tasks/[id] — Fetch a single task with project and focus sessions (for task detail view).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
    include: {
      project: { include: { domain: true } },
      focusSessions: { orderBy: { startTime: "desc" } },
    },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const totalFocusMinutes = task.focusSessions.reduce(
    (sum, s) => sum + (s.durationMinutes ?? 0),
    0
  );
  return NextResponse.json({
    id: task.id,
    title: task.title,
    deadline: task.deadline?.toISOString().slice(0, 10) ?? null,
    effort: task.effort,
    energyLevel: task.energyLevel,
    status: task.status,
    focusDate: task.focusDate?.toISOString().slice(0, 10) ?? null,
    focusGoalMinutes: task.focusGoalMinutes,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    project: {
      id: task.project.id,
      name: task.project.name,
      domain: { id: task.project.domain.id, name: task.project.domain.name },
    },
    focusSessions: task.focusSessions.map((s) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString() ?? null,
      durationMinutes: s.durationMinutes,
      notes: s.notes,
      createdAt: s.createdAt.toISOString(),
    })),
    totalFocusMinutes,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    const task = await prisma.task.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data: Record<string, unknown> = {};
    if (parsed.data.title != null) data.title = parsed.data.title;
    if (parsed.data.projectId != null) {
      const project = await prisma.project.findFirst({
        where: { id: parsed.data.projectId, userId: session.user.id },
      });
      if (!project)
        return NextResponse.json({ error: "Project not found" }, { status: 400 });
      data.projectId = parsed.data.projectId;
    }
    if (parsed.data.deadline !== undefined) data.deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;
    if (parsed.data.effort != null) data.effort = parsed.data.effort;
    if (parsed.data.energyLevel != null) data.energyLevel = parsed.data.energyLevel;
    if (parsed.data.focusGoalMinutes !== undefined) {
      data.focusGoalMinutes = parsed.data.focusGoalMinutes === null ? null : parsed.data.focusGoalMinutes ?? undefined;
    }
    if (parsed.data.status != null) {
      if (parsed.data.status === "focus") {
        // FR-14: Check if project is active before allowing focus assignment
        const project = await prisma.project.findUnique({
          where: { id: task.projectId },
          select: { status: true },
        });
        if (project?.status !== "active") {
          return NextResponse.json(
            { error: "Tasks from paused or completed projects cannot be moved to focus." },
            { status: 400 }
          );
        }
        // FR-24: Use user timezone for "today" and for focus count range
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { timezone: true },
        });
        const tz = user?.timezone ?? "UTC";
        const today = getTodayInUserTimezone(tz);
        const todayStr = today.toISOString().slice(0, 10);
        const focusCount = await getFocusCountForUserToday(prisma, session.user.id, tz);
        const isAlreadyFocusToday =
          task.status === "focus" &&
          task.focusDate &&
          new Date(task.focusDate).toISOString().slice(0, 10) === todayStr;
        if (!isAlreadyFocusToday && focusCount >= MAX_FOCUS_TASKS_PER_DAY) {
          return NextResponse.json(
            {
              error: `Maximum ${MAX_FOCUS_TASKS_PER_DAY} focus tasks per day. Complete or postpone one to free a slot.`,
            },
            { status: 400 }
          );
        }
        data.focusDate = today;
        if (parsed.data.focusGoalMinutes !== undefined) data.focusGoalMinutes = parsed.data.focusGoalMinutes ?? null;
      }
      if (["done", "postponed", "backlog"].includes(parsed.data.status)) {
        data.focusDate = null;
        data.focusGoalMinutes = null;
      }
      data.status = parsed.data.status;
    }
    const updated = await prisma.task.update({
      where: { id },
      data,
      include: { project: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Task update error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
