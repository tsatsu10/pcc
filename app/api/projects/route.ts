import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  domainId: z.string().uuid(),
  goal: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.number().int().min(1).max(3).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      domain: true,
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    const { domainId, deadline, ...rest } = parsed.data;
    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId: session.user.id },
    });
    if (!domain)
      return NextResponse.json({ error: "Domain not found" }, { status: 400 });
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        domainId,
        ...rest,
        deadline: deadline ? new Date(deadline) : null,
        priority: rest.priority ?? 2,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    console.error("Project create error:", e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
