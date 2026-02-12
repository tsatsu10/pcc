/**
 * GET /api/review — List past reviews (for Past reviews UI).
 * Query: type=daily|weekly|monthly (optional), limit=1..100 (default 50).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_TYPES = ["daily", "weekly", "monthly"] as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const limitParam = searchParams.get("limit");
  const type = typeParam && VALID_TYPES.includes(typeParam as (typeof VALID_TYPES)[number])
    ? (typeParam as (typeof VALID_TYPES)[number])
    : undefined;
  const limit = Math.min(100, Math.max(1, parseInt(limitParam ?? "50", 10) || 50));

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id, ...(type && { type }) },
    orderBy: { periodEnd: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      periodStart: true,
      periodEnd: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      type: r.type,
      periodStart: r.periodStart.toISOString().slice(0, 10),
      periodEnd: r.periodEnd.toISOString().slice(0, 10),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
