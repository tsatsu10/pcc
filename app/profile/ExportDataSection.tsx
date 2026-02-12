"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function ExportDataSection() {
  const [loading, setLoading] = useState<"json" | "csv" | null>(null);
  const [error, setError] = useState("");

  async function handleExport(format: "json" | "csv") {
    setError("");
    setLoading(format);
    try {
      const res = await fetch(`/api/me/export?format=${format}`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Export failed");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match?.[1] ?? `pcc-export.${format === "csv" ? "csv" : "json"}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="mt-10 pt-8 border-t border-border" aria-labelledby="export-heading">
      <h2 id="export-heading" className="text-base font-medium text-foreground mb-1">
        Export my data
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Download your domains, projects, tasks, focus sessions, reviews, and notes for portability or compliance.
      </p>
      {error && (
        <p className="text-sm text-destructive mb-2" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => handleExport("json")}
          disabled={loading !== null}
          aria-describedby="export-json-desc"
        >
          {loading === "json" ? "Preparing…" : "Download as JSON"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => handleExport("csv")}
          disabled={loading !== null}
          aria-describedby="export-csv-desc"
        >
          {loading === "csv" ? "Preparing…" : "Download as CSV (tasks)"}
        </Button>
      </div>
      <p id="export-json-desc" className="sr-only">
        Full export: profile, domains, projects, tasks, focus sessions, reviews, notes, tags.
      </p>
      <p id="export-csv-desc" className="sr-only">
        Tasks only: one row per task with domain and project name.
      </p>
    </section>
  );
}
