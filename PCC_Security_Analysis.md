# PCC — Full Security Analysis

**Date:** 2026-02-10  
**Scope:** Authentication, authorization, API security, data access, input validation, secrets, and common vulnerabilities.

---

## 1. Executive Summary

| Area | Status | Notes |
|------|--------|--------|
| Authentication | ✅ Strong | NextAuth JWT, bcrypt, 7-day session, login/register rate limited |
| API authorization | ✅ Fixed | Task/project ownership validated; project create validates domainId |
| Data isolation | ✅ Good | Queries consistently scope by `userId` from session |
| Input validation | ✅ Good | Zod on critical inputs; no raw SQL |
| Secrets & config | ✅ Good | `.env` gitignored; NEXTAUTH_SECRET required |
| Injection | ✅ Low risk | Prisma only; no `$queryRawUnsafe` in app code |
| XSS | ✅ Low risk | React default escaping; no `dangerouslySetInnerHTML` in app |

**Fixes applied:** (1) Task create/update validate `projectId` belongs to user. (2) Project create validates `domainId` belongs to user.

**Vercel deployment:** See **DEPLOYMENT_VERCEL.md** for production checklist (env vars, Redis, headers, blocked paths, error leakage, thorough audit).

---

## 2. Authentication

### 2.1 Session & Strategy

- **NextAuth** with **JWT** strategy; no database session store.
- **Session lifetime:** 7 days (`maxAge: 7 * 24 * 60 * 60`).
- **Sign-in page:** `/auth/login`; custom credentials provider.
- **Secrets:** `getToken({ req, secret: process.env.NEXTAUTH_SECRET })` in middleware; auth depends on `NEXTAUTH_SECRET` being set.

**Location:** `lib/auth.ts`, `middleware.ts`

### 2.2 Password Handling

- **Registration:** `bcryptjs` `hash(password, 12)`; minimum length 8 (Zod).
- **Login:** `compare(credentials.password, user.passwordHash)`; no timing leak beyond bcrypt.
- **Change password:** `PATCH /api/me/password` requires session + current password; new password min 8 chars; hash with cost 12.

**Locations:** `app/api/auth/register/route.ts`, `lib/auth.ts`, `app/api/me/password/route.ts`

### 2.3 Rate Limiting (NFR-3)

- **Login:** `checkRateLimit(ip)` in `authorize()`; blocks after 5 attempts per IP per 15 minutes.
- **Register:** Same limiter applied in `POST /api/auth/register`.
- **Storage:** Redis when `REDIS_URL` is set; otherwise in-memory (per-instance).
- **IP source:** `x-forwarded-for` or `x-real-ip`; fallback `'unknown'` (single bucket if both missing).

**Location:** `lib/rate-limit.ts`

**Recommendation:** Document `REDIS_URL` in `.env.example` for production so rate limits are shared across instances.

---

## 3. Authorization

### 3.1 Route Protection

- **Middleware** protects pages: `/dashboard`, `/onboarding`, `/profile`; redirects unauthenticated users to `/auth/login`. Auth pages `/auth/login`, `/auth/register` redirect logged-in users to `/dashboard`.
- **API routes** are **not** covered by this middleware. Every protected API handler uses `getServerSession(authOptions)` and returns `401` when `!session?.user?.id`.

**Verified:** All 36+ API route handlers under `app/api/` (except `/api/auth/register` and `/api/auth/[...nextauth]`) require a valid session.

### 3.2 Resource Ownership (Data Isolation)

- **Pattern:** Queries use `where: { id, userId: session.user.id }` or `where: { userId: session.user.id }` so users only see or modify their own data.
- **Domains, projects, tasks, focus sessions, reviews, notes, tags, analytics, dashboard, export, gamification:** All scoped by `session.user.id`.
- **Dashboard filter:** `domainId` from query string is used only as a filter on already user-scoped data; no cross-user leak (wrong UUID just narrows to empty set).

### 3.3 IDOR: Task ↔ Project and Project ↔ Domain (Fixed)

- **POST /api/tasks:** Now verifies `projectId` exists and `project.userId === session.user.id` before create.
- **PATCH /api/tasks/[id]:** When updating `projectId`, verifies the new project belongs to the current user.
- **POST /api/projects:** Now verifies `domainId` exists and `domain.userId === session.user.id` before create.

---

## 4. Input Validation

- **Registration:** Zod schema (email, password min 8, optional name/timezone).
- **Password change:** current + new password (min 8).
- **Profile (PATCH):** name, timezone, goals (array of strings, length 3, max 500 chars each).
- **Tasks:** UUIDs for `projectId`; effort (enum + time pattern); status enums; `focusGoalMinutes` 1–240.
- **Projects/Domains/Notes/Reviews:** Schemas with required fields and enums where applicable.
- **Knowledge search:** `q` trimmed and length ≥ 2; Prisma `contains` with parameterized input.
- **Analytics:** `domainId` / `projectId` from query are used only in `where` with `userId`; no raw concatenation. Date range parsed with validation (preset or custom).

No use of `$queryRawUnsafe` or string-concatenated SQL in application code; Prisma’s parameterized API is used throughout.

---

## 5. Injection & XSS

- **SQL:** All data access via Prisma (parameterized). No `$queryRaw` / `$executeRaw` in `app/` or `lib/`.
- **XSS:** No `dangerouslySetInnerHTML` or `innerHTML` in application source; React escapes by default. Build artifacts (e.g. webpack) use `eval` for dev tooling, not user content.

---

## 6. Secrets & Configuration

- **`.env`:** Listed in `.gitignore`; `.env.example` documents `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, optional `OPENAI_API_KEY`.
- **OPENAI_API_KEY:** Used only server-side in `app/api/review/weekly/insights/route.ts`; not sent to client.
- **NEXTAUTH_SECRET:** Required for signing JWTs; middleware uses it for `getToken`.
- **REDIS_URL:** Not in `.env.example`; optional for rate limiter (document for production).

---

## 7. Sensitive Data & Export

- **GET /api/me/export:** Returns full user data (profile, domains, projects, tasks, focus sessions, reviews, notes, tags). Protected by session; scoped to `session.user.id`. CSV escaping for comma, quote, newline.
- **Profile GET/PATCH:** Exposes `id`, `email`, `name`, `timezone`, `goals`, `createdAt`; no `passwordHash`.
- **Password hash:** Never selected in API responses; only used for compare/update.

---

## 8. CSRF & Headers

- NextAuth uses its own CSRF token for sign-in/sign-out; API routes rely on same-origin + session cookie (no custom CSRF middleware).
- Next.js default security headers apply; no custom `Content-Security-Policy` or security headers reviewed in this pass. Consider adding security headers (CSP, X-Frame-Options, etc.) for production.

---

## 9. Error Handling & Information Disclosure

- **NextAuth handler:** Catches errors and returns `{ error, message: String(...) }`; avoids leaking stack traces in response.
- **API routes:** Many return generic “Registration failed”, “Update failed”, etc.; some `console.error` in server logs. Ensure production logs do not expose sensitive data or stack traces to clients.

---

## 10. Checklist Summary

| # | Item | Status |
|---|------|--------|
| 1 | All protected API routes check session | ✅ |
| 2 | All DB queries scope by session user id | ✅ |
| 3 | Task create/update: projectId must belong to user | ✅ |
| 3b | Project create: domainId must belong to user | ✅ |
| 4 | Passwords hashed with bcrypt (cost ≥10) | ✅ (12) |
| 5 | Auth endpoints rate limited | ✅ |
| 6 | No raw SQL / $queryRawUnsafe in app | ✅ |
| 7 | No dangerouslySetInnerHTML on user content | ✅ |
| 8 | .env and secrets not committed | ✅ |
| 9 | Export and profile scoped to current user | ✅ |
| 10 | Input validation (Zod) on critical payloads | ✅ |

---

## 11. Cybersecurity vulnerability check (additional)

- **Open redirect:** Fixed. Custom `redirect` callback in `authOptions` allows only relative paths or same-origin URLs (`lib/auth.ts`).
- **Request body DoS:** Fixed. Middleware rejects POST/PUT/PATCH to `/api/*` when `Content-Length` > 1 MB with 413 (`middleware.ts`).
- **Dependencies:** Keep NextAuth, Next.js, Prisma, and other deps updated; run `npm audit` periodically.
- **Projects domainId:** Fixed: `POST /api/projects` now validates that `domainId` belongs to the current user before creating a project.

## 12. Recommendations (remaining)

1. ~~**Implement project ownership check** for tasks and projects~~ **Done.**
2. ~~**Add REDIS_URL** to `.env.example`~~ Done.
3. ~~**Security headers**~~ Done. `next.config.mjs`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
4. ~~**Validate domainId in dashboard/analytics**~~ Done. Validate `domainId` in `GET /api/dashboard` and `GET /api/analytics` against user’s domains for clearer errors (defense in depth; current use is already safe).
5. ~~**Rate limit export and password change**~~ Done. Both use `checkRateLimit(ip)`.

---

## 13. Implementation summary (applied)

- **Tasks:** POST and PATCH validate `projectId` with `prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } })`. If not found, return `400` (e.g. “Project not found”).
- **Projects:** POST validates `domainId` via `prisma.domain.findFirst({ where: { id, userId: session.user.id } })`.
