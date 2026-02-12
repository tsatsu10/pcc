"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Breadcrumbs,
  Button,
  Input,
  Label,
  Textarea,
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
  Select,
} from "@/components/ui";
import { DomainIcon } from "@/components/dashboard/DashboardIcons";

type Domain = {
  id: string;
  name: string;
  objective: string | null;
  kpis: unknown;
  createdAt: string;
  projectsCount: number;
  tasksCount: number;
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

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"none" | "create" | "edit">("none");
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [kpisText, setKpisText] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string; projectsCount: number } | null>(null);
  const [reassignToDomainId, setReassignToDomainId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function load() {
    fetch("/api/domains")
      .then((r) => r.json())
      .then(setDomains)
      .catch(() => setDomains([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          objective: objective.trim() || undefined,
          kpis: kpisToArray(kpisText),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error ?? "Failed to create");
        return;
      }
      setModal("none");
      setName("");
      setObjective("");
      setKpisText("");
      load();
    } finally {
      setSaving(false);
    }
  }

  function kpisToArray(text: string): string[] | undefined {
    const arr = text.split(/\n/).map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr : undefined;
  }

  function kpisFromDomain(k: unknown): string {
    if (Array.isArray(k)) return k.filter((x) => typeof x === "string").join("\n");
    return "";
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/domains/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          objective: objective.trim() || null,
          kpis: kpisToArray(kpisText) ?? null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error ?? "Failed to update");
        return;
      }
      setModal("none");
      setEditId(null);
      setName("");
      setObjective("");
      setKpisText("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    if (deleteModal.projectsCount > 0 && !reassignToDomainId) {
      setDeleteError("Choose a domain to reassign projects to.");
      return;
    }
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/domains/${deleteModal.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reassignToDomainId ? { reassignToDomainId } : {}
        ),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(d.error ?? "Delete failed");
        return;
      }
      setDeleteModal(null);
      setReassignToDomainId("");
      load();
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(d: Domain) {
    setEditId(d.id);
    setName(d.name);
    setObjective(d.objective ?? "");
    setKpisText(kpisFromDomain(d.kpis));
    setModal("edit");
    setSaveError("");
  }

  const openCreate = () => {
    setModal("create");
    setName("");
    setObjective("");
    setKpisText("");
    setSaveError("");
  };

  return (
    <main className="p-6 sm:p-8 max-w-5xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Domains" },
      ]} />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Domains</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            High-level areas of your life — Work, Health, Personal. Each domain holds projects and tasks.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add domain
        </Button>
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : domains.length === 0 ? (
        <EmptyState
          icon={<DomainIcon />}
          heading="No domains yet"
          description="Domains are the high-level areas of your life. Create one to start organizing."
          action={
            <Button size="sm" onClick={openCreate}>
              Add domain
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d) => (
            <Card
              key={d.id}
              className="relative transition duration-200 hover:bg-accent/30 hover:border-accent hover:shadow-md group"
            >
              <Link
                href={`/dashboard/domains/${d.id}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg -m-px p-px"
                aria-label={`View ${d.name} domain`}
              >
                <CardHeader className="flex flex-row items-start gap-3 pb-2">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0 [&_svg]:text-primary [&_svg]:w-5 [&_svg]:h-5">
                    <DomainIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{d.name}</CardTitle>
                    {d.objective && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {d.objective}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default" className="text-xs font-normal">
                      {d.projectsCount} project{d.projectsCount !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {d.tasksCount} task{d.tasksCount !== 1 ? "s" : ""}
                    </Badge>
                    {Array.isArray(d.kpis) && (d.kpis as string[]).length > 0 && (
                      <Badge variant="default" className="text-xs font-normal bg-muted/80">
                        {(d.kpis as string[]).length} KPI{(d.kpis as string[]).length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                    View domain →
                  </span>
                </CardContent>
              </Link>
              <div
                className="absolute top-3 right-3 flex gap-0.5 z-10"
                onClick={(e) => e.preventDefault()}
              >
                <Tooltip content={`Edit ${d.name}`} side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); openEdit(d); }}
                    aria-label={`Edit ${d.name}`}
                  >
                    <EditIcon />
                  </Button>
                </Tooltip>
                <Tooltip content={`Delete ${d.name}`} side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ id: d.id, name: d.name, projectsCount: d.projectsCount }); setReassignToDomainId(""); setDeleteError(""); }}
                    aria-label={`Delete ${d.name}`}
                  >
                    <TrashIcon />
                  </Button>
                </Tooltip>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal === "create"} onClose={() => setModal("none")} title="New domain">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="create-name">Name</Label>
            <Input
              id="create-name"
              data-autofocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Work"
              aria-invalid={!!saveError}
              aria-errormessage={saveError ? "create-name-error" : undefined}
            />
            <FieldError id="create-name-error">{saveError && modal === "create" ? saveError : null}</FieldError>
          </div>
          <div>
            <Label htmlFor="create-objective">Objective (optional)</Label>
            <Textarea
              id="create-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
              placeholder="What this domain is for"
            />
          </div>
          <div>
            <Label htmlFor="create-kpis">KPIs (optional, one per line)</Label>
            <Textarea
              id="create-kpis"
              value={kpisText}
              onChange={(e) => setKpisText(e.target.value)}
              rows={3}
              placeholder="One per line, e.g. Revenue, Customer satisfaction"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setModal("none")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "edit"} onClose={() => setModal("none")} title="Edit domain">
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
            <Label htmlFor="edit-objective">Objective (optional)</Label>
            <Textarea
              id="edit-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="edit-kpis">KPIs (optional, one per line)</Label>
            <Textarea
              id="edit-kpis"
              value={kpisText}
              onChange={(e) => setKpisText(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setModal("none")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteModal}
        onClose={() => { if (!deleting) { setDeleteModal(null); setDeleteError(""); setReassignToDomainId(""); } }}
        title="Delete domain"
      >
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {deleteModal.projectsCount === 0
                ? <>Delete &quot;{deleteModal.name}&quot;? This cannot be undone.</>
                : <>Delete &quot;{deleteModal.name}&quot;? Reassign its {deleteModal.projectsCount} project{deleteModal.projectsCount !== 1 ? "s" : ""} to another domain below, or move/delete them manually first.</>
              }
            </p>
            {deleteModal.projectsCount > 0 && (
              <div>
                <Label htmlFor="delete-reassign">Reassign projects to</Label>
                <Select
                  id="delete-reassign"
                  value={reassignToDomainId}
                  onChange={(e) => setReassignToDomainId(e.target.value)}
                  className="mt-1"
                >
                  <option value="">— Select domain —</option>
                  {domains.filter((d) => d.id !== deleteModal.id).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
                {domains.filter((d) => d.id !== deleteModal.id).length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">No other domain. Create one first to reassign projects.</p>
                )}
              </div>
            )}
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
                disabled={deleting || (deleteModal.projectsCount > 0 && domains.filter((d) => d.id !== deleteModal.id).length === 0)}
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
