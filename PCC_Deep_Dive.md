# PCC — Deep Dive

A technical deep dive into the Personal Command Center: architecture, data model, critical paths, business rules, and implementation details.

**Sources:** Codebase review, `PCC_Cursor_Build_Spec.txt`, `PCC_Full_Requirements_and_Build_Order.txt`.  
**Companion docs:** `PCC_Deep_Dive_Report.md` (audit summary), `PCC_Security_Analysis.md` (security), `PCC_System_Analysis_Whats_Missing.md` (gaps).

---

## 1. Architecture & Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui-style (Button, Input, Card, etc.) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth v4 (JWT, Credentials provider) |
| Rate limiting | rate-limiter-flexible (in-memory or Redis via `REDIS_URL`) |

**Repo layout (high level):**
- `app/` — App Router: `api/` (route handlers), `auth/`, `dashboard/`, `onboarding/`, `profile/`, `page.tsx` (landing)
- `components/` — Shared UI and dashboard-specific (e.g. `ReviewGate`, `DashboardCards`)
- `lib/` — Auth, DB client, dashboard aggregator, gamification, review-status, timezone, focus-limit rules, rate-limit
- `prisma/` — `schema.prisma` (single source of truth for data model)
- `scripts/` — `perf-check.mjs` (NFR-1)
- Specs and analysis — `PCC_*.txt`, `PCC_*.md` in project root

**Build order (from spec):** Auth + DB → Onboarding → CRUD (domains, projects, tasks) → Daily Focus engine → Focus sessions → Reviews → Dashboard + analytics. The codebase reflects this ordering in route structure and dependencies.

---

## 2. Data Model

### 2.1 Entity relationship (summary)

```
User (1) ──< Domain (many)
User (1) ──< Project (many) ── domainId → Domain
User (1) ──< Task (many) ── projectId → Project
User (1) ──< FocusSession (many) ── taskId → Task
User (1) ──< Review (many)
User (1) ──< Note (many); Note ── domainId, projectId, taskId (optional FKs)
User (1) ──< Tag (many); NoteTag (many-to-many Note ↔ Tag)
User (1) ──< InsightCache (many) — weekly AI insights cache
```

All user-scoped entities have `userId` (or `user_id`). Domains and projects use `onDelete: Cascade` from User; tasks cascade from Project; focus sessions and reviews cascade from User.

### 2.2 Key models and fields

- **User:** `id`, `email`, `passwordHash`, `name`, `timezone` (default `"UTC"`), `goals` (JSON, top 3), `onboardingCompletedAt`, timestamps.
- **Domain:** `id`, `userId`, `name`, `objective`, `kpis` (JSON), timestamps.
- **Project:** `id`, `userId`, `domainId`, `name`, `goal`, `deadline`, `priority` (1–3), `status` (active | paused | completed | dropped).
- **Task:** `id`, `userId`, `projectId`, `title`, `deadline`, `effort` (string: xs/s/m/l/xl or e.g. "90min"), `energyLevel`, `status` (backlog | focus | done | postponed), `focusDate` (date in focus), `focusGoalMinutes` (1–240 optional), timestamps.
- **FocusSession:** `id`, `userId`, `taskId`, `startTime`, `endTime`, `durationMinutes`, `pausedAt`, `totalPausedMs`, `notes`, `createdAt`.
- **Review:** `id`, `userId`, `type` (daily | weekly | monthly), `periodStart`, `periodEnd`, `content` (JSON), `createdAt`.
- **Note:** `id`, `userId`, `title`, `content`, optional `domainId`/`projectId`/`taskId`, timestamps. **Tag:** `userId`, `name` (unique per user). **NoteTag:** join table.
- **InsightCache:** `userId`, `periodEnd` (date), `insight` (text); unique on `(userId, periodEnd)`.

### 2.3 Indexes (Prisma)

- `Task`: `@@index([userId, status])`, `@@index([userId, focusDate])`
- `Project`: `@@index([userId, domainId])`
- `FocusSession`: `@@index([userId, startTime])`
- `Note`, `Tag`, `InsightCache`: indexes on `userId` and FKs as needed.

---

## 3. Authentication & Session

### 3.1 Flow

1. **Middleware** (`middleware.ts`): Runs for `/api/*`, `/dashboard/*`, `/onboarding/*`, `/profile/*`, `/auth/login`, `/auth/register`. Uses `getToken({ req, secret: NEXTAUTH_SECRET })`. Unauthenticated access to protected paths → redirect to `/auth/login?callbackUrl=<path>`. Authenticated access to auth pages → redirect to `/dashboard`. Also enforces 1 MB max body for API POST/PUT/PATCH (413 if exceeded).
2. **Login:** `POST /api/auth/[...nextauth]` (Credentials). `lib/auth.ts` `authorize()`: rate limit by IP, find user by email, `bcrypt.compare` password; return `{ id, email, name }`. NextAuth issues JWT; `jwt` and `session` callbacks attach `id`, `onboardingCompletedAt`, `name` to session.
3. **Session:** JWT strategy, 7-day max age. No DB session store. `redirect` callback restricts post-login redirect to relative paths or same-origin only (open-redirect defense).
4. **Dashboard/Onboarding:** Layouts use `getServerSession(authOptions)` and DB (`onboardingCompletedAt`); redirect to login or onboarding as needed. Review gate (below) can redirect to daily/weekly review.

### 3.2 Rate limiting

- **lib/rate-limit.ts:** 5 points per 15 minutes per IP, 15-minute block. Used for: login (in `authorize`), register, export, password change. Redis when `REDIS_URL` is set; otherwise in-memory.

---

## 4. Critical Paths

### 4.1 Onboarding

- **Routes:** `app/onboarding/page.tsx` (wizard), `POST /api/onboarding/complete`, `POST /api/onboarding/defaults` (create default domains/project/tasks if user skips).
- **Gate:** Dashboard layout redirects to `/onboarding` when `!user?.onboardingCompletedAt`. Onboarding layout redirects to `/dashboard` when `user?.onboardingCompletedAt`.
- **Complete:** Sets `User.onboardingCompletedAt` (and optionally `goals`). No spec violation if user uses defaults only.

### 4.2 Daily Focus Engine (max 3 tasks per day)

- **Rule (FR-20–FR-23):** At most 3 tasks with `status = "focus"` and `focusDate` = “today” (in user timezone). Adding a 4th is rejected. Slot is freed when a focus task is set to `done` or `postponed` (focusDate cleared).
- **Enforcement:**
  - **lib/rules/focus-limit.ts:** `getFocusCountForUserToday(prisma, userId, userTimezone)` uses `getTodayRangeInUserTimezone(tz)` and counts tasks where `status: "focus"` and `focusDate` in that range. `MAX_FOCUS_TASKS_PER_DAY = 3`.
  - **PATCH /api/tasks/[id]:** When setting `status: "focus"`, loads user timezone, gets today range, checks `getFocusCountForUserToday`; if already at max and task not already in today’s focus set, returns 400. Also checks project is active (FR-14). Sets `focusDate` to today (user TZ).
  - **POST /api/focus/assign:** Delegates to `PATCH /api/tasks/:id` with `{ status: "focus" }`.
- **GET /api/focus/today:** Returns current focus tasks (today in user TZ), backlog (with suggested top 3 by score: deadline ≤2 days, priority high, effort small/medium), active session if any, and `date` (today in user TZ).

### 4.3 Focus Sessions (timer)

- **Start:** `POST /api/focus/sessions` with `taskId`. Validates task belongs to user and is in today’s focus; disallows a second active session (one running at a time). Creates `FocusSession` with `startTime`, no `endTime`.
- **Pause/Resume/End:** `PATCH /api/focus/sessions/[id]`. Body: `action: "pause" | "resume"` or omit to end. End computes `durationMinutes` from `startTime`, `endTime`, and `totalPausedMs`; optional `notes` stored. All mutations require session ownership.
- **Recovery:** `POST /api/focus/sessions/[id]/resume` (or equivalent) allows ending an orphaned active session (e.g. after refresh). Active session is returned by `/api/focus/today` so the UI can show the running timer.

### 4.4 Reviews (daily / weekly / monthly)

- **Requirement (FR-28, FR-30):**
  - **Daily:** Required if there was at least one focus session “today” (user TZ) and no daily review for that day.
  - **Weekly:** Required 7 days after last weekly review’s `periodEnd`, or 7 days after `onboardingCompletedAt` if no weekly yet.
  - **Monthly:** Required 30 days after last monthly review (similar logic).
- **lib/review-status.ts:** `getReviewStatus(prisma, userId)` returns `dailyRequired`, `weeklyRequired`, `monthlyRequired`, plus last period ends. Uses `getTodayRangeInUserTimezone(tz)` for “today” and for weekly anchor: `weeklyAnchorEnd = lastWeeklyReview?.periodEnd ?? user?.onboardingCompletedAt`.
- **ReviewGate (components/dashboard/ReviewGate.tsx):** Client component used in dashboard layout. If `dailyRequired` and not on `/dashboard/review/daily`, replaces with `/dashboard/review/daily`. If `weeklyRequired` and not on `/dashboard/review/weekly`, replaces with `/dashboard/review/weekly`. So dashboard is blocked until the required review is done.
- **Submission:** Daily/weekly/monthly review data and submit endpoints (e.g. `POST /api/review/daily`, weekly, monthly) create `Review` with `type`, `periodStart`, `periodEnd`, `content`.

### 4.5 Paused projects (FR-14)

- Tasks in paused (or completed/dropped) projects must not be moved to focus. **Enforcement:** In `PATCH /api/tasks/[id]`, when setting `status: "focus"`, the task’s project is loaded; if `project.status !== "active"`, returns 400 with message that tasks from paused/completed projects cannot be moved to focus.

---

## 5. Timezone (FR-24)

- **Stored:** `User.timezone` (IANA, default `"UTC"`).
- **lib/timezone.ts:** `getTodayInUserTimezone(tz)`, `getTodayRangeInUserTimezone(tz)`, `getDayRangeInUserTimezone(date, tz)`, `getStartOfDayInTimezone(dateStr, tz)`, `isToday(date, tz)`. Used for:
  - Focus: `/api/focus/today`, task PATCH (focus date and count), `getFocusCountForUserToday`.
  - Reviews: `getReviewStatus` (“today”, weekly anchor).
  - Analytics: preset ranges and “today” for overdue (via `getTodayInUserTimezone`).
- **Dashboard “today”:** `lib/dashboard.ts` derives `dayStart`/`dayEnd` from `getTodayRangeInUserTimezone(tz)` after loading user timezone, so dashboard “today’s focus,” focus session count, and daily review check align with FR-24 and with `/api/focus/today` and task PATCH.

---

## 6. API Surface (concise)

- **Auth:** `POST /api/auth/register`, `GET/POST /api/auth/[...nextauth]`.
- **Me:** `GET/PATCH /api/me`, `PATCH /api/me/password`, `GET /api/me/export?format=json|csv`.
- **Onboarding:** `POST /api/onboarding/complete`, `POST /api/onboarding/defaults`.
- **Domains:** `GET/POST /api/domains`, `GET/PATCH/DELETE /api/domains/[id]` (DELETE supports `reassignToDomainId`).
- **Projects:** `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/[id]`. Create validates `domainId` ownership.
- **Tasks:** `GET /api/tasks?projectId=&domainId=&status=`, `POST /api/tasks`, `GET/PATCH/DELETE /api/tasks/[id]`. Create/update validate `projectId` ownership.
- **Focus:** `GET /api/focus/today`, `POST /api/focus/assign`, `POST /api/focus/postpone`; `POST /api/focus/sessions`, `PATCH /api/focus/sessions/[id]`, resume endpoint.
- **Dashboard:** `GET /api/dashboard?domain=`.
- **Reviews:** `GET /api/review/status`, `GET /api/review`, `GET/POST` daily/weekly/monthly data and submit routes, `GET /api/review/backlog`, `GET /api/review/[id]`, insights (weekly AI).
- **Analytics:** `GET /api/analytics?domainId=&projectId=&range=&start=&end=` (filters validated for ownership).
- **Gamification:** `GET /api/gamification`.
- **Knowledge:** `GET /api/notes`, `POST /api/notes`, `GET/PATCH/DELETE /api/notes/[id]`, `GET /api/knowledge/search?q=`, tags CRUD.

All data APIs require session; ownership is enforced by `userId` in queries and by explicit checks for `projectId`/`domainId` where applicable (see PCC_Security_Analysis.md).

---

## 7. Frontend Structure

- **Layouts:** Root `app/layout.tsx`; `app/dashboard/layout.tsx` enforces auth + onboarding, loads `getReviewStatus`, renders `ReviewGate`, `Header`, `ReviewBanner`, children, `MobileBottomNav`. Nested layouts for analytics, domains, focus, knowledge, projects, review (daily/weekly/monthly/backlog/past), tasks.
- **Key pages:** Dashboard home (`app/dashboard/page.tsx`), Focus (`app/dashboard/focus/page.tsx`), Tasks list and detail, Projects list and detail, Domains, Review hub and daily/weekly/monthly/backlog/past, Analytics, Milestones, Knowledge list and note detail, Profile (with export and password change).
- **ReviewGate:** Client component; redirects to daily or weekly review when required; otherwise renders nothing.
- **Data loading:** Pages and layouts use server components and `getServerSession`; many pages fetch from API routes (client or server) or call `getDashboardData`/similar on the server.

---

## 8. Business Rules Summary

| Rule | Where enforced | Notes |
|------|----------------|-------|
| Max 3 focus tasks per day | PATCH tasks, focus/assign | `getFocusCountForUserToday` + user TZ today range |
| Paused project → no focus | PATCH tasks | Check project.status === "active" |
| Project create → domain owned | POST projects | `domainId` must belong to user |
| Task create/update → project owned | POST/PATCH tasks | `projectId` must belong to user |
| Daily review required | ReviewGate + review-status | If focus session today and no daily review |
| Weekly review required | ReviewGate + review-status | 7 days after last weekly or onboarding |
| One active focus session | POST focus/sessions | Reject if existing session with endTime null |
| Session ownership | All focus/dashboard APIs | `userId` in where / explicit checks |

---

## 9. Security (summary)

- Session check on all protected API routes; middleware protects pages and enforces body size.
- Ownership: all queries scoped by `session.user.id`; task projectId and project domainId validated on create/update.
- Open redirect mitigated by NextAuth `redirect` callback; security headers in next.config; rate limiting on auth, export, password change; dashboard/analytics filter IDs validated.
- Details: **PCC_Security_Analysis.md**.

---

## 10. Testing & Quality

- **Unit:** `lib/rules/__tests__/focus-limit.test.ts` (focus count / today range). Vitest.
- **Accessibility:** `components/ui/__tests__/accessibility.test.tsx` (axe on form, button, login-style form).
- **Performance:** `scripts/perf-check.mjs` — GET `/api/dashboard` and `/api/focus/today` under 2s (run with server up).
- **Lint:** Next.js ESLint. No raw SQL in app/lib; Prisma only.

---

## 11. Gaps, Risks & Improvements

- ~~**Dashboard timezone:**~~ Fixed. `getDashboardData` now uses `getTodayRangeInUserTimezone(tz)` for “today.”
- **Dependencies:** Keep NextAuth, Next.js, Prisma, and others updated; run `npm audit`.
- **Optional:** E2E tests for critical flows (login → onboarding → focus → review); CI for perf-check; stricter CSP if needed.
- **Docs:** `PCC_System_Analysis_Whats_Missing.md` and `PCC_GAPS_TODO.md` list spec alignment and optional follow-ups.

---

## 12. Quick Reference

- **Focus limit:** `lib/rules/focus-limit.ts` — `MAX_FOCUS_TASKS_PER_DAY = 3`, `getFocusCountForUserToday`.
- **Review required:** `lib/review-status.ts` — `getReviewStatus`.
- **User “today”:** `lib/timezone.ts` — `getTodayRangeInUserTimezone(tz)`.
- **Dashboard payload:** `lib/dashboard.ts` — `getDashboardData(userId, filters)`.
- **Auth config:** `lib/auth.ts` — `authOptions` (redirect, jwt, session).
- **Rate limit:** `lib/rate-limit.ts` — `checkRateLimit(ip)`.
