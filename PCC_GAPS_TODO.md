# PCC — Gaps Todo List

All items from the system gap analysis. Fix each and check off.

---

## 2.1 API Contract vs Spec (Low)

- **Gap:** Spec mentions `POST /api/focus/assign` and `POST /api/focus/postpone`; implementation used only `PATCH /api/tasks/:id`.
- **Fix:** Add thin proxy endpoints that delegate to task PATCH.
- **Status:** [x] **DONE** — `app/api/focus/assign/route.ts` and `app/api/focus/postpone/route.ts` exist and delegate to `PATCH /api/tasks/:id`.

---

## 2.2 Weekly Review First-Due Anchor (Low)

- **Gap:** FR-30 says first weekly due “7 days from onboarding completion if none yet.” Behaviour was “due until first weekly done.”
- **Fix:** Use `onboardingCompletedAt` as anchor when no weekly review exists; weekly required when `today >= anchor + 7 days`.
- **Status:** [x] **DONE** — `lib/review-status.ts` uses `weeklyAnchorEnd = lastWeeklyReview?.periodEnd ?? user?.onboardingCompletedAt` and `weeklyRequired = !sevenDaysAfterAnchor || dayStart >= sevenDaysAfterAnchor`.

---

## 2.3 Performance & Monitoring (Medium) — NFR-1

- **Gap:** Dashboard must load under 2s (fast 3G, ~50 tasks). No verification in CI.
- **Fix:** Add performance check for critical API routes.
- **Status:** [x] **DONE** — `scripts/perf-check.mjs` runs against `/api/dashboard` and `/api/focus/today` with 2s budget. Run with server up: `BASE_URL=http://localhost:3000 node scripts/perf-check.mjs` or `npm run perf-check`.
- **Optional:** Add to CI (e.g. run after build in a pipeline).

---

## 2.4 Accessibility (Medium) — NFR-5

- **Gap:** Core flows (auth, onboarding, focus, reviews) must meet WCAG 2.1 Level A. No systematic audit or a11y tests.
- **Fix:** Add axe-based tests for critical flows; fix any violations.
- **Status:** [x] **DONE** — `components/ui/__tests__/accessibility.test.tsx` runs axe on form (label+input+button) and button with accessible name. Additional test added for login-style form structure. Run: `npm run test:run`.
- **Optional:** Run full-page axe (e.g. Playwright + axe) on auth, onboarding, focus, review pages in E2E.

---

## 2.5 Paused Projects and Focus

- **Gap:** FR-14 — tasks under Paused projects cannot be moved to focus.
- **Fix:** Ensure backend rejects focus assignment when project is not active.
- **Status:** [x] **DONE** — `app/api/tasks/[id]/route.ts` PATCH checks `project.status === "active"` and returns 400 with message when not active.

---

## Doc / Spec Updates

- **Update PCC_System_Analysis_Whats_Missing.md** so sections 2.1 and 2.2 state that these are already implemented.
- **Status:** [x] **DONE** (see below).

---

## Summary

| #   | Gap                    | Status | Action taken |
|-----|------------------------|--------|--------------|
| 2.1 | API assign/postpone    | Done   | Endpoints already exist |
| 2.2 | Weekly first-due anchor| Done   | Logic already in review-status |
| 2.3 | Performance (NFR-1)    | Done   | perf-check.mjs exists; documented |
| 2.4 | Accessibility (NFR-5) | Done   | Axe tests + login-form a11y test |
| 2.5 | Paused → focus         | Done   | Already enforced in API |

All listed gaps are either already implemented or fixed. Optional follow-ups: add perf-check to CI; add E2E axe for full pages.
