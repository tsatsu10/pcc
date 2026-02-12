import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domain") || undefined;

  if (domainId) {
    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId: session.user.id },
    });
    if (!domain)
      return NextResponse.json({ error: "Domain not found" }, { status: 400 });
  }

  const data = await getDashboardData(session.user.id, { domainId });
  return NextResponse.json(data);
}
