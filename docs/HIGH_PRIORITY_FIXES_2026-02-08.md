# High Priority Fixes Implementation
**Date**: 2026-02-08  
**Reference**: PCC_Full_Requirements_and_Build_Order.txt (Issues #5-8)

## Summary
Implemented 4 high-priority improvements to core features.

---

## ✅ #5: Tests for Daily Focus Engine (AC-1)

**Issue**: No automated tests for the core 3-task limit requirement.

**Spec Requirement (AC-1)**:
> User cannot assign more than 3 focus tasks in a single day.

**Implementation**:

### Files Created:
1. **`vitest.config.ts`** - Vitest configuration
2. **`lib/rules/__tests__/focus-limit.test.ts`** - Test suite for Daily Focus Engine
   - Tests `MAX_FOCUS_TASKS_PER_DAY` constant (verifies it's 3)
   - Tests `canAssignFocus()` function with counts 0-5
   - Tests edge cases (negative, at limit, one less than limit)
   - Includes 11 test cases covering all scenarios

### Files Modified:
3. **`package.json`** - Added test scripts:
   - `npm test` - Run tests in watch mode
   - `npm run test:ui` - Open Vitest UI
   - `npm run test:run` - Run tests once

### Test Coverage:
- ✅ Can assign when 0, 1, 2 focus tasks
- ✅ Cannot assign when 3 or more focus tasks
- ✅ Edge cases (negative counts, exact limit)
- ✅ Sequential assignment simulation

**Installation Required**:
```bash
npm install -D vitest @vitest/ui happy-dom
```

**Run Tests**:
```bash
npm test
```

**Note**: Integration tests for `getFocusCountForUserToday` would require database setup. Consider E2E tests with Playwright for full API flow testing.

---

## ✅ #6: FR-16 Flexible Effort Field

**Issue**: Spec says effort can be "T-shirt (XS, S, M, L, XL) **OR** estimated hours (number)" but schema only supported T-shirt enum.

**Spec Requirement (FR-16)**:
> Effort: optional; scale T-shirt (XS, S, M, L, XL) or estimated hours (number).

**Implementation**:

### Files Modified:
1. **`prisma/schema.prisma`** (lines 78, 103-110)
   - Changed `effort` field from `TaskEffort` enum to `String`
   - Removed `TaskEffort` enum entirely
   - Default value: `"m"`
   - Now accepts: `"xs"`, `"s"`, `"m"`, `"l"`, `"xl"` OR `"90min"`, `"2h"`, `"1.5h"`, `"30m"`, etc.

2. **`app/api/tasks/route.ts`** (lines 10-16)
   - Added `effortSchema` with Zod validation
   - Validates T-shirt sizes: `xs`, `s`, `m`, `l`, `xl` (case-insensitive)
   - Validates time formats: `/^\d+(\.\d+)?(h|m|min|hour|hours|minutes)$/i`
   - Examples: `"90min"`, `"2h"`, `"1.5h"`, `"30m"`, `"2hours"`

3. **`app/api/tasks/[id]/route.ts`** (lines 8-16)
   - Same validation for task updates

**Migration Required**:
```bash
npm run db:push
# or
npm run db:migrate
```

**Examples**:
```typescript
// T-shirt sizes
{ effort: "xs" }  // ✅
{ effort: "m" }   // ✅
{ effort: "xl" }  // ✅

// Time estimates
{ effort: "90min" }  // ✅
{ effort: "2h" }     // ✅
{ effort: "1.5h" }   // ✅
{ effort: "30m" }    // ✅

// Invalid
{ effort: "abc" }    // ❌
{ effort: "2" }      // ❌ (needs unit)
```

---

## ✅ #7: FR-28 Hard Block on Review Skip

**Issue**: Spec says "block access to main dashboard until review is submitted" but app only showed banner.

**Spec Requirement (FR-28)**:
> If skipped: persistent banner/block on dashboard until completed (MVP: block access to main dashboard until review is submitted).

**Implementation**:

### Files Modified:
1. **`app/dashboard/page.tsx`** (lines 36-40)
   - Added check after `getDashboardData()` fetch
   - If `data.dailyRequired` → `redirect("/dashboard/review/daily")`
   - If `data.weeklyRequired` → `redirect("/dashboard/review/weekly")`
   - User cannot access dashboard until reviews are complete

**Behavior**:
- User tries to access `/dashboard`
- If daily review required → redirected to `/dashboard/review/daily`
- If weekly review required → redirected to `/dashboard/review/weekly`
- After submitting review → can access dashboard normally

**Test**:
1. Start focus session
2. Complete session
3. Try to access dashboard → redirected to daily review
4. Submit review → can access dashboard

**Note**: Banner still appears on other dashboard pages (e.g., `/dashboard/tasks`, `/dashboard/projects`). Consider adding middleware to block all dashboard routes except review pages if full hard block is desired.

---

## ✅ #8: Analytics Filters (Domain/Project/Date)

**Issue**: FR-32-35 analytics don't support filtering beyond preset periods.

**Spec Requirements (FR-32-35)**:
> FR-32: Show tasks completed over selected period.
> FR-33: Aggregate focus session durations.
> FR-34: Count and list overdue tasks.
> FR-35: Tasks completed per domain.

**Implementation**:

### Files Modified:
1. **`app/api/analytics/route.ts`** (lines 10-45, 59-81, 114)
   - Added URL parameters:
     - `domainId` - Filter by domain
     - `projectId` - Filter by project (overrides domain)
     - `range` - Preset ranges: `"7d"`, `"30d"`, `"90d"`, `"custom"`
     - `start` - Custom start date (YYYY-MM-DD, requires `range=custom`)
     - `end` - Custom end date (YYYY-MM-DD, requires `range=custom`)
   - Updated all queries to use filters
   - Returns `filters` object in response

**API Examples**:
```bash
# Last 7 days (all data)
GET /api/analytics?range=7d

# Last 30 days (all data)
GET /api/analytics?range=30d

# Filter by domain
GET /api/analytics?range=30d&domainId=uuid-here

# Filter by project
GET /api/analytics?range=30d&projectId=uuid-here

# Custom date range
GET /api/analytics?range=custom&start=2026-01-01&end=2026-01-31

# Custom range + domain filter
GET /api/analytics?range=custom&start=2026-01-01&end=2026-01-31&domainId=uuid-here

# Backward compatible (old period parameter still works)
GET /api/analytics?period=60
```

**Response Format**:
```json
{
  "filters": {
    "domainId": "uuid-or-null",
    "projectId": "uuid-or-null",
    "range": "30d"
  },
  "periodStart": "2026-01-09",
  "periodEnd": "2026-02-08",
  "completionRate": { ... },
  "focusTime": { ... },
  "overdueTasks": { ... },
  "domainBalance": [ ... ]
}
```

**UI Enhancement Needed**:
- Add filter dropdowns to `app/dashboard/analytics/page.tsx`
- Add domain selector (dropdown with user's domains)
- Add project selector (dropdown with user's projects)
- Add date range picker (preset buttons + custom date inputs)
- Wire up to API with URL params

---

## Migration Steps

### 1. Install Test Dependencies
```bash
npm install -D vitest @vitest/ui happy-dom
```

### 2. Update Database Schema
```bash
npm run db:push
```
This applies the `effort` field change from enum to String.

### 3. Run Tests
```bash
npm test
```

### 4. Verify Hard Block
- Start focus session
- Try to access dashboard
- Should redirect to review page

---

## Verification Checklist

### #5: Tests
- [ ] Install vitest: `npm install -D vitest @vitest/ui happy-dom`
- [ ] Run tests: `npm test`
- [ ] All 11 tests pass
- [ ] Coverage report shows focus-limit module tested

### #6: Flexible Effort
- [ ] Run `npm run db:push` to update schema
- [ ] Create task with `effort: "xs"` → succeeds
- [ ] Create task with `effort: "90min"` → succeeds
- [ ] Create task with `effort: "2h"` → succeeds
- [ ] Create task with `effort: "invalid"` → fails with validation error
- [ ] Update existing task effort → works with new formats

### #7: Hard Block
- [ ] User with pending daily review
- [ ] Navigate to `/dashboard` → redirected to `/dashboard/review/daily`
- [ ] Submit review → can access dashboard
- [ ] Weekly review same behavior

### #8: Analytics Filters
- [ ] `GET /api/analytics?range=7d` → returns last 7 days
- [ ] `GET /api/analytics?domainId={uuid}&range=30d` → filtered by domain
- [ ] `GET /api/analytics?projectId={uuid}&range=30d` → filtered by project
- [ ] `GET /api/analytics?range=custom&start=2026-01-01&end=2026-01-31` → custom range
- [ ] Response includes `filters` object with applied filters

---

## Next Steps

**Remaining High Priority**:
- None! #5-8 complete.

**Medium Priority (from original list)**:
- #9: NFR-5: Accessibility fixes (aria-labels, contrast, live regions)
- #10: NFR-3: Rate limiting on auth endpoints
- #11: NFR-1: Dashboard query optimization (Promise.all)
- #12: Timezone handling (user timezone field)
- #13: Clean up pending/backlog status confusion
- #14: Error boundaries

**UI Enhancements for #8**:
- Add filter UI to analytics page:
  - Domain dropdown
  - Project dropdown
  - Date range picker (7d/30d/90d/custom)
  - Apply button to reload with filters

---

## References
- **Spec**: `PCC_Full_Requirements_and_Build_Order.txt`
- **Critical Fixes**: `docs/CRITICAL_FIXES_2026-02-08.md`
- **Test Framework**: Vitest (https://vitest.dev/)
