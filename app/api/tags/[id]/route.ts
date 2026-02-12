import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    const tag = await prisma.tag.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const existing = await prisma.tag.findUnique({
      where: { userId_name: { userId: session.user.id, name: parsed.data.name.trim() } },
    });
    if (existing && existing.id !== id) return NextResponse.json({ error: "Tag already exists" }, { status: 400 });
    const updated = await prisma.tag.update({
      where: { id },
      data: { name: parsed.data.name.trim() },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Tag update error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const tag = await prisma.tag.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
