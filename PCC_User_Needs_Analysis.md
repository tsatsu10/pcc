# Personal Command Center (PCC) — User Needs Analysis

**Version:** 1.0  
**Date:** 2026-02-10  
**Companion to:** PCC_Business_Needs_Analysis.md, PCC_Full_Requirements_and_Build_Order.txt  

---

## 1. Purpose of This Document

This **User Needs Analysis** describes what **end users** need from PCC: their goals, tasks, pain points, and expectations. It is written from the user’s perspective and supports product, design, and validation decisions. It complements the Business Needs Analysis (business and product goals) and the Full Requirements (functional and non-functional specs).

---

## 2. User Personas

### 2.1 Primary Personas (Target Users)

PCC’s primary users are people who operate across many responsibilities and need a single system to structure work and life, commit to a few things each day, and learn from what they do.

| Persona | Role examples | Typical context | Primary user need |
|--------|----------------|------------------|-------------------|
| **Consultant** | Strategy, operations, advisory | Multiple clients, deliverables, travel | One place to see “what matters today” and track actual time per commitment |
| **Manager** | Team lead, department head | Meetings, reports, people, projects | Clear daily priorities and a way to reflect on what got done vs planned |
| **Founder** | Startup / SME owner | Strategy, sales, product, ops | Enforced focus (max 3) so the day isn’t consumed by reactive work |
| **Doctor / Researcher** | Clinician, academic, R&D | Patients, papers, grants, teaching | Structure across domains (e.g. clinical vs research) and accountability via reviews |
| **SME operator** | Small business owner, Africa-first | Operations, finance, growth, family | Simple system that works without many tools; clarity over extra features |

### 2.2 User Characteristics (Cross-Persona)

- **High mental load** — Many competing demands; easy to feel overwhelmed.
- **Multiple concurrent responsibilities** — Work, personal, learning, side projects; no single “job” to optimize for.
- **Preference for clarity over features** — Values a small set of clear rules and views more than many options.
- **Time-constrained and execution-focused** — Wants to spend time doing, not organizing or learning a complex tool.
- **Single primary device for focus (MVP)** — Uses one browser/device for the focus timer; no expectation of mobile or multi-device sync in MVP.

These characteristics drive the need for **constraints** (e.g. max 3 focus tasks) and **mandatory reflection** (reviews), not just optional tips.

---

## 3. User Goals (Jobs to Be Done)

What users are trying to accomplish when they use PCC:

| User goal | Description | How PCC supports it |
|-----------|-------------|----------------------|
| **Know what “today” means** | Answer “What should I do today?” without re-sorting a long list every morning. | Daily Focus view with max 3 tasks; suggested tasks from backlog; “Focus slots (X of 3)” so the limit is visible. |
| **Commit and do, not just plan** | Move from planning to actually doing, with a clear commitment for the day. | Picking focus tasks is an explicit commitment; focus timer records real work; completing or postponing frees a slot so the user can adjust. |
| **Reduce overwhelm** | Feel less scattered and more in control despite many responsibilities. | Hard cap of 3 focus tasks; everything else stays in backlog; domains/projects give structure without forcing a single list. |
| **See what actually happened** | Know how much time went where and what got done. | Focus sessions (start/stop, duration); “Mark done” / “Postpone”; daily and weekly reviews that surface completed and missed focus tasks. |
| **Learn from the week** | Avoid repeating the same bottlenecks and misalignments. | Weekly review (project progress, overdue tasks, bottlenecks, priority notes); daily review (reasons for missed/completed) so patterns become visible. |
| **Keep life areas in balance** | Ensure one area (e.g. work) doesn’t crowd out others. | Domains (e.g. Work, Personal, Learning); analytics showing tasks completed per domain; projects tied to domains. |

---

## 4. User Tasks and Workflows

### 4.1 First-Time Experience (Onboarding)

| User task | User need | PCC response |
|-----------|-----------|---------------|
| Get started without friction | To see value quickly and not get stuck on setup. | Mandatory onboarding with defaults: if the user skips domains/project/tasks, system creates defaults (e.g. Work, Personal, Learning; Getting Started; 3 starter tasks). |
| Define “life areas” | To group work and life in a way that makes sense. | At least one domain required; optional objective/KPIs; can add more later. |
| Set direction | To align the system with what matters. | Top 3 goals captured as free text (stored for context; used in reviews/planning). |
| Have something to focus on | To hit the ground running on day one. | At least one project and three tasks required (or created by defaults). |

**User need satisfied:** “I have a structure and a first set of tasks without spending an hour configuring.”

### 4.2 Daily Execution (Core Loop)

| User task | User need | PCC response |
|-----------|-----------|---------------|
| See today’s focus | To know the 1–3 things that “count” today. | Daily Focus page: list of focus tasks, “Focus slots (X of 3)”, date in user’s timezone. |
| Add a task to focus | To promote something from the backlog to today. | “Add to focus” on suggested backlog tasks; system blocks a 4th focus task and explains (complete or postpone one first). |
| Start working on a task | To commit time and track it. | “Start focus session” → timer runs; pause/resume; “End session” saves duration. Session survives refresh (recovery). |
| Finish or defer a task | To free a slot and record outcome. | “Mark done” or “Postpone (back to backlog)”; slot frees immediately; same-day re-add allowed. |
| Know progress vs plan | To see if they’re on track without mental math. | Timer shows elapsed / plan (e.g. “6:12 / 45 min”); progress bar; “Past your planned time” when over. |

**User need satisfied:** “I know what I’m doing today, I record real time on it, and I can complete or postpone without guilt—the system enforces the limit so I don’t over-commit.”

### 4.3 Reflection (Reviews)

| User task | User need | PCC response |
|-----------|-----------|---------------|
| Close the day | To reflect on what got done and what didn’t, and why. | Daily review required when there was at least one focus session; shows completed and missed focus tasks; user adds reasons/comments. |
| Close the week | To see project progress, overdue items, and bottlenecks. | Weekly review (required on cadence); project progress, overdue tasks, bottlenecks, priority adjustment; can update project priorities. |
| Not lose access by accident | To be reminded to review without feeling blocked arbitrarily. | Dashboard blocks access until required daily/weekly review is submitted; clear redirect to the right review page. |

**User need satisfied:** “I’m prompted to reflect when it matters, and I can’t skip it and forget—so I build a habit of learning from what I did.”

### 4.4 Structure and Visibility (Ongoing)

| User task | User need | PCC response |
|-----------|-----------|---------------|
| Organize by life area and goal | To keep work, personal, and learning (etc.) visible and balanced. | Domains (CRUD); projects under domains; tasks under projects; tasks visible in project, domain, and daily pool. |
| See what’s late or at risk | To avoid dropping important items. | Overdue tasks on dashboard and in analytics; weekly review surfaces overdue; project status (active/paused/completed). |
| See how time was spent | To understand where effort went. | Analytics: focus time (from sessions), completion rate, overdue count, domain balance; filters by range, domain, project. |

**User need satisfied:** “I have one place for structure and progress, and I can see if I’m over-investing in one domain or letting things slip.”

---

## 5. User Pain Points (Without PCC)

What users struggle with when they *don’t* have a system like PCC:

| Pain point | Impact on the user | How PCC addresses it |
|------------|--------------------|------------------------|
| **Endless to-do lists** | Feels overwhelming; hard to choose what to do; tendency to do easy or reactive items. | Max 3 focus tasks; backlog is separate; “today” is a small, explicit set. |
| **Planning without doing** | Lots of lists and plans; little sense of completion or progress. | Focus = commitment; timer and “Mark done” create a clear record of execution. |
| **No clear “today”** | Day is reactive; at EOD, hard to say what was actually prioritized. | Daily Focus is the single definition of “today”; reviews force a look at completed vs missed. |
| **No reflection habit** | Same bottlenecks and slips repeat; no structured learning. | Mandatory daily (if focus session) and weekly reviews; content tailored (completed/missed, bottlenecks, priorities). |
| **Tools scattered** | Tasks in one app, timer in another, notes elsewhere; no single picture. | One app: structure (domains/projects/tasks), execution (focus + timer), and reflection (reviews). |
| **Guilt from over-commitment** | User blames themselves for taking on too much. | System enforces the limit; “postpone” is a normal, supported outcome that frees a slot. |

---

## 6. User Needs (Summary)

### 6.1 Functional Needs

- **Authentication and profile** — Secure sign-up and login; basic profile (name, timezone) so “today” and data are correct.
- **Onboarding with sensible defaults** — Quick setup with the option to skip steps and get defaults so they can start focusing soon.
- **Daily focus with a hard limit** — See and manage up to 3 focus tasks per day; add only when a slot is free; see “Focus slots (X of 3).”
- **Focus timer** — Start/stop/pause sessions; see elapsed vs plan; know that progress is saved (e.g. “Saved” chip, recovery after refresh).
- **Completion and deferral** — Mark done or postpone with one action; slot frees immediately; optional same-day re-add.
- **Daily and weekly reviews** — Prompted when required; simple forms (completed/missed + reasons; projects, overdue, bottlenecks, priorities); blocked from rest of dashboard until submitted.
- **Structure** — Domains, projects, tasks; tasks visible in project, domain, and daily backlog; project status (active/paused/completed) so paused work doesn’t clutter focus.
- **Visibility** — Dashboard with today’s focus, active projects, overdue tasks, review reminders; analytics (focus time, completion rate, overdue, domain balance).

### 6.2 Emotional and Experiential Needs

- **Clarity** — “What matters today?” is answerable in one place; no need to re-prioritize from a long list every morning.
- **Permission to focus** — The system’s limit (3 tasks) gives permission to say “no” to the rest for today.
- **Reduced guilt** — Postpone is normal and built-in; the system, not the user, enforces the cap.
- **Trust** — Session data and progress are saved and recoverable; “Saved” and recovery flow support this.
- **Low cognitive load** — Minimal UI, clear rules, consistent patterns (e.g. focus actions same style, “Project:” and “Backlog” pill).
- **Accountability** — Reviews are required when applicable; blocking until review is submitted supports building the habit.

---

## 7. Success from the User’s Perspective

Users will consider PCC successful when:

1. **They can answer “What am I doing today?” in under a minute** — Daily Focus view and “Focus slots (X of 3)” make this possible.
2. **They complete or consciously postpone their focus tasks** — Mark done and Postpone are first-class; slot release is immediate.
3. **They see real time recorded** — Focus sessions with start/stop and duration; analytics show focus time and completion.
4. **They build a review habit** — Daily and weekly reviews are required and straightforward; they notice patterns (e.g. repeated bottlenecks).
5. **They feel less overwhelmed** — The 3-task limit and clear backlog reduce the feeling of an infinite list.
6. **They don’t lose work** — Timer and session state persist and can be recovered after refresh or crash.

---

## 8. Out of Scope (MVP) — User Expectations to Set

So that user needs stay aligned with the product:

- **No mobile app** — Use the web on a phone if needed; no native app or sync of in-progress session across devices.
- **No AI** — Suggestions are rule-based (e.g. due date, priority, effort); no AI task breakdown or insights yet.
- **No collaboration** — Single user only; no sharing or team features.
- **One timezone** — Profile timezone used for “today” and focus date; no multi-timezone scheduling.

Setting these expectations helps users judge PCC against what it is designed to do (personal, enforced focus and reflection) rather than features that are explicitly out of scope.

---

## 9. Traceability

- **Business goals and product scope:** PCC_Business_Needs_Analysis.md  
- **Functional and non-functional requirements:** PCC_Full_Requirements_and_Build_Order.txt  
- **Build spec, data model, API, UI:** PCC_Cursor_Build_Spec.txt  

This User Needs Analysis should be used alongside those documents to ensure that design, copy, and prioritization stay user-centered while remaining within the agreed scope and requirements.

---

*End of User Needs Analysis*
