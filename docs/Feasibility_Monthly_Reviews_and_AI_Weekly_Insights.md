# Feasibility Study: Monthly Reviews & AI Weekly Insights

**Date:** 2026-02-02  
**Scope:** Two future extensions from PCC (Section 9 — Future Extensions)

---

## 1. Monthly Reviews

### 1.1 Definition

A **monthly review** is a periodic reflection (e.g. once per calendar month or every 30 days) where the user reviews the past month’s outcomes, adjusts priorities, and optionally sets intentions for the next month. It follows the same pattern as daily and weekly reviews: **trigger** → **data** → **submit** → **persist**.

### 1.2 Current System (Reuse)

| Piece | Daily | Weekly | Reusable for Monthly? |
|-------|--------|--------|------------------------|
| **Review model** | `type: "daily"`, periodStart/End, content (JSON) | `type: "weekly"`, same | Yes — add `monthly` to `ReviewType` enum |
| **Trigger logic** | Focus sessions today && no review today | Last weekly `periodEnd` < 7 days ago | Same pattern: last monthly `periodEnd` < 30 days ago |
| **Data API** | Today’s completed/missed focus tasks | Last 7 days: project progress, overdue, priorities | Last 30 days: same shape, longer window |
| **Submit API** | POST with completed/missed + comments | POST with bottlenecks, priorityNotes, projectPriorities | POST with similar + optional “monthly wins” / “next month focus” |
| **UI** | `/dashboard/review/daily` | `/dashboard/review/weekly` | New page `/dashboard/review/monthly` |
| **Banner** | ReviewBanner checks dailyRequired, weeklyRequired | Same | Add monthlyRequired, link to monthly |

**Existing data that fits a 30-day view:**

- **Analytics API** already supports `?period=30`: tasks completed, focus time, overdue, domain balance. Can be reused or mirrored for monthly data.
- **Backlog review** (60+ days) is a separate “view”; monthly review would be a **submitted** review with its own content.

### 1.3 What Needs to Be Done

| Item | Effort | Notes |
|------|--------|--------|
| Schema: add `monthly` to `ReviewType` enum | Low | Prisma migrate + regenerate |
| `GET /api/review/status`: add `monthlyRequired`, `monthlyLastPeriodEnd` | Low | Query last monthly review; require if none or periodEnd &lt; 30 days ago |
| `GET /api/review/monthly/data`: last 30 days project progress, overdue, completions, focus time, domain balance | Low | Copy weekly/data pattern, 30-day window; can align with analytics queries |
| `POST /api/review/monthly`: validate “no monthly in last 30 days”, create Review with type `monthly`, optional content (bottlenecks, priorities, wins, next month) | Low | Same validation pattern as weekly |
| UI: `/dashboard/review/monthly` page | Low–Medium | Copy weekly page structure; adapt copy and fields (e.g. “Monthly wins”, “Focus for next month”) |
| ReviewBanner + dashboard links: show monthly when due, link to monthly review | Low | Extend status response and banner logic |
| Nav / dashboard: add “Monthly review” where appropriate | Low | Header, dashboard cards, command palette |

### 1.4 Risks & Dependencies

- **Risks:** Low. No new infra; same auth, same Review model, same UI patterns.
- **Dependencies:** None beyond current stack.
- **Edge case:** “Once per month” can be calendar month (e.g. 1st–30th) or rolling 30 days. Rolling is consistent with weekly (7 days) and simpler to implement; calendar month is more intuitive for some users. Recommend **rolling 30 days** for v1.

### 1.5 Feasibility Verdict: **High**

- **Feasibility:** High.  
- **Effort:** Small–medium (roughly 1–2 days for a focused implementation).  
- **Recommendation:** Proceed when prioritised; no technical blockers.

---

## 2. AI Weekly Insights

### 2.1 Definition

**AI weekly insights** would use an LLM to turn the user’s weekly data (completed tasks, focus time, overdue, project progress, review notes) into short, readable insights or suggestions—e.g. a 2–4 sentence summary, or bullets like “You completed 12 tasks; 4h focus on Project X; 3 overdue in Domain Y” and “Consider reprioritising Project Z (no progress this week).”

### 2.2 Current System (Inputs for AI)

| Data | Source | Use for AI |
|------|--------|------------|
| Weekly project progress | `GET /api/review/weekly/data` | Project names, done/total, overdue per project |
| Overdue tasks | Same API | Count and list |
| Completed tasks in period | Analytics (7 days) or weekly window | Completion rate, which projects/domains |
| Focus time | FocusSession aggregate | Total minutes, sessions count |
| Domain balance | Analytics | Completion per domain |
| User’s weekly review content | Review.content (bottlenecks, priorityNotes) | Optional: “You noted bottlenecks: …” |
| Backlog (60+ days) | Backlog review API | Optional: “3 tasks sitting 60+ days” |

All of this is already available via existing APIs; no new data model is required to feed the AI.

### 2.3 What Needs to Be Done

| Item | Effort | Notes |
|------|--------|--------|
| **Provider + API key** | Low | e.g. OpenAI, Anthropic, or Azure OpenAI; env var, server-side only |
| **Server-side LLM call** | Medium | New API route (e.g. `POST /api/review/weekly/insights` or `GET …/insights`) that builds a prompt from weekly data, calls provider, returns plain text or structured JSON |
| **Prompt design** | Medium | System + user prompt: “Summarise this week: …” and “Suggest 1–2 priorities or risks” (no PII beyond task/project names user already sees). Iterate for tone and length |
| **Caching / idempotency** | Low | Same week + same data → same insight (e.g. cache by userId + periodEnd or hash of inputs) to avoid repeated cost and variability |
| **UI** | Low–Medium | Show “AI insight” block on weekly review page or dashboard (e.g. after weekly data loads); loading and error states |
| **Optional: store insight** | Low | Store in `Review.content.weeklyInsight` or separate table for “last week’s insight” on dashboard |

### 2.4 Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| **Cost** | Per-user, per-week call; cache so one generation per week; use a small/cheap model for summaries |
| **Latency** | Show “Generating…” and render when ready; optional “Generate insight” button instead of auto |
| **Privacy** | Task/project/domain names are user data; use provider with clear DPA and no training on customer data (e.g. OpenAI/Anthropic opt-outs). Avoid sending PII beyond what’s in the app |
| **Reliability** | Provider outages or rate limits; handle errors gracefully and show “Insight unavailable” |
| **MVP alignment** | PCC MVP explicitly lists “No AI dependency”; this is a **post-MVP** feature |

### 2.5 Dependencies

- **External:** LLM API (OpenAI, Anthropic, or similar); API key and billing.
- **Internal:** Weekly data APIs (already exist); no schema change required for a first version.

### 2.6 Feasibility Verdict: **Medium–High**

- **Feasibility:** Medium–high. Implementation is straightforward (one route, one prompt, one UI block); main decisions are product (opt-in vs default, where to show) and ops (cost, provider choice).
- **Effort:** Medium (order of 2–4 days including prompt tuning and error handling).
- **Recommendation:** Feasible after MVP; introduce behind a feature flag or “Insights” toggle; start with a simple summary prompt and optional “suggest one priority” to limit cost and complexity.

---

## 3. Summary Table

| Feature | Feasibility | Effort | Deps | Recommendation |
|--------|-------------|--------|------|-----------------|
| **Monthly reviews** | High | Small–medium (1–2 days) | None | Implement when prioritised; no blockers. |
| **AI weekly insights** | Medium–high | Medium (2–4 days) | LLM provider + API key | Implement post-MVP; optional/opt-in; cache and handle errors. |

---

## 4. Suggested Implementation Order

1. **Monthly reviews** first: extends the existing review system with minimal new concepts; no external dependency.  
2. **AI weekly insights** second: reuses weekly (and optionally monthly) data; can be added once monthly review is in place so “weekly + monthly” data can both feed insights later if desired.
