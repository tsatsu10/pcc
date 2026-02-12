import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  objective: z.string().optional(),
  kpis: z.unknown().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const domains = await prisma.domain.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          projects: true,
        },
      },
      projects: {
        select: {
          _count: { select: { tasks: true } },
        },
      },
    },
  });
  const mapped = domains.map((d) => {
    const tasksCount = d.projects.reduce((sum, p) => sum + p._count.tasks, 0);
    return {
      id: d.id,
      name: d.name,
      objective: d.objective,
      kpis: d.kpis,
      createdAt: d.createdAt,
      projectsCount: d._count.projects,
      tasksCount,
    };
  });
  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    const kpisValue =
      parsed.data.kpis === undefined
        ? undefined
        : parsed.data.kpis === null
          ? Prisma.JsonNull
          : (parsed.data.kpis as Prisma.InputJsonValue);

    const domain = await prisma.domain.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        objective: parsed.data.objective ?? null,
        ...(kpisValue !== undefined && { kpis: kpisValue }),
      },
    });
    return NextResponse.json(domain, { status: 201 });
  } catch (e) {
    console.error("Domain create error:", e);
    return NextResponse.json({ error: "Failed to create domain" }, { status: 500 });
  }
}
