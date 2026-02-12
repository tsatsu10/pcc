"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, Card, CardContent, CardHeader, CardTitle, EmptyState, Button, PageSkeleton, Select, DateInput } from "@/components/ui";
import { TasksIcon, OverdueIcon, AnalyticsIcon, FocusIcon } from "@/components/dashboard/DashboardIcons";

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
] as const;

type CompletedTask = {
  id: string;
  title: string;
  updatedAt: string;
  project: { id: string; name: string };
  domain: { id: string; name: string };
};

type OverdueTask = {
  id: string;
  title: string;
  deadline: string | null;
  project: { id: string; name: string };
};

type DomainBalanceItem = {
  domainId: string;
  domainName: string;
  completedCount: number;
};

type Domain = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
};

type FocusTimePerDay = { date: string; minutes: number };
type FocusTimeByDomain = { domainId: string; domainName: string; totalMinutes: number };

type Gamification = {
  completionStreak: number;
  dailyReviewStreak: number;
  focusDaysStreak: number;
  milestones: { totalTasksCompleted: number; totalFocusMinutes: number; reached: string[] };
};

type Analytics = {
  periodStart: string;
  periodEnd: string;
  completionRate: {
    totalCompleted: number;
    totalCreatedInPeriod?: number;
    previousPeriodCompleted?: number;
    tasks: CompletedTask[];
  };
  focusTime: {
    totalMinutes: number;
    sessionsCount: number;
    averageSessionMinutes?: number | null;
    perDay?: FocusTimePerDay[];
  };
  focusTimeByDomain?: FocusTimeByDomain[];
  overdueTasks: { count: number; tasks: OverdueTask[] };
  domainBalance: DomainBalanceItem[];
  filters?: {
    domainId: string | null;
    projectId: string | null;
    range: string;
    start: string | null;
    end: string | null;
  };
};

const DAILY_FOCUS_GOAL_KEY = "pcc-daily-focus-goal-minutes";
const DEFAULT_DAILY_FOCUS_GOAL = 60;
const DAILY_GOAL_OPTIONS = [30, 60, 90, 120];

function getDailyFocusGoalMinutes(): number {
  if (typeof window === "undefined") return DEFAULT_DAILY_FOCUS_GOAL;
  const raw = localStorage.getItem(DAILY_FOCUS_GOAL_KEY);
  const n = Number(raw);
  return raw != null && !Number.isNaN(n) && n >= 0 && n <= 480 ? n : DEFAULT_DAILY_FOCUS_GOAL;
}

function setDailyFocusGoalMinutes(minutes: number): number {
  const value = Math.max(0, Math.min(480, Math.round(minutes)));
  if (typeof window !== "undefined") localStorage.setItem(DAILY_FOCUS_GOAL_KEY, String(value));
  return value;
}

function periodDaysFromRange(start: string, end: string): number {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function AnalyticsPage() {
  // Filter state
  const [range, setRange] = useState<string>("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  
  // Data state
  const [data, setData] = useState<Analytics | null>(null);
  const [gamification, setGamification] = useState<Gamification | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [dailyFocusGoal, setDailyFocusGoal] = useState<number>(() => DEFAULT_DAILY_FOCUS_GOAL);

  // Sync daily goal from localStorage on mount (client)
  useEffect(() => {
    setDailyFocusGoal(getDailyFocusGoalMinutes());
  }, []);

  // Load domains, projects, and gamification
  useEffect(() => {
    Promise.all([
      fetch("/api/domains").then(r => r.ok ? r.json() : []),
      fetch("/api/projects").then(r => r.ok ? r.json() : []),
      fetch("/api/gamification").then(r => (r.ok ? r.json() : null)),
    ]).then(([doms, projs, gam]) => {
      setDomains(doms);
      setProjects(projs);
      setGamification(gam);
    });
  }, []);

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (range === "custom") {
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      params.set("range", "custom");
    } else {
      params.set("range", range);
    }
    if (selectedDomain) params.set("domainId", selectedDomain);
    if (selectedProject) params.set("projectId", selectedProject);
    return params.toString();
  };

  // Fetch analytics data
  useEffect(() => {
    setLoading(true);
    const query = buildQueryParams();
    fetch(`/api/analytics?${query}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range, startDate, endDate, selectedDomain, selectedProject]);

  const handleResetFilters = () => {
    setRange("30d");
    setStartDate("");
    setEndDate("");
    setSelectedDomain("");
    setSelectedProject("");
  };

  if (loading && !data) return <PageSkeleton />;
  if (!data) return <main className="p-6 sm:p-8 max-w-5xl mx-auto"><p className="text-muted-foreground">Could not load analytics.</p></main>;

  return (
    <main className="p-6 sm:p-8 max-w-5xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Analytics" },
      ]} />
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Completion rate, focus time, overdue tasks, and domain balance.
            </p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              {filtersExpanded ? "Hide filters" : "Show filters"}
            </Button>
          </div>
        </div>

        {/* Filters: always visible on lg+, toggled on smaller screens */}
        <div className={`rounded-lg border border-border bg-card p-4 mb-4 space-y-4 ${filtersExpanded ? "block" : "hidden lg:block"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Time Range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>

            {range === "custom" && (
              <>
                <DateInput
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <DateInput
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </>
            )}

            <Select
              label="Domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="">All domains</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Select
              label="Project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
            >
              Reset filters
            </Button>
            <p className="text-xs text-muted-foreground flex items-center">
              {(selectedDomain || selectedProject || range === "custom") && (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  Filters active
                </span>
              )}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {data?.periodStart} → {data?.periodEnd}. Completion rate and focus time use this period; overdue is current.
        </p>
      </div>

      {gamification && (
        <Card className="mb-6 transition duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Streaks & milestones</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Current streaks and lifetime milestones.
            </p>
          </CardHeader>
          <CardContent>
            {(() => {
              const hasStreak = gamification.completionStreak > 0 || gamification.dailyReviewStreak > 0 || gamification.focusDaysStreak > 0;
              const hasMilestones = gamification.milestones.reached.length > 0;
              if (!hasStreak && !hasMilestones) {
                return (
                  <EmptyState
                    icon={<FocusIcon />}
                    heading="No streaks yet"
                    description="Complete tasks, do daily reviews, or log focus sessions to build streaks. Reach 10 tasks or 10h focus for milestones."
                    className="py-4"
                  />
                );
              }
              return (
                <div className="space-y-3 text-sm">
                  {(hasStreak && (
                    <div>
                      <p className="font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Streaks</p>
                      <ul className="flex flex-wrap gap-x-4 gap-y-1">
                        {gamification.completionStreak > 0 && (
                          <li className="text-foreground">{gamification.completionStreak}-day completion streak</li>
                        )}
                        {gamification.dailyReviewStreak > 0 && (
                          <li className="text-foreground">{gamification.dailyReviewStreak}-day review streak</li>
                        )}
                        {gamification.focusDaysStreak > 0 && (
                          <li className="text-foreground">{gamification.focusDaysStreak}-day focus streak</li>
                        )}
                      </ul>
                    </div>
                  )) || null}
                  {hasMilestones && (
                    <div>
                      <p className="font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Milestones reached</p>
                      <p className="text-foreground">{gamification.milestones.reached.join(", ")}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total: {gamification.milestones.totalTasksCompleted} tasks completed · {formatDuration(gamification.milestones.totalFocusMinutes)} focus time
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 animate-in fade-in duration-300">
        <Card className="transition duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0 [&_svg]:text-primary [&_svg]:w-5 [&_svg]:h-5">
              <TasksIcon />
            </div>
            <div className="min-w-0">
              <CardTitle>Completion rate</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Tasks completed in selected period</p>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const total = data.completionRate.totalCompleted;
              const created = data.completionRate.totalCreatedInPeriod ?? 0;
              const prev = data.completionRate.previousPeriodCompleted ?? null;
              const pct = created > 0 ? Math.round((total / created) * 100) : null;
              return (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    {total}
                    {pct != null && (
                      <span className="text-lg font-normal text-muted-foreground ml-1.5">
                        / {created} · {pct}%
                      </span>
                    )}
                  </p>
                  {prev != null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Previous period: {prev} completed
                    </p>
                  )}
                  {created > 0 && pct != null && prev == null && (
                    <p className="text-xs text-muted-foreground mt-0.5">Completed vs created in period</p>
                  )}
                </>
              );
            })()}
            {data.completionRate.tasks.length > 0 ? (
              <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {data.completionRate.tasks.map((t) => (
                  <li key={t.id} className="flex justify-between items-start text-sm">
                    <Link href={`/dashboard/tasks/${t.id}`} className="font-medium text-foreground hover:text-primary hover:underline truncate mr-2">{t.title}</Link>
                    <span className="text-muted-foreground shrink-0">
                      <Link href={`/dashboard/domains/${t.domain.id}`} className="text-primary hover:underline">{t.domain.name}</Link>
                      {" · "}{new Date(t.updatedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<TasksIcon />}
                heading="No completions yet"
                description="Tasks completed in this period will appear here."
                action={
                  <Link href="/dashboard/focus">
                    <Button variant="secondary" size="sm">Go to focus</Button>
                  </Link>
                }
                className="py-4"
              />
            )}
          </CardContent>
        </Card>

        <Card className="transition duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0 [&_svg]:text-primary [&_svg]:w-5 [&_svg]:h-5">
              <FocusIcon />
            </div>
            <div className="min-w-0">
              <CardTitle>Focus time</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Aggregate focus session durations in selected period</p>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const totalMin = data.focusTime.totalMinutes;
              const days = periodDaysFromRange(data.periodStart, data.periodEnd);
              const dailyGoal = dailyFocusGoal;
              const goalMin = days * dailyGoal;
              const pct = goalMin > 0 ? Math.min(100, Math.round((totalMin / goalMin) * 100)) : null;
              const cycleGoal = () => {
                const idx = DAILY_GOAL_OPTIONS.indexOf(dailyGoal);
                const next = DAILY_GOAL_OPTIONS[(idx + 1) % DAILY_GOAL_OPTIONS.length];
                setDailyFocusGoal(setDailyFocusGoalMinutes(next));
              };
              return (
                <>
                  <p className="text-2xl font-bold text-foreground">{formatDuration(data.focusTime.totalMinutes)}</p>
                  {data.focusTime.averageSessionMinutes != null && data.focusTime.averageSessionMinutes > 0 && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Avg session: {formatDuration(Math.round(data.focusTime.averageSessionMinutes))}
                    </p>
                  )}
                  {goalMin > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span>Goal: {formatDuration(goalMin)} ({days} days × {dailyGoal}m/day)</span>
                        <span className="flex items-center gap-1.5">
                          {pct != null && <span>{pct}%</span>}
                          <button
                            type="button"
                            onClick={cycleGoal}
                            className="text-xs underline hover:text-foreground"
                            title="Change daily focus goal"
                          >
                            Change
                          </button>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${pct != null && pct >= 100 ? "bg-success" : "bg-primary"}`}
                          style={{ width: `${pct != null ? Math.min(100, pct) : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{data.focusTime.sessionsCount} session(s)</p>
                  {data.focusTime.perDay && data.focusTime.perDay.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Focus time per day</p>
                      <ul className="space-y-1.5 max-h-36 overflow-y-auto text-sm">
                        {data.focusTime.perDay.map((d) => (
                          <li key={d.date} className="flex justify-between items-center">
                            <span className="text-muted-foreground">{d.date}</span>
                            <span className="font-medium tabular-nums">{formatDuration(d.minutes)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="transition duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-lg bg-destructive/10 p-2 shrink-0 [&_svg]:text-destructive [&_svg]:w-5 [&_svg]:h-5">
              <OverdueIcon />
            </div>
            <div className="min-w-0">
              <CardTitle>Overdue tasks</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Count and list of overdue tasks (current)</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{data.overdueTasks.count}</p>
            {data.overdueTasks.tasks.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {data.overdueTasks.tasks.map((t) => (
                  <li key={t.id} className="flex justify-between items-center text-sm rounded-lg border border-destructive/30 bg-destructive/10 p-2">
                    <Link href={`/dashboard/projects/${t.project.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{t.title}</Link>
                    <span className="text-muted-foreground">
                      <Link href={`/dashboard/projects/${t.project.id}`} className="text-primary hover:underline">{t.project.name}</Link>
                      {t.deadline && ` · Due ${new Date(t.deadline).toLocaleDateString()}`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                variant="celebratory"
                icon={<OverdueIcon />}
                heading="All caught up"
                description="No overdue tasks right now."
                action={
                  <Link href="/dashboard/tasks">
                    <Button variant="secondary" size="sm">View tasks</Button>
                  </Link>
                }
                className="py-4"
              />
            )}
          </CardContent>
        </Card>

        <Card className="transition duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0 [&_svg]:text-primary [&_svg]:w-5 [&_svg]:h-5">
              <AnalyticsIcon />
            </div>
            <div className="min-w-0">
              <CardTitle>Domain balance</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Tasks completed per domain in selected period</p>
            </div>
          </CardHeader>
          <CardContent>
            {data.domainBalance.length > 0 ? (
              <ul className="space-y-3">
                {data.domainBalance.map((d) => {
                  const maxCount = Math.max(...data.domainBalance.map((x) => x.completedCount), 1);
                  const pct = Math.round((d.completedCount / maxCount) * 100);
                  return (
                    <li key={d.domainId}>
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <Link href={`/dashboard/domains/${d.domainId}`} className="font-medium text-foreground hover:text-primary hover:underline truncate">{d.domainName}</Link>
                        <span className="font-semibold text-foreground shrink-0">{d.completedCount}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<AnalyticsIcon />}
                heading="No domain completions"
                description="Tasks completed per domain will appear here."
                className="py-4"
              />
            )}
          </CardContent>
        </Card>

        {data.focusTimeByDomain && data.focusTimeByDomain.length > 0 && (
          <Card className="transition duration-200 hover:shadow-md sm:col-span-2">
            <CardHeader className="flex flex-row items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 shrink-0 [&_svg]:text-primary [&_svg]:w-5 [&_svg]:h-5">
                <FocusIcon />
              </div>
              <div className="min-w-0">
                <CardTitle>Focus time by domain</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Focus session minutes per domain in selected period</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.focusTimeByDomain.map((d) => {
                  const totalMin = data.focusTimeByDomain!.reduce((s, x) => s + x.totalMinutes, 0);
                  const pct = totalMin > 0 ? Math.round((d.totalMinutes / totalMin) * 100) : 0;
                  return (
                    <li key={d.domainId}>
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <Link href={`/dashboard/domains/${d.domainId}`} className="font-medium text-foreground hover:text-primary hover:underline truncate">{d.domainName}</Link>
                        <span className="font-semibold text-foreground shrink-0 tabular-nums">{formatDuration(d.totalMinutes)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
