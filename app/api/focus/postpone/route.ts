import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/focus/postpone — Spec-aligned endpoint.
 * Postpones a focus task by delegating to PATCH /api/tasks/:id with status "postponed".
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : null;
    if (!taskId)
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    const url = new URL(req.url);
    const origin = url.origin;
    const res = await fetch(`${origin}/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        Cookie: req.headers.get("cookie") ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "postponed" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      return NextResponse.json(data.error ? { error: data.error } : { error: "Postpone failed" }, { status: res.status });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[POST /api/focus/postpone]", e);
    return NextResponse.json({ error: "Postpone failed" }, { status: 500 });
  }
}
