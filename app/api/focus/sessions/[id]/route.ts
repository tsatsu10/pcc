import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH: end session (no body), or pause/resume with body { action: "pause" | "resume" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.focusSession.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (existing.endTime) return NextResponse.json({ error: "Session already ended" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : undefined;
    const now = new Date();
    const totalPausedMs = (existing as { totalPausedMs?: number | null }).totalPausedMs ?? 0;

    if (action === "pause") {
      if (existing.pausedAt) {
        return NextResponse.json({ error: "Session already paused" }, { status: 400 });
      }
      const updated = await prisma.focusSession.update({
        where: { id },
        data: { pausedAt: now },
      });
      return NextResponse.json({
        id: updated.id,
        taskId: updated.taskId,
        startTime: updated.startTime.toISOString(),
        pausedAt: updated.pausedAt?.toISOString() ?? null,
        totalPausedMs: (updated as { totalPausedMs?: number }).totalPausedMs ?? 0,
      });
    }

    if (action === "resume") {
      if (!existing.pausedAt) {
        return NextResponse.json({ error: "Session is not paused" }, { status: 400 });
      }
      const extraPaused = now.getTime() - existing.pausedAt.getTime();
      const updated = await prisma.focusSession.update({
        where: { id },
        data: { pausedAt: null, totalPausedMs: totalPausedMs + extraPaused },
      });
      return NextResponse.json({
        id: updated.id,
        taskId: updated.taskId,
        startTime: updated.startTime.toISOString(),
        pausedAt: null,
        totalPausedMs: (updated as { totalPausedMs?: number }).totalPausedMs ?? 0,
      });
    }

    // End session (no action or action !== pause/resume); optional notes (Build Spec §7.6)
    const elapsedMs = now.getTime() - existing.startTime.getTime() - totalPausedMs;
    const durationMinutes = Math.max(0, Math.round(elapsedMs / 60_000));
    const notes = typeof body?.notes === "string" ? body.notes.trim() || null : undefined;

    const updated = await prisma.focusSession.update({
      where: { id },
      data: { endTime: now, durationMinutes, ...(notes !== undefined && { notes }) },
    });

    return NextResponse.json({
      id: updated.id,
      taskId: updated.taskId,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime?.toISOString() ?? null,
      durationMinutes: updated.durationMinutes,
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.error("[focus/sessions PATCH]", e);
    const hint = process.env.NODE_ENV !== "production" && e instanceof Error && /column|paused|Unknown/.test(e.message)
      ? " If pause was recently added, run: npx prisma db push"
      : "";
    return NextResponse.json({ error: `Could not update session.${hint}` }, { status: 500 });
  }
}
