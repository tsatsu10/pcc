"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import {
  FocusIcon,
  ReviewIcon,
  TasksIcon,
  AnalyticsIcon,
  OverdueIcon,
  ProjectsIcon,
  CalendarIcon,
} from "@/components/dashboard/DashboardIcons";
import { NextActionCard } from "@/components/dashboard/NextActionCard";
import { DashboardOverdueCard } from "@/components/dashboard/DashboardOverdueCard";
import { DashboardActiveProjectsCard } from "@/components/dashboard/DashboardActiveProjectsCard";
import type { DashboardData } from "@/lib/dashboard";

const STORAGE_ORDER_KEY = "pcc-dashboard-card-order";
const STORAGE_COLLAPSED_KEY = "pcc-dashboard-card-collapsed";

const DEFAULT_ORDER = [
  "next-action",
  "focus",
  "review",
  "overdue",
  "upcoming-deadlines",
  "active-projects",
  "tasks",
  "analytics",
] as const;

const LEFT_COLUMN_IDS = ["review", "overdue", "upcoming-deadlines"] as const;
const RIGHT_COLUMN_IDS = ["active-projects", "tasks", "analytics"] as const;

export type DashboardCardId = (typeof DEFAULT_ORDER)[number];

function getStoredOrder(): DashboardCardId[] {
  if (typeof window === "undefined") return [...DEFAULT_ORDER];
  try {
    const raw = localStorage.getItem(STORAGE_ORDER_KEY);
    if (!raw) return [...DEFAULT_ORDER];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [...DEFAULT_ORDER];
    const valid = parsed.filter((id): id is DashboardCardId =>
      typeof id === "string" && DEFAULT_ORDER.includes(id as DashboardCardId)
    );
    const missing = DEFAULT_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...DEFAULT_ORDER];
  }
}

function getStoredCollapsed(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_COLLAPSED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function MoveUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function MoveDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type DashboardCardsProps = {
  data: DashboardData;
  reviewsDue: boolean;
  maxFocus: number;
  /** Card ids to hide (e.g. when rendered in the Today section above) */
  hideCardIds?: DashboardCardId[];
};

export function DashboardCards({ data, reviewsDue, maxFocus, hideCardIds }: DashboardCardsProps) {
  const [order, setOrder] = useState<DashboardCardId[]>(() => [...DEFAULT_ORDER]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const visibleOrder = hideCardIds?.length
    ? order.filter((id) => !hideCardIds.includes(id))
    : order;

  useEffect(() => {
    setOrder(getStoredOrder());
    setCollapsed(getStoredCollapsed());
  }, []);

  const persistOrder = (next: DashboardCardId[]) => {
    setOrder(next);
    try {
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(next));
    } catch {}
  };

  const persistCollapsed = (next: Record<string, boolean>) => {
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_COLLAPSED_KEY, JSON.stringify(next));
    } catch {}
  };

  const move = (id: DashboardCardId, dir: "up" | "down") => {
    const i = order.indexOf(id);
    if (i < 0) return;
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    persistOrder(next);
  };

  const toggleCollapsed = (id: string) => {
    const next = { ...collapsed, [id]: !collapsed[id] };
    persistCollapsed(next);
  };

  const cardLabels: Record<DashboardCardId, string> = {
    "next-action": "What's next?",
    focus: "Today's focus",
    review: "Review",
    overdue: "Overdue tasks",
    "upcoming-deadlines": "Upcoming deadlines",
    "active-projects": "Active projects",
    tasks: "Tasks",
    analytics: "Analytics",
  };

  const renderCardContent = (id: DashboardCardId) => {
    switch (id) {
      case "next-action":
        return (
          <NextActionCard
            data={{
              focusCount: data.focusCount,
              focusTasks: data.focusTasks,
              dailyRequired: data.dailyRequired,
              weeklyRequired: data.weeklyRequired,
              monthlyRequired: data.monthlyRequired,
              overdueCount: data.overdueTasks.length,
              backlogCount: data.backlogCount,
            }}
          />
        );
      case "focus":
        return (
          <Card className="border-focus-active/40 bg-focus-active/5 shadow-pcc-md">
            <CardContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">Max 3 tasks. Complete or postpone one to free a slot.</p>
              {data.focusTasks.length > 0 && (
                <ul className="text-sm space-y-1 text-foreground">
                  {data.focusTasks.map((t) => (
                    <li key={t.id} className="truncate">· {t.title}</li>
                  ))}
                </ul>
              )}
              <Link href="/dashboard/focus">
                <Button variant="focus" size="default">
                  {data.focusCount === 0 ? "Choose focus tasks" : data.focusCount < maxFocus ? "Choose focus tasks" : "View focus tasks"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      case "review":
        return (
          <Card className={reviewsDue ? "border-warning/40 bg-warning/5" : "border-success/20 bg-success/5"}>
            <CardContent className="pt-4">
              {reviewsDue ? (
                <div className="space-y-3">
                  <p className="text-sm text-foreground">
                    {[data.dailyRequired, data.weeklyRequired, data.monthlyRequired].filter(Boolean).length >= 2
                      ? "Reviews are due."
                      : data.dailyRequired
                        ? "You had focus time today — do a quick daily review."
                        : data.weeklyRequired
                          ? "Your weekly review is due."
                          : "Monthly review is due."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.dailyRequired && <Link href="/dashboard/review/daily"><Button variant="focus" size="sm">Do daily review</Button></Link>}
                    {data.weeklyRequired && <Link href="/dashboard/review/weekly"><Button variant="focus" size="sm">Do weekly review</Button></Link>}
                    {data.monthlyRequired && <Link href="/dashboard/review/monthly"><Button variant="focus" size="sm">Do monthly review</Button></Link>}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-success font-medium">All caught up</p>
                  <div className="space-y-1 text-sm">
                    <Link href="/dashboard/review/daily" className="block text-primary hover:underline">Daily review</Link>
                    <Link href="/dashboard/review/weekly" className="block text-primary hover:underline">Weekly review</Link>
                    <Link href="/dashboard/review/monthly" className="block text-primary hover:underline">Monthly review</Link>
                    <Link href="/dashboard/review/backlog" className="block text-primary hover:underline">Backlog review</Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case "overdue":
        return <DashboardOverdueCard tasks={data.overdueTasks} titleHref="/dashboard/tasks" />;
      case "active-projects":
        return <DashboardActiveProjectsCard projects={data.activeProjects} />;
      case "tasks":
        return (
          <Card>
            <CardContent className="pt-4">
              <Link href="/dashboard/tasks" className="text-primary font-medium hover:underline">All tasks →</Link>
            </CardContent>
          </Card>
        );
      case "analytics":
        return (
          <Card>
            <CardContent className="pt-4">
              <Link href="/dashboard/analytics" className="text-primary font-medium hover:underline">View completion & focus stats →</Link>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  const leftOrder = visibleOrder.filter((id) => (LEFT_COLUMN_IDS as readonly string[]).includes(id));
  const rightOrder = visibleOrder.filter((id) => (RIGHT_COLUMN_IDS as readonly string[]).includes(id));

  const renderCard = (id: DashboardCardId, index: number) => {
    const isCollapsed = collapsed[id];
        const isNextAction = id === "next-action";
        const isOverdueOrProjects = id === "overdue" || id === "active-projects";

        if (isOverdueOrProjects) {
          const label = id === "overdue" ? <><OverdueIcon /> Overdue tasks</> : <><ProjectsIcon /> Active projects</>;
          return (
            <div key={id} className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-3 shrink-0 hidden md:flex">
                <button type="button" onClick={() => move(id, "up")} disabled={index === 0} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40" aria-label="Move card up"><MoveUpIcon /></button>
                <button type="button" onClick={() => move(id, "down")} disabled={index === visibleOrder.length - 1} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40" aria-label="Move card down"><MoveDownIcon /></button>
              </div>
              <div className="flex-1 min-w-0">
                {isCollapsed ? (
                  <Card>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          {id === "overdue" ? <Link href="/dashboard/tasks">{label}</Link> : <Link href="/dashboard/projects" className="flex items-center gap-2 hover:text-primary">{label}</Link>}
                        </CardTitle>
                        <button type="button" onClick={() => toggleCollapsed(id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground" aria-label="Expand card" aria-expanded={false}><ChevronRight /></button>
                      </div>
                    </CardHeader>
                  </Card>
                ) : id === "overdue" ? (
                  <DashboardOverdueCard tasks={data.overdueTasks} titleHref="/dashboard/tasks" />
                ) : (
                  <DashboardActiveProjectsCard projects={data.activeProjects} />
                )}
              </div>
            </div>
          );
        }

        if (isNextAction) {
          const content = renderCardContent(id);
          if (!content) return null;
          return (
            <div key={id} className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-1 shrink-0 hidden md:flex">
                <button type="button" onClick={() => move(id, "up")} disabled={index === 0} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40" aria-label="Move card up"><MoveUpIcon /></button>
                <button type="button" onClick={() => move(id, "down")} disabled={index === visibleOrder.length - 1} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40" aria-label="Move card down"><MoveDownIcon /></button>
              </div>
              <div className="flex-1 min-w-0">
                {collapsed[id] ? (
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">What&apos;s next?</span>
                    <button type="button" onClick={() => toggleCollapsed(id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground" aria-label="Expand card" aria-expanded={!collapsed[id]}><ChevronRight /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-1">
                      <button type="button" onClick={() => toggleCollapsed(id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground" aria-label="Collapse card" aria-expanded={!collapsed[id]}><ChevronDown /></button>
                    </div>
                    {content}
                  </>
                )}
              </div>
            </div>
          );
        }

        const isFocus = id === "focus";
        const isReview = id === "review";
        const isTasks = id === "tasks";
        const isAnalytics = id === "analytics";
        const isUpcomingDeadlines = id === "upcoming-deadlines";

        let cardHeader: React.ReactNode = cardLabels[id];
        if (isFocus) cardHeader = <><FocusIcon /> Today&apos;s focus</>;
        else if (isReview) cardHeader = <><ReviewIcon /> Review</>;
        else if (isTasks) cardHeader = <><TasksIcon /> Tasks</>;
        else if (isAnalytics) cardHeader = <><AnalyticsIcon /> Analytics</>;
        else if (isUpcomingDeadlines) cardHeader = <><CalendarIcon /> Upcoming deadlines</>;

        return (
          <div key={id} className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 pt-3 shrink-0 hidden md:flex">
              <button
                type="button"
                onClick={() => move(id, "up")}
                disabled={index === 0}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40"
                aria-label="Move card up"
              >
                <MoveUpIcon />
              </button>
              <button
                type="button"
                onClick={() => move(id, "down")}
                disabled={index === visibleOrder.length - 1}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40"
                aria-label="Move card down"
              >
                <MoveDownIcon />
              </button>
            </div>
            <Card className={`flex-1 min-w-0 overflow-hidden ${isFocus ? "border-focus-active/40 bg-focus-active/5 shadow-pcc-md" : ""} ${isReview && reviewsDue ? "border-warning/40 bg-warning/5" : isReview ? "border-success/20 bg-success/5" : ""}`}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {id === "focus" ? (
                      <Link href="/dashboard/focus" className="flex items-center gap-2 hover:text-primary transition-colors">
                        {cardHeader}
                      </Link>
                    ) : id === "tasks" ? (
                      <Link href="/dashboard/tasks" className="flex items-center gap-2 hover:text-primary transition-colors">
                        {cardHeader}
                      </Link>
                    ) : id === "analytics" ? (
                      <Link href="/dashboard/analytics" className="flex items-center gap-2 hover:text-primary transition-colors">
                        {cardHeader}
                      </Link>
                    ) : id === "upcoming-deadlines" ? (
                      <Link href="/dashboard/tasks" className="flex items-center gap-2 hover:text-primary transition-colors">
                        {cardHeader}
                      </Link>
                    ) : (
                      cardHeader
                    )}
                    {id === "focus" && (
                      <Link href="/dashboard/focus" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        {data.focusCount}/{maxFocus} slots
                      </Link>
                    )}
                  </CardTitle>
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                    aria-label={isCollapsed ? "Expand card" : "Collapse card"}
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                  </button>
                </div>
              </CardHeader>
              {!isCollapsed && (
                <CardContent className="pt-0">
                  {id === "focus" && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Max 3 tasks. Complete or postpone one to free a slot.</p>
                      {data.focusTasks.length > 0 && (
                        <ul className="text-sm space-y-1 text-foreground">
                          {data.focusTasks.map((t) => (
                            <li key={t.id} className="truncate">· {t.title}</li>
                          ))}
                        </ul>
                      )}
                      <Link href="/dashboard/focus">
                        <Button variant="focus" size="default">
                          {data.focusCount === 0 ? "Choose focus tasks" : data.focusCount < maxFocus ? "Choose focus tasks" : "View focus tasks"}
                        </Button>
                      </Link>
                    </div>
                  )}
                  {id === "review" && (
                    reviewsDue ? (
                      <div className="space-y-3">
                        <p className="text-sm text-foreground">
                          {[data.dailyRequired, data.weeklyRequired, data.monthlyRequired].filter(Boolean).length >= 2
                            ? "Reviews are due."
                            : data.dailyRequired
                              ? "You had focus time today — do a quick daily review."
                              : data.weeklyRequired
                                ? "Your weekly review is due."
                                : "Monthly review is due."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {data.dailyRequired && <Link href="/dashboard/review/daily"><Button variant="focus" size="sm">Do daily review</Button></Link>}
                          {data.weeklyRequired && <Link href="/dashboard/review/weekly"><Button variant="focus" size="sm">Do weekly review</Button></Link>}
                          {data.monthlyRequired && <Link href="/dashboard/review/monthly"><Button variant="focus" size="sm">Do monthly review</Button></Link>}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-success font-medium">All caught up</p>
                        <div className="space-y-1 text-sm">
                          <Link href="/dashboard/review/daily" className="block text-primary hover:underline">Daily review</Link>
                          <Link href="/dashboard/review/weekly" className="block text-primary hover:underline">Weekly review</Link>
                          <Link href="/dashboard/review/monthly" className="block text-primary hover:underline">Monthly review</Link>
                          <Link href="/dashboard/review/backlog" className="block text-primary hover:underline">Backlog review</Link>
                        </div>
                      </div>
                    )
                  )}
                  {id === "upcoming-deadlines" && (
                    <div className="space-y-2">
                      {data.upcomingDeadlines.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tasks with deadlines in the next 7 days.</p>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {data.upcomingDeadlines.map((t) => (
                            <li key={t.id} className="truncate">
                              <Link href={`/dashboard/tasks/${t.id}`} className="text-foreground hover:text-primary hover:underline">
                                {t.title}
                              </Link>
                              <span className="text-muted-foreground ml-1">· {new Date(t.deadline).toLocaleDateString()}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link href="/dashboard/tasks" className="text-primary font-medium hover:underline text-sm">View all tasks →</Link>
                    </div>
                  )}
                  {id === "tasks" && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {data.backlogCount === 0 && data.focusCount === 0
                          ? "No tasks in backlog or focus yet."
                          : (
                            <>
                              {data.focusCount > 0 && <span>{data.focusCount} in focus today</span>}
                              {data.focusCount > 0 && data.backlogCount > 0 && " · "}
                              {data.backlogCount > 0 && <span>{data.backlogCount} in backlog</span>}
                              {data.focusCount === 0 && data.backlogCount > 0 && " ready to schedule."}
                            </>
                          )}
                      </p>
                      <Link href="/dashboard/tasks" className="text-primary font-medium hover:underline">All tasks →</Link>
                    </div>
                  )}
                  {id === "analytics" && (
                    <div className="space-y-2">
                      {data.gamification?.milestones ? (
                        <p className="text-sm text-muted-foreground">
                          {data.gamification.milestones.totalTasksCompleted} tasks completed
                          {" · "}
                          {Math.floor((data.gamification.milestones.totalFocusMinutes ?? 0) / 60)}h focus time
                          {data.gamification.milestones.reached.length > 0 && (
                            <span className="block mt-1 text-muted-foreground/90">
                              Milestones: {data.gamification.milestones.reached.join(", ")}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Completion rate, focus time, and streaks.</p>
                      )}
                      <Link href="/dashboard/analytics" className="text-primary font-medium hover:underline">View completion & focus stats →</Link>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        );
  };

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
      <div className="space-y-4">
        {leftOrder.map((id) => renderCard(id, visibleOrder.indexOf(id)))}
      </div>
      <div className="space-y-4">
        {rightOrder.map((id) => renderCard(id, visibleOrder.indexOf(id)))}
      </div>
    </div>
  );
}
