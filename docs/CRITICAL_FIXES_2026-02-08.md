# Critical Fixes Implementation
**Date**: 2026-02-08  
**Reference**: PCC_Full_Requirements_and_Build_Order.txt

## Summary
Implemented 4 critical requirement gaps identified in codebase analysis.

---

## ✅ #1: FR-14 Paused Project Enforcement

**Issue**: Tasks from paused/completed projects could be moved to focus, violating FR-14.

**Spec Requirement (FR-14)**:
> Tasks under Paused projects remain in backlog but cannot be moved to focus until project is Active again.

**Implementation**:

### Files Modified:
1. **`app/api/tasks/[id]/route.ts`** (lines 40-48)
   - Added project status check before allowing focus assignment
   - Blocks focus if `project.status !== "active"`
   - Error: "Tasks from paused or completed projects cannot be moved to focus."

2. **`app/api/focus/today/route.ts`** (line 28)
   - Changed backlog query filter from `status: { not: "dropped" }` to `status: "active"`
   - Only active project tasks appear in assignable backlog

**Test**:
1. Create project, set status to "paused"
2. Try to move task from that project to focus
3. Should fail with clear error message

---

## ✅ #2: NFR-2 Focus Session Recovery

**Issue**: In-progress sessions could be lost/orphaned after refresh/crash. No recovery UI.

**Spec Requirement (NFR-2)**:
> Focus sessions must not be lost on refresh/crash. Persist session on start/stop; in-progress session state recoverable after refresh (resume or one-click save).

**Implementation**:

### Files Created:
1. **`app/api/focus/sessions/[id]/resume/route.ts`** (new)
   - `PATCH` endpoint to end orphaned session
   - Calculates duration from `startTime` to now
   - Sets `endTime` and `durationMinutes`

### Files Modified:
2. **`app/dashboard/focus/page.tsx`**
   - Added `orphanedSession` state to track session not in today's focus
   - Added detection in `load()`: if `activeSession.taskId` not in focus list, mark as orphaned
   - Added `resumeOrphanedSession()` function to call resume endpoint
   - Added recovery banner UI:
     - Shows: "You have an in-progress session for '{task}'. Resume or save it."
     - Actions: "End & save session" | "Dismiss"

**Test**:
1. Start focus session on a task
2. Postpone or complete the task (removes from focus, but session still open)
3. Refresh page
4. Should see recovery banner; click "End & save session"
5. Session saved with correct duration

---

## ✅ #3: FR-9 Partial Onboarding Defaults

**Issue**: Onboarding created all-or-nothing defaults. Spec requires partial filling.

**Spec Requirement (FR-9)**:
> If user provides no input, system creates [full defaults]. Partial input: fill only what is missing (e.g. user adds 1 domain → add remaining default domains; user adds 2 tasks → add one default task to reach 3).

**Implementation**:

### Files Modified:
1. **`app/api/onboarding/defaults/route.ts`** (complete rewrite)
   - Added `partialDomains` and `partialTasks` flags in request body
   - Counts existing user data (`existingDomainCount`, `existingTaskCount`)
   - Creates only needed items to reach minimum (3 domains, 3 tasks)
   - Returns counts: `{ domains: created, tasks: created, project: created }`

2. **`app/onboarding/page.tsx`**
   - `handleDomainsNext()`: 
     - If user adds 0 domains → call defaults with `partialDomains: false` (full)
     - If user adds 1-2 domains → call defaults with `partialDomains: true` (partial fill)
   - `handleTasksNext()`:
     - Same logic for tasks: 0 → full defaults, 1-2 → partial fill to reach 3

**Test**:
1. Onboarding: add 1 domain "Work"
2. Continue → system adds "Personal" and "Learning" automatically
3. Add 2 tasks "Task A", "Task B"
4. Continue → system adds 1 default task to reach 3

---

## ✅ #4: FR-11 Domain Delete Validation

**Status**: Already implemented ✅

**Location**: `app/api/domains/[id]/route.ts` (lines 85-89)

**Implementation**:
```typescript
if (domain._count.projects > 0)
  return NextResponse.json(
    { error: "Domain has projects. Move or delete them first." },
    { status: 400 }
  );
```

No changes needed.

---

## Verification Checklist

### #1: FR-14 Enforcement
- [ ] Create project in domain
- [ ] Add task to project
- [ ] Change project status to "paused"
- [ ] Try to assign task to focus → should fail
- [ ] Change project back to "active"
- [ ] Try again → should succeed

### #2: NFR-2 Session Recovery
- [ ] Start focus session on task
- [ ] Complete or postpone the task
- [ ] Refresh page
- [ ] Recovery banner appears
- [ ] Click "End & save session"
- [ ] Session saved with correct duration
- [ ] Check analytics → time recorded

### #3: FR-9 Partial Defaults
- [ ] New user registration
- [ ] Onboarding: add 1 domain
- [ ] Verify 3 domains created total
- [ ] Add 2 tasks
- [ ] Verify 3 tasks created total
- [ ] Complete onboarding → dashboard works

### #4: FR-11 Domain Delete
- [ ] Create domain with project
- [ ] Try to delete domain → fails with project count message
- [ ] Delete or reassign project
- [ ] Delete domain → succeeds

---

## Next Priorities (from analysis)

**High Priority**:
- #5: Add tests for Daily Focus Engine (AC-1)
- #6: FR-16 flexible effort field (hours OR T-shirt)
- #7: FR-28 hard block on review skip
- #8: Analytics filters (domain/project/date)

**Medium Priority**:
- #9-14: NFR improvements (accessibility, rate limiting, performance, timezone, error boundaries)

---

## References
- **Spec**: `PCC_Full_Requirements_and_Build_Order.txt`
- **Build Spec**: `PCC_Cursor_Build_Spec.txt`
- **Analysis**: See suggestions in chat history (2026-02-08)
