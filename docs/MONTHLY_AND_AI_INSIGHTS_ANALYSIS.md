# Analysis: Monthly Reviews & AI Weekly Insights

After reviewing the codebase and current best practices, here’s a concise analysis of what we built, what’s solid, and what could be improved.

---

## What’s Working Well

### 1. **Consistent patterns**
- Monthly review mirrors weekly (status, data API, submit API, UI). Same auth, validation, and response shapes.
- Review status and dashboard both use the same “rolling 30 days” rule and a single source of truth in `getDashboardData` + status API.

### 2. **AI insights**
- **Opt-in**: “Generate insight” avoids surprise cost and latency; no LLM call on page load.
- **Timeout**: 10s `AbortController` avoids hanging requests.
- **Errors**: 429, 5xx, missing key, and empty response are handled with clear user-facing messages.
- **No key in client**: `OPENAI_API_KEY` stays server-side; only a generic error is shown when unset (503).
- **Prompt**: System + user prompt are focused; payload is structured (projects, focus, overdue, domain balance, last review).

### 3. **Cost control**
- One generation per user per week via in-memory cache keyed by `userId:periodEnd`.
- Small model (`gpt-4o-mini`) and `max_tokens: 256` keep cost low.

### 4. **UX**
- Banner, dashboard card, NextActionCard, Header, and Command Palette all support monthly; “reviews due” prioritizes daily → weekly → monthly for the single CTA.
- Weekly page: AI block doesn’t block submit; loading and error states are clear.

---

## Issues & Gaps

### 1. **In-memory cache is not reliable in serverless (high impact)**

**Current:** `insightCache = new Map<string, string>()` in `app/api/review/weekly/insights/route.ts`.

**Reality:** On Vercel (and similar serverless platforms), each request can run in a different instance. In-memory state is not shared and is lost when the instance is torn down. So:
- Cache hits are unpredictable.
- Same user/week can trigger multiple LLM calls → higher cost and duplicate work.

**Recommendation:** Persist the cache somewhere durable:
- **Option A:** Store in DB, e.g. an `InsightCache` table (`userId`, `periodEnd`, `insight`, `createdAt`) or a `weeklyInsight` field in the last weekly review’s `content`.
- **Option B:** Use Vercel KV or Redis and set a TTL (e.g. 7 days).
- **Option C:** Next.js `unstable_cache` (or similar) if you’re on a stack that keeps a long-lived cache layer.

Until then, treat the in-memory cache as a per-instance optimization only; for production, add one of the above.

---

### 2. **Dates and timezones (medium impact)**

**Current:** All “today” and period boundaries use the server’s local time (`new Date()`, `setHours(0,0,0,0)`, `toDateString()`). Prisma `@db.Date` stores date-only; the server’s TZ determines what “today” is.

**Implications:**
- Single server in one TZ: behavior is consistent for that TZ.
- Server in UTC and users elsewhere: “today” and “last 7/30 days” are UTC, so a user in e.g. PST may see “tomorrow” or “yesterday” relative to their calendar.
- If you later run in multiple regions or need strict “user’s local day,” you’ll need a user timezone (e.g. stored or from browser) and to compute day boundaries in that TZ (or use a library and store UTC).

**Recommendation:** For v1, document that “day” is server time. If you add user timezone later, compute `dayStart`/`dayEnd` (and thus period boundaries) from the user’s local date and keep storing UTC or date-only in the DB.

---

### 3. **Insights period vs weekly page (low impact)**

**Current:** Weekly page shows `data.periodStart` → `data.periodEnd` from `/api/review/weekly/data`. “Generate insight” calls `/api/review/weekly/insights` with no `periodEnd`, so the API uses “current week” (today as period end).

Because both the weekly data and insights use “last 7 days ending today,” they match for the normal case. If you later add a “view past week” (e.g. with `?periodEnd=2025-01-26`), the insight would still be for the current week unless the client passes that same `periodEnd` to the insights API (e.g. `GET /api/review/weekly/insights?periodEnd=2025-01-26`). So: fine for current behavior; when adding historical weeks, pass `periodEnd` from the page into the insights request.

---

### 4. **Duplication between weekly data and insights (low impact)**

**Current:** The insights route re-fetches projects, tasks, focus sessions, overdue, and last weekly review. The weekly data route does similar work (projects + tasks; no focus/completions in the weekly data route, but insights need that).

**Impact:** Two similar but not shared code paths; a bit more DB load when generating insight and a risk of logic drifting (e.g. “overdue” or “period” defined differently).

**Recommendation:** Optional refactor: extract a shared “weekly review payload” (or “weekly stats”) used by both `/api/review/weekly/data` and `/api/review/weekly/insights`, so period math and filters live in one place. Not urgent, but helpful for consistency and future changes.

---

### 5. **Error handling in insights (minor)**

**Current:** On non-OK OpenAI response we do `const errBody = await res.text()` but don’t use `errBody` (we use a generic message). That’s good for not leaking provider details. For debugging, you could log `errBody` (or a short hash) server-side only.

**Optional:** Parse OpenAI error JSON when available and map known codes (e.g. context_length_exceeded) to slightly clearer messages, while still avoiding exposure of internals to the client.

---

### 6. **NextActionCard when multiple reviews are due**

**Current:** We show one CTA; we choose daily first, then weekly, then monthly. That ordering is sensible (daily is most time-sensitive).

**Possible improvement:** When more than one review is due, the label is “Do reviews” and the link goes to daily. You could instead link to a small “reviews” hub that lists due reviews (daily / weekly / monthly) with separate buttons, so users see all due items. Current behavior is still correct and simple.

---

## Summary Table

| Area              | Status   | Action |
|------------------|----------|--------|
| In-memory cache  | Fragile  | Move to DB or external cache for production. |
| Timezones        | Server TZ| Document; add user TZ later if needed. |
| Insights period  | OK       | Pass `periodEnd` when you add “past week” UI. |
| Data duplication | Minor    | Optional: shared “weekly stats” helper. |
| Error handling   | Good     | Optional: log or map provider errors server-side. |
| Next action UX   | Good     | Optional: reviews hub when multiple due. |

---

## References (research)

- **Serverless in-memory cache:** In-memory Maps are not shared across serverless invocations; use persistent storage or a managed cache (Vercel KV, Redis, or DB).
- **OpenAI + Next.js:** Keep API key server-side; use timeouts and explicit error handling; consider rate limiting per user in production.
- **Dates in DB:** Store in UTC or as date-only; be explicit about which “day” (server vs user TZ) you use for boundaries.

Overall, the feature set is consistent, secure, and cost-conscious. The main production fix is making the insights cache durable; the rest are incremental improvements and future-proofing.
