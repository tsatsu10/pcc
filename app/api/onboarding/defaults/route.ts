import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_DOMAINS = [
  { name: "Work", objective: null },
  { name: "Personal", objective: null },
  { name: "Learning", objective: null },
];
const DEFAULT_PROJECT = { name: "Getting Started", goal: "Learn PCC" };
const DEFAULT_TASKS = [
  "Review PCC dashboard",
  "Complete first focus task",
  "Do first weekly review",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const partialDomains = body.partialDomains === true;
  const partialTasks = body.partialTasks === true;

  // FR-9: Partial defaults — fill missing domains/tasks to reach minimum
  const existingDomainCount = await prisma.domain.count({ where: { userId } });
  
  let domainsCreated = 0;
  if (existingDomainCount === 0 || partialDomains) {
    const neededDomains = Math.max(0, 3 - existingDomainCount);
    if (neededDomains > 0) {
      await prisma.$transaction(
        DEFAULT_DOMAINS.slice(0, neededDomains).map((d) =>
          prisma.domain.create({ data: { userId, name: d.name, objective: d.objective } })
        )
      );
      domainsCreated = neededDomains;
    }
  }

  // Get first domain for project creation
  const firstDomain = await prisma.domain.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (!firstDomain) {
    return NextResponse.json({ error: "No domain found" }, { status: 400 });
  }

  // Create project if none exist
  const existingProjectCount = await prisma.project.count({ where: { userId } });
  let projectCreated = 0;
  let project = await prisma.project.findFirst({ where: { userId } });
  if (existingProjectCount === 0) {
    project = await prisma.project.create({
      data: {
        userId,
        domainId: firstDomain.id,
        name: DEFAULT_PROJECT.name,
        goal: DEFAULT_PROJECT.goal,
        priority: 2,
      },
    });
    projectCreated = 1;
  }

  if (!project) {
    return NextResponse.json({ error: "No project found" }, { status: 400 });
  }

  // Create tasks to reach minimum of 3
  const existingTaskCount = await prisma.task.count({ where: { userId } });
  let tasksCreated = 0;
  if (existingTaskCount === 0 || partialTasks) {
    const neededTasks = Math.max(0, 3 - existingTaskCount);
    if (neededTasks > 0) {
      await prisma.task.createMany({
        data: DEFAULT_TASKS.slice(0, neededTasks).map((title) => ({
          userId,
          projectId: project.id,
          title,
          effort: "m",
          energyLevel: "medium",
        })),
      });
      tasksCreated = neededTasks;
    }
  }

  return NextResponse.json({ 
    ok: true, 
    domains: domainsCreated, 
    project: projectCreated, 
    tasks: tasksCreated 
  });
}
