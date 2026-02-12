"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button, Input, Label, FieldError } from "@/components/ui";

const STEPS = [
  { label: "Domains", title: "Define your domains", outcome: "Your life areas (e.g. Work, Personal, Learning)." },
  { label: "Goals", title: "Your top 3 goals", outcome: "We'll show these on your dashboard." },
  { label: "First project", title: "Add your first project", outcome: "A project belongs to a domain — you'll add tasks to it next." },
  { label: "First tasks", title: "Your first 3 tasks", outcome: "You'll use these in Daily focus." },
] as const;
const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [domains, setDomains] = useState<{ name: string; objective?: string }[]>([{ name: "" }]);
  const [goals, setGoals] = useState(["", "", ""]);
  const [projectName, setProjectName] = useState("");
  const [projectDomainId, setProjectDomainId] = useState("");
  const [domainList, setDomainList] = useState<{ id: string; name: string }[]>([]);
  const [tasks, setTasks] = useState(["", "", ""]);
  const [projectList, setProjectList] = useState<{ id: string; name: string; domainId: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step >= 1) fetch("/api/domains").then((r) => r.json()).then(setDomainList).catch(() => {});
  }, [step]);
  useEffect(() => {
    if (step >= 3) fetch("/api/projects").then((r) => r.json()).then(setProjectList).catch(() => {});
  }, [step]);
  useEffect(() => {
    if (domainList.length && !projectDomainId) setProjectDomainId(domainList[0].id);
  }, [domainList]);

  async function handleDomainsNext() {
    const toCreate = domains.map((d) => d.name.trim()).filter(Boolean);
    setLoading(true);
    setError("");
    try {
      if (toCreate.length === 0) {
        // FR-9: No domains provided, use full defaults
        await fetch("/api/onboarding/defaults", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partialDomains: false }),
        });
      } else {
        // Create user-provided domains
        for (const name of toCreate) {
          const res = await fetch("/api/domains", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          if (!res.ok) throw new Error("Failed to create domain");
        }
        // FR-9: Fill remaining domains to reach 3 if user provided < 3
        if (toCreate.length < 3) {
          await fetch("/api/onboarding/defaults", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partialDomains: true }),
          });
        }
      }
      setStep(1);
    } catch (e) {
      setError("Could not save domains. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoalsNext() {
    setStep(2);
  }

  async function handleProjectNext() {
    const name = projectName.trim() || "Getting Started";
    const domainId = projectDomainId || domainList[0]?.id;
    if (!domainId) {
      setError("Create at least one domain first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domainId, goal: "First project" }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      setStep(3);
    } catch (e) {
      setError("Could not save project.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTasksNext() {
    const projectId = projectList[0]?.id;
    if (!projectId) {
      setError("No project found. Go back and create one.");
      return;
    }
    const toCreate = tasks.map((t) => t.trim()).filter(Boolean);
    setLoading(true);
    setError("");
    try {
      if (toCreate.length === 0) {
        // FR-9: No tasks provided, use full defaults
        await fetch("/api/onboarding/defaults", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partialTasks: false }),
        });
      } else {
        // Create user-provided tasks
        for (const title of toCreate) {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, title }),
          });
          if (!res.ok) throw new Error("Failed to create task");
        }
        // FR-9: Fill remaining tasks to reach 3 if user provided < 3
        if (toCreate.length < 3) {
          await fetch("/api/onboarding/defaults", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partialTasks: true }),
          });
        }
      }
      const goalsToSend = goals.filter((g) => g.trim());
      const completeRes = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalsToSend.length ? { goals: goalsToSend } : {}),
      });
      if (!completeRes.ok) throw new Error("Failed to complete onboarding");
      window.location.href = "/dashboard?onboarding=1";
    } catch (e) {
      setError("Could not save tasks.");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    setError("");
    if (step === 0) handleDomainsNext();
    else if (step === 1) handleGoalsNext();
    else if (step === 2) handleProjectNext();
    else handleTasksNext();
  }

  return (
    <>
      <Header variant="minimal" />
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="flex justify-between mb-6">
            {STEPS.map((s, i) => (
              <span
                key={s.label}
                className={`text-sm ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {i + 1}. {s.label}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {STEPS[step].title}
          </h1>
          <p className="text-muted-foreground text-sm mb-1">
            {STEPS[step].outcome}
          </p>
          <p className="text-muted-foreground text-xs mb-6">
            Step {step + 1} of {TOTAL_STEPS}
          </p>

          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Add at least one, or use defaults (Work, Personal, Learning).
              </p>
              {domains.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={d.name}
                    onChange={(e) => {
                      const next = [...domains];
                      next[i] = { ...next[i], name: e.target.value };
                      setDomains(next);
                    }}
                    placeholder="e.g. Work"
                    className="flex-1"
                  />
                  {domains.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDomains(domains.filter((_, j) => j !== i))}
                      className="text-destructive shrink-0"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDomains([...domains, { name: "" }])}
                className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
              >
                + Add domain
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                In your own words. Optional — you can leave blank.
              </p>
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  value={goals[i] ?? ""}
                  onChange={(e) => {
                    const next = [...goals];
                    next[i] = e.target.value;
                    setGoals(next);
                  }}
                  placeholder="e.g. Ship the product launch"
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Add one, or use default &quot;Getting Started&quot;.
              </p>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Getting Started"
              />
              {domainList.length > 0 && (
                <div>
                  <Label>Domain</Label>
                  <select
                    value={projectDomainId}
                    onChange={(e) => setProjectDomainId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {domainList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Add up to 3, or use defaults — we&apos;ll create 3 starter tasks so you can go straight to your dashboard.
              </p>
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  value={tasks[i] ?? ""}
                  onChange={(e) => {
                    const next = [...tasks];
                    next[i] = e.target.value;
                    setTasks(next);
                  }}
                  placeholder="What's the task?"
                />
              ))}
            </div>
          )}

          <FieldError id="onboarding-error">{error}</FieldError>
          <Button
            onClick={next}
            disabled={loading}
            className="mt-6 w-full"
          >
            {loading ? "Saving…" : step === 3 ? "Go to dashboard" : "Continue"}
          </Button>
        </div>
      </main>
    </>
  );
}
