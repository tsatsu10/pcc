# Design Recommendations — Daily Focus Screen

**Screen:** `/dashboard/focus`  
**Aligns with:** PCC_Design_System.md, FR-20–FR-27, NFR-5 (Usability)

---

## 1. Timer & progress display (high impact)

**Current:** Elapsed time, “(paused)”, and “6/45 min” appear as separate chunks, which can feel disjointed.

**Recommendations:**

- **Single progress statement**  
  Use one clear line, e.g.  
  **“6:12 of 45 min (paused)”** or **“Elapsed: 6:12 / 45 min · Paused”**  
  so the relationship between elapsed, plan, and state is obvious at a glance.

- **Progress bar as primary**  
  Keep the progress bar (e.g. `FocusTimerProgress`) as the main visual; treat the big elapsed time as supporting. Optionally show “X / Y min” under or beside the bar instead of duplicating in the timer line.

- **“Past your planned time”**  
  Keep the message; consider a soft background or left border (e.g. `border-l-4 border-l-warning`) so it’s visible but not alarming.

---

## 2. Button hierarchy & consistency (medium impact)

**Current:** “Resume” and “Start focus session” use `variant="focus"` (filled teal); “Add to focus” uses default primary (blue). That splits “focus” actions across two styles.

**Recommendations:**

- **Unify focus actions**  
  Use the same variant for all focus-related actions: **Resume**, **Start focus session**, and **Add to focus** (e.g. all `variant="focus"`). That makes “this starts or continues focus” visually consistent and supports the “one primary action per screen” idea (focus is the job of this view).

- **Secondary actions**  
  Keep **Mark done** and **Postpone** as they are (success / secondary). **Pause** and **End session** as secondary is correct so they don’t compete with “Resume” or “Start focus session.”

- **Optional**  
  If you want “Start focus session” to feel like the main CTA when no timer is running, you could use a slightly larger size or the same focus variant with a subtle emphasis (e.g. same variant, no outline).

---

## 3. Backlog labels (medium impact)

**Current:** Each backlog row shows project name and “· Backlog” (e.g. “GHS DSD Project · Backlog”).

**Recommendations:**

- **Consistent prefix**  
  Use a single pattern so users always know what they’re looking at, e.g.  
  **“Project: GHS DSD Project”** or **“GHS DSD Project (backlog)”**.  
  Avoid mixing “Project” and “Category” unless the product distinguishes them.

- **Status as badge (optional)**  
  If you add small status badges elsewhere (e.g. in task lists), a muted “Backlog” pill here would align with the rest of the app.

---

## 4. “Saved” / persistence message (low impact)

**Current:** “Saved · refresh won’t lose progress” is small and can be missed.

**Recommendations:**

- **Slightly more prominent**  
  Use a small icon (e.g. checkmark or cloud) + short text, or a compact inline chip (e.g. “Saved”) so the NFR-2 reassurance is easier to notice without adding clutter.

- **Placement**  
  Keeping it near the timer/session controls is good; avoid moving it far from the active session.

---

## 5. Rule reinforcement (already strong)

**Current:** “Today, February 10 · Up to 3 tasks in focus today. Finish or postpone one to add another.” and “Focus slots (2 of 3)” are clear and align with the Daily Focus Engine.

**Recommendations:**

- **Keep as-is**  
  No change needed; this already supports the business rule and reduces cognitive load.

- **When all slots are used**  
  The “Add another from the list below” line is hidden when at 3/3; the backlog section already says “All 3 slots used. Complete or postpone a task to free one.” That’s good. Optionally repeat a one-line reminder at the top when `focus.length === 3`, e.g. “All 3 slots in use. Complete or postpone to free a slot.”

---

## 6. Accessibility & NFR-5 (ongoing)

- **Focus order**  
  Ensure keyboard flow is logical: e.g. Focus slots → first task (Mark done, Postpone, Start/Resume/End) → next task → … → Backlog → Add to focus buttons.

- **Live regions**  
  The elapsed time already uses `aria-live="polite"`; keep it so screen readers get timer updates.

- **Progress bar**  
  `FocusTimerProgress` already exposes `role="progressbar"` and `aria-valuenow`; keep and ensure `aria-label` stays accurate when the plan changes.

---

## 7. Summary priority

| Priority | Item | Effort |
|----------|------|--------|
| High     | Single, clear timer line (elapsed / plan / state) | Low |
| Medium   | Same button variant for Resume, Start focus session, Add to focus | Low |
| Medium   | Consistent backlog label (e.g. “Project: X”) | Low |
| Low      | Slightly clearer “Saved” / persistence message | Low |
| Optional | “All 3 slots in use” reminder at top when full | Low |

These changes keep the screen aligned with the PCC design system (calm, clear hierarchy, sparse color, one primary job) and with the Daily Focus Engine rules while improving scanability and consistency.
