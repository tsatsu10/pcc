"use client";

const STORAGE_KEY = "pcc-focus-goal-minutes";
const DEFAULT_GOAL_MINUTES = 25;

export function getFocusGoalMinutes(): number {
  if (typeof window === "undefined") return DEFAULT_GOAL_MINUTES;
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = Number(raw);
  return raw != null && !Number.isNaN(n) && n >= 1 && n <= 240 ? n : DEFAULT_GOAL_MINUTES;
}

export function setFocusGoalMinutes(minutes: number) {
  const value = Math.max(1, Math.min(240, Math.round(minutes)));
  localStorage.setItem(STORAGE_KEY, String(value));
  return value;
}

type FocusTimerProgressProps = {
  elapsedSeconds: number;
  goalMinutes?: number;
  onGoalChange?: (minutes: number) => void;
  label?: "goal" | "plan";
};

export function FocusTimerProgress({
  elapsedSeconds,
  goalMinutes: goalProp,
  onGoalChange,
  label: labelProp = "plan",
}: FocusTimerProgressProps) {
  const goalMinutes = goalProp ?? getFocusGoalMinutes();
  const goalSeconds = goalMinutes * 60;
  const progress = goalSeconds > 0 ? Math.min(100, (elapsedSeconds / goalSeconds) * 100) : 0;
  const isComplete = elapsedSeconds >= goalSeconds;
  const labelText = labelProp === "goal" ? "Goal" : "Plan";

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{labelText}: {goalMinutes} min</span>
        {onGoalChange && (
          <button
            type="button"
            onClick={() => {
              const next = goalMinutes === 25 ? 45 : goalMinutes === 45 ? 90 : 25;
              setFocusGoalMinutes(next);
              onGoalChange(next);
            }}
            className="hover:text-foreground underline"
            title="Change goal (25 → 45 → 90 min)"
          >
            {goalMinutes}m
          </button>
        )}
      </div>
      <div
        className="h-2 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Focus progress ${Math.round(progress)}% of ${goalMinutes} minute plan`}
      >
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            isComplete ? "bg-success" : "bg-focus-active"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground tabular-nums">
        {Math.floor(elapsedSeconds / 60)} / {goalMinutes} min
      </div>
    </div>
  );
}
