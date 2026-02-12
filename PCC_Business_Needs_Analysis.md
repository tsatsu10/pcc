# Personal Command Center (PCC) — Business Needs Analysis

**Version:** 1.0  
**Date:** 2026-02-10  
**Status:** Draft for stakeholder review  

---

## 1. Executive Summary

**Product:** Personal Command Center (PCC) — a web-based “Life Operating System” (SaaS MVP).

**Core need:** Knowledge workers and operators suffer from **cognitive overload** and **planning without execution**. They need a system that **enforces** a strict daily focus (max 3 tasks), captures real work via focus sessions, and turns activity into insight through mandatory review loops.

**Primary differentiator:** Hard-enforced Daily Focus Engine (3 active tasks per day) plus mandatory daily/weekly reviews — not optional “best practice” but system-enforced behavior.

**Outcome:** A single place to structure life like a company (domains → projects → tasks), execute with constraints, and learn from reality (reviews). Foundation for future vertical SaaS (e.g. clinic, NGO, SME).

---

## 2. Business Context & Problem Statement

### 2.1 Market / User Context

- **Target segment:** Consultants, managers, founders, doctors/researchers, SME operators; **Africa-first** focus.
- **Characteristics:** High mental load, multiple concurrent responsibilities, time-constrained, execution-focused. They need **clarity and constraints** more than extra features.

### 2.2 Problem Statement

| Aspect | Current State (Without PCC) | Impact |
|--------|----------------------------|--------|
| **Cognitive load** | Unlimited “to-do” lists; no forced prioritization | Overwhelm, procrastination, context-switching |
| **Execution vs planning** | Easy to plan; hard to commit and do | Lots of plans, little completed work |
| **Daily priorities** | Unclear what “today” means | Reactive days, no clear wins |
| **Learning from work** | No structured reflection | Repeated mistakes, no improvement loop |
| **Tool fragmentation** | Notes, tasks, timers, reviews in different tools | No single source of truth; no enforced workflow |

### 2.3 Business Need (Summary)

The business needs a **single, opinionated system** that:

1. **Reduces cognitive overload** by capping daily focus to 3 tasks.
2. **Forces execution over planning** by making “focus” a scarce, explicit choice.
3. **Provides clear daily priorities** via the Daily Focus view and suggestions.
4. **Converts activity into insight** via mandatory daily and weekly reviews.
5. **Serves as a foundation** for future vertical SaaS (e.g. templates for Clinic, NGO, SME) and optional AI/API extensions.

---

## 3. Stakeholders & Personas

### 3.1 Stakeholders

| Stakeholder | Role | Primary need |
|-------------|------|----------------|
| **End user** | Consultant, manager, founder, doctor, SME operator | Less overwhelm; clear daily focus; accountability and learning |
| **Product owner** | Tsatsu (per spec) | Delivered MVP that validates Daily Focus Engine and review loop |
| **Development team** | Build/implementation | Clear spec, build order, and acceptance criteria |
| **Future customers** | Vertical segments (clinic, NGO, SME) | Platform-ready base + templates |

### 3.2 User Personas (Summary)

- **Primary:** High mental load; multiple responsibilities; needs clarity and limits.
- **Behavior:** Prefers minimal UI, low cognitive load, clear constraints.
- **Context:** Single timezone (MVP); web-only; one device for focus timer (MVP).

---

## 4. Goals & Non-Goals

### 4.1 Business Goals

- Reduce cognitive overload for target users.
- Force execution over planning via hard limits.
- Provide clear daily priorities (max 3 focus tasks).
- Convert activity into insight via reviews.
- Establish a foundation for future vertical SaaS products.

### 4.2 Non-Goals (MVP)

- No AI dependency.
- No mobile app.
- No collaboration / multi-user teams.
- No advanced forecasting or automation.

---

## 5. Current State vs Desired State

### 5.1 Current State (Without PCC)

- Tasks and projects live in ad hoc tools or mental lists.
- No enforced limit on “what counts as today.”
- No mandatory link between “what I did” and “what I learned.”
- No single place that combines: structure (domains/projects/tasks), execution (focus + timer), and reflection (reviews).

### 5.2 Desired State (With PCC MVP)

- **Structure:** Life organized as Domains → Projects → Tasks, with at least one domain, one project, and three tasks after onboarding.
- **Execution:** User selects max 3 focus tasks per day; system rejects more; completing or postponing frees a slot. Focus sessions (timer) log actual work.
- **Reflection:** Daily review required if user had any focus session; weekly review on a 7-day cadence. Dashboard blocks until review is done when required.
- **Visibility:** Dashboard shows today’s focus, active projects, overdue tasks, review reminders; analytics show completion rate, focus time, overdue count, domain balance.

### 5.3 Gap (What PCC Must Deliver)

- Mandatory onboarding and sensible defaults so every user has structure from day one.
- Daily Focus Engine with server-side enforcement (max 3 focus tasks, slot release on complete/postpone).
- Focus Mode and FocusSession logging (start/stop, duration).
- Daily and weekly review flows with blocking behavior when required.
- Analytics (completion rate, focus time, overdue, domain balance) for selected range.

---

## 6. Functional Needs (Mapped to Requirements)

Business needs are satisfied by the following functional areas (traceable to FR in the Full Requirements document).

| Business need | Functional area | Key FR |
|---------------|-----------------|--------|
| Secure, simple access | Auth & user management | FR-1, FR-2, FR-3 |
| Every user has structure | Mandatory onboarding | FR-4–FR-9 |
| Life areas and ownership | Domain management | FR-10, FR-11 |
| Structured goals and deadlines | Project management | FR-12–FR-15 |
| Execution units with effort/energy | Task management | FR-16–FR-19 |
| **Enforced daily focus** | **Daily Focus Engine** | **FR-20–FR-24** |
| Reality capture (actual work) | Focus mode & sessions | FR-25–FR-27 |
| Learning loop | Review system | FR-28–FR-31 |
| Insight and balance | Analytics | FR-32–FR-35 |

**Critical business rule:** The Daily Focus Engine (FR-20–FR-24) must be implemented and enforced on the server; the MVP’s value depends on it.

---

## 7. Non-Functional Needs (Mapped to NFR)

| Need | Requirement | Rationale |
|------|-------------|-----------|
| Responsive product | NFR-1 (dashboard &lt; 2s, fast 3G, ~50 tasks) | Usability and trust |
| No lost work | NFR-2 (focus sessions persisted; recoverable after refresh) | User trust in timer and data |
| Safe and compliant | NFR-3 (hashing, auth, session timeout, rate limit, HTTPS) | Security and compliance |
| Future growth | NFR-4 (support AI and vertical extensions) | Platform strategy |
| Usable and accessible | NFR-5 (minimal UI, low cognitive load, WCAG 2.1 Level A for core flows) | Inclusivity and adoption |

---

## 8. Success Criteria & Acceptance

Success is measured by the following acceptance criteria (from spec):

| ID | Criterion | Maps to |
|----|-----------|--------|
| AC-1 | User cannot assign more than 3 focus tasks in a single day | FR-20, FR-22 |
| AC-2 | Focus session is created when timer starts and closed when stopped | FR-25, FR-26 |
| AC-3 | User is blocked from dashboard until onboarding is completed | FR-4 |
| AC-4 | Daily review prompt appears if focus session exists (and can block until done) | FR-28, FR-29 |
| AC-5 | Weekly review summarizes overdue tasks and project progress | FR-30, FR-31 |

**Definition of done (MVP):** All of the above hold; Daily Focus Engine is server-enforced; onboarding supports defaults; reviews are required when applicable and block access until completed.

---

## 9. Constraints & Assumptions

### 9.1 Constraints

- **Technical:** PostgreSQL + Prisma; Next.js App Router; TypeScript; Tailwind; shadcn/ui (per spec).
- **Scope:** MVP only; no AI, mobile, or collaboration.
- **Enforcement:** All critical rules (e.g. 3-task limit, slot release) must be enforced server-side.

### 9.2 Assumptions

- Single timezone per user (MVP).
- Web-only; no offline support.
- One device per user for focus timer (no cross-device in-progress session in MVP).
- Users accept mandatory onboarding and mandatory reviews when triggered.
- Session-based auth (cookies) sufficient for MVP; JWT reserved for future API/mobile.

---

## 10. Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Users resist “mandatory” reviews | Clear UX: explain why, keep review forms short; block only when required |
| 3-task limit feels too strict | Position as feature (reduces overload); allow same-day re-assignment after postpone |
| Scope creep (AI, mobile, collaboration) | Strict MVP non-goals; Phase 2+ documented separately |
| Focus session loss on refresh/crash | NFR-2: persist on start/stop; implement recovery/resume or one-click save |

**Dependencies:** Auth and DB schema in place before onboarding and Daily Focus Engine; Daily Focus Engine before focus sessions and reviews; reviews and sessions before analytics.

---

## 11. Traceability to Specs

- **Full requirements and build order:** `PCC_Full_Requirements_and_Build_Order.txt` (FR, NFR, AC, build order).
- **MVP build spec:** `PCC_Cursor_Build_Spec.txt` (data model, API contract, UI screens, tech stack, practical build order).

This Business Needs Analysis should be read alongside those documents for implementation and prioritization decisions.

---

## 12. System vs Business Needs — Implementation Assessment

**Question:** Does the system created meet the complete business needs?

**Short answer:** The system meets **most** business needs. A few requirements are only partially met or not yet implemented. The table below summarizes alignment and gaps.

### 12.1 Summary

| Area | Status | Notes |
|------|--------|--------|
| Auth & user management (FR-1–FR-3) | Met | Register, login, logout, profile; bcrypt, rate limit, protected routes. |
| Mandatory onboarding (FR-4–FR-9) | Met | Dashboard redirects until onboarding complete; domains/project/3 tasks + auto-defaults. |
| Domain management (FR-10–FR-11) | Met | CRUD; delete blocked until no projects (user reassigns via project edit). |
| Project management (FR-12–FR-15) | Met | CRUD, status active/paused/completed; paused blocks focus (FR-14). |
| Task management (FR-16–FR-19) | Met | CRUD, effort/energy, status transitions, visibility in project/domain/daily pool. |
| **Daily Focus Engine (FR-20–FR-24)** | Met | 3-task limit enforced server-side; slot release on done/postpone; “Today” "today" uses user timezone (FR-24). |
| Focus mode & sessions (FR-25–FR-27) | Met | Timer start/stop, FocusSession created/closed, duration; pause/resume; session recovery (NFR-2). |
| **Review system (FR-28–FR-31)** | Met | Daily/weekly review content and submission; “block access until review submitted” **dashboard blocked** until required daily/weekly review submitted (ReviewGate). |
| Analytics (FR-32–FR-35) | Met | Completion rate, focus time, overdue count, domain balance; filters (range, domain, project). |
| NFR-1 (performance) | Not verified | No automated 2s / fast 3G check in repo. |
| NFR-2 (session recovery) | Met | Persist on start/stop; resume endpoint for orphaned session. |
| NFR-3 (security) | Met | Hashing, auth, rate limit; session maxAge 30 days (spec 7 days — consider aligning). |
| NFR-4 / NFR-5 | Design-time | Architecture and WCAG not re-verified here. |

### 12.2 Gaps (to meet complete business needs)

1. **FR-24 — Focus date in user timezone**  
   - **Requirement:** “Each focus task is associated with a focus_date (user's current date in their timezone; store in UTC with user timezone or date-only in user TZ).”  
   - **Current:** `User.timezone` exists and `lib/timezone.ts` provides `getTodayInUserTimezone()`, but focus limit and “today” in `/api/focus/today`, `/api/review/status`, `/api/review/daily/*` use **server** date.  
   - **Change:** Use user timezone when computing “today” in `lib/rules/focus-limit.ts`, `app/api/focus/today/route.ts`, and review APIs (pass user timezone from DB).

2. **FR-28 / FR-30 — Block dashboard until review submitted (MVP option)**  
   - **Requirement:** “If skipped: persistent banner/block on dashboard until completed (MVP: **block access to main dashboard** until review is submitted).”  
   - **Current:** `ReviewBanner` prompts for daily/weekly (and monthly) review but is dismissible (“Remind later”); dashboard layout does **not** redirect when a review is due.  
   - **Change:** In dashboard layout (or middleware), when `dailyRequired` or `weeklyRequired` is true, redirect to the corresponding review page and disallow access to other dashboard routes until the review is submitted (or explicitly “skip” if product decision allows).

3. **Optional — NFR-1 and session timeout**  
   - Add a performance budget or test for dashboard load &lt; 2s (fast 3G, ~50 tasks) if needed for compliance.  
   - Confirm session timeout (e.g. 7 days inactivity per spec) vs current NextAuth `maxAge` and align if required.

### 12.3 Conclusion

- **Core business need (Daily Focus Engine + execution + structure)** is met: 3-task limit is enforced, slots release correctly, focus sessions and reviews exist.  
- **Complete business needs** are met **after** addressing: (1) user timezone for “today” (FR-24), and (2) optional but spec-called MVP behavior: block dashboard access until required daily/weekly review is submitted (FR-28/FR-30).

Implementing the two gaps above will bring the system in line with the full set of business needs described in this document and in the PCC requirements.

---

*End of Business Needs Analysis*
