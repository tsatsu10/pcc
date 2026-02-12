import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  objective: z.string().optional().nullable(),
  kpis: z.unknown().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const domain = await prisma.domain.findFirst({
    where: { id, userId: session.user.id },
    include: {
      projects: {
        include: { tasks: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
      notes: { select: { id: true, title: true }, orderBy: { updatedAt: "desc" } },
    },
  });
  if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(domain);
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
    const domain = await prisma.domain.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const kpisValue =
      parsed.data.kpis === undefined
        ? undefined
        : parsed.data.kpis === null
          ? Prisma.JsonNull
          : (parsed.data.kpis as Prisma.InputJsonValue);

    const updated = await prisma.domain.update({
      where: { id },
      data: {
        ...(parsed.data.name != null && { name: parsed.data.name }),
        ...(parsed.data.objective !== undefined && { objective: parsed.data.objective }),
        ...(parsed.data.kpis !== undefined && { kpis: kpisValue }),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Domain update error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

const deleteBodySchema = z.object({
  reassignToDomainId: z.string().uuid().optional(),
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const domain = await prisma.domain.findFirst({
    where: { id, userId: session.user.id },
    include: { _count: { select: { projects: true } } },
  });
  if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let reassignToDomainId: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = deleteBodySchema.safeParse(body);
    if (parsed.success && parsed.data.reassignToDomainId) reassignToDomainId = parsed.data.reassignToDomainId;
  } catch {
    // no body or invalid JSON — proceed without reassign
  }

  if (domain._count.projects > 0 && !reassignToDomainId)
    return NextResponse.json(
      { error: "Domain has projects. Move or delete them first, or provide reassignToDomainId to reassign all projects to another domain." },
      { status: 400 }
    );

  if (reassignToDomainId) {
    if (reassignToDomainId === id)
      return NextResponse.json({ error: "reassignToDomainId must be a different domain." }, { status: 400 });
    const target = await prisma.domain.findFirst({
      where: { id: reassignToDomainId, userId: session.user.id },
    });
    if (!target)
      return NextResponse.json({ error: "Target domain not found or access denied." }, { status: 404 });
    await prisma.project.updateMany({
      where: { domainId: id },
      data: { domainId: reassignToDomainId },
    });
  }

  await prisma.domain.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
