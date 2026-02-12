/**
 * GET /api/review/[id] — Fetch a single past review (read-only view).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      type: true,
      periodStart: true,
      periodEnd: true,
      content: true,
      createdAt: true,
    },
  });

  if (!review)
    return NextResponse.json({ error: "Review not found" }, { status: 404 });

  return NextResponse.json({
    id: review.id,
    type: review.type,
    periodStart: review.periodStart.toISOString().slice(0, 10),
    periodEnd: review.periodEnd.toISOString().slice(0, 10),
    content: review.content,
    createdAt: review.createdAt.toISOString(),
  });
}
