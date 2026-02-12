import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGamification } from "@/lib/gamification";

/**
 * GET /api/gamification — Streaks and milestones for dashboard and analytics.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const tz = user?.timezone ?? "UTC";

  const gamification = await getGamification(prisma, session.user.id, tz);
  return NextResponse.json(gamification);
}
