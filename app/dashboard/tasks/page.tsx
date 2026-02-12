"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Breadcrumbs, Button, Input, Label, Badge, Modal, EmptyState, CardGridSkeleton, FieldError, type BadgeVariant } from "@/components/ui";
import { TasksIcon } from "@/components/dashboard/DashboardIcons";

type Task = {
  id: string;
  title: string;
  status: string;
  effort: string;
  energyLevel: string;
  deadline: string | null;
  project: { id: string; name: string };
};

type Project = {
  id: string;
  name: string;
  domain: { id: string; name: string };
};

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";

const statusVariant = (status: string): BadgeVariant => {
  if (status === "focus") return "focus";
  if (status === "done") return "done";
  if (status === "postponed") return "postponed";
  if (status === "backlog") return "backlog";
  return "default";
};

type ViewMode = "card" | "list" | "calendar";
type SortKey = "title" | "status" | "deadline" | "project";

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortBy, setSortBy] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [projects, setProjects] = useState<Project[]>([]);
  const [createProjectId, setCreateProjectId] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDeadline, setCreateDeadline] = useState("");
  const [createEffort, setCreateEffort] = useState("m");
  const [createEnergyLevel, setCreateEnergyLevel] = useState("medium");
  const [createError, setCreateError] = useState("");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editEffort, setEditEffort] = useState("m");
  const [editEnergyLevel, setEditEnergyLevel] = useState("medium");
  const [editStatus, setEditStatus] = useState("backlog");
  const [editError, setEditError] = useState("");
  const hasHandledNewParam = useRef(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  function loadTasks() {
    const url = statusFilter ? `/api/tasks?status=${statusFilter}` : "/api/tasks";
    fetch(url)
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    loadTasks();
  }, [statusFilter]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Project[]) => {
        setProjects(list);
        setCreateProjectId((prev) => (prev || list[0]?.id) ?? "");
      })
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (createOpen) setCreateError("");
  }, [createOpen]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      if (!hasHandledNewParam.current) {
        hasHandledNewParam.current = true;
        setCreateOpen(true);
        router.replace("/dashboard/tasks", { scroll: false });
      }
    } else {
      hasHandledNewParam.current = false;
    }
  }, [searchParams, router]);

  const tasksWithDeadlines = tasks.filter((t): t is Task & { deadline: string } => t.deadline != null);
  const tasksByDate = tasksWithDeadlines.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.deadline.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const sortedTasks = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "title") cmp = a.title.localeCompare(b.title);
    else if (sortBy === "status") cmp = a.status.localeCompare(b.status);
    else if (sortBy === "deadline") {
      const da = a.deadline ? new Date(a.deadline).getTime() : 0;
      const db = b.deadline ? new Date(b.deadline).getTime() : 0;
      cmp = da - db;
    } else if (sortBy === "project") cmp = a.project.name.localeCompare(b.project.name);
    if (cmp !== 0) return sortDir === "asc" ? cmp : -cmp;
    return a.id.localeCompare(b.id);
  });

  function toggleSort(key: SortKey) {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    if (!createProjectId.trim()) {
      setCreateError("Select a project");
      return;
    }
    const project = projects.find((p) => p.id === createProjectId);
    const optId = `opt-${Date.now()}`;
    const optimisticTask: Task = {
      id: optId,
      title: createTitle.trim(),
      status: "backlog",
      effort: createEffort,
      energyLevel: createEnergyLevel,
      deadline: createDeadline.trim() || null,
      project: project ?? { id: createProjectId, name: "" },
    };
    const showsInFilter = !statusFilter || statusFilter === optimisticTask.status;
    if (showsInFilter) setTasks((prev) => [...prev, optimisticTask]);
    setCreateTitle("");
    setCreateDeadline("");
    setCreateEffort("m");
    setCreateEnergyLevel("medium");
    setCreateOpen(false);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: createProjectId,
          title: optimisticTask.title,
          deadline: optimisticTask.deadline || undefined,
          effort: optimisticTask.effort as "xs" | "s" | "m" | "l" | "xl",
          energyLevel: optimisticTask.energyLevel as "low" | "medium" | "high",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (showsInFilter) setTasks((prev) => prev.filter((t) => t.id !== optId));
        setCreateError(d.error ?? "Failed to create task");
        setCreateOpen(true);
        return;
      }
      const created = await res.json();
      if (showsInFilter) {
        const createdProject = projects.find((p) => p.id === created.projectId);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === optId
              ? {
                  ...created,
                  project: createdProject ?? { id: created.projectId, name: "" },
                }
              : t
          )
        );
      } else {
        loadTasks();
      }
    } catch {
      if (showsInFilter) setTasks((prev) => prev.filter((t) => t.id !== optId));
      setCreateError("Failed to create task");
      setCreateOpen(true);
    }
  }

  function openEditTask(t: Task) {
    setEditTask(t);
    setEditTitle(t.title);
    setEditProjectId(t.project.id);
    setEditDeadline(t.deadline ? t.deadline.slice(0, 10) : "");
    setEditEffort(t.effort);
    setEditEnergyLevel(t.energyLevel);
    setEditStatus(t.status);
    setEditError("");
  }

  async function handleUpdateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editTask) return;
    setEditError("");
    const res = await fetch(`/api/tasks/${editTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        projectId: editProjectId || undefined,
        deadline: editDeadline.trim() || null,
        effort: editEffort as "xs" | "s" | "m" | "l" | "xl",
        energyLevel: editEnergyLevel as "low" | "medium" | "high",
        status: editStatus as "pending" | "backlog" | "focus" | "done" | "postponed",
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setEditError(d.error ?? "Failed to update");
      return;
    }
    setEditTask(null);
    loadTasks();
  }

  const mapStatusVariant = (
    s: string
  ): BadgeVariant => {
    if (s === "backlog") return "backlog";
    if (s === "focus") return "focus";
    if (s === "done") return "done";
    if (s === "postponed") return "postponed";
    return "default";
  };

  function getCalendarWeeks(year: number, month: number): Array<Array<{ date: string; day: number } | null>> {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDow = first.getDay();
    const daysInMonth = last.getDate();
    const cells: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: dateStr, day: d });
    }
    const remainder = cells.length % 7;
    if (remainder) for (let i = 0; i < 7 - remainder; i++) cells.push(null);
    const weeks: Array<Array<{ date: string; day: number } | null>> = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  const calendarWeeks = viewMode === "calendar" ? getCalendarWeeks(calendarMonth.year, calendarMonth.month) : [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Tasks" },
      ]} />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">All tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage tasks across all projects. Filter by status or create new tasks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5" role="group" aria-label="View mode">
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "card" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Card
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "list" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "calendar" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Calendar
            </button>
          </div>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Create task
          </Button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="backlog">Backlog</option>
            <option value="focus">Focus</option>
            <option value="done">Done</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<TasksIcon />}
          heading="No tasks yet"
          description="Create a task or add tasks from a project to get started."
          action={
            <>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Create task
              </Button>
              <Link href="/dashboard/projects">
                <Button variant="secondary" size="sm">Go to projects</Button>
              </Link>
            </>
          }
        />
      ) : viewMode === "calendar" ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-muted/30">
            <button
              type="button"
              onClick={() => setCalendarMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50"
              aria-label="Previous month"
            >
              ←
            </button>
            <h2 className="text-base font-semibold text-foreground">
              {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <button
              type="button"
              onClick={() => setCalendarMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }))}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50"
              aria-label="Next month"
            >
              →
            </button>
          </div>
          <p className="text-xs text-muted-foreground px-3 py-1 border-b border-border">
            Tasks with a deadline only. Click a task to open it.
          </p>
          {tasksWithDeadlines.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No tasks with deadlines in this view.</p>
              <p className="text-xs text-muted-foreground mt-1">Add a deadline when creating or editing a task to see it on the calendar.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm" role="grid" aria-label="Calendar">
              <thead>
                <tr>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <th key={d} scope="col" className="p-1.5 text-center text-xs font-medium text-muted-foreground border-b border-border">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarWeeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((cell, ci) => {
                      if (!cell) return <td key={ci} className="p-1 align-top border-b border-border min-h-[80px] bg-muted/20" />;
                      const dayTasks = tasksByDate[cell.date] ?? [];
                      const isToday = cell.date === today;
                      const isOverdue = cell.date < today;
                      return (
                        <td
                          key={ci}
                          className={`p-1.5 align-top border-b border-border min-h-[80px] min-w-[44px] ${
                            isToday ? "bg-primary/10 ring-1 ring-primary/30" : isOverdue ? "bg-destructive/5" : "bg-background"
                          }`}
                        >
                          <span className={`text-xs font-medium ${isToday ? "text-primary" : isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                            {cell.day}
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {dayTasks.map((t) => (
                              <li key={t.id}>
                                <Link
                                  href={`/dashboard/tasks/${t.id}`}
                                  className="block text-xs truncate rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
                                  title={`${t.title} · ${t.project.name}`}
                                >
                                  {t.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80 border-b border-border">
                <tr>
                  <th scope="col" className="text-left p-3 font-medium">
                    <button type="button" onClick={() => toggleSort("title")} className="hover:text-foreground">
                      Title {sortBy === "title" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th scope="col" className="text-left p-3 font-medium">
                    <button type="button" onClick={() => toggleSort("project")} className="hover:text-foreground">
                      Project {sortBy === "project" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th scope="col" className="text-left p-3 font-medium">
                    <button type="button" onClick={() => toggleSort("status")} className="hover:text-foreground">
                      Status {sortBy === "status" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th scope="col" className="text-left p-3 font-medium">
                    <button type="button" onClick={() => toggleSort("deadline")} className="hover:text-foreground">
                      Deadline {sortBy === "deadline" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th scope="col" className="text-right p-3 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-accent/20">
                    <td className="p-3 font-medium">
                      <Link href={`/dashboard/tasks/${t.id}`} className="text-foreground hover:text-primary hover:underline">
                        {t.title}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Link href={`/dashboard/projects/${t.project.id}`} className="text-primary hover:underline">
                        {t.project.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Badge variant={mapStatusVariant(t.status)} className="text-xs font-normal capitalize">
                        {t.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {t.deadline ? new Date(t.deadline).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEditTask(t)} aria-label={`Edit ${t.title}`}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTasks.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-border bg-card p-5 shadow-pcc transition-colors hover:bg-accent/30 hover:border-accent"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/dashboard/tasks/${t.id}`}
                  className="font-semibold text-foreground line-clamp-2 min-w-0 flex-1 hover:text-primary hover:underline"
                >
                  {t.title}
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 shrink-0"
                  onClick={() => openEditTask(t)}
                  aria-label={`Edit ${t.title}`}
                >
                  Edit
                </Button>
              </div>
              <Link
                href={`/dashboard/projects/${t.project.id}`}
                className="text-sm text-primary hover:underline mt-0.5 block truncate"
              >
                {t.project.name}
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={mapStatusVariant(t.status)} className="text-xs font-normal capitalize">
                  {t.status}
                </Badge>
                <Badge variant="default" className="text-xs font-normal">
                  {t.effort.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">
                  {t.energyLevel}
                </span>
              </div>
              {t.deadline && (
                <p className="text-xs text-muted-foreground mt-2">
                  Due {new Date(t.deadline).toLocaleDateString()}
                </p>
              )}
              <Link
                href={`/dashboard/projects/${t.project.id}`}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                View project →
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <Label htmlFor="create-project">Project</Label>
            <select
              id="create-project"
              data-autofocus
              value={createProjectId}
              onChange={(e) => setCreateProjectId(e.target.value)}
              required
              className={selectClass}
              aria-invalid={!!createError}
              aria-errormessage={createError ? "create-project-error" : undefined}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.domain.name}
                </option>
              ))}
            </select>
            {createOpen && projects.length === 0 && (
              <p className="text-xs text-warning mt-1">
                Create a project first from the Projects page.
              </p>
            )}
            <FieldError id="create-project-error">{createError}</FieldError>
          </div>
          <div>
            <Label htmlFor="create-title">Title</Label>
            <Input
              id="create-title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              required
              placeholder="Task title"
            />
          </div>
          <div>
            <Label htmlFor="create-deadline">Deadline (optional)</Label>
            <Input
              id="create-deadline"
              type="date"
              value={createDeadline}
              onChange={(e) => setCreateDeadline(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="create-effort">Effort</Label>
            <select
              id="create-effort"
              value={createEffort}
              onChange={(e) => setCreateEffort(e.target.value)}
              className={selectClass}
            >
              <option value="xs">XS</option>
              <option value="s">S</option>
              <option value="m">M</option>
              <option value="l">L</option>
              <option value="xl">XL</option>
            </select>
          </div>
          <div>
            <Label htmlFor="create-energy">Energy level</Label>
            <select
              id="create-energy"
              value={createEnergyLevel}
              onChange={(e) => setCreateEnergyLevel(e.target.value)}
              className={selectClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        title="Edit task"
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div>
            <Label htmlFor="edit-project">Project</Label>
            <select
              id="edit-project"
              data-autofocus
              value={editProjectId}
              onChange={(e) => setEditProjectId(e.target.value)}
              className={selectClass}
              aria-invalid={!!editError}
              aria-errormessage={editError ? "edit-project-error" : undefined}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.domain.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              placeholder="Task title"
            />
          </div>
          <div>
            <Label htmlFor="edit-deadline">Deadline (optional)</Label>
            <Input
              id="edit-deadline"
              type="date"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-effort">Effort</Label>
            <select
              id="edit-effort"
              value={editEffort}
              onChange={(e) => setEditEffort(e.target.value)}
              className={selectClass}
            >
              <option value="xs">XS</option>
              <option value="s">S</option>
              <option value="m">M</option>
              <option value="l">L</option>
              <option value="xl">XL</option>
            </select>
          </div>
          <div>
            <Label htmlFor="edit-energy">Energy level</Label>
            <select
              id="edit-energy"
              value={editEnergyLevel}
              onChange={(e) => setEditEnergyLevel(e.target.value)}
              className={selectClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className={selectClass}
            >
              <option value="backlog">Backlog</option>
              <option value="focus">Focus</option>
              <option value="done">Done</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setEditTask(null)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
