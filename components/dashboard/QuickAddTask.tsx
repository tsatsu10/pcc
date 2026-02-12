"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Modal, FieldError } from "@/components/ui";

type Project = { id: string; name: string; domain: { id: string; name: string } };

export function QuickAddTask() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setTitle("");
      fetch("/api/projects")
        .then((r) => r.json())
        .then((list: Project[]) => {
          setProjects(Array.isArray(list) ? list : []);
          setProjectId((id) => (id && list.some((p) => p.id === id)) ? id : list[0]?.id ?? "");
        })
        .catch(() => setProjects([]));
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError("Enter a title");
      return;
    }
    if (!projectId) {
      setError("Select a project");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title: t }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add task");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)} aria-label="Quick add task to backlog">
        Add task
      </Button>
      <Modal open={open} onClose={() => !loading && setOpen(false)} title="Quick add task">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adds a task to your backlog. You can move it to focus from Daily focus.
          </p>
          <div>
            <Label htmlFor="quick-add-title">Title</Label>
            <Input
              id="quick-add-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to do?"
              maxLength={500}
              required
              aria-invalid={!!error}
            />
          </div>
          <div>
            <Label htmlFor="quick-add-project">Project</Label>
            <select
              id="quick-add-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              required
            >
              <option value="">— Select project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.domain?.name ?? "?"} › {p.name}
                </option>
              ))}
            </select>
            {projects.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Create a project from Projects first.</p>
            )}
          </div>
          {error && <FieldError>{error}</FieldError>}
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !projectId}>
              {loading ? "Adding…" : "Add to backlog"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
