import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getReviewStatus } from "@/lib/review-status";

/** FR-24: Review due windows use user timezone (via getReviewStatus). */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getReviewStatus(prisma, session.user.id);
  return NextResponse.json({
    dailyRequired: status.dailyRequired,
    weeklyRequired: status.weeklyRequired,
    monthlyRequired: status.monthlyRequired,
    dailyDone: status.dailyDone,
    weeklyLastPeriodEnd: status.weeklyLastPeriodEnd,
    monthlyLastPeriodEnd: status.monthlyLastPeriodEnd,
  });
}
