import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().max(100_000).optional(),
  domainId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  taskId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
    include: {
      domain: true,
      project: { include: { domain: true } },
      task: true,
      tags: { include: { tag: true } },
    },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(note);
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
    const note = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (parsed.data.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: parsed.data.projectId, userId: session.user.id },
      });
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 400 });
    }
    if (parsed.data.domainId) {
      const domain = await prisma.domain.findFirst({
        where: { id: parsed.data.domainId, userId: session.user.id },
      });
      if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 400 });
    }
    if (parsed.data.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: parsed.data.taskId, userId: session.user.id },
      });
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 400 });
    }

    const data: {
      title?: string;
      content?: string;
      domainId?: string | null;
      projectId?: string | null;
      taskId?: string | null;
      tags?: { deleteMany: Record<string, never>; create: { tagId: string }[] };
    } = {};
    if (parsed.data.title != null) data.title = parsed.data.title.trim();
    if (parsed.data.content !== undefined) data.content = parsed.data.content;
    if (parsed.data.domainId !== undefined) data.domainId = parsed.data.domainId;
    if (parsed.data.projectId !== undefined) data.projectId = parsed.data.projectId;
    if (parsed.data.taskId !== undefined) data.taskId = parsed.data.taskId;

    if (parsed.data.tagIds !== undefined) {
      const tagIds = parsed.data.tagIds;
      const userTags = await prisma.tag.findMany({
        where: { userId: session.user.id, id: { in: tagIds } },
        select: { id: true },
      });
      const validIds = userTags.map((t) => t.id);
      const invalid = tagIds.filter((tid) => !validIds.includes(tid));
      if (invalid.length > 0) return NextResponse.json({ error: "Invalid tag ids" }, { status: 400 });
      data.tags = {
        deleteMany: {},
        create: validIds.map((tagId) => ({ tagId })),
      };
    }

    const updated = await prisma.note.update({
      where: { id },
      data,
      include: {
        domain: true,
        project: { include: { domain: true } },
        task: true,
        tags: { include: { tag: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Note update error:", e);
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
  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
