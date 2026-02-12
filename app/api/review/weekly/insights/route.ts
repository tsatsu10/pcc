import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeeklyReviewStats } from "@/lib/review-weekly";

const INSIGHT_TIMEOUT_MS = 10_000;

function mapOpenAIError(status: number, body: unknown): string {
  if (status === 429) return "Rate limit exceeded. Try again later.";
  if (status >= 500) return "AI service temporarily unavailable.";
  if (typeof body === "object" && body !== null && "error" in body) {
    const err = (body as { error?: { code?: string; message?: string } }).error;
    const code = err?.code;
    if (code === "context_length_exceeded") return "Too much data for this week; try a shorter period.";
    if (code === "invalid_api_key") return "AI insights are not configured.";
  }
  return "Failed to generate insight.";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "AI insights are not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const periodEndParam = searchParams.get("periodEnd") ?? null;

  const stats = await getWeeklyReviewStats(session.user.id, periodEndParam);
  const periodEndDate = stats.periodEnd; // start-of-day Date for DB

  const cached = await prisma.insightCache.findUnique({
    where: {
      userId_periodEnd: { userId: session.user.id, periodEnd: periodEndDate },
    },
    select: { insight: true },
  });
  if (cached) return NextResponse.json({ insight: cached.insight });

  const todayStr = new Date().toDateString();
  const projectProgress = stats.projects.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "done").length;
    const overdue = p.tasks.filter(
      (t) => t.deadline && t.status !== "done" && new Date(t.deadline).toDateString() < todayStr
    ).length;
    return { name: p.name, domainName: p.domain.name, totalTasks: total, doneCount: done, overdueCount: overdue };
  });

  const domainCounts = new Map<string, number>();
  for (const t of stats.completedInPeriod) {
    const name = t.project?.domain?.name ?? "Other";
    domainCounts.set(name, (domainCounts.get(name) ?? 0) + 1);
  }
  const domainBalance = Array.from(domainCounts.entries()).map(([name, count]) => ({ domainName: name, completedCount: count }));

  const payload = {
    period: `${stats.periodStartStr} to ${stats.periodEndStr}`,
    projectProgress,
    totalCompletedInPeriod: stats.completedInPeriod.length,
    focusMinutes: stats.focusResult.sumMinutes,
    focusSessions: stats.focusResult.count,
    overdueCount: stats.overdueTasks.length,
    overdueProjects: [...new Set(stats.overdueTasks.map((t) => t.project?.name).filter(Boolean))],
    domainBalance,
    lastReview: stats.lastWeeklyContent,
  };

  const systemPrompt = `You are a concise productivity coach. Summarise the following week in 2–4 short sentences. Optionally suggest one priority or risk. Do not use bullet points; write in flowing prose.`;
  const userPrompt = JSON.stringify(payload, null, 0);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), INSIGHT_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 256,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const bodyText = await res.text();
    let parsedBody: unknown = null;
    try {
      parsedBody = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      parsedBody = bodyText;
    }

    if (!res.ok) {
      if (process.env.NODE_ENV !== "test") {
        console.error("[weekly/insights] OpenAI error:", res.status, bodyText?.slice(0, 500));
      }
      const message = mapOpenAIError(res.status, parsedBody);
      return NextResponse.json(
        { error: message },
        { status: res.status >= 500 ? 503 : 400 }
      );
    }

    const data = parsedBody as { choices?: { message?: { content?: string } }[] };
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });

    await prisma.insightCache.upsert({
      where: { userId_periodEnd: { userId: session.user.id, periodEnd: periodEndDate } },
      create: { userId: session.user.id, periodEnd: periodEndDate, insight: content },
      update: { insight: content },
    });
    return NextResponse.json({ insight: content });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error) {
      if (process.env.NODE_ENV !== "test") console.error("[weekly/insights]", e.message);
      if (e.name === "AbortError") return NextResponse.json({ error: "Request timed out." }, { status: 504 });
      const msg = process.env.NODE_ENV === "production" ? "Failed to generate insight." : (e.message || "Failed to generate insight.");
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to generate insight." }, { status: 502 });
  }
}
