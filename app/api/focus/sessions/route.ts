import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST: start a focus session for a task (creates FocusSession record)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const taskId = body.taskId as string | undefined;
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const existing = await prisma.focusSession.findFirst({
      where: { userId: session.user.id, endTime: null },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have an active focus session. Stop it first." },
        { status: 409 }
      );
    }

    const startTime = new Date();
    const focusSession = await prisma.focusSession.create({
      data: {
        userId: session.user.id,
        taskId,
        startTime,
      },
    });

    return NextResponse.json({
      id: focusSession.id,
      taskId: focusSession.taskId,
      startTime: focusSession.startTime.toISOString(),
    });
  } catch (e) {
    console.error("[POST /api/focus/sessions]", e);
    return NextResponse.json(
      { error: "Failed to start focus session. Please try again." },
      { status: 500 }
    );
  }
}
