"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tooltip,
} from "@/components/ui";
import { KnowledgeIcon } from "@/components/dashboard/DashboardIcons";

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

function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

type Domain = { id: string; name: string };
type Project = { id: string; name: string; domainId: string; domain?: Domain };
type Tag = { id: string; name: string };
type TaskRef = { id: string; title: string; project?: { id: string; name: string } };
type Note = {
  id: string;
  title: string;
  content: string;
  domainId: string | null;
  projectId: string | null;
  taskId: string | null;
  domain: Domain | null;
  project: (Project & { domain?: Domain }) | null;
  task: TaskRef | null;
  tags: { tag: Tag }[];
};
type SearchHit = {
  id: string;
  title: string;
  contentPreview: string;
  domain: Domain | null;
  project: { id: string; name: string } | null;
  href: string;
};

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

function KnowledgePageContent() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"none" | "create" | "edit">("none");
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [domainId, setDomainId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tasksForProject, setTasksForProject] = useState<{ id: string; title: string }[]>([]);
  const [domainFilter, setDomainFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);

  function loadNotes() {
    const params = new URLSearchParams();
    if (tagFilter) params.set("tagId", tagFilter);
    if (domainFilter) params.set("domainId", domainFilter);
    if (projectFilter) params.set("projectId", projectFilter);
    const qs = params.toString();
    return fetch(qs ? `/api/notes?${qs}` : "/api/notes").then((r) => r.json());
  }
  function loadTags() {
    return fetch("/api/tags").then((r) => r.json());
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
  function loadProjects() {
    return fetch("/api/projects").then((r) => r.json());
  }
  function loadDomains() {
    return fetch("/api/domains").then((r) => r.json());
  }

  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    Promise.all([loadNotes(), loadTags(), loadProjects(), loadDomains()]).then(([n, t, p, d]) => {
      setNotes(n);
      setTags(t);
      setProjects(p);
      setDomains(d);
    }).finally(() => setLoading(false));
  }, [tagFilter, domainFilter, projectFilter]);

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

  useEffect(() => {
    if (!searchQ || searchQ.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const q = searchQ.trim();
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/knowledge/search?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((hits: SearchHit[]) => setSearchResults(hits))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const domainIdParam = searchParams.get("domainId");
  const projectIdParam = searchParams.get("projectId");

  useEffect(() => {
    if (!domainIdParam && !projectIdParam) return;
    if (loading || domains.length === 0) return;
    setModal("create");
    if (domainIdParam) setDomainId(domainIdParam);
    if (projectIdParam) {
      setProjectId(projectIdParam);
      const proj = projects.find((p) => p.id === projectIdParam) as { domainId?: string; domain?: { id: string } } | undefined;
      if (proj && (proj.domain?.id || proj.domainId)) {
        setDomainId(proj.domain?.id ?? proj.domainId ?? "");
      }
    }
  }, [domainIdParam, projectIdParam, loading, domains.length, projects.length]);

  const projectsInDomain = domainId
    ? projects.filter((pr) => (pr as { domainId?: string }).domainId === domainId || (pr.domain as Domain)?.id === domainId)
    : projects;

  async function handleCreate(e: React.FormEvent) {
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
      const res = await fetch("/api/notes", {
        method: "POST",
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
        setSaveError(d.error ?? "Failed to create");
        return;
      }
      setModal("none");
      setTitle("");
      setContent("");
      setDomainId("");
      setProjectId("");
      setTaskId("");
      setSelectedTagIds([]);
      setNewTagName("");
      setNotes(await loadNotes());
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
      const res = await fetch(`/api/notes/${editId}`, {
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
        setSaveError(d.error ?? "Failed to update");
        return;
      }
      setModal("none");
      setEditId(null);
      setTitle("");
      setContent("");
      setDomainId("");
      setProjectId("");
      setTaskId("");
      setSelectedTagIds([]);
      setNewTagName("");
      setNotes(await loadNotes());
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes/${deleteModal.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(d.error ?? "Delete failed");
        return;
      }
      setDeleteModal(null);
      setNotes(await loadNotes());
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(n: Note) {
    setEditId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setDomainId(n.domain?.id ?? (n.project as { domainId?: string; domain?: { id: string } })?.domain?.id ?? (n.project as { domainId?: string })?.domainId ?? "");
    setProjectId((n.project as { id?: string })?.id ?? "");
    setTaskId((n.task as { id?: string })?.id ?? "");
    setSelectedTagIds(n.tags.map((t) => t.tag.id));
    setNewTagName("");
    setModal("edit");
    setSaveError("");
    loadTags().then(setTags).catch(() => {});
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  const filteredProjects = domainFilter
    ? projects.filter((p) => (p as { domainId?: string }).domainId === domainFilter || (p.domain as Domain)?.id === domainFilter)
    : projects;

  return (
    <main className="min-h-screen bg-background">
      <div className="p-6 sm:p-8 max-w-5xl mx-auto">
        <Breadcrumbs items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Knowledge" },
        ]} />

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Knowledge
              </h1>
              <p className="text-muted-foreground mt-1 max-w-md">
                Notes, ideas, and references. Link to domains and projects for context.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setModal("create");
                setTitle("");
                setContent("");
                setDomainId("");
                setProjectId("");
                setTaskId("");
                setSelectedTagIds([]);
                setNewTagName("");
                setSaveError("");
                loadTags().then(setTags).catch(() => {});
              }}
              className="shrink-0"
            >
              Add note
            </Button>
          </div>
        </header>

        {/* Search + filters bar */}
        <section className="mb-8 rounded-xl border border-border bg-card p-4 shadow-pcc">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex-1 min-w-0">
              <label htmlFor="knowledge-search" className="sr-only">Search notes</label>
              <Input
                id="knowledge-search"
                type="search"
                placeholder="Search notes (2+ characters)…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full h-10"
                aria-label="Search notes"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline-flex items-center gap-1.5">
                <FilterIcon />
                Filters
              </span>
              <select
                value={domainFilter}
                onChange={(e) => { setDomainFilter(e.target.value); setProjectFilter(""); }}
                className={selectClass + " min-w-[140px]"}
                aria-label="Filter by domain"
              >
                <option value="">All domains</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className={selectClass + " min-w-[140px]"}
                aria-label="Filter by project"
              >
                <option value="">All projects</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className={selectClass + " min-w-[120px]"}
                aria-label="Filter by tag"
              >
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

      {loading ? (
        <CardGridSkeleton />
      ) : searchResults !== null ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {searching ? "Searching…" : `Results for "${searchQ.trim()}" (${searchResults.length})`}
            </h2>
          </div>
          {searchResults.length === 0 ? (
            <EmptyState
              icon={<KnowledgeIcon />}
              heading="No notes match your search"
              description={`No results for "${searchQ.trim()}". Try different keywords or clear the search.`}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setSearchQ(""); setSearchResults(null); }}
                >
                  Clear search
                </Button>
              }
              className="py-12 rounded-xl border border-border"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((hit) => (
                <Card
                  key={hit.id}
                  className="transition duration-200 hover:bg-accent/20 hover:border-primary/30 hover:shadow-md group border-l-4 border-l-primary/50"
                >
                  <Link
                    href={hit.href}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg -m-px p-px"
                    aria-label={`View note: ${hit.title}`}
                  >
                    <CardHeader className="flex flex-row items-start gap-3 pb-2">
                      <div className="rounded-lg bg-primary/10 p-2 shrink-0 [&_svg]:text-primary [&_svg]:w-5 [&_svg]:h-5">
                        <KnowledgeIcon />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate">{hit.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{hit.contentPreview}</p>
                        {(hit.domain || hit.project) && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {hit.project?.name}
                            {hit.project && hit.domain && " · "}
                            {hit.domain?.name}
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                        View note →
                      </span>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<KnowledgeIcon />}
          heading="No notes yet"
          description="Create a note to capture ideas, references, and context."
          action={
            <Button size="sm" onClick={() => setModal("create")}>
              Add note
            </Button>
          }
          className="py-12 rounded-xl border border-border"
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <Card
              key={n.id}
              className="relative transition duration-200 hover:bg-accent/20 hover:border-primary/30 hover:shadow-md group border-l-4 border-l-primary/40"
            >
              <Link
                href={`/dashboard/knowledge/${n.id}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg -m-px p-px"
                aria-label={`View note: ${n.title}`}
              >
                <CardHeader className="flex flex-row items-start gap-3 pb-2">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0 [&_svg]:text-primary [&_svg]:w-5 [&_svg]:h-5">
                    <KnowledgeIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{n.title}</CardTitle>
                    {n.content && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {n.content}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {n.tags.map(({ tag }) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTagFilter(tag.id); }}
                        className="inline-flex rounded-sm px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                        title={`Filter by ${tag.name}`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  {(n.domain || n.project || n.task) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {n.task && (
                        <span className="text-primary">
                          Task: {n.task.title}
                        </span>
                      )}
                      {n.task && (n.project || n.domain) && " · "}
                      {n.project ? (
                        <span className="text-primary">{n.project.name}</span>
                      ) : n.domain ? (
                        <span className="text-primary">{n.domain.name}</span>
                      ) : null}
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                    View note →
                  </span>
                </CardContent>
              </Link>
              <div
                className="absolute top-3 right-3 flex gap-0.5 z-10"
                onClick={(e) => e.preventDefault()}
              >
                <Tooltip content={`Edit ${n.title}`} side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); openEdit(n); }}
                    aria-label={`Edit ${n.title}`}
                  >
                    <EditIcon />
                  </Button>
                </Tooltip>
                <Tooltip content={`Delete ${n.title}`} side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ id: n.id, title: n.title }); }}
                    aria-label={`Delete ${n.title}`}
                  >
                    <TrashIcon />
                  </Button>
                </Tooltip>
              </div>
            </Card>
          ))}
        </section>
      )}

      </div>

      <Modal open={modal === "create"} onClose={() => setModal("none")} title="New note">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="create-title">Title</Label>
            <Input
              id="create-title"
              data-autofocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Note title"
              aria-invalid={!!saveError}
            />
            <FieldError id="create-title-error">{saveError && modal === "create" ? saveError : null}</FieldError>
          </div>
          <div>
            <Label htmlFor="create-content">Content</Label>
            <Textarea
              id="create-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Your note content…"
            />
          </div>
          <div>
            <Label htmlFor="create-domain">Domain (optional)</Label>
            <select
              id="create-domain"
              value={domainId}
              onChange={(e) => { setDomainId(e.target.value); setProjectId(""); setTaskId(""); }}
              className={selectClass}
            >
              <option value="">None</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="create-project">Project (optional)</Label>
            <select
              id="create-project"
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setTaskId(""); }}
              className={selectClass}
            >
              <option value="">None</option>
              {projectsInDomain.length > 0
                ? projectsInDomain.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                : projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
            </select>
          </div>
          <div>
            <Label htmlFor="create-task">Task (optional)</Label>
            <select
              id="create-task"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className={selectClass}
              disabled={!projectId}
            >
              <option value="">None</option>
              {tasksForProject.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            {projectId && tasksForProject.length === 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">No tasks in this project.</p>
            )}
          </div>
          <div>
            <Label>Tags</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Select existing tags below, or type a new name to create one on save.
            </p>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t) => (
                  <label key={t.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(t.id)}
                      onChange={() => toggleTag(t.id)}
                      className="rounded border-input"
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-2">No tags yet. Create one below.</p>
            )}
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onBlur={() => addExistingTagByName(newTagName)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExistingTagByName(newTagName); } }}
              placeholder="Type existing tag name to select, or new name to create"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setModal("none")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "edit"} onClose={() => setModal("none")} title="Edit note">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              data-autofocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              aria-invalid={!!saveError}
            />
            <FieldError id="edit-title-error">{saveError && modal === "edit" ? saveError : null}</FieldError>
          </div>
          <div>
            <Label htmlFor="edit-content">Content</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="edit-domain">Domain (optional)</Label>
            <select
              id="edit-domain"
              value={domainId}
              onChange={(e) => { setDomainId(e.target.value); setProjectId(""); setTaskId(""); }}
              className={selectClass}
            >
              <option value="">None</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="edit-project">Project (optional)</Label>
            <select
              id="edit-project"
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setTaskId(""); }}
              className={selectClass}
            >
              <option value="">None</option>
              {projectsInDomain.length > 0
                ? projectsInDomain.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                : projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="edit-task">Task (optional)</Label>
            <select
              id="edit-task"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className={selectClass}
              disabled={!projectId}
            >
              <option value="">None</option>
              {tasksForProject.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tags</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Select existing tags below, or type a new name to create one on save.
            </p>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t) => (
                  <label key={t.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(t.id)}
                      onChange={() => toggleTag(t.id)}
                      className="rounded border-input"
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-2">No tags yet. Create one below.</p>
            )}
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onBlur={() => addExistingTagByName(newTagName)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExistingTagByName(newTagName); } }}
              placeholder="Type existing tag name to select, or new name to create"
              className="mt-1"
            />
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
        title="Delete note"
      >
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Delete &quot;{deleteModal.title}&quot;? This cannot be undone.
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

export default function KnowledgePage() {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <KnowledgePageContent />
    </Suspense>
  );
}
