"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Breadcrumbs,
  Button,
  Input,
  Label,
  Modal,
  EmptyState,
  CardGridSkeleton,
  FieldError,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tooltip,
} from "@/components/ui";
import { ProjectsIcon } from "@/components/dashboard/DashboardIcons";

type Domain = { id: string; name: string };
type Project = {
  id: string;
  name: string;
  goal: string | null;
  deadline: string | null;
  priority: number;
  status: string;
  domain: Domain;
  _count?: { tasks: number };
};

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const statusBadgeVariant = (
  s: string
): "default" | "done" | "backlog" | "focus" | "postponed" => {
  if (s === "completed") return "done";
  if (s === "active") return "focus";
  if (s === "paused") return "postponed";
  if (s === "dropped") return "backlog";
  return "default";
};

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3-3V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"none" | "create" | "edit">("none");
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [domainId, setDomainId] = useState("");
  const [priority, setPriority] = useState(2);
  const [status, setStatus] = useState("active");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function loadProjects() {
    return fetch("/api/projects").then((r) => r.json());
  }
  function loadDomains() {
    return fetch("/api/domains").then((r) => r.json());
  }

  useEffect(() => {
    Promise.all([loadProjects(), loadDomains()]).then(([projs, doms]) => {
      setProjects(projs);
      setDomains(doms);
      if (doms.length && !domainId) setDomainId(doms[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (domains.length && !domainId) setDomainId(domains[0].id);
  }, [domains]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domainId: domainId || domains[0]?.id,
          goal: goal.trim() || undefined,
          deadline: deadline.trim() || undefined,
          priority,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error ?? "Failed to create");
        return;
      }
      setModal("none");
      setName("");
      setGoal("");
      setDeadline("");
      setProjects(await loadProjects());
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domainId: domainId || undefined,
          goal: goal.trim() || null,
          deadline: deadline.trim() || null,
          priority,
          status,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error ?? "Failed to update");
        return;
      }
      setModal("none");
      setEditId(null);
      setProjects(await loadProjects());
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteModal.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(d.error ?? "Delete failed");
        return;
      }
      setDeleteModal(null);
      setProjects(await loadProjects());
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(p: Project) {
    setEditId(p.id);
    setName(p.name);
    setGoal(p.goal ?? "");
    setDeadline(p.deadline ? p.deadline.slice(0, 10) : "");
    setDomainId(p.domain.id);
    setPriority(p.priority);
    setStatus(p.status);
    setModal("edit");
    setSaveError("");
  }

  const priorityLabel = (p: number) => (p === 1 ? "Low" : p === 2 ? "Medium" : "High");

  return (
    <main className="p-6 sm:p-8 max-w-5xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects" },
      ]} />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize tasks under domains. Each project can have a goal, deadline, and priority.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setModal("create");
            setName("");
            setGoal("");
            setDeadline("");
            setDomainId(domains[0]?.id ?? "");
            setPriority(2);
            setSaveError("");
          }}
        >
          Add project
        </Button>
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<ProjectsIcon />}
          heading="No projects yet"
          description="Create a project to organize your tasks and track progress."
          action={
            <Button size="sm" onClick={() => setModal("create")}>
              Add project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
          {projects.map((p) => (
            <Card
              key={p.id}
              className="relative transition duration-200 hover:bg-accent/30 hover:border-accent hover:shadow-md group"
            >
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg -m-px p-px"
                aria-label={`View ${p.name} project`}
              >
                <CardHeader className="flex flex-row items-start gap-3 pb-2">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0 [&_svg]:text-primary [&_svg]:w-5 [&_svg]:h-5">
                    <ProjectsIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{p.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {p.domain.name}
                    </p>
                    {p.goal && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {p.goal}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(p.status)} className="text-xs font-normal capitalize">
                      {p.status}
                    </Badge>
                    <Badge variant="default" className="text-xs font-normal">
                      {priorityLabel(p.priority)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {(p._count?.tasks ?? 0)} task{(p._count?.tasks ?? 0) !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {p.deadline && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Due {new Date(p.deadline).toLocaleDateString()}
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                    View project →
                  </span>
                </CardContent>
              </Link>
              <div
                className="absolute top-3 right-3 flex gap-0.5 z-10"
                onClick={(e) => e.preventDefault()}
              >
                <Tooltip content={`Edit ${p.name}`} side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                    aria-label={`Edit ${p.name}`}
                  >
                    <EditIcon />
                  </Button>
                </Tooltip>
                <Tooltip content={`Delete ${p.name}`} side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ id: p.id, name: p.name }); }}
                    aria-label={`Delete ${p.name}`}
                  >
                    <TrashIcon />
                  </Button>
                </Tooltip>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal === "create" && domains.length > 0} onClose={() => setModal("none")} title="New project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="create-name">Name</Label>
            <Input
              id="create-name"
              data-autofocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Project name"
              aria-invalid={!!saveError}
              aria-errormessage={saveError ? "create-name-error" : undefined}
            />
            <FieldError id="create-name-error">{saveError && modal === "create" ? saveError : null}</FieldError>
          </div>
          <div>
            <Label htmlFor="create-domain">Domain</Label>
            <select id="create-domain" value={domainId} onChange={(e) => setDomainId(e.target.value)} className={selectClass}>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="create-goal">Goal (optional)</Label>
            <Input id="create-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What you want to achieve" />
          </div>
          <div>
            <Label htmlFor="create-priority">Priority</Label>
            <select id="create-priority" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className={selectClass}>
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setModal("none")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "edit"} onClose={() => setModal("none")} title="Edit project">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              data-autofocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-invalid={!!saveError}
              aria-errormessage={saveError ? "edit-name-error" : undefined}
            />
            <FieldError id="edit-name-error">{saveError && modal === "edit" ? saveError : null}</FieldError>
          </div>
          <div>
            <Label htmlFor="edit-domain">Domain</Label>
            <select id="edit-domain" value={domainId} onChange={(e) => setDomainId(e.target.value)} className={selectClass}>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="edit-goal">Goal (optional)</Label>
            <Input id="edit-goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-deadline">Deadline (optional)</Label>
            <Input id="edit-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-priority">Priority</Label>
            <select id="edit-priority" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className={selectClass}>
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>
          <div>
            <Label htmlFor="edit-status">Status</Label>
            <select id="edit-status" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped / Abandoned</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setModal("none")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteModal}
        onClose={() => { if (!deleting) { setDeleteModal(null); setDeleteError(""); } }}
        title="Delete project"
      >
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Delete &quot;{deleteModal.name}&quot;? All tasks in this project will be removed. This cannot be undone.
            </p>
            {deleteError && <FieldError>{deleteError}</FieldError>}
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
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
