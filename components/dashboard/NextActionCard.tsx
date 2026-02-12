import Link from "next/link";
import { Button } from "@/components/ui";
import { MAX_FOCUS_TASKS_PER_DAY } from "@/lib/rules/focus-limit";

type NextActionData = {
  focusCount: number;
  focusTasks: { id: string; title: string }[];
  dailyRequired: boolean;
  weeklyRequired: boolean;
  monthlyRequired: boolean;
  overdueCount: number;
  backlogCount: number;
};

export function NextActionCard({ data }: { data: NextActionData }) {
  const action = computeNextAction(data);
  if (!action) return null;

  return (
    <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">What&apos;s next?</p>
        <p className="text-sm text-muted-foreground mt-0.5">{action.hint}</p>
      </div>
      <Link href={action.href}>
        <Button size="sm">{action.label}</Button>
      </Link>
    </div>
  );
}

function computeNextAction(data: NextActionData): { label: string; hint: string; href: string } | null {
  if (data.dailyRequired || data.weeklyRequired || data.monthlyRequired) {
    const labels = [];
    if (data.dailyRequired) labels.push("daily");
    if (data.weeklyRequired) labels.push("weekly");
    if (data.monthlyRequired) labels.push("monthly");
    const singleHref = data.dailyRequired ? "/dashboard/review/daily" : data.weeklyRequired ? "/dashboard/review/weekly" : "/dashboard/review/monthly";
    return {
      label: labels.length > 1 ? "Do reviews" : labels[0] === "daily" ? "Do daily review" : labels[0] === "weekly" ? "Do weekly review" : "Do monthly review",
      hint: labels.length > 1 ? `${labels.length} reviews due.` : "Your review is waiting.",
      href: labels.length > 1 ? "/dashboard/review" : singleHref,
    };
  }
  if (data.overdueCount > 0) {
    return {
      label: `Address ${data.overdueCount} overdue`,
      hint: "Tackle these first to stay on track.",
      href: "/dashboard/tasks",
    };
  }
  if (data.focusCount > 0 && data.focusTasks[0]) {
    return {
      label: "Start focus",
      hint: `Focus on: ${data.focusTasks[0].title}`,
      href: "/dashboard/focus",
    };
  }
  if (data.focusCount < MAX_FOCUS_TASKS_PER_DAY && data.backlogCount > 0) {
    return {
      label: "Choose focus tasks",
      hint: `You have ${data.backlogCount} tasks in backlog. Pick up to ${MAX_FOCUS_TASKS_PER_DAY - data.focusCount} for today.`,
      href: "/dashboard/focus",
    };
  }
  if (data.focusCount === 0) {
    return {
      label: "Choose focus tasks",
      hint: "No focus tasks yet. Pick up to 3 from your backlog.",
      href: "/dashboard/focus",
    };
  }
  return {
    label: "View focus",
    hint: "All 3 slots used. Complete or postpone a task to free one.",
    href: "/dashboard/focus",
  };
}
