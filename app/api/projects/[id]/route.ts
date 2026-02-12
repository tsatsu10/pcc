import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  domainId: z.string().uuid().optional(),
  goal: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(3).optional(),
  status: z.enum(["active", "paused", "completed", "dropped"]).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      domain: true,
      tasks: { orderBy: { createdAt: "asc" } },
      notes: { select: { id: true, title: true }, orderBy: { updatedAt: "desc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

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
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data: Record<string, unknown> = {};
    if (parsed.data.name != null) data.name = parsed.data.name;
    if (parsed.data.domainId != null) data.domainId = parsed.data.domainId;
    if (parsed.data.goal !== undefined) data.goal = parsed.data.goal;
    if (parsed.data.deadline !== undefined) data.deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;
    if (parsed.data.priority != null) data.priority = parsed.data.priority;
    if (parsed.data.status != null) data.status = parsed.data.status;
    const updated = await prisma.project.update({
      where: { id },
      data,
      include: { domain: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Project update error:", e);
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
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
