# PCC — Full System Analysis: What Exists & What’s Left to Build

**Version:** 1.0  
**Date:** 2026-02-10  
**Purpose:** Map current functionality, answer “how do I access X?”, and list remaining builds that would help.

---

## 1. What the System Does Today (Functionality Map)

| Area | Implemented | How to Access |
|------|-------------|----------------|
| **Auth** | Register, login, logout, profile | `/auth/register`, `/auth/login`, profile via `/api/me` + `/profile` |
| **Onboarding** | Mandatory wizard, domains → goals → project → 3 tasks, defaults | `/onboarding` (redirect if not completed) |
| **Dashboard** | Greeting, date, today strip (focus count, overdue, review status), goals, filters, cards, quick add task | `/dashboard` |
| **Domains** | CRUD, list, detail with projects | `/dashboard/domains`, `/dashboard/domains/[id]` |
| **Projects** | CRUD, list, detail with tasks | `/dashboard/projects`, `/dashboard/projects/[id]` |
| **Tasks** | CRUD, list with filters (status), edit modal, no dedicated task detail page | `/dashboard/tasks`, APIs: `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id` |
| **Daily Focus** | Max 3 focus tasks, suggested top 3 (heuristic), assign/postpone, focus date in user TZ | `/dashboard/focus`, `GET /api/focus/today`, `POST /api/focus/assign`, `POST /api/focus/postpone` |
| **Focus sessions** | Start/stop/pause, duration, optional notes, resume after refresh | Focus page timer; `POST /api/focus-sessions`, PATCH session, resume endpoint |
| **Daily review** | Form: completed/missed tasks + reasons, mood, remember for tomorrow; blocks dashboard when due | `/dashboard/review/daily`, `GET /api/review/daily/data`, `POST /api/review/daily` |
| **Weekly review** | Form: project progress, overdue, priorities; optional AI insights | `/dashboard/review/weekly`, `GET /api/review/weekly/data`, `POST /api/review/weekly` |
| **Monthly review** | Implemented (not in core FR list) | `/dashboard/review/monthly` |
| **Review hub** | Links to do daily / weekly / monthly / backlog; shows “Due” | `/dashboard/review` |
| **Backlog review** | Triage backlog and postponed tasks | `/dashboard/review/backlog` |
| **Analytics** | Completion rate, focus time, overdue count, domain balance; filters (domain, project, 7d/30d/90d/custom) | `/dashboard/analytics`, `GET /api/analytics?range=…` |
| **Knowledge** | Notes, tags, search, link to domain/project/task | `/dashboard/knowledge` |
| **Data export** | Full user data (JSON/CSV): profile, domains, projects, tasks, sessions, reviews, notes, tags | Profile page “Export my data”, `GET /api/me/export?format=json|csv` |

---

## 2. Your Questions Answered

### 2.1 How do we access **past daily or weekly reviews**?

**Short answer: you can’t in the UI today.**  
Reviews are stored in the `Review` table (`type`, `periodStart`, `periodEnd`, `content`, `createdAt`). They are:

- Used to **fill** the current daily review form (e.g. “last remember for tomorrow”).
- Included in **Export my data** (Profile → Export), so you get all past reviews in the JSON/CSV download.

There is **no**:

- API to list past reviews (e.g. `GET /api/reviews?type=daily&limit=20`).
- UI to browse “Past daily reviews” or “Past weekly reviews” (e.g. a list with date + link to read-only view).

So: **past reviews exist in the DB and in export only; there is no in-app way to open or search them.**

---

### 2.2 How do we access **data of an individual focus task**?

**Short answer: only in aggregate or via export.**  
For a **single task** you currently get:

- **Tasks list** (`/dashboard/tasks`): title, status, project, deadline, effort, energy; edit in a modal. No focus history.
- **API**: `GET /api/tasks` returns tasks with `project`; there is **no `GET /api/tasks/:id`** that returns one task with its focus sessions or history.

So today you **cannot** in the app:

- Open a **task detail page** (e.g. `/dashboard/tasks/[id]`).
- See for that task:
  - All **focus sessions** (dates, durations, notes).
  - **Total focus time** for the task.
  - **Focus dates** (when it was in focus).
  - **Completion date** (e.g. when status became “done”) other than via `updatedAt` in lists/export.

Export gives full tasks and full focus sessions, so you can correlate by `task_id` yourself, but there’s no in-app “task story” or “task focus history” view.

---

### 2.3 What else is missing that would help?

- **Review history (past daily/weekly)**  
  - List and open past reviews by type and date (read-only or editable depending on product choice).

- **Task detail + focus history**  
  - Single task view: metadata + list of focus sessions (date, duration, notes) and total focus time; optional completion/focus-date timeline.

- **Other items** from the existing gap report and this analysis are summarized in Section 3 below.

---

## 3. What’s Left to Build (Prioritized)

### 3.1 High impact / blocks correctness

| # | Item | What’s missing | Why it helps |
|---|------|----------------|--------------|
| 1 | **Focus count timezone (bug)** | `getFocusCountForUserToday` may use server date instead of user TZ for the “today” range | Ensures the 3-task-per-day limit is correct at day boundaries for all timezones (FR-24). |

### 3.2 High value for “accessing past data & task story”

| # | Item | What to build | Why it helps |
|---|------|----------------|--------------|
| 2 | **Past daily/weekly reviews** | (1) API: e.g. `GET /api/reviews?type=daily|weekly|monthly&limit=50` returning list of `{ id, type, periodStart, periodEnd, createdAt }` and optionally `GET /api/reviews/:id` for full content. (2) UI: e.g. “Past reviews” on Review hub: list by type + date, click to read (and optionally edit) that review. | Users can revisit “what I said last week” and search/scroll their reflection history. |
| 3 | **Individual task data / task detail** | (1) API: `GET /api/tasks/:id` with `include: { focusSessions: true, project: true }`. (2) UI: Task detail page or slide-over at `/dashboard/tasks/[id]` showing task fields + list of focus sessions (date, duration, notes), total focus time, and optionally focus_date / completion timeline. | Answers “how much did I work on this?” and “when did I focus on it?” without leaving the app. |

### 3.3 Medium value (product/UX and spec alignment)

| # | Item | What’s missing / what to build | Why it helps |
|---|------|--------------------------------|--------------|
| 4 | **Profile timezone** | Allow PATCH `/api/me` to update `timezone`; add timezone field to profile form. | Users can fix timezone after signup without re-registering (FR-3). |
| 5 | **Suggested top 3** | Already implemented in `/api/focus/today` and shown on Daily Focus. | No build needed; optionally make the “Suggested” label more visible if desired. |
| 6 | **Session timeout** | NFR says “e.g. 7 days”; currently 30 days. | Reduce `maxAge` in NextAuth to 7 days (or add sliding/inactivity) if you want to align with NFR-3. |
| 7 | **Domain delete – reassign projects** | When deleting a domain with projects, either: (a) optional `reassignToDomainId` on DELETE, or (b) UI: “Reassign N projects to…” then delete. | Smoother domain cleanup (FR-11). |
| 8 | **Weekly review first-due anchor** | Optionally set first weekly due to “7 days after onboarding” instead of “due until first weekly done.” | Clearer first-time behavior (FR-30). |

### 3.4 Lower priority / polish

| # | Item | What’s missing / what to build | Why it helps |
|---|------|--------------------------------|--------------|
| 9 | **Focus session notes in UI** | DB has `FocusSession.notes`; ensure focus UI has an optional notes field when starting/stopping. | Better reflection and context (Build Spec §7.6). |
| 10 | **Performance / a11y** | NFR-1 (2s dashboard), NFR-5 (WCAG 2.1 A). | Add Lighthouse/load checks and an a11y audit for core flows. |
| 11 | **API contract** | Spec mentions `/api/focus/assign` and `/api/focus/postpone`; these exist as thin wrappers. | Already aligned; optionally update spec to mention PATCH task as alternative. |

---

## 4. Quick Reference: “Where do I get X?”

| Need | Where today | Ideal (if built) |
|------|-------------|-------------------|
| Past daily reviews | Export only | Review hub → “Past reviews” → filter Daily → list + open by date |
| Past weekly reviews | Export only | Same → filter Weekly |
| Data for one task (sessions, total time) | Export only (correlate task + sessions by task_id) | Task detail page or drawer: task + focus sessions + total time |
| List of all my reviews | Export only | GET /api/reviews + “Past reviews” UI |
| Single task by id | Not available (no GET /api/tasks/:id) | GET /api/tasks/:id with focusSessions |
| Today’s focus + suggested 3 | `/dashboard/focus`, GET /api/focus/today | Already there |
| Analytics for a period | `/dashboard/analytics` + range/filters | Already there |
| Export all data | Profile → Export my data | Already there |

---

## 5. Recommended Build Order for “What’s Left”

1. **Fix focus-count timezone** (Section 3.1) so the 3-task rule is correct everywhere.
2. **Past reviews**: add `GET /api/reviews` (+ optional `GET /api/reviews/:id`), then “Past reviews” on Review hub with list and read view.
3. **Task detail**: add `GET /api/tasks/:id` with `focusSessions` and project; add `/dashboard/tasks/[id]` (or slide-over) with task info + session list + total focus time.
4. **Profile timezone** and **domain delete reassign** (and optionally session timeout / weekly anchor) as next UX improvements.
5. **Performance and a11y** checks and fixes as ongoing polish.

---

*This document complements `PCC_System_Analysis_Gaps.md` (which focuses on spec vs implementation). Here the focus is: current functionality, how to access past reviews and task-level data, and a concrete list of what to build next to improve that.*
