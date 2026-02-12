# PCC — Full System Analysis: What We Have & What’s Missing

**Date:** 2026-02-10  
**Sources:** Codebase review, PCC_Full_Requirements_and_Build_Order.txt, PCC_System_Analysis_Gaps.md, industry/productivity-app research

---

## 1. What’s Built (Current State)

### 1.1 Auth & User
- Email/password registration and login (FR-1, FR-2)
- Profile: name, timezone, top 3 goals editable (FR-3); change password
- Session: JWT, 7-day max age (NFR-3)
- Rate limiting on auth endpoints

### 1.2 Onboarding
- Mandatory onboarding before dashboard (FR-4)
- Domains, goals, first project, first 3 tasks (FR-5–FR-8)
- Auto-defaults when user skips (FR-9)

### 1.3 Domains & Projects
- CRUD for domains (FR-10, FR-11) with objective/KPIs
- Domain delete with **bulk reassign** (reassignToDomainId in API and UI)
- Projects: create, edit, status (active/paused/completed/dropped), deadline, priority (FR-12–FR-15)
- Project view with tasks, overdue

### 1.4 Tasks
- Create, edit, status (backlog/focus/done/postponed), deadline, effort, energy (FR-16–FR-19)
- All tasks view with filters (status), card/list/calendar views
- Task detail page with focus sessions and total focus time

### 1.5 Daily Focus Engine
- Max 3 focus tasks per day, server-enforced (FR-20–FR-22)
- Slot release on complete/postpone (FR-23)
- **Focus date in user timezone** via `getTodayRangeInUserTimezone` (FR-24)
- **Suggested top 3** heuristic in `/api/focus/today` (deadline, priority, effort) with “Suggested” badge in UI (Build Spec §8)

### 1.6 Focus Sessions
- Start/pause/stop timer, session persisted (FR-25, FR-26, NFR-2)
- **Optional session notes** on stop (Build Spec §7.6)
- Multiple sessions per task (FR-27)
- Recovery of active session after refresh

### 1.7 Reviews
- Daily: required after focus session; block/banner until done (FR-28, FR-29)
- Weekly: required every 7 days; block until done (FR-30, FR-31)
- Monthly: implemented; in flow
- Review hub, past reviews list and read-only detail
- “Remember for tomorrow” from daily review

### 1.8 Analytics & Gamification
- Completion rate, focus time, overdue, domain balance (FR-32–FR-35)
- Focus time per day, average session, focus by domain, completion vs previous period
- **Streaks & milestones** (completion, review, focus-day streaks; task and focus-time milestones)
- Dedicated **Milestones** page (unlocked vs to-unlock with requirements)
- In-app **milestone toasts** on unlock

### 1.9 Dashboard
- Today strip (focus count, overdue, daily/weekly review status)
- **Today** section: strip + What’s next? + Focus block
- **Focus areas** (top 3 goals) with “Edit in profile”
- **Rest** section: Review, Overdue, **Upcoming deadlines**, Active projects, Tasks, Analytics
- **Two-column layout** on large screens
- **Quick add task** (QuickAddTask)
- Domain filter, reorder/collapse cards

### 1.10 Other
- **Knowledge** (notes, tags, link to domains/projects/tasks)
- **Data export** (JSON/CSV via `/api/me/export` and profile)
- Past reviews and task detail as planned

---

## 2. Gaps vs Spec (Still Missing or Partial)

### 2.1 API Contract vs Spec (Low)
- **Spec** mentions `POST /api/focus/assign` and `POST /api/focus/postpone`.
- **Reality:** Implemented. Thin proxy endpoints exist: `POST /api/focus/assign` and `POST /api/focus/postpone` delegate to `PATCH /api/tasks/:id` with status focus/postponed. See `app/api/focus/assign/route.ts` and `app/api/focus/postpone/route.ts`.

### 2.2 Weekly Review First-Due Anchor (Low)
- **Spec (FR-30):** “7 days from last completed weekly review, **or from onboarding completion if none yet**.”
- **Reality:** Implemented. `lib/review-status.ts` uses `weeklyAnchorEnd = lastWeeklyReview?.periodEnd ?? user?.onboardingCompletedAt` and requires weekly when `dayStart >= sevenDaysAfterAnchor`.

### 2.3 Performance & Monitoring (Medium)
- **NFR-1:** Dashboard load under 2s (fast 3G, ~50 tasks).
- **Reality:** `scripts/perf-check.mjs` asserts `/api/dashboard` and `/api/focus/today` respond within 2s. Run with server up: `npm run perf-check` or `BASE_URL=http://localhost:3000 node scripts/perf-check.mjs`. Optional: add to CI.

### 2.4 Accessibility (Medium)
- **NFR-5:** Core flows (auth, onboarding, focus, reviews) WCAG 2.1 Level A.
- **Reality:** Axe tests in `components/ui/__tests__/accessibility.test.tsx` (form, button, login-style form). Run `npm run test:run`. Optional: E2E axe on full pages.

### 2.5 Paused Projects and Focus
- **Spec (FR-14):** Tasks under Paused projects “cannot be moved to focus until project is Active again.”
- **Reality:** Implemented. PATCH /api/tasks/:id with status focus checks `project.status === "active"` and returns 400 with message “Tasks from paused or completed projects cannot be moved to focus.” if not active.

---

## 3. Ideas from Research (Not in Spec, Optional)

Common productivity/focus-app features and how they relate to PCC:

| Feature | PCC status | Note |
|--------|------------|------|
| **Quick add / fast capture** | Done | Quick add on dashboard; could add natural-language parsing later. |
| **Multiple views (list, board, calendar)** | Partial | List + card + **calendar (deadlines)** on tasks; no Kanban. |
| **Time tracking & focus** | Done | Focus sessions with timer, duration, notes. |
| **Recurring tasks** | Missing | No recurrence; tasks are one-off. Would need recurrence model and UI. |
| **Reminders / notifications** | Partial | In-app milestone toasts and review banner; no push/email reminders. |
| **Reporting & trends** | Partial | Analytics + streaks/milestones; no capacity/workload planning. |
| **Templates** | Missing | No project/task templates or “copy project.” |
| **Integrations** | Non-goal (MVP) | Spec says no integrations for MVP. |
| **Mobile app** | Non-goal | Web-only MVP. |
| **Offline** | Non-goal | Online required. |
| **AI / smart scheduling** | Non-goal | Spec: no AI for MVP; suggested top 3 is heuristic only. |

### 3.1 Recurring Tasks (Idea)
- Many apps support “repeat every X” or “repeat after completion.”
- Would need: recurrence rule on Task (or new model), cron or daily job to create next instance, UI to set repeat.
- **Effort:** Medium–high; new model and logic.

### 3.2 Reminders / Notifications (Idea)
- **PCC_Notifications_Analysis.md** already recommends in-app only for MVP; optional email later.
- Could add: “Daily review due” reminder (e.g. end-of-day toast), optional email digest.
- **Effort:** Low (toast) to medium (email + prefs).

### 3.3 Kanban / Board View (Idea)
- Tasks could be shown as columns (e.g. Backlog | Focus | Done) per project or global.
- **Effort:** Medium; new view and drag-and-drop.

### 3.4 Templates (Idea)
- “Copy project” or “Create from template” (e.g. “Weekly planning” with pre-filled tasks).
- **Effort:** Low–medium.

### 3.5 Natural-Language Quick Add (Idea)
- e.g. “Call John tomorrow” → task with deadline.
- **Effort:** Medium; parsing or small ML.

---

## 4. Summary Table

| Area | Status | Priority / action |
|------|--------|-------------------|
| Focus API shape (assign/postpone) | Spec vs implementation | Low: align spec or add proxies |
| Weekly first-due from onboarding | Unclear | Low: clarify and implement or document |
| Performance (2s dashboard) | Not verified | Medium: add Lighthouse/load checks |
| Accessibility (WCAG A) | No audit | Medium: axe + a11y tests |
| Paused project → focus | Implemented | — |
| Recurring tasks | Not in product | Optional: design and backlog |
| Reminders / notifications | In-app only | Optional: expand per notifications doc |
| Kanban view | Not in product | Optional: backlog |
| Templates | Not in product | Optional: backlog |

---

## 5. Recommended Next Steps

1. **Align:** Update spec to match `PATCH /api/tasks/:id` for focus, or add `/api/focus/assign` and `/api/focus/postpone`.
2. **Quality:** Add performance and accessibility checks (Lighthouse, axe, key a11y tests).
3. **Product:** Decide weekly first-due rule (onboarding anchor vs “due until first done”) and implement or document.
4. **Backlog:** Consider recurring tasks, reminders/email, Kanban, templates as product priorities allow.

---

*End of analysis.*
