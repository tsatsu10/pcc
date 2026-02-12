import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * NFR-2: Session recovery endpoint.
 * Allows user to end an orphaned focus session (e.g. after crash/refresh).
 */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const focusSession = await prisma.focusSession.findFirst({
    where: { id, userId: session.user.id, endTime: null },
  });
  if (!focusSession) {
    return NextResponse.json({ error: "Session not found or already ended" }, { status: 404 });
  }

  const now = new Date();
  const elapsedMs = now.getTime() - focusSession.startTime.getTime() - (focusSession.totalPausedMs ?? 0);
  const durationMinutes = Math.max(0, Math.floor(elapsedMs / 60000));

  const updated = await prisma.focusSession.update({
    where: { id },
    data: {
      endTime: now,
      durationMinutes,
      pausedAt: null,
    },
  });

  return NextResponse.json(updated);
}
