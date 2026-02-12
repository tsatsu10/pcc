"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, Button, Input, Label, Modal, EmptyState, PageSkeleton, FieldError } from "@/components/ui";
import { TasksIcon } from "@/components/dashboard/DashboardIcons";

type Task = {
  id: string;
  title: string;
  status: string;
  effort: string;
  energyLevel: string;
  deadline: string | null;
  project?: { id: string; name: string };
};

function isOverdue(deadline: string | null, status: string): boolean {
  if (!deadline || status === "done") return false;
  return new Date(deadline) < new Date(new Date().toDateString());
}
type Project = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  domain: { id: string; name: string };
  tasks: Task[];
  notes?: { id: string; title: string }[];
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newEffort, setNewEffort] = useState("m");
  const [newEnergyLevel, setNewEnergyLevel] = useState("medium");
  const [addError, setAddError] = useState("");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editEffort, setEditEffort] = useState("m");
  const [editEnergyLevel, setEditEnergyLevel] = useState("medium");
  const [editStatus, setEditStatus] = useState("backlog");
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string; domain: { name: string } }[]>([]);

  function load() {
    fetch(`/api/projects/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllProjects)
      .catch(() => setAllProjects([]));
  }, []);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: id,
        title: newTitle.trim(),
        deadline: newDeadline.trim() || undefined,
        effort: newEffort as "xs" | "s" | "m" | "l" | "xl",
        energyLevel: newEnergyLevel as "low" | "medium" | "high",
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setAddError(d.error ?? "Failed to add task");
      return;
    }
    setNewTitle("");
    setNewDeadline("");
    setNewEffort("m");
    setNewEnergyLevel("medium");
    setAddTaskOpen(false);
    load();
  }

  async function handleUpdateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editTaskId) return;
    const res = await fetch(`/api/tasks/${editTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        projectId: editProjectId || undefined,
        deadline: editDeadline.trim() || null,
        effort: editEffort as "xs" | "s" | "m" | "l" | "xl",
        energyLevel: editEnergyLevel as "low" | "medium" | "high",
        status: editStatus as "backlog" | "focus" | "done" | "postponed",
      }),
    });
    if (!res.ok) return;
    setEditTaskId(null);
    setEditTitle("");
    setEditProjectId("");
    setEditDeadline("");
    setEditEffort("m");
    setEditEnergyLevel("medium");
    setEditStatus("backlog");
    load();
  }

  function openEditTask(t: Task) {
    setEditTaskId(t.id);
    setEditTitle(t.title);
    setEditProjectId(t.project?.id ?? id);
    setEditDeadline(t.deadline ? t.deadline.slice(0, 10) : "");
    setEditEffort(t.effort);
    setEditEnergyLevel(t.energyLevel);
    setEditStatus(t.status);
  }

  async function handleDeleteTask() {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${deleteModal.id}`, { method: "DELETE" });
      if (!res.ok) return;
      setDeleteModal(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  const selectClass = "h-9 rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  if (loading) return <PageSkeleton />;
  if (!project) return <main className="p-6 sm:p-8"><p className="text-muted-foreground">Project not found.</p></main>;

  const doneCount = project.tasks.filter((t) => t.status === "done").length;
  const totalCount = project.tasks.length;
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const overdueTasks = project.tasks.filter((t) => isOverdue(t.deadline, t.status));

  return (
    <main className="p-6 sm:p-8 max-w-2xl mx-auto">
      <Breadcrumbs items={[
        { label: "Domains", href: "/dashboard/domains" },
        { label: project.domain.name, href: `/dashboard/domains/${project.domain.id}` },
        { label: project.name },
      ]} />
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
        <p className="text-sm text-muted-foreground">
          {project.domain.name} · {project.status}
        </p>
        {project.goal && <p className="text-muted-foreground mt-1">{project.goal}</p>}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Progress: {doneCount}/{totalCount} tasks done ({progress}%)
          </span>
          {overdueTasks.length > 0 && (
            <span className="text-destructive font-medium">
              {overdueTasks.length} overdue
            </span>
          )}
        </div>
        {overdueTasks.length > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-xs font-medium text-destructive mb-1">Overdue tasks</p>
            <ul className="text-sm text-destructive">
              {overdueTasks.map((t) => (
                <li key={t.id}>
                  {t.title}
                  {t.deadline && ` (due ${new Date(t.deadline).toLocaleDateString()})`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-foreground">Tasks</h2>
        <Button type="button" onClick={() => { setAddTaskOpen(true); setAddError(""); }}>
          Add task
        </Button>
      </div>

      {project.tasks.length === 0 ? (
        <EmptyState
          icon={<TasksIcon />}
          heading="No tasks yet"
          description="Add tasks to track progress on this project."
          action={
            <Button size="sm" onClick={() => { setAddTaskOpen(true); setAddError(""); }}>
              Add task
            </Button>
          }
          className="py-6"
        />
      ) : (
        <ul className="space-y-2">
          {project.tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/30"
            >
              {editTaskId === t.id ? (
                <div className="flex-1">
                  <form onSubmit={handleUpdateTask} className="space-y-3 p-2 rounded-lg border border-border bg-muted/30">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      placeholder="Title"
                      className="h-9"
                    />
                    <div>
                      <Label className="text-xs">Project</Label>
                      <select
                        value={editProjectId}
                        onChange={(e) => setEditProjectId(e.target.value)}
                        className={`${selectClass} w-full mt-0.5`}
                      >
                        {allProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {p.domain.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className="h-9" />
                      <select value={editEffort} onChange={(e) => setEditEffort(e.target.value)} className={selectClass}>
                        <option value="xs">XS</option>
                        <option value="s">S</option>
                        <option value="m">M</option>
                        <option value="l">L</option>
                        <option value="xl">XL</option>
                      </select>
                      <select value={editEnergyLevel} onChange={(e) => setEditEnergyLevel(e.target.value)} className={selectClass}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={selectClass}>
                        <option value="backlog">Backlog</option>
                        <option value="focus">Focus</option>
                        <option value="done">Done</option>
                        <option value="postponed">Postponed</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">Save</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditTaskId(null)}>Cancel</Button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium text-foreground">{t.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{t.status} · {t.effort} · {t.energyLevel}</span>
                    {t.deadline && <span className="ml-2 text-xs text-muted-foreground">Due {new Date(t.deadline).toLocaleDateString()}</span>}
                    {isOverdue(t.deadline, t.status) && (
                      <span className="ml-2 text-xs text-destructive font-medium">Overdue</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEditTask(t)}>Edit</Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteModal({ id: t.id, title: t.title })}>Delete</Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-medium text-foreground mb-3 mt-8">Notes in this project</h2>
      {(project.notes?.length ?? 0) === 0 ? (
        <div className="flex items-center gap-2 py-4">
          <Link href={`/dashboard/knowledge?projectId=${project.id}`}>
            <Button variant="secondary" size="sm">
              Add note
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {project.notes?.map((n) => (
            <Link
              key={n.id}
              href={`/dashboard/knowledge/${n.id}`}
              className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/30 hover:border-accent"
            >
              <span className="font-medium text-foreground hover:text-primary hover:underline">{n.title}</span>
            </Link>
          ))}
          <Link href={`/dashboard/knowledge?projectId=${project.id}`} className="inline-block text-sm text-primary hover:underline mt-2">
            Add note →
          </Link>
        </div>
      )}

      <Modal
        open={!!deleteModal}
        onClose={() => { if (!deleting) setDeleteModal(null); }}
        title="Delete task"
      >
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Delete &quot;{deleteModal.title}&quot;? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteTask}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} title="Add task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <Label htmlFor="add-title">Title</Label>
            <Input
              id="add-title"
              data-autofocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              placeholder="Task title"
              aria-invalid={!!addError}
              aria-errormessage={addError ? "add-title-error" : undefined}
            />
            <FieldError id="add-title-error">{addError}</FieldError>
          </div>
          <div>
            <Label htmlFor="add-deadline">Deadline (optional)</Label>
            <Input id="add-deadline" type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="add-effort">Effort</Label>
            <select id="add-effort" value={newEffort} onChange={(e) => setNewEffort(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <option value="xs">XS</option>
              <option value="s">S</option>
              <option value="m">M</option>
              <option value="l">L</option>
              <option value="xl">XL</option>
            </select>
          </div>
          <div>
            <Label htmlFor="add-energy">Energy level</Label>
            <select id="add-energy" value={newEnergyLevel} onChange={(e) => setNewEnergyLevel(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
