import Link from "next/link";
import type { GamificationResult } from "@/lib/gamification";

type DashboardStreaksProps = {
  gamification: GamificationResult | undefined;
};

export function DashboardStreaks({ gamification }: DashboardStreaksProps) {
  if (!gamification) return null;
  const { completionStreak, dailyReviewStreak, focusDaysStreak, milestones } = gamification;
  const hasStreak = completionStreak > 0 || dailyReviewStreak > 0 || focusDaysStreak > 0;
  const hasMilestones = milestones.reached.length > 0;
  if (!hasStreak && !hasMilestones) return null;

  const parts: string[] = [];
  if (completionStreak > 0) parts.push(`${completionStreak}-day completion streak`);
  if (dailyReviewStreak > 0) parts.push(`${dailyReviewStreak}-day review streak`);
  if (focusDaysStreak > 0) parts.push(`${focusDaysStreak}-day focus streak`);
  if (milestones.reached.length > 0) parts.push(milestones.reached.join(", "));

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Streaks & milestones:</span>
      <span>{parts.join(" · ")}</span>
      <Link href="/dashboard/analytics" className="ml-auto text-primary hover:underline shrink-0">
        View analytics →
      </Link>
    </div>
  );
}
