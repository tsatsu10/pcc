# Deploying PCC on Vercel — Secure Production Checklist

This guide ensures your PCC deployment on Vercel is **protected and production-ready**. Follow every step.

---

## 1. Environment Variables (Required)

Set these in **Vercel Project → Settings → Environment Variables**. Use **Production** (and Preview if you want preview deployments to work).

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. **Use Supabase** (recommended): Project Settings → Database → Connection string → **Transaction** (port 6543), add `?pgbouncer=true`. See [docs/DATABASE_SUPABASE.md](docs/DATABASE_SUPABASE.md). Other options: Neon, Vercel Postgres — always use a pooler for serverless. |
| `NEXTAUTH_SECRET` | **Yes** | Generate with: `openssl rand -base64 32`. Used to sign JWTs and cookies. **Never commit or share.** |
| `NEXTAUTH_URL` | **Yes** | Your production URL **with HTTPS**: `https://your-domain.com`. Vercel may auto-set `VERCEL_URL`; set `NEXTAUTH_URL` explicitly to your canonical domain (e.g. `https://pcc.vercel.app` or your custom domain). |

### Optional but strongly recommended

| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | **Rate limiting.** On Vercel, each serverless function can have its own in-memory rate limiter, so limits are not shared. Attackers can bypass by hitting different instances. **Set Redis** (e.g. Upstash Redis, Redis Cloud) and add `REDIS_URL` so login/register/export/password rate limits are enforced globally. |
| `OPENAI_API_KEY` | Only if you use weekly AI insights. Server-side only; never exposed to client. |

---

## 2. Security Checklist (No Stone Unturned)

### Authentication & session
- [x] **NEXTAUTH_URL** is HTTPS in production (cookies use `__Secure-` prefix and `secure: true`).
- [x] **NEXTAUTH_SECRET** is set and strong (32+ bytes random). Without it, sessions are insecure.
- [x] **Open redirect** mitigated: NextAuth `redirect` callback allows only same-origin or relative paths.
- [x] **Rate limiting** on login, register, export, password change. Use **REDIS_URL** on Vercel so limits are shared across instances.

### Headers (already configured in app)
- [x] **Strict-Transport-Security (HSTS):** Enforces HTTPS; 1 year; includeSubDomains; preload.
- [x] **X-Frame-Options: DENY** — prevents clickjacking.
- [x] **X-Content-Type-Options: nosniff** — prevents MIME sniffing.
- [x] **Content-Security-Policy** — restricts script/style/connect sources; frame-ancestors 'none'.
- [x] **Referrer-Policy, Permissions-Policy** — limit referrer and browser features.

### Request & API
- [x] **Body size limit:** POST/PUT/PATCH to `/api/*` rejected if `Content-Length` > 1 MB (413).
- [x] **Blocked paths:** Middleware returns 404 for `/.env`, `/.git`, `/wp-admin`, `/wp-login.php`, and similar probe paths (including path segments like `/api/.env`, `/dashboard/.git`).
- [x] **No stack traces or internal errors in production:** NextAuth, focus/sessions PATCH, and weekly insights return generic messages when `NODE_ENV === "production"`. Error pages show detailed messages only in development.

### Data & authorization
- [x] All API routes (except `/api/auth/register` and `/api/auth/[...nextauth]`) require session (`getServerSession`).
- [x] All queries scoped by `session.user.id`. Task/project/domain ownership validated on create/update.
- [x] Passwords hashed with bcrypt (cost 12). No `passwordHash` in API responses.

### Build & source
- [x] **productionBrowserSourceMaps: false** — production client bundles do not ship source maps (reduces info leakage).
- [x] `.env` and `.env*.local` in `.gitignore` — never commit secrets.

---

## 3. Vercel-Specific Settings

1. **Build & Development**
   - **Framework Preset:** Next.js (auto-detected).
   - **Build Command:** `next build` (default).
   - **Output Directory:** default.
   - **Install Command:** `npm install` (default).

2. **Database (Supabase recommended)**
   - Create a project at [supabase.com](https://supabase.com). In **Project Settings → Database**, copy the **Transaction** (pooler) connection string (port 6543), add `?pgbouncer=true`, and set it as `DATABASE_URL` in Vercel. Full steps: [docs/DATABASE_SUPABASE.md](docs/DATABASE_SUPABASE.md).
   - Run `npx prisma db push` (or `prisma migrate deploy` if you use migrations) after the first deploy so the schema exists. You can run it locally with the same `DATABASE_URL` or from a one-off script.

3. **Optional: Vercel Deployment Protection**
   - **Preview deployments:** In Project Settings → Deployment Protection, you can enable **Vercel Authentication** or **Password Protection** for preview URLs so only your team can access them.
   - **Production:** Usually public; use strong auth (your app’s login) and the checklist above.

4. **Custom domain**
   - Add your domain in Vercel; set **NEXTAUTH_URL** to `https://your-domain.com` so cookies and redirects use the correct origin.

---

## 4. Post-Deploy Verification

1. **HTTPS:** Open `https://your-domain.com` and confirm the site loads over HTTPS. Check response headers (e.g. in DevTools → Network → select document → Headers) for `Strict-Transport-Security` and `X-Frame-Options`.
2. **Auth:** Register a test user, log in, complete onboarding. Log out and log in again. Confirm session persists and cookies use `__Secure-` in production.
3. **Blocked paths:** Visit `https://your-domain.com/.env` and `https://your-domain.com/.git` — both should return 404 (or 404 without leaking content).
4. **Rate limit:** After 5 failed logins (or 5 register/export/password attempts) from the same IP, you should get 429. If you did **not** set REDIS_URL, try from another device/IP to confirm per-instance limit.
5. **No leakage:** Trigger an auth error (e.g. wrong password) and confirm the response does not include stack traces or internal paths.

---

## 5. Thorough audit (what was verified)

- **No `NEXT_PUBLIC_*` env:** No secrets or config are exposed to the client bundle.
- **All 36 data API routes** require `getServerSession` and return 401 when unauthenticated. Only `/api/auth/register` and `/api/auth/[...nextauth]` are public by design.
- **500/502 error responses** do not include stack traces or internal error messages in production (NextAuth, focus sessions, weekly insights).
- **Prisma logging:** In production only `error` is logged; `query` and `warn` are disabled to avoid leaking data in logs.
- **Probe paths:** Blocked both at path start and when contained in path (e.g. `/api/.env`, `/dashboard/.git`).
- **Cookie:** Session cookie uses `__Secure-` prefix and `secure: true` only when `NEXTAUTH_URL` is HTTPS; app throws at load if production and `NEXTAUTH_SECRET` is missing.

---

## 6. Summary

- **Required:** `DATABASE_URL` (with pooler), `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (HTTPS).
- **Strongly recommended:** `REDIS_URL` for global rate limiting on Vercel.
- The app is hardened with secure cookies, HSTS, CSP, body size limit, blocked probe paths, and no production error leakage. Keep dependencies updated (`npm audit`, upgrade Next.js/NextAuth/Prisma) and monitor Vercel logs for errors.
