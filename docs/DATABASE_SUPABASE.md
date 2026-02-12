# Using Supabase as the database for PCC

PCC uses **PostgreSQL** with **Prisma**. Supabase is a hosted Postgres provider that works out of the box. Use the **connection pooler** for serverless (e.g. Vercel) so you don’t exhaust connections.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → choose org, name, database password (save it securely), region.
3. Wait for the project to be ready.

---

## 2. Get the connection string

1. In the dashboard: **Project Settings** (gear) → **Database**.
2. Scroll to **Connection string**.
3. Choose **URI**.
4. Select **Transaction** (pooler) — port **6543**. This is the one to use for Vercel and for local dev with Prisma.
5. Copy the URI. It looks like:
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
6. **Add `?pgbouncer=true`** at the end for Prisma (required when using the pooler):
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
7. Replace `[YOUR-PASSWORD]` with your database password (URL-encode it if it contains special characters).

---

## 3. Configure PCC

**Local (`.env`):**

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

**Vercel:**  
Add the same `DATABASE_URL` (Supabase pooler + `?pgbouncer=true`) in **Project Settings → Environment Variables** for Production (and Preview if you use it).

---

## 4. Apply the schema

From your project root:

```bash
npm run db:generate
npm run db:push
```

`db:push` applies the Prisma schema to your Supabase database (creates/updates tables). For production you can later switch to `prisma migrate deploy` if you use migrations.

---

## 5. Optional: Prisma Studio

To inspect data:

```bash
npm run db:studio
```

If you hit connection limits, use the **Session** (direct) connection string on port **5432** only for Studio, and keep the **Transaction** (pooler) URL in `.env` for the app.

---

## 6. Security

- **Never commit** your `.env` or the real `DATABASE_URL`. It contains the DB password.
- In Supabase: **Settings → Database → Connection pooling** — keep the pooler enabled for serverless.
- Use **Row Level Security (RLS)** only if you add Supabase Auth or direct Supabase client access. PCC uses **NextAuth** and Prisma only; all access is through your API with `session.user.id`, so RLS is optional for the current setup.

---

## Summary

| Use case   | Connection        | Port | Query param     |
|-----------|--------------------|------|------------------|
| App / Vercel | Transaction pooler | 6543 | `?pgbouncer=true` |
| Migrations / push | Same pooler or Direct | 6543 or 5432 | `?pgbouncer=true` for pooler |

Use the **pooler URL with `?pgbouncer=true`** as `DATABASE_URL` everywhere (local and Vercel) for PCC.
