# Personal Command Center (PCC)

Web-based life operating system: daily focus (max 3 tasks), projects, tasks, focus sessions, and reviews.

## Specs (source of truth)

- **PCC_Full_Requirements_and_Build_Order.txt** — Full requirements and phased build order.
- **PCC_Cursor_Build_Spec.txt** — MVP spec: data model, API, UI, tech stack.

## Stack

- **Next.js** (App Router), TypeScript, Tailwind
- **PostgreSQL** + Prisma (Supabase recommended)
- **NextAuth** (auth)

## Setup

1. Clone and install:
   ```bash
   npm install
   ```

2. Copy env and set your database URL:
   ```bash
   cp .env.example .env
   # Edit .env: set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
   ```
   **Using Supabase?** See **[docs/DATABASE_SUPABASE.md](./docs/DATABASE_SUPABASE.md)** for connection string (use Transaction pooler + `?pgbouncer=true`).

3. Generate Prisma client and push schema:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. Run dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel (production)

See **[DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)** for a secure deployment checklist: required env vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`), Redis for rate limiting, and post-deploy verification.

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Build for production   |
| `npm run start` | Start production server |
| `npm test` | Run tests (watch mode) |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:run` | Run tests once |
| `npm run perf-check` | NFR-1: Assert dashboard/focus API response &lt;2s (run with dev server up) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB (no migrations) |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |

## Build order (from spec)

1. Auth + DB models ✅
2. Onboarding wizard + defaults ✅
3. Projects + tasks CRUD ✅
4. Daily Focus engine (3-task hard limit) ✅
5. Focus sessions (timer) ✅
6. Daily/weekly reviews ✅
7. Dashboard + analytics ✅

## Recent Improvements

**Critical Fixes (2026-02-08)**:
- ✅ FR-14: Paused project enforcement
- ✅ NFR-2: Focus session recovery UI
- ✅ FR-9: Partial onboarding defaults
- ✅ FR-11: Domain delete validation

**High Priority (2026-02-08)**:
- ✅ Tests for Daily Focus Engine
- ✅ FR-16: Flexible effort field (T-shirt OR time)
- ✅ FR-28: Hard block on review skip
- ✅ Analytics filters (domain/project/date)

**Medium Priority (2026-02-08)**:
- ✅ NFR-5: Accessibility (ARIA labels, live regions, WCAG AA)
- ✅ NFR-3: Rate limiting (5 attempts/15min on auth)
- ✅ NFR-1: Dashboard optimization (Promise.all)
- ✅ FR-24: Timezone handling (capture on registration)
- ✅ Status cleanup (removed "pending", use "backlog")
- ✅ Error boundaries (dashboard, focus, review)

See `docs/CRITICAL_FIXES_2026-02-08.md`, `docs/HIGH_PRIORITY_FIXES_2026-02-08.md`, `docs/MEDIUM_PRIORITY_FIXES_2026-02-08.md`, and `docs/IMPLEMENTATION_SUMMARY_2026-02-08.md` for details.
