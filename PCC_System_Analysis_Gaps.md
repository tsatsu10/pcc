# PCC — Full System Analysis & Gap Report

**Version:** 1.0  
**Date:** 2026-02-10  
**Sources:** PCC_Full_Requirements_and_Build_Order.txt, PCC_Cursor_Build_Spec.txt, codebase review

---

## 1. Executive Summary

The PCC MVP is largely **in place**: auth, onboarding, domains/projects/tasks CRUD, Daily Focus Engine (3-task limit), focus sessions, daily/weekly (and monthly) reviews, analytics, and the Knowledge module. The following gaps are **missing, partial, or at risk** relative to the spec and NFRs.

---

## 2. Functional Gaps

### 2.1 Goals on Dashboard (FR-6)

- **Requirement:** Capture top 3 goals in onboarding; implied use on dashboard.
- **Current:** Goals are stored in `User.goals` (JSON array) during onboarding.
- **Gap:** Dashboard does **not** fetch or display the user’s top 3 goals. The dashboard shows greeting, date, focus strip, filters, and cards but no “Your goals” or similar.
- **Recommendation:** Add a “Goals” or “Top 3 goals” widget/section on the main dashboard that reads `user.goals` and displays them (editable optional for MVP).

### 2.2 Profile: Timezone & Full Metadata (FR-3)

- **Requirement:** Editable profile (optional in MVP); user metadata (name, etc.).
- **Current:** `/api/me` supports GET and PATCH; PATCH allows **name** only. Timezone is set at **registration** only.
- **Gap:** Users **cannot change timezone** after signup. Profile page/form does not expose timezone (or other fields).
- **Recommendation:** Allow PATCH `/api/me` to update `timezone` and surface it in the profile form so users can correct it without re-registering.

### 2.3 API Contract vs Spec: Focus Endpoints

- **Spec:** `POST /api/focus/assign`, `POST /api/focus/postpone`.
- **Current:** Focus assignment and postpone are done via **PATCH /api/tasks/:id** (body: `status: "focus" | "postponed"`, etc.). No dedicated `/api/focus/assign` or `/api/focus/postpone`.
- **Gap:** API surface does not match the written contract; all logic is correctly in task PATCH.
- **Recommendation:** Either add thin `/api/focus/assign` and `/api/focus/postpone` that delegate to task updates, or update the spec to reflect the current REST design.

### 2.4 Domain Delete: Reassign Projects (FR-11)

- **Requirement:** “Deleting a domain: user must reassign projects to another domain or delete them.”
- **Current:** DELETE domain returns 400 if the domain has any projects (“Move or delete them first”). Users must edit each project to another domain or delete projects manually.
- **Gap:** No **bulk “reassign all projects to domain X”** flow when deleting a domain.
- **Recommendation:** Either add an optional `reassignToDomainId` (or similar) to the delete request, or add a clear UI flow: “Reassign N projects to…” before delete.

### 2.5 Weekly Review Anchor from Onboarding (FR-30)

- **Requirement:** “Weekly review required every 7 days (anchor: 7 days from last completed weekly review, **or from onboarding completion if none yet**).”
- **Current:** `getReviewStatus` uses “no weekly review ever” OR “last weekly period end &lt; 7 days ago” to require weekly. It does **not** use `user.onboardingCompletedAt` as the first anchor.
- **Gap:** First weekly due is not explicitly “7 days after onboarding”; it’s “due immediately until first weekly is done.”
- **Recommendation:** If the product intent is “first weekly due 7 days after onboarding,” set the first due date from `onboardingCompletedAt`; otherwise document current behavior.

### 2.6 “Suggested Top 3” Heuristic (Build Spec §8)

- **Spec:** Daily Focus suggests top 3 tasks by a simple score (deadline, priority, effort).
- **Current:** Focus/today API and UI surface backlog and current focus; suggestion heuristic is **not** clearly implemented (e.g. no explicit scoring/sorting of “suggested” tasks).
- **Gap:** No documented or visible “suggested 3” based on the spec formula.
- **Recommendation:** Implement the suggested heuristic in `/api/focus/today` (or equivalent) and surface “Suggested” in the Daily Focus UI.

---

## 3. Non-Functional & Technical Gaps

### 3.1 Focus Count Uses Server Date (FR-24 / Timezone)

- **Requirement:** Focus date and daily limits must respect **user timezone** (FR-24).
- **Current:** In `getFocusCountForUserToday`, the `today` argument is the start-of-day **in user TZ** (from `getTodayInUserTimezone`). Inside the function, however, the range is built with `setHours(0,0,0,0)` and `setDate(getDate()+1)` on that Date, which effectively uses **server local** date arithmetic.
- **Gap:** In environments where server TZ ≠ user TZ, the focus count query could use the wrong calendar day, allowing or blocking focus incorrectly at day boundaries.
- **Recommendation:** Make `getFocusCountForUserToday` timezone-aware: accept `userTimezone` and derive the day range with the same timezone utilities used elsewhere (e.g. `getStartOfDayInTimezone` / `getTodayInUserTimezone`), then use that range for the Prisma query.

### 3.2 Session Timeout (NFR-3)

- **Requirement:** “Session timeout after inactivity (e.g. **7 days**).”
- **Current:** NextAuth session `maxAge: 30 * 24 * 60 * 60` (30 days).
- **Gap:** Session lives 30 days, not “e.g. 7 days” as in the NFR.
- **Recommendation:** Reduce `maxAge` to 7 days, or add sliding window / inactivity timeout if the product requires stricter security.

### 3.3 Performance & Load (NFR-1)

- **Requirement:** “Dashboard must load under 2 seconds on average (fast 3G, up to 50 tasks).”
- **Current:** No automated performance or load tests found in the repo; no documented 2s budget or monitoring.
- **Gap:** No evidence that NFR-1 is verified or continuously monitored.
- **Recommendation:** Add Lighthouse CI or similar (e.g. on dashboard and focus routes), and/or load tests with ~50 tasks to assert response times.

### 3.4 Accessibility (NFR-5)

- **Requirement:** “Core flows (auth, onboarding, focus, reviews) meet **WCAG 2.1 Level A**.”
- **Current:** Some use of `aria-label`, `aria-invalid`, `focus-visible`, and semantic structure; no systematic audit or WCAG checklist.
- **Gap:** No documented accessibility audit or test suite; risk of missing labels, focus order, contrast, or keyboard support.
- **Recommendation:** Run an axe or similar audit on auth, onboarding, Daily Focus, and review pages; fix issues and add a few critical-path a11y tests.

### 3.5 Data Export (Future but Noted in Spec)

- **Spec §9 (Future):** “User data export (e.g. JSON/CSV for portability and compliance).”
- **Current:** No export API or UI.
- **Gap:** Not in MVP scope but called out; useful for trust and compliance later.
- **Recommendation:** When prioritising post-MVP work, add “Export my data” (e.g. `/api/me/export` returning JSON/CSV of user’s domains, projects, tasks, sessions, reviews).

---

## 4. Product / UX Gaps

### 4.1 Dashboard “Quick Add Task” (Build Spec §7.4)

- **Spec:** Main Dashboard includes “Quick add task (adds to backlog only).”
- **Current:** Dashboard has filters and cards (focus, projects, overdue, reviews); no explicit “Quick add task” control on the main dashboard.
- **Gap:** Quick add reduces friction; currently user must go to Tasks or a project.
- **Recommendation:** Add a small “Add task” (or “Quick add”) on the dashboard that opens a minimal modal (title, optional project/domain) and creates a backlog task.

### 4.2 Focus Mode “Notes (optional)” (Build Spec §7.6)

- **Spec:** Focus Mode includes “notes (optional)” and “end session → mark done/postpone/continue.”
- **Current:** Focus timer has start/pause/stop and done/postpone; session is logged with duration. No **per-session notes** stored with FocusSession.
- **Gap:** No optional notes field on focus session for reflection or context.
- **Recommendation:** If desired for MVP, add an optional `notes` (or `content`) field to FocusSession and a small text area in the focus UI; otherwise defer and document.

### 4.3 Monthly Review vs Spec

- **Requirements doc:** FR-28 (daily), FR-30 (weekly). Monthly is listed in **Future** in the build spec.
- **Current:** Codebase has **monthly** review (review/monthly, review status, monthly data API).
- **Gap:** Monthly is implemented but not part of the core FR list; review-status blocks dashboard for daily and weekly, and monthly is in the flow.
- **Recommendation:** Align docs: either add monthly to the official FR list and NFR/acceptance criteria, or clearly mark monthly as “optional / pilot” and avoid blocking dashboard on it until product decides.

---

## 5. Summary Table

| Area              | Gap / Risk                                      | Severity   | Spec ref   |
|-------------------|--------------------------------------------------|------------|------------|
| Goals on dashboard| Not displayed                                    | Medium     | FR-6       |
| Profile timezone  | Cannot edit after registration                   | Medium     | FR-3       |
| Focus API shape   | No /api/focus/assign, /postpone                  | Low        | Build spec §6 |
| Domain delete     | No bulk reassign projects                        | Low        | FR-11      |
| Weekly anchor     | First weekly not tied to onboarding date         | Low        | FR-30      |
| Suggested top 3   | Heuristic not implemented                        | Medium     | Build spec §8 |
| Focus count TZ    | Uses server date in focus-limit                  | High (bug) | FR-24      |
| Session timeout   | 30 days vs “e.g. 7 days”                        | Low        | NFR-3      |
| Performance       | No 2s verification                               | Medium     | NFR-1      |
| Accessibility     | No WCAG audit                                   | Medium     | NFR-5      |
| Quick add task    | Missing on dashboard                             | Low        | Build spec §7.4 |
| Focus session notes | Not implemented                               | Low        | Build spec §7.6 |
| Monthly review    | Implemented but not in core FR list              | Doc only   | Future     |

---

## 6. Recommended Priorities

1. **High:** Fix focus-count timezone in `getFocusCountForUserToday` so the 3-task limit is correct for all user timezones.
2. **Medium:** Show top 3 goals on the dashboard; add timezone to profile and `/api/me` PATCH.
3. **Medium:** Implement “suggested top 3” for Daily Focus and optionally add performance/a11y checks.
4. **Low:** Align API with spec (focus assign/postpone endpoints or spec update); session timeout; quick add task; domain delete reassign UX.

---

*End of gap report.*
