/**
 * GET /api/me/export — User data export (Spec §9 / portability and compliance).
 * Query: format=json (default) | format=csv
 * Returns all user data: profile, domains, projects, tasks, focus sessions, reviews, notes, tags.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

function escapeCsvCell(value: string): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateLimitResult = await checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimitResult.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": rateLimitResult.retryAfter.toString() } }
    );
  }
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") ?? "json").toLowerCase();

  const [
    user,
    domainsWithProjectsAndTasks,
    focusSessions,
    reviews,
    notesWithTags,
    tags,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        goals: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.domain.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        projects: {
          orderBy: { createdAt: "asc" },
          include: {
            tasks: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    }),
    prisma.focusSession.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
    }),
    prisma.review.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { periodEnd: "desc" }],
    }),
    prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        tags: { include: { tag: true } },
      },
    }),
    prisma.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const exportedAt = new Date().toISOString();

  const userSafe = {
    ...user,
    onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  const domains = domainsWithProjectsAndTasks.map((d) => ({
    id: d.id,
    name: d.name,
    objective: d.objective,
    kpis: d.kpis,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    projects: d.projects.map((p) => ({
      id: p.id,
      domainId: p.domainId,
      name: p.name,
      goal: p.goal,
      deadline: p.deadline?.toISOString().slice(0, 10) ?? null,
      priority: p.priority,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      tasks: p.tasks.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        deadline: t.deadline?.toISOString().slice(0, 10) ?? null,
        effort: t.effort,
        energyLevel: t.energyLevel,
        status: t.status,
        focusDate: t.focusDate?.toISOString().slice(0, 10) ?? null,
        focusGoalMinutes: t.focusGoalMinutes,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    })),
  }));

  const sessions = focusSessions.map((s) => ({
    id: s.id,
    taskId: s.taskId,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime?.toISOString() ?? null,
    durationMinutes: s.durationMinutes,
    totalPausedMs: s.totalPausedMs,
    notes: s.notes ?? null,
    createdAt: s.createdAt.toISOString(),
  }));

  const reviewsData = reviews.map((r) => ({
    id: r.id,
    type: r.type,
    periodStart: r.periodStart.toISOString().slice(0, 10),
    periodEnd: r.periodEnd.toISOString().slice(0, 10),
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  }));

  const notes = notesWithTags.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    domainId: n.domainId,
    projectId: n.projectId,
    taskId: n.taskId,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    tagNames: n.tags.map((nt) => nt.tag.name),
  }));

  const tagsData = tags.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: t.createdAt.toISOString(),
  }));

  if (format === "csv") {
    const rows: string[][] = [
      [
        "domain",
        "project",
        "task_id",
        "title",
        "status",
        "deadline",
        "effort",
        "energyLevel",
        "focusDate",
        "focusGoalMinutes",
        "createdAt",
        "updatedAt",
      ],
    ];
    for (const d of domainsWithProjectsAndTasks) {
      for (const p of d.projects) {
        for (const t of p.tasks) {
          rows.push([
            d.name,
            p.name,
            t.id,
            t.title,
            t.status,
            t.deadline?.toISOString().slice(0, 10) ?? "",
            t.effort,
            t.energyLevel,
            t.focusDate?.toISOString().slice(0, 10) ?? "",
            String(t.focusGoalMinutes ?? ""),
            t.createdAt.toISOString(),
            t.updatedAt.toISOString(),
          ]);
        }
      }
    }
    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const filename = `pcc-export-tasks-${exportedAt.slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const payload = {
    exportedAt,
    user: userSafe,
    domains,
    focusSessions: sessions,
    reviews: reviewsData,
    notes,
    tags: tagsData,
  };

  const filename = `pcc-export-${exportedAt.slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
