import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const goalsSchema = z.array(z.string().min(0).max(500)).length(3);

const updateSchema = z.object({
  name: z.string().min(0).max(200).optional(),
  timezone: z.string().min(1).max(64).optional(),
  goals: goalsSchema.optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, timezone: true, goals: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const goals = Array.isArray(user.goals)
    ? (user.goals as string[]).slice(0, 3).map((g) => (typeof g === "string" ? g : ""))
    : ["", "", ""];
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone ?? "UTC",
    goals,
    createdAt: user.createdAt,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const updateData: { name?: string; timezone?: string; goals?: string[] } = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name ?? undefined;
    if (parsed.data.timezone !== undefined) updateData.timezone = parsed.data.timezone;
    if (parsed.data.goals !== undefined) {
      updateData.goals = parsed.data.goals.map((g) => (typeof g === "string" ? g.trim() : ""));
    }
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, email: true, name: true, timezone: true, goals: true, createdAt: true },
    });
    const goals = Array.isArray(user.goals)
      ? (user.goals as string[]).slice(0, 3).map((g) => (typeof g === "string" ? g : ""))
      : ["", "", ""];
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone ?? "UTC",
      goals,
      createdAt: user.createdAt,
    });
  } catch (e) {
    console.error("Profile update error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
