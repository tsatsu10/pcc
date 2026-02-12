# Personal Command Center (PCC) — Use Case Analysis

**Version:** 1.0  
**Date:** 2026-02-10  
**Aligns with:** PCC_Full_Requirements_and_Build_Order.txt, PCC_Cursor_Build_Spec.txt, PCC_User_Needs_Analysis.md  

---

## 1. Introduction

This document describes **use cases** for the PCC MVP: actors, goals, flows, and exceptions. Use cases are grouped by functional area and traced to functional requirements (FR) where applicable.

---

## 2. Actors

| Actor | Type | Description |
|-------|------|-------------|
| **User** | Primary | A registered person who uses PCC. Performs all use cases. Authenticated via email/password; must complete onboarding before accessing the dashboard. |
| **System** | Secondary | PCC application. Enforces business rules (e.g. max 3 focus tasks), applies defaults during onboarding, triggers review prompts and dashboard blocking. |

---

## 3. Use Case Diagram (Summary)

```
                    +------------------+
                    |       User       |
                    +--------+---------+
                             |
    +------------------------+------------------------+
    |            |            |            |           |
    v            v            v            v           v
[Auth]    [Onboarding]  [Structure]  [Daily Focus]  [Reviews]
    |            |            |            |           |
    |            |            |            |           +-- Submit Daily Review
    |            |            |            |           +-- Submit Weekly Review
    |            |            |            |
    |            |            |            +-- View Daily Focus
    |            |            |            +-- Add Task to Focus
    |            |            |            +-- Mark Task Done / Postpone
    |            |            |            +-- Start/Pause/Resume/End Focus Session
    |            |            |
    |            |            +-- Domains: Create, Edit, Delete, View
    |            |            +-- Projects: Create, Edit, View, Set Status
    |            |            +-- Tasks: Create, Edit, Delete, View
    |            |
    |            +-- Complete Onboarding (domains, goals, project, tasks; defaults)
    |
    +-- Register | Login | Logout | View/Edit Profile

                    [Analytics]
                         +-- View Analytics
```

---

## 4. Use Cases by Area

### 4.1 Authentication & Profile

---

#### UC-A1: Register

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Create an account to use PCC. |
| **FR** | FR-1 |

**Preconditions**

- User is not logged in.
- Email is not already registered.

**Main flow**

1. User opens the registration page.
2. User enters email and password (and optionally name).
3. User submits the form.
4. System validates input (email format, password strength, unique email).
5. System creates the user account (password stored hashed).
6. System logs the user in and redirects to onboarding or dashboard per FR-4.

**Alternative flows**

- **3a. User skips name:** System stores null for name; registration continues.
- **5a. New user:** System redirects to onboarding (no dashboard access until onboarding complete).

**Exception flows**

- **E1.** Email already registered → System returns error; user must use another email or log in.
- **E2.** Validation failure → System returns field errors; user corrects and resubmits.
- **E3.** Rate limit exceeded (e.g. too many attempts) → System blocks for a period; user retries later.

**Postconditions**

- User account exists; user is authenticated.
- If first time: user is on onboarding; dashboard is not accessible until onboarding is complete.

---

#### UC-A2: Login

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Access PCC with existing credentials. |
| **FR** | FR-2 |

**Preconditions**

- User has a registered account.

**Main flow**

1. User opens the login page.
2. User enters email and password.
3. User submits.
4. System validates credentials (bcrypt compare).
5. System creates session (cookie-based in MVP).
6. System redirects to dashboard if onboarding is complete; otherwise redirects to onboarding.

**Exception flows**

- **E1.** Invalid email or password → System returns generic error (no “email exists” disclosure).
- **E2.** Rate limit exceeded → System blocks login for a period (NFR-3).

**Postconditions**

- User is authenticated; session is active.

---

#### UC-A3: Logout

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | End the current session. |
| **FR** | FR-2 |

**Main flow**

1. User triggers logout (e.g. menu or dedicated control).
2. System invalidates the session.
3. User is redirected to landing or login.

**Postconditions**

- User is not authenticated; session is cleared.

---

#### UC-A4: View or Edit Profile

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | See or update name and timezone (and other profile data if supported). |
| **FR** | FR-3 |

**Preconditions**

- User is logged in.

**Main flow**

1. User opens the profile page.
2. System displays current profile (e.g. name, timezone).
3. (Edit) User changes fields and saves.
4. System validates and persists changes; timezone is used for “today” (FR-24).

**Postconditions**

- Profile data is updated; subsequent “today” and focus date use new timezone if changed.

---

### 4.2 Onboarding

---

#### UC-B1: Complete Onboarding

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Set up initial structure (domains, goals, project, tasks) so they can use the dashboard. |
| **FR** | FR-4–FR-9 |

**Preconditions**

- User is logged in.
- User has not completed onboarding (onboardingCompletedAt is null).

**Main flow**

1. User is redirected to the onboarding wizard (dashboard access blocked).
2. **Step 1 — Domains:** User defines one or more domains (name, optional objective/KPIs), or skips.
   - If skip: system creates default domains (Work, Personal, Learning) per FR-9.
   - If partial (e.g. 1 domain): system fills up to 3 default domains as needed.
3. **Step 2 — Goals:** User optionally enters top 3 goals (free text); can skip.
4. **Step 3 — First project:** User creates at least one project (name, domain, optional goal/deadline/priority), or skips.
   - If skip: system creates default project “Getting Started” in first domain.
5. **Step 4 — First tasks:** User creates at least 3 tasks (or skips).
   - If skip: system creates 3 default tasks under the first project (e.g. Review dashboard, Complete first focus task, Do first weekly review).
   - If partial (e.g. 2 tasks): system adds enough default tasks to reach 3.
6. User completes the wizard (e.g. “Finish” or equivalent).
7. System sets onboardingCompletedAt and (if provided) stores goals.
8. System redirects to the dashboard.

**Alternative flows**

- **2a–5a.** User provides partial input at any step → System fills only what is missing (FR-9).

**Exception flows**

- **E1.** User tries to access dashboard before completing onboarding → System redirects to onboarding.

**Postconditions**

- User has at least one domain, one project, and three tasks (user-created or defaults).
- Onboarding is marked complete; user can access the dashboard.

---

### 4.3 Domain Management

---

#### UC-C1: Create Domain

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Add a life area (domain) to organize projects. |
| **FR** | FR-10 |

**Preconditions**

- User is logged in and has completed onboarding.

**Main flow**

1. User opens Domains (list or dashboard entry).
2. User chooses “Create domain” (or equivalent).
3. User enters name and optionally objective and KPIs.
4. User saves.
5. System creates the domain and associates it with the user.
6. Domain appears in the domains list and can be selected for new projects.

**Postconditions**

- New domain exists; user can create projects under it.

---

#### UC-C2: Edit Domain

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Update a domain’s name, objective, or KPIs. |
| **FR** | FR-11 |

**Main flow**

1. User opens the domain (list or detail).
2. User edits name and/or objective and/or KPIs.
3. User saves.
4. System updates the domain.

**Postconditions**

- Domain data is updated.

---

#### UC-C3: Delete Domain

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Remove a domain. |
| **FR** | FR-11 |

**Preconditions**

- Domain has no projects (user must reassign or delete projects first).

**Main flow**

1. User opens the domain and chooses delete.
2. System checks that the domain has no projects.
3. System deletes the domain.
4. Domain no longer appears in lists.

**Exception flows**

- **E1.** Domain has one or more projects → System rejects with message: user must move or delete projects first.

**Postconditions**

- Domain is removed.

---

#### UC-C4: View Domain

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | See a domain’s details and its projects/tasks. |
| **FR** | FR-10, FR-15 |

**Main flow**

1. User opens Domains and selects a domain (or navigates from project/task).
2. System displays domain name, objective, KPIs, and list of projects (and tasks as per project view).

**Postconditions**

- User has seen the domain structure.

---

### 4.4 Project Management

---

#### UC-D1: Create Project

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Add a project under a domain. |
| **FR** | FR-12 |

**Preconditions**

- User has at least one domain.

**Main flow**

1. User opens Projects (or domain/project creation).
2. User chooses create project.
3. User enters name, domain, and optionally goal, deadline, priority.
4. User saves.
5. System creates the project (status default Active).
6. User can add tasks to the project.

**Postconditions**

- New project exists; user can add tasks and assign them to focus when active.

---

#### UC-D2: Edit Project

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Update project fields. |
| **FR** | FR-13 |

**Main flow**

1. User opens the project.
2. User edits name, goal, deadline, priority, status, or other fields.
3. User saves.
4. System updates the project.

**Postconditions**

- Project is updated. If status is set to Paused, tasks under it cannot be moved to focus until status is Active again (FR-14).

---

#### UC-D3: View Project

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | See project details, tasks, and progress. |
| **FR** | FR-15 |

**Main flow**

1. User opens the project (from list, domain, or dashboard).
2. System displays project data and list of tasks (with status, deadline, etc.); overdue tasks visible.

**Postconditions**

- User has seen project and tasks.

---

#### UC-D4: Set Project Status

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Pause, complete, or reactivate a project. |
| **FR** | FR-14 |

**Main flow**

1. User edits the project and sets status to Active, Paused, or Completed.
2. System saves the status.
3. If Paused: tasks under this project remain in backlog but cannot be moved to focus until project is Active again.
4. If Completed: project is treated as closed (tasks no longer suggested for focus in normal flow).

**Postconditions**

- Project status updated; focus eligibility of its tasks follows FR-14.

---

### 4.5 Task Management

---

#### UC-E1: Create Task

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Add a task under a project. |
| **FR** | FR-16 |

**Preconditions**

- User has at least one project (and project is in a domain).

**Main flow**

1. User opens the project (or task creation from dashboard/tasks).
2. User chooses add task.
3. User enters title and optionally deadline, effort (T-shirt or time), energy level.
4. User saves.
5. System creates the task (status Backlog by default).
6. Task appears in project view, domain view, and daily pool (backlog) per FR-18.

**Postconditions**

- Task exists in backlog; user can later add it to focus (subject to daily limit).

---

#### UC-E2: Edit Task

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Update task title, deadline, effort, energy level, or other fields. |
| **FR** | FR-19 |

**Main flow**

1. User opens the task (from project, domain, or daily focus/backlog).
2. User edits fields and saves.
3. System updates the task.

**Postconditions**

- Task is updated everywhere it is visible.

---

#### UC-E3: Delete Task

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Permanently remove a task. |
| **FR** | FR-11 (cascade), data model |

**Main flow**

1. User opens the task and chooses delete.
2. System deletes the task (and any focus sessions remain associated for analytics if applicable; task record is removed).
3. If the task was in focus, a slot is effectively freed (one fewer focus task).

**Postconditions**

- Task no longer exists; if it was in focus, focus count decreases.

---

#### UC-E4: View Tasks (Project / Domain / Daily Pool)

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | See tasks in context (project, domain, or daily focus/backlog). |
| **FR** | FR-18 |

**Main flow**

1. User opens a project, domain, or Daily Focus page.
2. System lists tasks relevant to that context (project tasks; domain’s project tasks; today’s focus + suggested backlog).
3. User sees status, deadline, project/domain as appropriate.

**Postconditions**

- User has seen tasks in the chosen context.

---

### 4.6 Daily Focus Engine

---

#### UC-F1: View Daily Focus

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | See today’s focus tasks and suggested backlog. |
| **FR** | FR-20, FR-21, FR-24 |

**Preconditions**

- User is logged in; “today” is determined by user timezone (FR-24).

**Main flow**

1. User opens the Daily Focus page.
2. System loads focus tasks for today (max 3) and backlog (suggested by due date, priority, effort).
3. System displays “Focus slots (X of 3)” and the list of focus tasks with actions (start session, mark done, postpone).
4. System displays suggested backlog with “Add to focus” (enabled only if fewer than 3 focus tasks).

**Postconditions**

- User sees what is in focus today and what can be added (when slots are free).

---

#### UC-F2: Add Task to Focus

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Move a backlog task into today’s focus. |
| **FR** | FR-21, FR-22, FR-24 |

**Preconditions**

- User has fewer than 3 focus tasks for today.
- Task is in backlog (or postponed); task’s project is Active (FR-14).

**Main flow**

1. User is on Daily Focus (or equivalent) and chooses “Add to focus” for a task.
2. System checks: focus count for today < 3; task’s project is Active.
3. System sets task status to Focus and sets focus_date to today (user timezone).
4. Task appears in the focus list; “Focus slots” count increases.

**Exception flows**

- **E1.** User already has 3 focus tasks → System rejects with message: complete or postpone one to free a slot (FR-22).
- **E2.** Task’s project is Paused or Completed → System rejects: tasks from paused/completed projects cannot be moved to focus (FR-14).

**Postconditions**

- Task is in focus for today; one more slot is used (or same slot reused if user had just postponed this task same day per FR-23).

---

#### UC-F3: Mark Task Done

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Record a focus task as completed. |
| **FR** | FR-17, FR-23 |

**Preconditions**

- Task is in focus for today.

**Main flow**

1. User chooses “Mark done” for a focus task.
2. System sets task status to Done and clears focus_date (and focus_goal_minutes if stored).
3. A focus slot is freed immediately (FR-23).
4. Task appears in completed lists (e.g. daily review, analytics).

**Postconditions**

- Task is done; one focus slot is free; user can add another task to focus the same day.

---

#### UC-F4: Postpone Task

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Move a focus task back to backlog without completing it. |
| **FR** | FR-17, FR-23 |

**Preconditions**

- Task is in focus for today.

**Main flow**

1. User chooses “Postpone (back to backlog)” for a focus task.
2. System sets task status to Postponed and clears focus_date.
3. A focus slot is freed immediately (FR-23).
4. Task appears in backlog again; user can re-add it to focus the same day (reuses the freed slot).

**Postconditions**

- Task is in backlog; one focus slot is free.

---

### 4.7 Focus Sessions (Timer)

---

#### UC-G1: Start Focus Session

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Begin timing work on a focus task. |
| **FR** | FR-25, FR-26 |

**Preconditions**

- Task is in focus for today.
- No other focus session is currently active (one session at a time in MVP).

**Main flow**

1. User chooses “Start focus session” for a focus task.
2. System creates a FocusSession (task_id, start_time); no end_time yet.
3. Timer is shown (elapsed time); user can pause or end session.
4. Session is persisted so refresh does not lose it (NFR-2).

**Exception flows**

- **E1.** Another session is already active → System rejects: stop the other session first.

**Postconditions**

- FocusSession exists with start_time; timer is running until paused or ended.

---

#### UC-G2: Pause Focus Session

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Pause the timer without ending the session. |
| **FR** | FR-26 (session continues; duration computed on end) |

**Preconditions**

- A focus session is active (running).

**Main flow**

1. User chooses “Pause.”
2. System sets pausedAt (and may accumulate totalPausedMs on resume).
3. Elapsed time stops increasing until resume.
4. Session remains open (no end_time).

**Postconditions**

- Session is paused; user can resume or end later.

---

#### UC-G3: Resume Focus Session

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Continue a paused session. |
| **FR** | FR-26 |

**Preconditions**

- A focus session is paused.

**Main flow**

1. User chooses “Resume.”
2. System clears pausedAt and updates totalPausedMs for the pause period.
3. Timer runs again; duration on end will exclude paused time.

**Postconditions**

- Session is running again.

---

#### UC-G4: End Focus Session

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Stop the timer and save the session duration. |
| **FR** | FR-26 |

**Preconditions**

- A focus session is active (running or paused).

**Main flow**

1. User chooses “End session” (or “End & save session” in recovery flow).
2. System sets end_time and duration_minutes (elapsed minus paused time).
3. Session is closed; duration is available for analytics (FR-33).
4. User can start a new session on the same or another focus task.

**Postconditions**

- FocusSession has end_time and duration_minutes; focus time is recorded.

---

#### UC-G5: Recover Orphaned Focus Session

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Save or resume a session that was left open after refresh/crash. |
| **FR** | NFR-2 |

**Preconditions**

- User had a focus session running; page was refreshed or closed without ending the session.
- Session still exists in DB with end_time null.

**Main flow**

1. User returns to Daily Focus (or dashboard).
2. System detects an active session (end_time null) and shows recovery message (e.g. “Session recovery: you have an in-progress session for ‘Task X’. Resume or save it.”).
3. User chooses “End & save session” or “Resume.”
4. If End & save: system sets end_time and duration_minutes (same as UC-G4).
5. If Resume: timer continues (same as UC-G3 conceptually; session was “orphaned” but not paused).

**Postconditions**

- Session is either closed with duration saved or resumed; no progress is lost.

---

### 4.8 Reviews

---

#### UC-H1: Submit Daily Review

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Complete the required daily reflection when they had focus sessions today. |
| **FR** | FR-28, FR-29 |

**Preconditions**

- User had at least one focus session today (user timezone).
- Daily review for today is not already submitted.

**Main flow**

1. System has triggered daily review (banner/block); user is redirected to daily review page when trying to access dashboard.
2. User opens the daily review form.
3. System shows completed and missed focus tasks for today (and optional last “remember for tomorrow”).
4. User adds comments/reasons for completed and missed tasks (and optional general comment, mood, remember for tomorrow).
5. User submits.
6. System creates a Review record (type daily, period_start/period_end = today).
7. Dashboard block is lifted; user can access the rest of the dashboard.

**Exception flows**

- **E1.** No focus session today but user opens daily review → System may allow a minimal submit or show message that review is not required (per product rule).
- **E2.** Daily review already submitted for today → System rejects duplicate.

**Postconditions**

- Daily review is stored; user is no longer blocked from dashboard for daily review.

---

#### UC-H2: Submit Weekly Review

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | Complete the required weekly reflection (project progress, overdue, bottlenecks, priorities). |
| **FR** | FR-30, FR-31 |

**Preconditions**

- Weekly review is due (e.g. 7 days since last weekly review or since onboarding).
- User is prompted/blocked until weekly review is submitted.

**Main flow**

1. System has triggered weekly review (banner/block); user is redirected to weekly review page when trying to access dashboard.
2. User opens the weekly review form.
3. System shows project progress, overdue tasks, and optionally suggested priorities.
4. User enters bottlenecks, priority notes, and optionally adjusts project priorities.
5. User submits.
6. System creates a Review record (type weekly, period_start/period_end for the week) and updates project priorities if provided.
7. Dashboard block is lifted for weekly review.

**Exception flows**

- **E1.** Weekly review already submitted within the last 7 days → System rejects duplicate.

**Postconditions**

- Weekly review is stored; user is no longer blocked from dashboard for weekly review.

---

#### UC-H3: View Review Status

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | See whether daily or weekly review is due. |
| **FR** | FR-28, FR-30 |

**Main flow**

1. User is on dashboard or review hub.
2. System displays whether daily and/or weekly (and optionally monthly) review is required, and links to the corresponding review page.

**Postconditions**

- User knows what review(s) to do; can navigate to the correct form.

---

### 4.9 Analytics

---

#### UC-I1: View Analytics

| Attribute | Value |
|-----------|--------|
| **Actor** | User |
| **Goal** | See completion rate, focus time, overdue tasks, and domain balance over a period. |
| **FR** | FR-32–FR-35 |

**Preconditions**

- User is logged in.

**Main flow**

1. User opens Analytics.
2. User optionally selects range (e.g. 7d, 30d, 90d) and/or domain or project filter.
3. System loads and displays:
   - Completion rate (tasks completed in period)
   - Focus time (total minutes from focus sessions, session count)
   - Overdue tasks (count and list)
   - Domain balance (tasks completed per domain)
4. User reviews the data.

**Postconditions**

- User has seen their analytics for the chosen filters.

---

## 5. Use Case Relationships (Include / Extend)

| Relationship | Use cases | Note |
|--------------|-----------|------|
| **Include** | Complete Onboarding **includes** (logically) Create Domain, Create Project, Create Task | Onboarding steps may create domains/project/tasks or invoke defaults. |
| **Include** | View Daily Focus **includes** (data) View Tasks (daily pool) | Daily Focus view shows focus + backlog tasks. |
| **Extend** | Recover Orphaned Focus Session **extends** End Focus Session | Recovery is an alternative path to close a session. |
| **Precedes** | Submit Daily Review **precedes** (unblock) access to dashboard | When daily review is required, other dashboard use cases are blocked until UC-H1 is completed. Same for UC-H2 and weekly. |

---

## 6. Traceability: Use Case → FR

| Use case | FR(s) |
|----------|--------|
| UC-A1 Register | FR-1 |
| UC-A2 Login, UC-A3 Logout | FR-2 |
| UC-A4 View/Edit Profile | FR-3 |
| UC-B1 Complete Onboarding | FR-4–FR-9 |
| UC-C1–UC-C4 Domains | FR-10, FR-11 |
| UC-D1–UC-D4 Projects | FR-12–FR-15 |
| UC-E1–UC-E4 Tasks | FR-16–FR-19 |
| UC-F1–UC-F4 Daily Focus | FR-20–FR-24 |
| UC-G1–UC-G5 Focus Sessions | FR-25–FR-27, NFR-2 |
| UC-H1–UC-H3 Reviews | FR-28–FR-31 |
| UC-I1 View Analytics | FR-32–FR-35 |

---

## 7. Out of Scope (MVP)

The following are **not** use cases in the MVP and are listed only for clarity:

- Mobile app usage; multi-device sync of active session.
- AI-assisted task breakdown or weekly insights.
- Collaboration (shared projects, team reviews).
- Monthly review (may exist in UI but not required for this analysis).
- Knowledge module (notes/tags) as a first-class use case set (later phase).

---

*End of Use Case Analysis*
