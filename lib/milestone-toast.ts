/**
 * Client-side only: diff current reached milestones vs last seen (localStorage),
 * return new IDs and persist current. Use for in-app milestone toasts.
 */
import { TASK_MILESTONE_DEFS, FOCUS_MILESTONE_DEFS } from "@/lib/gamification";

const STORAGE_KEY = "pcc-last-seen-milestones";

const LABELS: Record<string, string> = {};
[...TASK_MILESTONE_DEFS, ...FOCUS_MILESTONE_DEFS].forEach((d) => {
  LABELS[d.id] = d.label;
});

export function getMilestoneLabel(id: string): string {
  return LABELS[id] ?? id;
}

/**
 * Returns IDs in `reached` that weren’t in the last saved list, then saves `reached`.
 * No-op on server (returns []).
 */
export function getNewMilestonesAndSave(reached: string[]): string[] {
  if (typeof window === "undefined") return [];
  let last: string[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) last = JSON.parse(raw) as string[];
  } catch {
    last = [];
  }
  const lastSet = new Set(last);
  const newIds = reached.filter((id) => !lastSet.has(id));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reached));
  } catch {
    // ignore quota etc.
  }
  return newIds;
}
