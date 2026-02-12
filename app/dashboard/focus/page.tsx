"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, Button, EmptyState, PageSkeleton, LoadingSpinner, SuccessCheckmark, Textarea } from "@/components/ui";
import { FocusIcon, TasksIcon } from "@/components/dashboard/DashboardIcons";
import { useToast } from "@/components/Toast";
import { getNewMilestonesAndSave, getMilestoneLabel } from "@/lib/milestone-toast";
import { MAX_FOCUS_TASKS_PER_DAY } from "@/lib/rules/focus-limit";
import { FocusTimerProgress, getFocusGoalMinutes } from "@/components/dashboard/FocusTimerProgress";

type Task = {
  id: string;
  title: string;
  status: string;
  effort: string;
  deadline: string | null;
  focusDate: string | null;
  focusGoalMinutes?: number | null;
  project: { id: string; name: string; status?: string };
};

type ActiveSession = {
  id: string;
  taskId: string;
  startTime: string;
  pausedAt: string | null;
  totalPausedMs: number;
};

type FocusToday = {
  focus: Task[];
  backlog: Task[];
  suggestedIds?: string[];
  date: string;
  activeSession: ActiveSession | null;
};

export default function FocusPage() {
  const { toast } = useToast();
  const [data, setData] = useState<FocusToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [orphanedSession, setOrphanedSession] = useState<{ id: string; taskTitle: string } | null>(null);
  const [goalMinutes, setGoalMinutes] = useState(25);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  useEffect(() => {
    setGoalMinutes(getFocusGoalMinutes());
  }, []);

  function load() {
    if (!loading) setRefetching(true);
    fetch("/api/focus/today")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setError("");
        // NFR-2: Check for orphaned session (session exists but task not in today's focus)
        if (d?.activeSession && d.focus) {
          const sessionTaskInFocus = d.focus.find((t: Task) => t.id === d.activeSession.taskId);
          if (!sessionTaskInFocus) {
            // Find task title from backlog or use generic message
            const taskInBacklog = d.backlog.find((t: Task) => t.id === d.activeSession.taskId);
            setOrphanedSession({
              id: d.activeSession.id,
              taskTitle: taskInBacklog?.title || "Unknown task",
            });
          }
        }
        return d;
      })
      .catch(() => setData(null))
      .finally(() => {
        setLoading(false);
        setRefetching(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const activeSession = data?.activeSession ?? null;
  const isPaused = !!activeSession?.pausedAt;
  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      setSessionNotes("");
      return;
    }
    const start = new Date(activeSession.startTime).getTime();
    const totalPaused = activeSession.totalPausedMs ?? 0;
    const computeElapsed = () => {
      if (activeSession.pausedAt) {
        const pausedAt = new Date(activeSession.pausedAt).getTime();
        return Math.floor((pausedAt - start - totalPaused) / 1000);
      }
      return Math.floor((Date.now() - start - totalPaused) / 1000);
    };
    const tick = () => setElapsedSeconds(Math.max(0, computeElapsed()));
    tick();
    const interval = isPaused ? null : setInterval(tick, 1000);
    return () => { if (interval) clearInterval(interval); };
  }, [activeSession?.id, activeSession?.startTime, activeSession?.pausedAt, activeSession?.totalPausedMs, isPaused]);

  async function startSession(taskId: string) {
    setError("");
    setActingId(taskId);
    try {
      const res = await fetch("/api/focus/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Failed to start timer");
        return;
      }
      load();
    } catch (e) {
      setError(
        e instanceof TypeError && e.message === "Failed to fetch"
          ? "Network error. Check your connection and try again."
          : "Something went wrong. Please try again."
      );
    } finally {
      setActingId(null);
    }
  }

  async function pauseSession(sessionId: string) {
    setError("");
    setActingId(sessionId);
    try {
      const res = await fetch(`/api/focus/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Failed to pause");
        return;
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to pause");
    } finally {
      setActingId(null);
    }
  }

  async function resumeSession(sessionId: string) {
    setError("");
    setActingId(sessionId);
    try {
      const res = await fetch(`/api/focus/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Failed to resume");
        return;
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resume");
    } finally {
      setActingId(null);
    }
  }

  async function stopSession(sessionId: string) {
    setError("");
    setActingId(sessionId);
    try {
      const res = await fetch(`/api/focus/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: sessionNotes.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Failed to stop timer");
        return;
      }
      setSessionNotes("");
      load();
      fetch("/api/gamification", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((g) => {
          if (!g?.milestones?.reached) return;
          const newIds = getNewMilestonesAndSave(g.milestones.reached as string[]);
          newIds.forEach((id) => toast({ message: `You unlocked: ${getMilestoneLabel(id)}` }));
        })
        .catch(() => {});
    } catch (e) {
      setError(
        e instanceof TypeError && e.message === "Failed to fetch"
          ? "Network error. Check your connection and try again."
          : "Something went wrong. Please try again."
      );
    } finally {
      setActingId(null);
    }
  }

  async function resumeOrphanedSession(sessionId: string) {
    setError("");
    try {
      const res = await fetch(`/api/focus/sessions/${sessionId}/resume`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to end session");
        return;
      }
      setOrphanedSession(null);
      load();
    } catch (e) {
      setError(
        e instanceof TypeError && e.message === "Failed to fetch"
          ? "Network error. Check your connection and try again."
          : "Something went wrong. Please try again."
      );
    }
  }

  function formatElapsed(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatFocusDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) {
      return `Today, ${d.toLocaleDateString(undefined, { day: "numeric", month: "long" })}`;
    }
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  }

  async function setStatus(taskId: string, status: "focus" | "done" | "postponed") {
    setError("");
    setActingId(taskId);
    const prevData = data;
    if (status === "done" || status === "postponed") {
      setData((d) => {
        if (!d) return d;
        const removed = d.focus.find((t) => t.id === taskId);
        const nextFocus = d.focus.filter((t) => t.id !== taskId);
        if (status === "postponed" && removed) {
          return { ...d, focus: nextFocus, backlog: [{ ...removed, status: "postponed" }, ...d.backlog] };
        }
        return { ...d, focus: nextFocus };
      });
    } else if (status === "focus" && data) {
      const task = data.backlog.find((t) => t.id === taskId);
      if (task && data.focus.length < MAX_FOCUS_TASKS_PER_DAY) {
        const today = new Date().toISOString().slice(0, 10);
        setData((d) =>
          d
            ? {
                ...d,
                backlog: d.backlog.filter((t) => t.id !== taskId),
                focus: [...d.focus, { ...task, status: "focus", focusDate: today }],
              }
            : d
        );
      }
    }
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setData(prevData);
        setError(body.error ?? "You already have 3 focus tasks today. Complete or postpone one to add another.");
        return;
      }
      if (status === "done" || status === "postponed") {
        if (status === "done") setJustCompletedId(taskId);
        toast({
          message: status === "done" ? "Task completed" : "Task postponed",
          undo: {
            label: "Undo",
            action: async () => {
              await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "focus" }),
              });
              load();
            },
          },
        });
        if (status === "done") {
          fetch("/api/gamification", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((g) => {
              if (!g?.milestones?.reached) return;
              const newIds = getNewMilestonesAndSave(g.milestones.reached as string[]);
              newIds.forEach((id) => toast({ message: `You unlocked: ${getMilestoneLabel(id)}` }));
            })
            .catch(() => {});
        }
      }
      load();
    } catch (e) {
      setData(prevData);
      setError(
        e instanceof TypeError && e.message === "Failed to fetch"
          ? "Network error. Check your connection and try again."
          : "Something went wrong. Please try again."
      );
    } finally {
      setActingId(null);
    }
  }

  async function setTaskGoalMinutes(taskId: string, minutes: number | null) {
    setError("");
    setActingId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusGoalMinutes: minutes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to update plan");
        return;
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update plan");
    } finally {
      setActingId(null);
    }
  }

  const canAddFocus = data?.focus != null && data.focus.length < MAX_FOCUS_TASKS_PER_DAY;

  return (
    <>
      <SuccessCheckmark
        visible={!!justCompletedId}
        onComplete={() => setJustCompletedId(null)}
        durationMs={1500}
      />
      {loading && <PageSkeleton />}
      {!loading && !data && (
        <main className="p-6 sm:p-8 max-w-4xl mx-auto">
          <p className="text-muted-foreground">Could not load focus data.</p>
        </main>
      )}
      {!loading && data && (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Daily focus" },
      ]} />
      <h1 className="text-xl font-semibold text-foreground">
        Daily focus
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        {formatFocusDate(data.date)} · Up to 3 tasks in focus today. Finish or postpone one to add another.
        {refetching && (
          <span className="ml-2 text-muted-foreground" aria-live="polite">Updating…</span>
        )}
      </p>
      {data.focus.length === MAX_FOCUS_TASKS_PER_DAY && (
        <p className="text-sm text-muted-foreground mt-1.5 pl-3 border-l-2 border-muted" role="status">
          All 3 slots in use. Complete or postpone a task to free a slot.
        </p>
      )}

      {orphanedSession && (
        <div
          className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-between gap-4 flex-wrap"
          role="alert"
        >
          <div>
            <p className="font-medium text-foreground">Session recovery</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              You have an in-progress session for &quot;{orphanedSession.taskTitle}&quot;. Resume or save it.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => resumeOrphanedSession(orphanedSession.id)}
            >
              End & save session
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOrphanedSession(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div
          className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="mt-6" aria-labelledby="focus-slots-heading">
        <h2 id="focus-slots-heading" className="font-medium text-foreground mb-2">
          Focus slots ({data.focus.length} of {MAX_FOCUS_TASKS_PER_DAY})
        </h2>
        {data.focus.length > 0 && data.focus.length < MAX_FOCUS_TASKS_PER_DAY && (
          <p className="text-sm text-muted-foreground mb-2">
            Add another from the list below.
          </p>
        )}
        {data.focus.length === 0 ? (
          <EmptyState
            icon={<FocusIcon />}
            heading="No focus tasks yet"
            description="Pick up to 3 from your backlog."
            action={
              <a href="#backlog">
                <Button size="sm">Pick from backlog</Button>
              </a>
            }
            className="py-6"
          />
        ) : (
          <ul className="space-y-3">
            {data.focus.map((t, index) => {
              const isTimerRunning = activeSession?.taskId === t.id;
              const taskGoalMinutes = t.focusGoalMinutes ?? goalMinutes;
              const hasTaskGoal = t.focusGoalMinutes != null && t.focusGoalMinutes > 0;
              const isPastPlanned = hasTaskGoal && isTimerRunning && elapsedSeconds >= taskGoalMinutes * 60;
              return (
                <li
                  key={t.id}
                  className={`rounded-lg border p-4 shadow-pcc transition-all duration-300 hover:shadow-pcc-lg animate-in fade-in slide-in-from-top-2 ${
                    isTimerRunning
                      ? "border-l-4 border-l-focus-active border-border bg-focus-active/5"
                      : "border-border bg-card hover:bg-accent/30"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{t.title}</p>
                        {isTimerRunning && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-focus-active/20 text-focus-active">
                            {isPaused ? "Paused" : "Active"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <Link
                          href={`/dashboard/projects/${t.project.id}`}
                          className="text-primary hover:underline"
                        >
                          {t.project.name}
                        </Link>
                        {t.deadline &&
                          ` · Due ${new Date(t.deadline).toLocaleDateString()}`}
                      </p>
                      {!isTimerRunning && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <label htmlFor={`plan-${t.id}`} className="shrink-0">Plan:</label>
                          <select
                            id={`plan-${t.id}`}
                            value={t.focusGoalMinutes ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTaskGoalMinutes(t.id, val === "" ? null : parseInt(val, 10));
                            }}
                            disabled={actingId === t.id}
                            className="h-7 rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          >
                            <option value="">No plan</option>
                            <option value={15}>15 min</option>
                            <option value={25}>25 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                            <option value={90}>90 min</option>
                            <option value={120}>120 min</option>
                          </select>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 shrink-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="success"
                          size="sm"
                          className="min-h-[44px] sm:min-h-0"
                          onClick={() => setStatus(t.id, "done")}
                          disabled={actingId === t.id}
                          aria-label={`Mark done: ${t.title}`}
                        >
                          Mark done
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="min-h-[44px] sm:min-h-0"
                          onClick={() => setStatus(t.id, "postponed")}
                          disabled={actingId === t.id}
                          aria-label={`Postpone: ${t.title}`}
                        >
                          Postpone (back to backlog)
                        </Button>
                      </div>
                      {isTimerRunning ? (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <span
                              className="tabular-nums font-medium text-2xl text-focus-active"
                              aria-live="polite"
                            >
                              {formatElapsed(elapsedSeconds)}
                              {hasTaskGoal && (
                                <span className="text-lg font-normal text-focus-active/90">
                                  {" "}/ {taskGoalMinutes} min
                                </span>
                              )}
                              {isPaused && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">(paused)</span>
                              )}
                            </span>
                            <FocusTimerProgress
                              elapsedSeconds={elapsedSeconds}
                              goalMinutes={taskGoalMinutes}
                              onGoalChange={hasTaskGoal ? (m) => setTaskGoalMinutes(t.id, m) : setGoalMinutes}
                            />
                          </div>
                          {isPastPlanned && (
                            <span
                              className="inline-block text-xs text-warning font-medium pl-2 py-0.5 border-l-4 border-l-warning bg-warning/10 rounded-r"
                              role="status"
                            >
                              Past your planned time
                            </span>
                          )}
                          <span
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-success/10 border border-success/20 px-2 py-1 text-xs text-success font-medium"
                            title="Progress is saved; refresh won't lose it"
                          >
                            <svg className="size-3.5 shrink-0" aria-hidden fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                          </span>
                          <div className="w-full sm:w-auto min-w-0">
                            <label htmlFor="session-notes" className="block text-xs font-medium text-muted-foreground mb-1">
                              Session notes (optional)
                            </label>
                            <Textarea
                              id="session-notes"
                              value={sessionNotes}
                              onChange={(e) => setSessionNotes(e.target.value)}
                              placeholder="Reflection or context for this session…"
                              rows={2}
                              className="resize-none text-sm"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 border-l border-border pl-2" aria-label="Timer controls">
                            {isPaused ? (
                              <Button
                                type="button"
                                variant="focus"
                                size="sm"
                                className="min-h-[44px] sm:min-h-0"
                                onClick={() => activeSession && resumeSession(activeSession.id)}
                                disabled={actingId === activeSession?.id}
                                aria-label="Resume timer"
                              >
                                Resume
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="min-h-[44px] sm:min-h-0"
                                onClick={() => activeSession && pauseSession(activeSession.id)}
                                disabled={actingId === activeSession?.id}
                                aria-label="Pause timer"
                              >
                                Pause
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="min-h-[44px] sm:min-h-0"
                              onClick={() => activeSession && stopSession(activeSession.id)}
                              disabled={actingId === activeSession?.id}
                              aria-label="End session"
                            >
                              End session
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="focus"
                          size="sm"
                          className="min-h-[44px] sm:min-h-0"
                          onClick={() => startSession(t.id)}
                          disabled={!!activeSession || actingId === t.id}
                          aria-label={`Start focus session: ${t.title}`}
                        >
                          Start focus session
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="backlog" className="mt-8" aria-labelledby="backlog-heading">
        <h2 id="backlog-heading" className="font-medium text-foreground mb-2">
          Backlog
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Top 3 suggested by due date, priority, and effort. Add any to focus.
        </p>
        {!canAddFocus && (
          <p className="text-sm text-muted-foreground mb-2">
            All 3 slots used. Complete or postpone a task to free one.
          </p>
        )}
        {data.backlog.length === 0 ? (
          <EmptyState
            icon={<TasksIcon />}
            heading="No backlog tasks"
            description="Add tasks in a project first."
            action={
              <>
                <Link href="/dashboard/tasks">
                  <Button size="sm">Create task</Button>
                </Link>
                <Link href="/dashboard/projects">
                  <Button variant="secondary" size="sm">Go to projects</Button>
                </Link>
              </>
            }
            className="py-6"
          />
        ) : (
          <ul className="space-y-2">
            {data.backlog.map((t) => {
              const projectPaused = t.project?.status === "paused";
              const canAddThis = canAddFocus && !projectPaused;
              const isSuggested = (data.suggestedIds ?? []).indexOf(t.id) >= 0;
              return (
                <li
                  key={t.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                    projectPaused ? "border-border bg-muted/30" : "border-border bg-card hover:bg-accent/30"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                      {t.title}
                      {isSuggested && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                          Suggested
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground">Project: </span>
                      <Link
                        href={`/dashboard/projects/${t.project.id}`}
                        className="text-primary hover:underline"
                      >
                        {t.project.name}
                      </Link>
                      {projectPaused && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                          Project paused
                        </span>
                      )}
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                        Backlog
                      </span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="focus"
                    size="sm"
                    className="min-h-[44px] sm:min-h-0"
                    onClick={() => setStatus(t.id, "focus")}
                    disabled={!canAddThis || actingId === t.id}
                    aria-label={projectPaused ? `${t.title} (project paused — activate project to add to focus)` : `Add to focus: ${t.title}`}
                    title={projectPaused ? "Activate the project to add this task to focus" : undefined}
                  >
                    Add to focus
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
      )}
    </>
  );
}
