import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayInUserTimezone, getStartOfDayInTimezone } from "@/lib/timezone";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  
  // FR-35: Analytics filters - domain, project, custom date range
  const domainId = searchParams.get("domainId") || undefined;
  const projectId = searchParams.get("projectId") || undefined;
  const startDate = searchParams.get("start") || undefined;
  const endDate = searchParams.get("end") || undefined;
  const range = searchParams.get("range") || undefined; // "7d", "30d", "90d", "custom"

  // Validate filter IDs belong to user (defense in depth)
  if (domainId) {
    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId: session.user.id },
    });
    if (!domain)
      return NextResponse.json({ error: "Domain not found" }, { status: 400 });
  }
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const tz = user?.timezone ?? "UTC";

  // Calculate date range (FR-24: use user timezone for preset ranges)
  let periodStart: Date;
  let periodEnd: Date;
  const now = new Date();

  if (range === "custom" && startDate && endDate) {
    periodStart = getStartOfDayInTimezone(startDate, tz);
    periodEnd = new Date(getStartOfDayInTimezone(endDate, tz).getTime() + 24 * 60 * 60 * 1000 - 1);
  } else {
    // Preset: last N days including today (exactly N calendar days in user TZ)
    let periodDays = DEFAULT_DAYS;
    if (range === "7d") periodDays = 7;
    else if (range === "30d") periodDays = 30;
    else if (range === "90d") periodDays = 90;
    else if (searchParams.get("period")) {
      periodDays = Math.min(MAX_DAYS, Math.max(1, parseInt(searchParams.get("period") ?? String(DEFAULT_DAYS), 10) || DEFAULT_DAYS));
    }
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = dateFormatter.format(now);
    const todayStart = getStartOfDayInTimezone(todayStr, tz);
    periodEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const startDateStr = dateFormatter.format(new Date(todayStart.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000));
    periodStart = getStartOfDayInTimezone(startDateStr, tz);
  }

  const todayStart = getTodayInUserTimezone(tz);
  const todayStr = todayStart.toISOString().slice(0, 10);
  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });

  // Build where clauses with filters
  const taskWhere: any = {
    userId: session.user.id,
    status: "done",
    updatedAt: { gte: periodStart, lte: periodEnd },
  };
  if (projectId) taskWhere.projectId = projectId;
  if (domainId && !projectId) {
    taskWhere.project = { domainId };
  }
  
  const sessionWhere: any = {
    userId: session.user.id,
    endTime: { not: null, gte: periodStart, lte: periodEnd },
  };
  if (projectId) {
    sessionWhere.task = { projectId };
  } else if (domainId) {
    sessionWhere.task = { project: { domainId } };
  }
  
  const overdueWhere: any = {
    userId: session.user.id,
    status: { not: "done" },
    deadline: { lt: new Date(todayStr) },
    project: { status: { not: "dropped" } },
  };
  if (projectId) overdueWhere.projectId = projectId;
  if (domainId && !projectId) {
    overdueWhere.project = { ...overdueWhere.project, domainId };
  }

  // For completion rate denominator: tasks created in period (same filters)
  const createdInPeriodWhere: any = {
    userId: session.user.id,
    createdAt: { gte: periodStart, lte: periodEnd },
  };
  if (projectId) createdInPeriodWhere.projectId = projectId;
  if (domainId && !projectId) {
    createdInPeriodWhere.project = { domainId };
  }

  // Previous period (same length, ending just before periodStart) for completion comparison
  const periodMs = periodEnd.getTime() - periodStart.getTime();
  const prevPeriodEnd = new Date(periodStart.getTime() - 1);
  const prevPeriodStart = new Date(periodStart.getTime() - periodMs);
  const taskWherePrev: any = {
    userId: session.user.id,
    status: "done",
    updatedAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
  };
  if (projectId) taskWherePrev.projectId = projectId;
  if (domainId && !projectId) taskWherePrev.project = { domainId };

  const [completedInPeriod, focusTimeResult, focusSessionsInPeriod, overdueTasks, domainCompleted, totalCreatedInPeriod, previousPeriodCompletedCount] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
      include: { project: { include: { domain: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.focusSession.aggregate({
      where: sessionWhere,
      _sum: { durationMinutes: true },
      _count: true,
    }),
    prisma.focusSession.findMany({
      where: sessionWhere,
      select: {
        endTime: true,
        durationMinutes: true,
        task: { select: { project: { select: { domainId: true, domain: { select: { id: true, name: true } } } } } },
      },
    }),
    prisma.task.findMany({
      where: overdueWhere,
      include: { project: true },
      orderBy: { deadline: "asc" },
    }),
    prisma.task.groupBy({
      by: ["projectId"],
      where: taskWhere,
      _count: true,
    }),
    prisma.task.count({ where: createdInPeriodWhere }),
    prisma.task.count({ where: taskWherePrev }),
  ]);

  const projectIds = [...new Set(domainCompleted.map((d) => d.projectId))];
  const projects = projectIds.length
    ? await prisma.project.findMany({
        where: { id: { in: projectIds } },
        include: { domain: true },
      })
    : [];
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const domainAgg = new Map<string, { domainId: string; domainName: string; completedCount: number }>();
  for (const row of domainCompleted) {
    const proj = projectById.get(row.projectId);
    if (!proj) continue;
    const existing = domainAgg.get(proj.domainId);
    if (existing) existing.completedCount += row._count;
    else domainAgg.set(proj.domainId, { domainId: proj.domainId, domainName: proj.domain.name, completedCount: row._count });
  }

  const totalFocusMinutes = focusTimeResult._sum.durationMinutes ?? 0;
  const sessionsCount = focusTimeResult._count;
  const averageSessionMinutes = sessionsCount > 0 && totalFocusMinutes != null
    ? Math.round((totalFocusMinutes / sessionsCount) * 10) / 10
    : null;

  // Focus time per day (group by date in user TZ using endTime)
  const dayToMinutes = new Map<string, number>();
  for (const s of focusSessionsInPeriod) {
    if (!s.endTime || s.durationMinutes == null) continue;
    const dayStr = dateFormatter.format(s.endTime);
    const existing = dayToMinutes.get(dayStr) ?? 0;
    dayToMinutes.set(dayStr, existing + s.durationMinutes);
  }
  const focusTimePerDay = Array.from(dayToMinutes.entries())
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Focus time by domain
  const domainFocusMinutes = new Map<string, { domainId: string; domainName: string; totalMinutes: number }>();
  for (const s of focusSessionsInPeriod) {
    const domain = s.task?.project?.domain;
    if (!domain || s.durationMinutes == null) continue;
    const existing = domainFocusMinutes.get(domain.id);
    const mins = s.durationMinutes;
    if (existing) existing.totalMinutes += mins;
    else domainFocusMinutes.set(domain.id, { domainId: domain.id, domainName: domain.name, totalMinutes: mins });
  }
  const focusTimeByDomain = Array.from(domainFocusMinutes.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);

  return NextResponse.json({
    filters: {
      domainId: domainId || null,
      projectId: projectId || null,
      range: range || `${Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))}d`,
    },
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
    completionRate: {
      totalCompleted: completedInPeriod.length,
      totalCreatedInPeriod,
      previousPeriodCompleted: previousPeriodCompletedCount,
      tasks: completedInPeriod.map((t) => ({
        id: t.id,
        title: t.title,
        updatedAt: t.updatedAt.toISOString(),
        project: { id: t.project.id, name: t.project.name },
        domain: { id: t.project.domain.id, name: t.project.domain.name },
      })),
    },
    focusTime: {
      totalMinutes: totalFocusMinutes,
      sessionsCount: focusTimeResult._count,
      averageSessionMinutes: averageSessionMinutes,
      perDay: focusTimePerDay,
    },
    focusTimeByDomain: focusTimeByDomain,
    overdueTasks: {
      count: overdueTasks.length,
      tasks: overdueTasks.map((t) => ({
        id: t.id,
        title: t.title,
        deadline: t.deadline?.toISOString().slice(0, 10) ?? null,
        project: { id: t.project.id, name: t.project.name },
      })),
    },
    domainBalance: Array.from(domainAgg.values()).sort((a, b) => b.completedCount - a.completedCount),
  });
}
