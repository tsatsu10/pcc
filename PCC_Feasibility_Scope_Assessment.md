# PCC — Feasibility & Scope Assessment: Past Reviews & Task Detail

**Date:** 2026-02-10  
**Features assessed:** (1) Past reviews API + UI, (2) Individual task data / task detail API + UI

---

## 1. Alignment with Goals & Scope

### 1.1 PCC Goals (from Full Requirements)

- Reduce cognitive overload  
- Force execution over planning  
- Provide clear daily priorities  
- **Convert activity into insight via reviews**  
- Act as a foundation for future vertical SaaS products  

### 1.2 Spec / MVP Scope

- **Reviews (FR-28–FR-31):** Daily and weekly review *trigger* and *content* (what to show when doing the review) are in scope. The written spec does **not** explicitly require “view past reviews” or “review history.”  
- **Tasks (FR-16–FR-19, FR-27):** Task CRUD, status, visibility in project/domain/daily pool are in scope. FR-27 says “Tasks can have multiple focus sessions”; FR-33 is “Focus Time – aggregate focus session durations.” The Build Spec UI lists “all tasks view with filters” and “edit task drawer/modal” but **no** “task detail page” or “GET /api/tasks/:id.”

So: **neither feature is in the explicit MVP checklist**, but both are **natural, small extensions** of what is in scope:

- **Past reviews:** Data is already stored (`Review` with `type`, `periodStart`, `periodEnd`, `content`). Letting users revisit past reviews supports the stated goal “convert activity into insight via reviews” without changing the core review flow.
- **Task detail:** The model already has `Task` → `FocusSession[]`. Exposing one task with its sessions supports “where did my time go?” and aligns with FR-27/FR-33 without adding new domain logic.

**Conclusion:** Both fit the **goals** and **mental model** of PCC. They are **within scope as MVP extensions** if kept minimal (list + read; optional edit/timeline later).

---

## 2. Feasibility

### 2.1 Past Reviews

| Aspect | Assessment |
|--------|------------|
| **Data model** | `Review` already has `id`, `userId`, `type`, `periodStart`, `periodEnd`, `content`, `createdAt`. No schema change. |
| **Existing usage** | Export (`/api/me/export`) already loads all reviews; daily form uses “last daily” for “remember for tomorrow.” |
| **API** | Add list: `GET /api/review?type=daily|weekly|monthly&limit=50` (or `GET /api/reviews` if you prefer a dedicated resource). Single: `GET /api/review/[id]`. Both are one Prisma `findMany` / `findFirst` with `userId` and optional `type` filter. **Effort: low.** |
| **UI** | Review hub already has cards for Daily / Weekly / Monthly / Backlog. Add a “Past reviews” section: list (type + period/date) → link to read-only view (e.g. `/dashboard/review/past/[id]` or drawer). **Effort: low–medium.** |
| **Edit past reviews** | Possible (PATCH content for a given review). Not required for MVP; **read-only is enough** to fit scope and goals. |

**Verdict: Feasible, low risk.**  
**Scope suggestion:** Implement list + read-only view first; leave edit for a later iteration if needed.

### 2.2 Individual Task Data / Task Detail

| Aspect | Assessment |
|--------|------------|
| **Data model** | `Task` has relation `focusSessions FocusSession[]`; `FocusSession` has `startTime`, `endTime`, `durationMinutes`, `notes`. No schema change. |
| **Existing usage** | Analytics and export already aggregate or list sessions; focus page shows current session. |
| **API** | Add `GET /api/tasks/[id]` with `include: { project: true, focusSessions: { orderBy: { startTime: 'desc' } } }`. Compute total focus time in API or client. **Effort: low.** |
| **UI** | Same pattern as project detail: `GET /api/projects/:id` + `/dashboard/projects/[id]`. Add `/dashboard/tasks/[id]` (or a slide-over from tasks list) with task fields + table of focus sessions (date, duration, notes) + total focus time. Optional: simple timeline (e.g. bars or list by date). **Effort: low–medium.** |

**Verdict: Feasible, low risk.**  
**Scope suggestion:** Task detail page or slide-over with task info + sessions list + total time; timeline optional.

---

## 3. Consistency with Existing Codebase

- **API layout:** Review routes live under `app/api/review/` (e.g. `daily`, `weekly`, `status`). Prefer **`GET /api/review`** (list) and **`GET /api/review/[id]`** (single) so all review endpoints stay under one prefix. Alternatively, a dedicated `app/api/reviews/` for list + `[id]` is also REST-clean.
- **Tasks:** Projects use `GET /api/projects/[id]` and `/dashboard/projects/[id]`. Adding **`GET /api/tasks/[id]`** and **`/dashboard/tasks/[id]`** (or a task detail slide-over) matches that pattern.

No conflict with existing routes or conventions.

---

## 4. Scope & Goal Fit Summary

| Criterion | Past reviews | Task detail |
|-----------|--------------|-------------|
| In explicit MVP spec? | No | No |
| Supports stated goals? | Yes (insight via reviews) | Yes (execution reality, focus time) |
| Data already there? | Yes | Yes |
| New tables or core logic? | No | No |
| NFR “minimal UI, low cognitive load” | Yes (secondary surface: list + read) | Yes (detail on demand) |
| Feasibility | High | High |
| Recommended for MVP extension? | **Yes** (list + read-only) | **Yes** (detail + sessions + total time) |

---

## 5. Recommended Scope for Implementation

- **Past reviews**
  - **In scope:** API list (`GET /api/review?type=&limit=50`) and single (`GET /api/review/[id]`); UI “Past reviews” on Review hub with list by type/date and **read-only** view.
  - **Out of scope for first cut:** Edit past review (can add later if needed).

- **Task detail**
  - **In scope:** `GET /api/tasks/[id]` with `project` and `focusSessions`; task detail page or slide-over with task info, sessions list (date, duration, notes), and total focus time.
  - **Out of scope for first cut:** Fancy timeline visualization (optional later).

Both features are **feasible**, **fit the product goals and current scope as extensions**, and can be implemented without schema changes or breaking changes. Proceed with implementation as above is recommended.
