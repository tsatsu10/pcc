import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  goals: z.array(z.string()).max(3).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let goals: string[] | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (parsed.success && parsed.data.goals?.length) goals = parsed.data.goals;
  } catch {
    // optional body
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingCompletedAt: new Date(),
      ...(goals && goals.length ? { goals } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
