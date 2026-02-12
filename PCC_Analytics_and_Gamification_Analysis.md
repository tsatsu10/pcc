# PCC — Analytics Improvements & Gamification Analysis

**Date:** 2026-02-10  
**Scope:** Whole-system view of analytics (FR-32–FR-35) and feasibility of light gamification aligned with PCC goals.

---

## 1. Current Analytics (What Exists)

| Metric | Source | UI | Spec (FR) |
|--------|--------|-----|-----------|
| **Completion rate** | Tasks with `status: done` and `updatedAt` in period; denominator = tasks *created* in same period | Count + list; optional % (completed/created) | FR-32 |
| **Focus time** | Sum of `FocusSession.durationMinutes` in period; session count | Total duration, optional daily-goal bar (localStorage), sessions count | FR-33 |
| **Overdue tasks** | Tasks not done, `deadline < today`, project not dropped | Count + list (current snapshot) | FR-34 |
| **Domain balance** | Tasks completed in period grouped by project → domain | Bar list (completed per domain) | FR-35 |

**Filters:** Time range (7d / 30d / 90d / custom), domain, project. All use user timezone for “today” and period boundaries.

**Gaps in current implementation (vs. possible improvements):**
- No trend (e.g. “this week vs last week”).
- No focus time *per day* (e.g. sparkline or daily breakdown).
- No “overdue cleared in period” (overdue that got done).
- Completion rate denominator is “created in period” only (no “in focus in period” or “scheduled”).
- No review-related metrics or streaks.
- No gamification (streaks, milestones, badges).

---

## 2. Analytics Improvements (Concrete Options)

### 2.1 High value, fits existing data & spec

| Improvement | Description | Data needed | Effort | Spec fit |
|-------------|-------------|-------------|--------|----------|
| **Focus time per day** | Show focus minutes per day in the selected period (list or simple sparkline). | Already in API: filter `FocusSession` by day in range, sum by day. | Low | FR-33 |
| **Average session length** | Mean duration per completed session in period. | Same focus-session aggregate; add `_avg: { durationMinutes }` or compute from list. | Low | FR-33 |
| **Completion vs previous period** | e.g. “This week: 5 done. Last week: 3.” | Two queries: same completion logic for current and previous period. | Low | FR-32 |
| **Overdue cleared in period** | Count (and optionally list) tasks that were overdue at some point and were marked done in period. | Harder: need “was overdue before updatedAt” or approximate by “deadline < updatedAt and status=done and updatedAt in period”. | Medium | FR-34 extension |
| **Focus time by domain/project** | In addition to “tasks completed per domain”, show “focus minutes per domain” (or project) in period. | Join sessions → task → project (→ domain); group and sum. | Low | FR-33 + FR-35 |

### 2.2 Medium value, still in scope

| Improvement | Description | Data needed | Effort | Spec fit |
|-------------|-------------|-------------|--------|----------|
| **Review compliance** | e.g. “Daily reviews completed: 6/7 days”; “Weekly reviews: on time last 4 weeks.” | Count daily/weekly reviews in period; compare to “expected” (days with focus sessions, or 7-day windows). | Medium | Supports reflection loop (FR-28–FR-31) |
| **Days with ≥1 completion** | In selected period, how many days had at least one task marked done. | Group completed tasks by `updatedAt` date (user TZ), count distinct days. | Low | FR-32 |
| **Completion list link to task** | In analytics completion list, link to task detail (we have `/dashboard/tasks/[id]`). | Already have task id; add link to task instead of only project. | Trivial | UX |

### 2.3 Lower priority / Phase 2

- **Forecasting / capacity:** “Advanced analytics” in build spec Phase 2; skip for MVP.
- **Charts library:** Current UI is cards + lists; add simple charts (e.g. bar per day for focus time) only if we add “focus time per day” and want a visual.

---

## 3. Gamification: Fit with PCC Goals

**PCC goals (from requirements):**
- Reduce cognitive overload | Force execution over planning | Clear daily priorities | Convert activity into insight via reviews | Foundation for vertical SaaS.

**NFR-5:** Minimal UI, low cognitive load, clear constraints.

**Implication:** Gamification should support **execution and reflection**, not distract. Prefer:
- **Light-touch:** streaks and milestones, not points/levels/leaderboards.
- **Self-referential:** “You did X” not “You vs others.”
- **Aligned with core loop:** Daily focus → reviews → next day. Streaks for “days with focus” or “reviews done on time” fit; complex RPG levels do not.

---

## 4. Gamification Options (Feasible & Aligned)

### 4.1 Streaks (high fit)

All derivable from existing data; no new tables if we compute on read.

| Streak | Definition | Data source | Where to show |
|--------|------------|-------------|----------------|
| **Daily review streak** | Consecutive days (in user TZ) with a daily review submitted. | `Review` where `type = 'daily'`, order by `periodEnd` desc; count consecutive calendar days. | Dashboard strip or Analytics |
| **Weekly review streak** | Consecutive 7-day windows with a weekly review. | `Review` where `type = 'weekly'`; check last N periodEnds cover last N weeks. | Dashboard or Analytics |
| **Focus days streak** | Consecutive days with at least one focus session (or at least one task completed). | `FocusSession` or tasks `status=done` grouped by day in user TZ. | Dashboard or Analytics |
| **Completion streak** | Consecutive days with ≥1 task completed. | Tasks `status=done`, group by `updatedAt` date (user TZ). | Analytics or dashboard |

**Implementation note:** Streaks require “current streak” and optionally “longest streak”. Compute by walking backwards from “today” in user TZ and stopping at first gap. Can be done in API (e.g. `GET /api/analytics/streaks` or part of dashboard/analytics payload).

### 4.2 Milestones / simple “achievements” (medium fit)

No new tables: derive from existing counts/dates; show as one-time or recurring celebrations.

| Milestone | Condition | Where to show |
|-----------|-----------|----------------|
| First focus session | At least one `FocusSession` with `endTime` set. | Onboarding / first focus completion |
| First daily review | At least one daily review. | After first daily review submit |
| N tasks completed | Total tasks `status=done` ≥ 10, 25, 50, … | Analytics or dashboard widget |
| N hours focus time | Total `durationMinutes` across all time ≥ 10h, 50h, … | Analytics |
| Zero overdue week | In a 7-day window, no overdue tasks at end of each day (or: completed all overdue that existed). | Harder to define; optional. |
| Review week | Completed daily review every day for 7 days (where there was a focus session). | Analytics / dashboard |

Keep these as **informational** (“You’ve completed 10 tasks”) or **soft badges** (icon + short label), not points or levels, to stay within “minimal UI.”

### 4.3 What to avoid (for MVP)

- **Points, XP, levels:** Adds UI and mental model; conflicts with “low cognitive load.”
- **Leaderboards / social:** Out of scope (single-user, no teams).
- **Daily “quests” or mandatory challenges:** PCC already has a clear loop (3 focus tasks, daily/weekly review); avoid overlapping or conflicting mechanics.

---

## 5. Recommended Priorities

### 5.1 Analytics (implement first)

1. **Focus time per day** — List or minimal chart for focus minutes per day in selected period (API + analytics page).
2. **Average session length** — Single number in focus-time card (API change only).
3. **Focus time by domain** — Optional breakdown in domain balance area or new card (API + small UI).
4. **Completion vs previous period** — “This period: X. Previous: Y.” (API + one line in completion card).
5. **Link completion list to task detail** — Use existing `/dashboard/tasks/[id]` (UI only).

Later: review compliance metrics, “overdue cleared,” days-with-completion.

### 5.2 Gamification (light touch)

1. **Current streak: focus days or completions** — “You’ve had at least one completion for N days in a row.” Compute in API (dashboard or `GET /api/analytics` / `GET /api/analytics/streaks`), show on dashboard strip or analytics.
2. **Daily review streak** — “N days of daily reviews in a row.” Same pattern.
3. **Simple milestones** — e.g. “10 tasks completed,” “10h total focus,” as small callouts on dashboard or analytics when reached (no new table; derive from counts).

Avoid for MVP: points, levels, badges UI beyond a single “streak” or “milestone” line.

---

## 6. Summary Table

| Category | Item | Effort | Spec / goal fit |
|----------|------|--------|------------------|
| Analytics | Focus time per day | Low | FR-33 |
| Analytics | Average session length | Low | FR-33 |
| Analytics | Focus time by domain | Low | FR-33, FR-35 |
| Analytics | Completion vs previous period | Low | FR-32 |
| Analytics | Completion list → task link | Trivial | UX |
| Analytics | Review compliance | Medium | Reflection loop |
| Gamification | Focus/completion streak | Low | Execution, minimal UI |
| Gamification | Daily review streak | Low | Reflection, minimal UI |
| Gamification | Milestones (10 tasks, 10h focus) | Low | Motivation, minimal UI |

All of the above use **existing schema** (Task, FocusSession, Review). No new tables required for MVP analytics or light gamification.

---

*End of analysis. Implementation can start with analytics improvements (focus per day, avg session, comparison, task link), then add one or two streak metrics and optional milestone callouts.*
