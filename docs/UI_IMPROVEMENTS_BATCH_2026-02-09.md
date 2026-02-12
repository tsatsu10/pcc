# UI Improvements Batch — February 9, 2026

Summary of the 12 implemented UI improvements.

---

## 1. Breadcrumbs everywhere
- **Dashboard home**: Added `<Breadcrumbs items={[{ label: "Dashboard" }]} />` at top of main dashboard.
- Other routes (tasks, projects, domains, focus, analytics, review, knowledge) already had breadcrumbs; no change.

## 2. Page loading (loading.tsx)
- **Existing**: `app/dashboard/loading.tsx` already used `PageSkeleton`.
- **Added** `loading.tsx` with `PageSkeleton` for:
  - `app/dashboard/tasks/loading.tsx`
  - `app/dashboard/projects/loading.tsx`
  - `app/dashboard/domains/loading.tsx`
  - `app/dashboard/focus/loading.tsx`
  - `app/dashboard/analytics/loading.tsx`
  - `app/dashboard/review/loading.tsx`
  - `app/dashboard/review/daily/loading.tsx`
  - `app/dashboard/review/weekly/loading.tsx`
  - `app/dashboard/review/monthly/loading.tsx`
  - `app/dashboard/review/backlog/loading.tsx`
  - `app/dashboard/knowledge/loading.tsx`

Navigating to any of these segments now shows the skeleton while the page loads.

## 3. Form validation on blur + success message
- **Login** (`app/auth/login/page.tsx`):
  - Email: on blur, validate format; show inline error "Enter a valid email address." if invalid.
  - Submit blocked when email format is invalid.
- **Register** (`app/auth/register/page.tsx`):
  - Email: same format validation on blur.
  - Password: on blur, show "Password must be at least 8 characters." if length &lt; 8.
  - Submit blocked when email or password validation fails.
- **Success messages**: Handled by success toasts after review submit and onboarding (see #6).

## 4. Empty states with one primary action
- **Focus — “No focus tasks yet”**: Added primary action “Pick from backlog” (links to `#backlog`). Added `id="backlog"` to the “Suggested from backlog” section.
- **Weekly review — “No projects”**: Added action “Create project” (link to `/dashboard/projects`).
- **Monthly review — “No projects”**: Same “Create project” action.
- Other empty states (domains, projects, tasks, knowledge, analytics, etc.) already had a single primary action.

## 5. Tooltips on nav/icons
- **Header** (`components/Header.tsx`): Each nav link has a `title` attribute:
  - Dashboard: “Home and today's overview”
  - Domains: “Life areas (work, health, etc.)”
  - Projects: “Projects under domains”
  - Tasks: “All tasks across projects”
  - Knowledge: “Notes and references”
  - Daily focus: “Today's 3 focus tasks and timer”
  - Reviews: “Daily, weekly, monthly reviews”
  - etc.
- **Tooltip component**: `components/ui/Tooltip.tsx` added for reuse (hover/focus popover). Nav uses native `title` for simplicity.

## 6. “Review saved” / “You're all set”
- **SuccessParamToasts** (`components/dashboard/SuccessParamToasts.tsx`): Client component that:
  - When `reviewSaved` is true: shows toast “Review saved.” and replaces URL with `/dashboard` (no query).
  - When `onboarding` is true: shows toast “You're all set. Welcome to your dashboard.” and replaces URL.
- **Dashboard** (`app/dashboard/page.tsx`): Reads `review_saved` and `onboarding` from `searchParams`, passes to `SuccessParamToasts`.
- **Redirects**:
  - Daily/weekly/monthly review submit → `window.location.href = "/dashboard?review_saved=1"`.
  - Onboarding complete → `window.location.href = "/dashboard?onboarding=1"`.

## 7. One primary button per screen
- Not implemented as a separate change. Existing screens already use a clear primary CTA (e.g. “Sign in”, “Create account”, “Add domain”, “Submit review”). No audit changes.

## 8. Dark mode toggle
- **ThemeProvider** (`components/ThemeProvider.tsx`): Client context that:
  - Reads/writes `localStorage["pcc-theme"]` (`"light" | "dark" | "system"`).
  - Applies `.dark` on `document.documentElement` when theme is “dark” or (theme “system” and `prefers-color-scheme: dark`).
  - Listens to `prefers-color-scheme` for “system”.
- **globals.css**: Dark variables moved from `@media (prefers-color-scheme: dark)` to `.dark` so class-based toggle works.
- **ThemeToggle** (`components/ThemeToggle.tsx`): Button in header cycles Light → Dark → System. Shows sun/moon icon based on resolved theme.
- **Providers**: Wrapped app with `ThemeProvider` in `components/Providers.tsx`.
- **Header**: Renders `ThemeToggle` next to user menu.

## 9. Command palette: show shortcuts
- **CommandPalette** (`components/CommandPalette.tsx`): Each command can have a `shortcut` string.
- Shortcuts added: Dashboard `g d`, Focus `g f`, Tasks `g t`, Projects `g p`, Analytics `g a`, Reviews `g r`, “Set today's focus” `g f`.
- Palette list items show the shortcut in a `<kbd>` pill on the right when present.

## 10. Landing page refresh
- **Home** (`app/page.tsx`):
  - Background: gradient `from-primary/5` and dot pattern (radial-gradient grid).
  - Extra line: “One place for domains, projects, and today's three focus tasks.”
  - Slightly larger logo, max-width `max-w-lg`, full-width buttons on mobile (`w-full sm:w-auto`).

## 11. Dashboard “today” strip
- **DashboardTodayStrip** (`components/dashboard/DashboardTodayStrip.tsx`): Compact strip below breadcrumbs showing:
  - “Today:” then links: “X/3 focus”, “No overdue” or “N overdue”, “Daily review done” or “Daily review due”, “Weekly review done” or “Weekly review due”.
  - Links go to `/dashboard/focus`, `/dashboard/tasks`, `/dashboard/review/daily`, `/dashboard/review/weekly`. Done states styled with success color.
- **Dashboard page**: Renders `DashboardTodayStrip` with `focusCount`, `maxFocus`, `overdueCount`, `dailyReviewDone`, `weeklyReviewDone` from existing data.

## 12. Review banner “Remind later”
- **ReviewBanner** (`components/ReviewBanner.tsx`):
  - `localStorage["pcc-review-banner-dismissed"]` stores timestamp when user clicks “Remind later”.
  - Banner hidden for 2 hours (`REMIND_LATER_HOURS`); after that it shows again.
  - “Remind later” button added next to “Do daily/weekly/monthly review” buttons.

---

## Files touched (summary)

- **New**: `DashboardTodayStrip.tsx`, `SuccessParamToasts.tsx`, `ThemeProvider.tsx`, `ThemeToggle.tsx`, `Tooltip.tsx`, 11× `loading.tsx`.
- **Modified**: `app/dashboard/page.tsx`, `app/page.tsx`, `app/globals.css`, `app/auth/login/page.tsx`, `app/auth/register/page.tsx`, `app/onboarding/page.tsx`, `app/dashboard/review/daily/page.tsx`, `app/dashboard/review/weekly/page.tsx`, `app/dashboard/review/monthly/page.tsx`, `components/Header.tsx`, `components/ReviewBanner.tsx`, `components/CommandPalette.tsx`, `components/Providers.tsx`, `app/dashboard/focus/page.tsx`, `components/ui/index.ts`, review weekly/monthly empty states.
