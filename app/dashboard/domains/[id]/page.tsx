"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, Button, Input, Label, Modal, EmptyState, PageSkeleton, FieldError, Badge } from "@/components/ui";
import { ProjectsIcon, TasksIcon } from "@/components/dashboard/DashboardIcons";

type Task = {
  id: string;
  title: string;
  status: string;
  effort: string;
  deadline: string | null;
  project: { id: string; name: string };
};
type Project = {
  id: string;
  name: string;
  status: string;
  tasks: Task[];
};
type DomainDetail = {
  id: string;
  name: string;
  objective: string | null;
  kpis: unknown;
  projects: Project[];
  notes?: { id: string; title: string }[];
};

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

export default function DomainDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [domain, setDomain] = useState<DomainDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState(2);
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/domains/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setDomain)
      .catch(() => setDomain(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domainId: id,
          goal: goal.trim() || undefined,
          deadline: deadline.trim() || undefined,
          priority,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setAddError(d.error ?? "Failed to create project");
        return;
      }
      setName("");
      setGoal("");
      setDeadline("");
      setPriority(2);
      setAddProjectOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!domain) return <main className="p-6 sm:p-8"><p className="text-muted-foreground">Domain not found.</p></main>;

  const allTasks = domain.projects.flatMap((p) => p.tasks.map((t) => ({ ...t, projectName: p.name, projectId: p.id })));

  const projectStatusVariant = (s: string): "default" | "done" | "focus" | "postponed" | "backlog" => {
    if (s === "completed") return "done";
    if (s === "active") return "focus";
    if (s === "paused") return "postponed";
    if (s === "dropped") return "backlog";
    return "default";
  };

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Domains", href: "/dashboard/domains" },
        { label: domain.name },
      ]} />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{domain.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {domain.projects.length} project{domain.projects.length !== 1 ? "s" : ""} · {allTasks.length} task{allTasks.length !== 1 ? "s" : ""}
            {(domain.notes?.length ?? 0) > 0 && (
              <> · {(domain.notes?.length ?? 0)} note{(domain.notes?.length ?? 0) !== 1 ? "s" : ""}</>
            )}
          </p>
          {domain.objective && <p className="text-muted-foreground mt-1">{domain.objective}</p>}
          {Array.isArray(domain.kpis) && (domain.kpis as string[]).length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">KPIs: {(domain.kpis as string[]).join(", ")}</p>
          )}
        </div>
        <Button type="button" onClick={() => { setAddProjectOpen(true); setAddError(""); }}>
          Add project
        </Button>
      </div>

      <h2 className="font-medium text-foreground mb-3">Projects</h2>
      {domain.projects.length === 0 ? (
        <EmptyState
          icon={<ProjectsIcon />}
          heading="No projects in this domain"
          description="Create a project to organize your work here."
          action={
            <Button size="sm" onClick={() => { setAddProjectOpen(true); setAddError(""); }}>
              Add project
            </Button>
          }
          className="py-6 mb-8"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {domain.projects.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-border bg-card p-5 shadow-pcc transition-colors hover:bg-accent/30 hover:border-accent"
            >
              <Link href={`/dashboard/projects/${p.id}`} className="min-w-0 block">
                <h3 className="font-semibold text-foreground truncate hover:text-primary hover:underline">
                  {p.name}
                </h3>
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={projectStatusVariant(p.status)} className="text-xs font-normal capitalize">
                  {p.status}
                </Badge>
                <Badge variant="default" className="text-xs font-normal">
                  {p.tasks.length} task{p.tasks.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                View project →
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-medium text-foreground mb-3">All tasks in this domain</h2>
      {allTasks.length === 0 ? (
        <EmptyState
          icon={<TasksIcon />}
          heading="No tasks"
          description="Add tasks from a project above or from the Tasks page."
          action={
            <Link href="/dashboard/tasks">
              <Button variant="secondary" size="sm">Go to tasks</Button>
            </Link>
          }
          className="py-6"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allTasks.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-border bg-card p-4 shadow-pcc transition-colors hover:bg-accent/30 hover:border-accent"
            >
              <p className="font-medium text-foreground line-clamp-2">{t.title}</p>
              <Link
                href={`/dashboard/projects/${t.projectId}`}
                className="text-sm text-primary hover:underline mt-0.5 block truncate"
              >
                {t.projectName}
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    ["backlog", "focus", "done", "postponed"].includes(t.status)
                      ? (t.status as "backlog" | "focus" | "done" | "postponed")
                      : "default"
                  }
                  className="text-xs font-normal capitalize"
                >
                  {t.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{t.effort.toUpperCase()}</span>
              </div>
              <Link
                href={`/dashboard/projects/${t.projectId}`}
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                View project →
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-medium text-foreground mb-3 mt-8">Notes in this domain</h2>
      {(domain.notes?.length ?? 0) === 0 ? (
        <div className="flex items-center gap-2 py-4">
          <Link href={`/dashboard/knowledge?domainId=${domain.id}`}>
            <Button variant="secondary" size="sm">
              Add note
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {domain.notes?.map((n) => (
            <Link
              key={n.id}
              href={`/dashboard/knowledge/${n.id}`}
              className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/30 hover:border-accent"
            >
              <span className="font-medium text-foreground hover:text-primary hover:underline">{n.title}</span>
            </Link>
          ))}
          <Link href={`/dashboard/knowledge?domainId=${domain.id}`} className="inline-block text-sm text-primary hover:underline mt-2">
            Add note →
          </Link>
        </div>
      )}

      <Modal
        open={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        title={`New project in ${domain.name}`}
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <div>
            <Label htmlFor="add-name">Name</Label>
            <Input
              id="add-name"
              data-autofocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Project name"
              aria-invalid={!!addError}
              aria-errormessage={addError ? "add-name-error" : undefined}
            />
            <FieldError id="add-name-error">{addError}</FieldError>
          </div>
          <div>
            <Label htmlFor="add-goal">Goal (optional)</Label>
            <Input id="add-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal" />
          </div>
          <div>
            <Label htmlFor="add-deadline">Deadline (optional)</Label>
            <Input id="add-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="add-priority">Priority</Label>
            <select id="add-priority" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className={selectClass}>
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setAddProjectOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add project"}</Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
