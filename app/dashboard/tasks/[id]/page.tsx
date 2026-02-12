"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Breadcrumbs,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  EmptyState,
  PageSkeleton,
} from "@/components/ui";
import { TasksIcon, FocusIcon } from "@/components/dashboard/DashboardIcons";

type FocusSession = {
  id: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
};

type TaskDetail = {
  id: string;
  title: string;
  deadline: string | null;
  effort: string;
  energyLevel: string;
  status: string;
  focusDate: string | null;
  focusGoalMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string; domain: { id: string; name: string } };
  focusSessions: FocusSession[];
  totalFocusMinutes: number;
};

const statusVariant = (s: string): "default" | "focus" | "done" | "postponed" | "backlog" => {
  if (s === "focus") return "focus";
  if (s === "done") return "done";
  if (s === "postponed") return "postponed";
  if (s === "backlog") return "backlog";
  return "default";
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function TaskDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/tasks/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(setTask)
      .catch(() => setTask(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton className="p-6 sm:p-8 max-w-4xl mx-auto" />;
  if (notFound || !task)
    return (
      <main className="p-6 sm:p-8 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Tasks", href: "/dashboard/tasks" },
            { label: "Task" },
          ]}
        />
        <p className="text-muted-foreground mt-4">Task not found.</p>
        <Link
          href="/dashboard/tasks"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-accent"
        >
          Back to tasks
        </Link>
      </main>
    );

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tasks", href: "/dashboard/tasks" },
          { label: task.title },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4 mt-2">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap">
          <TasksIcon />
          {task.title}
        </h1>
        <Link
          href="/dashboard/tasks"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-accent"
        >
          ← All tasks
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant(task.status)} className="capitalize">
          {task.status}
        </Badge>
        {task.focusDate && (
          <span className="text-sm text-muted-foreground">
            Focus date: {task.focusDate}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Project: </span>
              <Link
                href={`/dashboard/projects/${task.project.id}`}
                className="text-primary hover:underline"
              >
                {task.project.name}
              </Link>
            </p>
            <p>
              <span className="text-muted-foreground">Domain: </span>
              <Link
                href={`/dashboard/domains/${task.project.domain.id}`}
                className="text-primary hover:underline"
              >
                {task.project.domain.name}
              </Link>
            </p>
            {task.deadline && (
              <p>
                <span className="text-muted-foreground">Deadline: </span>
                {task.deadline}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Effort: </span>
              {task.effort}
            </p>
            <p>
              <span className="text-muted-foreground">Energy: </span>
              <span className="capitalize">{task.energyLevel}</span>
            </p>
            {task.focusGoalMinutes != null && (
              <p>
                <span className="text-muted-foreground">Focus goal: </span>
                {task.focusGoalMinutes} min
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Updated: </span>
              {new Date(task.updatedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FocusIcon />
              Focus time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              {formatDuration(task.totalFocusMinutes)}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {task.focusSessions.length} session{task.focusSessions.length !== 1 ? "s" : ""} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Focus sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {task.focusSessions.length === 0 ? (
            <EmptyState
              heading="No focus sessions"
              description="Start a focus session from Daily Focus to log time on this task."
            />
          ) : (
            <ul className="divide-y divide-border">
              {task.focusSessions.map((s) => (
                <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(s.startTime).toLocaleString()}
                        {s.endTime && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            → {new Date(s.endTime).toLocaleString()}
                          </span>
                        )}
                      </p>
                      {s.durationMinutes != null && s.durationMinutes > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {formatDuration(s.durationMinutes)}
                        </p>
                      )}
                      {s.notes && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {s.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
