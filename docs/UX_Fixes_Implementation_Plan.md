# UX Fixes — Implementation Plan

**Source:** PCC_UX_Analysis.md (Opportunities and Recommendations)  
**Date:** 2026-02-10  

This plan breaks down the High, Medium, and Low items into concrete tasks, files to touch, and implementation order.

---

## Overview

| Priority | Item | Effort | Deps |
|----------|------|--------|------|
| **High** | One-line "why" on daily/weekly review when redirecting | Small | None |
| **Medium** | Mobile access to Domains/Projects/Knowledge | Small | None |
| **Medium** | Show "Project paused" and disable "Add to focus" in backlog when project is paused | Medium | API change |
| **Low** | Optimistic Mark done/Postpone | Medium | None |
| **Low** | Accessibility audit | Small (audit) + variable (fixes) | None |
| **Low** | Onboarding step labels and "Use defaults" wording | Small | None |

**Suggested order:** High → Medium (copy + mobile nav) → Medium (paused projects) → Low (onboarding) → Low (optimistic UI) → Low (accessibility audit + fixes).

---

## HIGH: One-line "why" on daily/weekly review

**Goal:** When the user is redirected to daily or weekly review (ReviewGate), they see a clear one-line reason so the requirement feels purposeful, not arbitrary.

### Tasks

1. **Daily review page — add "why" line**
   - **File:** `app/dashboard/review/daily/page.tsx`
   - **Where:** Immediately after the main `<h1>Daily review</h1>`, before the existing subtitle (`data.date · summary...`).
   - **Change:** Add a single line of copy that explains the value of the daily review. Show it in both branches (hasTasks and !hasTasks) so it appears whether they have completed/missed tasks or the "no focus tasks" path.
   - **Copy (suggested):**
     - With tasks: *"You had focus time today — a quick review helps you learn from it."*
     - No-tasks path: same line or *"A quick daily check-in helps you stay intentional."*
   - **Implementation:** Add a `<p className="text-sm text-muted-foreground mt-1">` (or a small info strip with left border) with the chosen copy. Place it so it’s the first thing under the title (or right after breadcrumbs). Keep existing date/summary line below it.

2. **Weekly review page — add "why" line**
   - **File:** `app/dashboard/review/weekly/page.tsx`
   - **Where:** Right after `<h1>Weekly review</h1>`, before the existing period/subtitle line.
   - **Copy (suggested):** *"Weekly review helps you spot bottlenecks and adjust priorities for the week ahead."*
   - **Implementation:** Add one `<p>` with the same styling approach as daily (muted, small). Existing period line can stay as second line.

### Acceptance

- [ ] Daily review page shows the one-line "why" under the title in both the main form and the no-tasks form.
- [ ] Weekly review page shows the one-line "why" under the title.
- [ ] Copy is consistent with PCC_In_App_Copy.md tone (clear, minimal, supportive).

### Optional

- Add a short `aria-description` or `id` for the "why" paragraph and reference it from the heading for screen readers: `aria-describedby`.

---

## MEDIUM: Mobile access to Domains/Projects/Knowledge

**Goal:** On mobile, users can reach Domains, Projects, and Knowledge without typing a URL. Currently the bottom nav has only Home, Focus, Tasks, Reviews, Analytics.

### Option A (recommended): "More" menu in bottom nav

- Add a 6th item **"More"** (or "Menu") that opens a sheet/drawer or dropdown.
- In the sheet: links to **Domains**, **Projects**, **Knowledge** (and optionally Profile, Settings if they exist).
- Keeps the bar to 5–6 items; avoids crowding.

### Tasks (Option A)

1. **Add "More" nav item and overlay**
   - **File:** `components/dashboard/MobileBottomNav.tsx`
   - **Change:**
     - Add a 6th item: `{ href: "#", label: "More", pathMatch: null }` or use a button that toggles open state (no navigation).
     - When "More" is tapped, open a bottom sheet or modal that lists:
       - Domains → `/dashboard/domains`
       - Projects → `/dashboard/projects`
       - Knowledge → `/dashboard/knowledge`
     - Use existing `Modal` or a simple fixed panel that slides up; close on link click or outside tap.
   - **Icon:** Folder, layers, or grid icon for "More."

2. **Ensure mobile layout shows bottom nav for dashboard**
   - **File:** `app/dashboard/layout.tsx`
   - **Check:** `MobileBottomNav` is already rendered; no change unless "More" needs to be excluded from active state (e.g. "More" is never `aria-current="page"`).

### Alternative: Replace one item with "More"

- Swap "Tasks" or "Analytics" for "More" and put Tasks + Analytics inside the menu. Not recommended if Tasks and Analytics are high-use; current 5 items are already core.

### Acceptance

- [ ] On viewports that show the bottom nav (e.g. `md:hidden`), a "More" (or equivalent) control is visible.
- [ ] Tapping "More" opens a menu/sheet with Domains, Projects, Knowledge.
- [ ] Tapping a link navigates and closes the menu.
- [ ] Focus is manageable (trap in sheet when open, return to trigger on close) for accessibility.

---

## MEDIUM: Show "Project paused" and disable "Add to focus" in backlog when project is paused

**Goal:** Tasks from paused projects appear in the Daily focus backlog so the user sees them, but "Add to focus" is disabled and the reason is clear (project is paused).

**Current behavior:** `/api/focus/today` returns only tasks from **active** projects for the backlog (`project: { status: "active" }`). So paused-project tasks never appear. Per FR-14, they "remain in backlog but cannot be moved to focus" — so we should show them and disable the action.

### Tasks

1. **API: Include backlog tasks from paused projects and expose project status**
   - **File:** `app/api/focus/today/route.ts`
   - **Change:**
     - Remove the filter `project: { status: "active" }` from the backlog query (or add a second query for paused-project tasks and merge).
     - Include tasks where `project.status` is `active` or `paused` (and optionally `completed` if you want to show them as read-only; spec says "cannot be moved to focus" for paused, so at least include `paused`).
     - Ensure each task in the response includes `project: { id, name, status }` (status may already be on project; verify Prisma `include: { project: true }` returns status).
   - **Response shape:** Keep `backlog` as array of tasks; each task has `project: { id, name, status }`. If `status === "paused"`, UI will disable "Add to focus" and show "Project paused."

2. **Focus page: Use project status in backlog list**
   - **File:** `app/dashboard/focus/page.tsx`
   - **Change:**
     - In the backlog `map`, for each task `t`, read `t.project.status` (or equivalent from API).
     - If `t.project.status === "paused"` (or not `"active"`):
       - Disable the "Add to focus" button (in addition to existing `!canAddFocus || actingId === t.id`).
       - Show a short label or tooltip: e.g. "Project paused" next to the project name or on the button (title/aria-label).
     - Optionally: subtle visual distinction for the row (e.g. muted border or small "Paused" pill next to project name).
   - **Type:** Extend the `Task` type to include `project: { id: string; name: string; status?: string }` so TypeScript reflects the new field.

### Acceptance

- [ ] Backlog in Daily focus includes tasks whose project is Paused.
- [ ] For those tasks, "Add to focus" is disabled and the user sees that the project is paused (label or tooltip).
- [ ] API still returns only backlog/postponed (and focus-from-other-day) tasks; no change to focus list logic.
- [ ] Active-project tasks behave as before (can add to focus when slot available).

### Edge cases

- **Completed/dropped projects:** Decide whether to show tasks from completed/dropped projects in backlog. If yes, same pattern: show, disable "Add to focus," label "Project completed" or similar. If no, keep filtering them out in the API.

---

## LOW: Optimistic Mark done / Postpone

**Goal:** When the user clicks "Mark done" or "Postpone," the UI updates immediately (task leaves focus list, slot count updates) so the interaction feels instant; then the API call runs and state is reconciled (revert + error message on failure).

### Tasks

1. **Focus page: Optimistic update for setStatus("done") and setStatus("postponed")**
   - **File:** `app/dashboard/focus/page.tsx`
   - **Current:** `setStatus` calls API, then `load()` on success.
   - **Change:**
     - In `setStatus`, when `newStatus` is `"done"` or `"postponed"`:
       1. Optimistically update local state:
          - Remove the task from `data.focus` (or set a local "optimistic" list derived from `data`).
          - Optionally increment a local "focus count" display so "Focus slots (X of 3)" shows one less (or derive from updated list length).
          - If "postponed," add the task to `data.backlog` so it appears in suggested backlog (or at least don’t leave a hole).
       2. Call the API (PATCH task).
       3. On success: call `load()` to sync with server (or skip if you trust optimistic state).
       4. On failure: revert optimistic state (restore task to focus list, restore slot count), set error message, and optionally call `load()` to resync.
     - Use a local copy of `data` (e.g. `optimisticData`) or a small state slice (e.g. "removedIds") so you can revert cleanly.
   - **Edge cases:**
     - If the user clicks "Mark done" on a second task before the first request completes, keep a queue or disable all Mark done/Postpone until the in-flight request finishes (simplest).
     - Success checkmark animation: keep existing behavior; it can still run after optimistic update.

2. **Minimal approach (if full optimistic is heavy)**
   - Only optimistically remove the task from the focus list and run `load()` in the background; on API failure, call `load()` again and show error. No need to add to backlog optimistically for postpone if `load()` runs on success and repopulates backlog.

### Acceptance

- [ ] Clicking "Mark done" or "Postpone" removes the task from the focus list (or updates slot count) without waiting for the API.
- [ ] On API failure, the task reappears (or state is reverted) and an error message is shown.
- [ ] No double-submit: buttons are disabled during the request (existing actingId) or only the clicked task is in "optimistic removed" state until the request completes.

---

## LOW: Accessibility audit

**Goal:** Identify and fix accessibility issues in core flows so the app moves toward NFR-5 (WCAG 2.1 Level A for core flows).

### Tasks

1. **Run automated audit**
   - **Tool:** Lighthouse (Chrome DevTools) with Accessibility category, and/or axe DevTools (browser extension or `@axe-core/cli`).
   - **Pages to audit:** Landing, Login, Register, Onboarding (step 1 and one other), Dashboard, Daily focus, Daily review, Weekly review.
   - **Output:** List of issues (e.g. contrast, missing alt, form labels, focus order, ARIA). Save a short report (e.g. `docs/Accessibility_Audit_YYYY-MM-DD.md`) with pass/fail and issue list.

2. **Fix critical and high-severity issues**
   - **Typical fixes:** Add `aria-label` where needed; ensure form inputs have associated `<label>` or `aria-label`; fix contrast where below AA; ensure focus order is logical; add `aria-live`/`role="alert"` where already partially done; ensure interactive elements are ≥44px where possible.
   - **Reduced motion:** Verify that success checkmark and any entrance animations respect `prefers-reduced-motion: reduce` (e.g. disable or shorten animation).

3. **Document in design system**
   - **File:** `docs/PCC_Design_System.md` or a short "Accessibility" subsection.
   - **Content:** One paragraph stating target (WCAG 2.1 Level A for auth, onboarding, focus, reviews); note that interactive elements should be ≥44px; focus order follows layout; key flows are tested with Lighthouse/axe.

### Acceptance

- [ ] Audit run and results documented.
- [ ] Critical/high issues fixed or tracked in a backlog.
- [ ] Design system or docs updated with accessibility expectations.

---

## LOW: Onboarding step labels and "Use defaults" wording

**Goal:** Make each onboarding step’s outcome clear and frame "skip" as "use defaults" so users understand they will get sensible defaults, not an empty state.

### Tasks

1. **Step titles / descriptions**
   - **File:** `app/onboarding/page.tsx`
   - **Current:** `STEPS` has `label` (e.g. "Domains") and `title` (e.g. "Define your domains"). Subtitle is "Step X of 4."
   - **Change:**
     - Add a short outcome to the step title or the description under it, e.g.:
       - Step 1: Title "Define your domains" → add line "Your life areas (e.g. Work, Personal, Learning)."
       - Step 2: "Your top 3 goals" → "We’ll show these on your dashboard."
       - Step 3: "Add your first project" → "A project belongs to a domain."
       - Step 4: "Your first 3 tasks" → "You’ll use these in Daily focus."
     - (Some of this may already exist in the `<p className="text-sm text-muted-foreground">` under each step; align and keep one line per step.)

2. **"Use defaults" instead of "Skip"**
   - **File:** `app/onboarding/page.tsx`
   - **Current:** Step 0 (Domains): copy says "We'll add defaults if you skip." No explicit "Skip" button; user can leave fields empty and click Next, which triggers defaults.
   - **Change:**
     - Where the UI or copy says "skip" or implies skipping, replace with "use defaults" or "I'll use defaults":
       - Domains: e.g. "Add at least one, or use defaults (Work, Personal, Learning)."
       - Tasks: if there’s any "skip" or "leave empty" hint, change to "Or use defaults: we’ll add 3 starter tasks."
     - If a button says "Skip" anywhere, rename to "Use defaults" and keep the same behavior (call defaults API and move to next step).

### Acceptance

- [ ] Each step has a clear one-line outcome or description.
- [ ] Any "skip" wording is replaced with "use defaults" (or equivalent) so the result is clear.
- [ ] Behavior unchanged: leaving domains/tasks empty and proceeding still creates defaults.

---

## Implementation Order (checklist)

1. [x] **High:** Daily review "why" line — `app/dashboard/review/daily/page.tsx` (both main and no-tasks branches).
2. [x] **High:** Weekly review "why" line — `app/dashboard/review/weekly/page.tsx`.
3. [x] **Medium:** Mobile "More" menu — `components/dashboard/MobileBottomNav.tsx` (add item + sheet with Domains, Projects, Knowledge).
4. [x] **Medium:** API focus/today — include paused-project tasks in backlog and return `project.status` — `app/api/focus/today/route.ts`.
5. [x] **Medium:** Focus page backlog — disable "Add to focus" and show "Project paused" when `project.status === 'paused'` — `app/dashboard/focus/page.tsx`.
6. [x] **Low:** Onboarding step labels and "Use defaults" — `app/onboarding/page.tsx`.
7. [x] **Low:** Optimistic Mark done/Postpone — `app/dashboard/focus/page.tsx` (optimistic state + revert on error).
8. [x] **Low:** Accessibility — `docs/Accessibility_Audit_Checklist.md` created; design system Section 10 updated with audit and touch-target guidance. Run Lighthouse/axe when ready and document in `docs/Accessibility_Audit_YYYY-MM-DD.md`.

---

## Optional: PCC_In_App_Copy.md

Add the new review "why" lines and onboarding tweaks to `docs/PCC_In_App_Copy.md` so future copy stays consistent.

---

*End of Implementation Plan*
