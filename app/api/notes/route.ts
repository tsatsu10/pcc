import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().max(100_000),
  domainId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  taskId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const tagId = searchParams.get("tagId");
  const domainId = searchParams.get("domainId");
  const projectId = searchParams.get("projectId");

  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      ...(tagId && { tags: { some: { tagId } } }),
      ...(domainId && { domainId }),
      ...(projectId && { projectId }),
    },
    include: {
      domain: true,
      project: { include: { domain: true } },
      task: true,
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    const { domainId, projectId, taskId, tagIds, ...rest } = parsed.data;

    if (domainId || projectId || taskId) {
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, userId: session.user.id },
        });
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 400 });
      }
      if (domainId) {
        const domain = await prisma.domain.findFirst({
          where: { id: domainId, userId: session.user.id },
        });
        if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 400 });
      }
      if (taskId) {
        const task = await prisma.task.findFirst({
          where: { id: taskId, userId: session.user.id },
        });
        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 400 });
      }
    }

    const tagIdsToConnect = tagIds ?? [];
    if (tagIdsToConnect.length > 0) {
      const userTags = await prisma.tag.findMany({
        where: { userId: session.user.id, id: { in: tagIdsToConnect } },
        select: { id: true },
      });
      const validIds = userTags.map((t) => t.id);
      const invalid = tagIdsToConnect.filter((id) => !validIds.includes(id));
      if (invalid.length > 0) return NextResponse.json({ error: "Invalid tag ids" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        userId: session.user.id,
        title: rest.title.trim(),
        content: rest.content || "",
        domainId: domainId || null,
        projectId: projectId || null,
        taskId: taskId || null,
        tags: {
          create: tagIdsToConnect.map((tagId) => ({ tagId })),
        },
      },
      include: {
        domain: true,
        project: { include: { domain: true } },
        task: true,
        tags: { include: { tag: true } },
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (e) {
    console.error("Note create error:", e);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
