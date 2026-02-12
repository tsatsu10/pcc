"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Breadcrumbs,
  Button,
  Input,
  Label,
  Modal,
  Textarea,
  PageSkeleton,
  FieldError,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
  Tooltip,
} from "@/components/ui";
import { KnowledgeIcon } from "@/components/dashboard/DashboardIcons";

type Domain = { id: string; name: string };
type Project = { id: string; name: string; domain?: Domain };
type Tag = { id: string; name: string };
type TaskRef = { id: string; title: string; project?: { id: string; name: string } };
type Note = {
  id: string;
  title: string;
  content: string;
  domain: Domain | null;
  project: (Project & { domain?: Domain }) | null;
  task: TaskRef | null;
  tags: { tag: Tag }[];
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

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function NoteDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [domainId, setDomainId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasksForProject, setTasksForProject] = useState<{ id: string; title: string }[]>([]);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (typeof (params as Promise<{ id: string }>).then === "function") {
      (params as Promise<{ id: string }>).then((p) => setResolvedId(p.id));
    } else {
      setResolvedId((params as { id: string }).id);
    }
  }, [params]);

  const id = resolvedId;

  function load() {
    if (!id) return;
    setLoading(true);
    fetch(`/api/notes/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setNote)
      .catch(() => setNote(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setTags).catch(() => []);
    fetch("/api/domains").then((r) => r.json()).then(setDomains).catch(() => []);
    fetch("/api/projects").then((r) => r.json()).then(setProjects).catch(() => []);
  }, []);

  useEffect(() => {
    if (editMode) fetch("/api/tags").then((r) => r.json()).then(setTags).catch(() => []);
  }, [editMode]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      const proj = note.project as { id?: string; domainId?: string; domain?: { id: string } };
      setDomainId(note.domain?.id ?? proj?.domain?.id ?? proj?.domainId ?? "");
      setProjectId(proj?.id ?? "");
      setTaskId((note.task as { id?: string })?.id ?? "");
      setSelectedTagIds(note.tags.map((t) => t.tag.id));
    }
  }, [note]);

  useEffect(() => {
    if (!projectId) {
      setTasksForProject([]);
      return;
    }
    fetch(`/api/tasks?projectId=${projectId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setTasksForProject)
      .catch(() => setTasksForProject([]));
  }, [projectId]);

  const projectsInDomain = domainId
    ? projects.filter((p) => (p as { domainId?: string }).domainId === domainId || (p.domain as Domain)?.id === domainId)
    : projects;

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }
  function addExistingTagByName(name: string) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return;
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed);
    if (existing && !selectedTagIds.includes(existing.id)) {
      setSelectedTagIds((prev) => [...prev, existing.id]);
      setNewTagName("");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      let tagIds = selectedTagIds;
      if (newTagName.trim()) {
        const createRes = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newTagName.trim() }),
        });
        if (createRes.ok) {
          const newTag = await createRes.json();
          tagIds = [...tagIds, newTag.id];
        } else {
          const d = await createRes.json().catch(() => ({}));
          setSaveError(d.error ?? "Tag already exists or invalid");
          setSaving(false);
          return;
        }
      }
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || "",
          domainId: domainId || null,
          projectId: projectId || null,
          taskId: taskId || null,
          tagIds,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error ?? "Failed to save");
        return;
      }
      setEditMode(false);
      setNewTagName("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(d.error ?? "Delete failed");
        return;
      }
      window.location.href = "/dashboard/knowledge";
    } finally {
      setDeleting(false);
    }
  }

  if (!id || loading) return <PageSkeleton />;
  if (!note) return <main className="p-6 sm:p-8 max-w-3xl mx-auto"><p className="text-muted-foreground">Note not found.</p></main>;

  const selectedTags = selectedTagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean) as Tag[];

  return (
    <main className="p-6 sm:p-8 max-w-3xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Knowledge", href: "/dashboard/knowledge" },
        { label: note.title },
      ]} />

      <Card className="overflow-hidden">
        {editMode ? (
          <form onSubmit={handleSave}>
            <div className="space-y-8">
              <section>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Note</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="mt-1.5"
                      placeholder="Note title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-content">Content</Label>
                    <Textarea
                      id="edit-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="mt-1.5 resize-y min-h-[160px]"
                      placeholder="Your note content…"
                    />
                  </div>
                </div>
              </section>

              <section className="pt-6 border-t border-border">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Context (optional)</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Select
                    label="Domain"
                    value={domainId}
                    onChange={(e) => { setDomainId(e.target.value); setProjectId(""); setTaskId(""); }}
                  >
                    <option value="">None</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Select>
                  <Select
                    label="Project"
                    value={projectId}
                    onChange={(e) => { setProjectId(e.target.value); setTaskId(""); }}
                  >
                    <option value="">None</option>
                    {projectsInDomain.length > 0
                      ? projectsInDomain.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                      : projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                  <Select
                    label="Task"
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    disabled={!projectId}
                  >
                    <option value="">None</option>
                    {tasksForProject.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </Select>
                </div>
              </section>

              <section className="pt-6 border-t border-border">
                <Label className="block mb-1.5">Tags</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Add existing tags by name, or type a new name to create one when you save.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => setSelectedTagIds((prev) => prev.filter((id) => id !== tag.id))}
                        className="rounded p-0.5 hover:bg-secondary-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Remove ${tag.name}`}
                      >
                        <XIcon />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {tags.filter((t) => !selectedTagIds.includes(t.id)).length > 0 && (
                    <span className="text-xs text-muted-foreground mr-1">Add:</span>
                  )}
                  {tags.filter((t) => !selectedTagIds.includes(t.id)).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTagIds((prev) => [...prev, t.id])}
                      className="inline-flex items-center rounded-sm border border-dashed border-input px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors"
                    >
                      + {t.name}
                    </button>
                  ))}
                </div>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onBlur={() => addExistingTagByName(newTagName)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExistingTagByName(newTagName); } }}
                  placeholder="Type tag name and press Enter to add or create"
                  className="mt-3"
                />
              </section>
            </div>

            {saveError && <FieldError className="mt-4">{saveError}</FieldError>}
            <div className="flex gap-2 mt-8 pt-6 border-t border-border">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              <Button type="button" variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0 [&_svg]:text-primary [&_svg]:w-6 [&_svg]:h-6">
                  <KnowledgeIcon />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground leading-tight">
                    {note.title}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {note.tags.map(({ tag }) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs font-normal">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  {(note.domain || note.project || note.task) && (
                    <p className="text-sm text-muted-foreground mt-2 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                      {note.task && (
                        <Link href={`/dashboard/projects/${note.task.project?.id ?? note.project?.id}`} className="text-primary hover:underline">
                          Task: {note.task.title}
                        </Link>
                      )}
                      {note.task && (note.project || note.domain) && <span>·</span>}
                      {note.project && (
                        <Link href={`/dashboard/projects/${note.project.id}`} className="text-primary hover:underline">
                          {note.project.name}
                        </Link>
                      )}
                      {note.project && note.domain && <span>·</span>}
                      {note.domain && (
                        <Link href={`/dashboard/domains/${note.domain.id}`} className="text-primary hover:underline">
                          {note.domain.name}
                        </Link>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-0.5 shrink-0">
                <Tooltip content="Edit note" side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditMode(true)}
                    aria-label="Edit note"
                  >
                    <EditIcon />
                  </Button>
                </Tooltip>
                <Tooltip content="Delete note" side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteModal(true)}
                    aria-label="Delete note"
                  >
                    <TrashIcon />
                  </Button>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-0 border-t border-border">
              <div className="pt-6 text-foreground prose prose-sm max-w-none dark:prose-invert">
                {note.content ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed m-0">{note.content}</pre>
                ) : (
                  <p className="text-muted-foreground italic m-0">No content</p>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <Modal
        open={deleteModal}
        onClose={() => { if (!deleting) { setDeleteModal(false); setDeleteError(""); } }}
        title="Delete note"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete &quot;{note.title}&quot;? This cannot be undone.
          </p>
          {deleteError && <FieldError>{deleteError}</FieldError>}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setDeleteModal(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
