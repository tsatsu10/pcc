# PCC Deep Dive Report

A concise technical audit of the Personal Command Center (PCC) codebase: auth, Daily Focus Engine, timezone handling, API security, and spec alignment.

---

## 1. Repo layout and spec alignment

- **Spec sources:** `PCC_Full_Requirements_and_Build_Order.txt` and `PCC_Cursor_Build_Spec.txt` define requirements and build order. The app follows the intended stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, PostgreSQL, Prisma.
- **Build order:** Auth + DB → onboarding → CRUD (domains, projects, tasks) → Daily Focus engine → focus sessions → reviews → dashboard/analytics is reflected in route structure and dependencies.
- **Mandatory onboarding:** Dashboard layout redirects unauthenticated users to login and users without `onboardingCompletedAt` to `/onboarding`. Review gate blocks dashboard until required daily/weekly review is done.

---

## 2. Auth

- **Middleware:** Protects `/dashboard`, `/onboarding`, `/profile`; redirects to login when no JWT. Redirects from `/auth/login` and `/auth/register` to `/dashboard` when a token exists (onboarding/done state is enforced in layout via DB).
- **NextAuth:** Session used for `session.user.id`; all dashboard API routes call `getServerSession(authOptions)` and return `401` when `!session?.user?.id`.
- **Rate limiting (NFR-3):** `lib/rate-limit.ts` implements in-memory rate limiting (5 attempts per 15 minutes, 15-minute block). Used on auth endpoints (login/register). Production with multiple instances should switch to a shared store (e.g. Redis) for consistency.

---

## 3. Daily Focus Engine (max 3 tasks per day)

- **Enforcement:** `lib/rules/focus-limit.ts` exposes `getFocusCountForUserToday` and `MAX_FOCUS_TASKS_PER_DAY` (3). The **server** enforces the limit:
  - **Focus today API** (`/api/focus/today`): Uses `getFocusCountForUserToday` and returns `canAddMore: count < MAX`.
  - **Task PATCH** (`/api/tasks/[id]`): When setting `status: "focus"`, checks `getFocusCountForUserToday`; if already at max and the task is not already in today’s focus set, returns `400` with a clear message.
- **Slot release:** Completing (done) or postponing a task clears `focusDate` (and `focusGoalMinutes`), so the count for “today” decreases and a new slot becomes available. No client-only bypass; all mutations go through the API.

---

## 4. Timezone usage (FR-24)

- **User timezone:** Stored on `User.timezone`, default `"UTC"`. Used wherever “today” or “this day” matters.
- **Focus and reviews:**
  - `lib/timezone.ts`: `getTodayInUserTimezone`, `getTodayRangeInUserTimezone`, `getDayRangeInUserTimezone`, `isToday`.
  - **Focus today:** `/api/focus/today` uses `getTodayInUserTimezone(tz)` for the focus date and for `getFocusCountForUserToday(prisma, userId, today)`.
  - **Task PATCH (status → focus):** Uses `getTodayInUserTimezone(tz)` for `focusDate` and for the daily count check.
  - **Review status:** `lib/review-status.ts` uses `getTodayRangeInUserTimezone(tz)` for “focus sessions today” and “daily review today.”
- **Convention:** “Today” is represented as the user’s local calendar date; that date is stored as UTC midnight (e.g. `YYYY-MM-DDT00:00:00.000Z`) for consistency with Prisma `@db.Date` and range queries. Focus session “today” uses the same day range. This is consistent across focus and reviews.
- **Analytics:** Date range for analytics (e.g. “last 30 days”) is derived from server `now`, not user timezone. Acceptable for MVP; if you need “user’s local calendar” for analytics, apply the same timezone helpers there.

---

## 5. API auth and data scoping

- **Session check:** Every dashboard/data API handler that was audited uses `getServerSession(authOptions)` and returns `401` when `!session?.user?.id`.
- **Resource ownership:** Mutations and reads are scoped by `session.user.id`:
  - Tasks: `where: { id, userId: session.user.id }` (GET/PATCH in `/api/tasks/[id]`); list in `/api/tasks` and `/api/focus/today` filter by `userId`.
  - Focus sessions: create with `userId: session.user.id`; PATCH in `/api/focus/sessions/[id]` uses `where: { id, userId: session.user.id }`.
  - Domains, projects, tags, notes, reviews, dashboard, analytics, onboarding: all filter or assign by `session.user.id`.
- No identified IDOR: updating a task or session by ID only succeeds if it belongs to the current user.

---

## 6. Error handling and validation

- **Validation:** Request bodies are validated with Zod where applicable (e.g. tasks, domains, projects, tags). Invalid input returns `400` with structured error details.
- **Not found:** Tasks, sessions, and other resources return `404` when the entity is missing or not owned by the user.
- **Business rules:** Focus limit returns `400` with a clear message; “session already ended” / “already paused” etc. return `400` or `409` as appropriate.
- **Server errors:** Several handlers use try/catch and return `500` with a generic message; some log to console. Focus session PATCH includes a hint to run migrations if DB schema is out of date.

---

## 7. Security and robustness (summary)

- **Auth:** Middleware + session checks; no dashboard API found without a session check.
- **Scoping:** All audited APIs scope by `session.user.id`; no cross-user data exposure found.
- **Input:** Zod used for creation/update payloads; effort and focus goal minutes are validated (e.g. `focusGoalMinutes` 1–240).
- **Rate limiting:** Auth endpoints only; consider extending to sensitive or expensive APIs if needed.

---

## 8. Recommendations (addressed)

1. **Rate limiter in production:** Done. `lib/rate-limit.ts` uses Redis when `REDIS_URL` is set (install `ioredis`); otherwise in-memory.
2. **Analytics and timezone:** Done. Analytics API uses the user's timezone for preset ranges and overdue "today" via `getTodayInUserTimezone(tz)`. (Obsolete: “user’s calendar” for analytics ranges, compute `periodStart`/`periodEnd` using the user’s timezone (same pattern as focus/reviews).
3. **Migrations:** Schema already has the fields; project uses `prisma db push`. Run `npx prisma db push` if DB is out of sync.
4. **Tasks page `?new=1`:** Done. Ref guard prevents double-open; ref resets when param is absent so later `?new=1` works.

---

*Report generated from codebase audit. Aligns with PCC_Full_Requirements_and_Build_Order.txt and PCC_Cursor_Build_Spec.txt.*
