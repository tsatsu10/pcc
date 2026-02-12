import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    const existing = await prisma.tag.findUnique({
      where: { userId_name: { userId: session.user.id, name: parsed.data.name.trim() } },
    });
    if (existing) return NextResponse.json({ error: "Tag already exists" }, { status: 400 });
    const tag = await prisma.tag.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name.trim(),
      },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (e) {
    console.error("Tag create error:", e);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
