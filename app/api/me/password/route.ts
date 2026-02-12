import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const bodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateLimitResult = await checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rateLimitResult.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": rateLimitResult.retryAfter.toString() } }
    );
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const passwordHash = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Change password error:", e);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
