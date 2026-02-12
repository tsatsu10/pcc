# PCC — More UI Improvement Ideas

Ideas beyond what’s already implemented (analytics filters, animations, keyboard shortcuts, progress bars, loading states). Grouped by impact and effort.

---

## High impact, moderate effort

### 1. **Landing page refresh**
- **Current**: Centered block, logo, bullets, two CTAs.
- **Ideas**:
  - Subtle gradient or pattern background (e.g. dot grid, soft gradient).
  - Short value line under subhead: “One place for domains, projects, and today’s three focus tasks.”
  - Optional: 1–2 small “product” visuals (e.g. dashboard mock, focus slots).
  - Optional: social proof line (“Join others who…” or “Free to start”).
- **Why**: First impression; sets tone for the rest of the app.

### 2. **Dashboard “today” summary strip**
- **Current**: Greeting, date, Next Action card, then cards.
- **Ideas**:
  - Compact strip above cards: “Today: 2/3 focus · 1 overdue · Daily review done” with quick links.
  - Or a small “Today at a glance” card with icons + counts + links (focus, overdue, reviews).
- **Why**: One-glance status without scrolling.

### 3. **Focus timer UX**
- **Current**: Elapsed time text, “End session”, “Mark done”, “Postpone”.
- **Ideas**:
  - Optional circular or linear timer that fills (e.g. toward a goal duration like 25 min).
  - Optional “Pause” that keeps elapsed but stops counting (if you add pause/resume API).
  - Optional sound or browser notification when a session reaches a target (e.g. 25 min).
  - Clear “Session saved” state (e.g. small checkmark or badge) so users trust refresh.
- **Why**: Makes focus sessions feel intentional and satisfying.

### 4. **Review banner and review flow**
- **Current**: Yellow banner with “Do daily/weekly review” links.
- **Ideas**:
  - Dismiss (e.g. “Remind later”) that hides banner for 1–2 hours (localStorage or API).
  - Optional progress: “Daily review: 2/3 questions” or stepper on the review page.
  - After submit: short success state (“Review saved”) and clear CTA back to dashboard.
- **Why**: Reduces banner fatigue while keeping reviews visible.

### 5. **Empty states with next step**
- **Current**: Icons + short copy + sometimes a button.
- **Ideas**:
  - One clear primary action per empty state (e.g. “Add first domain”, “Create a task”, “Pick 3 for today”).
  - Optional secondary: “See how it works” linking to a short help section or tooltip.
  - Keep copy from `PCC_In_App_Copy.md`; ensure every empty state has exactly one obvious next step.
- **Why**: Reduces “what do I do now?” and speeds time-to-value.

---

## Medium impact, lower effort

### 6. **Breadcrumbs everywhere**
- **Current**: Some pages have breadcrumbs (e.g. Analytics).
- **Ideas**:
  - Add breadcrumbs to: Projects list, Project detail, Tasks, Domain detail, Focus, Review (daily/weekly/monthly), Knowledge.
  - Same component and style; e.g. “Dashboard > Projects > My Project”.
- **Why**: Orientation and quick back-navigation, especially on deep links.

### 7. **Page-level loading**
- **Current**: Some pages use `PageSkeleton` or similar.
- **Ideas**:
  - Use a single loading pattern for all main dashboard routes (e.g. `loading.tsx` with same skeleton).
  - Optional: skeleton that mirrors the real layout (e.g. card shapes on dashboard).
- **Why**: Consistent “app is working” feedback during navigation.

### 8. **Form validation and feedback**
- **Current**: Errors and required fields exist; behavior varies.
- **Ideas**:
  - Inline validation on blur for key fields (e.g. email, task title, domain name): show error only after first blur or submit.
  - One-line success message after create/update (e.g. “Domain added” toast or inline).
  - Disable submit while loading and show spinner in button.
- **Why**: Fewer failed submits and clearer recovery.

### 9. **Tables and lists**
- **Current**: Cards and lists in many places.
- **Ideas**:
  - Optional “list vs card” toggle on Tasks (and maybe Projects) for users who prefer a compact table.
  - Sortable column headers where it makes sense (e.g. Tasks: title, status, deadline, project).
  - Sticky table header on scroll for long task lists.
- **Why**: Power users can scan and sort quickly.

### 10. **Mobile: bottom nav or FAB**
- **Current**: Header with hamburger and links.
- **Ideas**:
  - On small viewports, optional bottom nav with 4–5 items (Dashboard, Focus, Tasks, Reviews, More).
  - Or a FAB that opens the same nav (or command palette).
- **Why**: Thumb-friendly access to main actions on phones.

---

## Polish and delight

### 11. **Micro-copy and tooltips**
- **Ideas**:
  - Short tooltips on icons (e.g. “Today’s focus”, “Reviews”, “Analytics”).
  - Optional “Why only 3?” or “What’s a daily review?” one-liner near focus/review sections, with link to a small help modal or docs.
- **Why**: Clarifies concepts without cluttering the UI.

### 12. **Success / completion feedback**
- **Ideas**:
  - After “Mark done”: brief checkmark animation or confetti (respect `prefers-reduced-motion`).
  - After onboarding complete: “You’re all set” with a single CTA to dashboard.
  - After review submit: “Review saved” + optional 1-sentence reflection tip.
- **Why**: Reinforces progress and closure.

### 13. **Consistent primary actions**
- **Ideas**:
  - Each main screen has one clear primary button (e.g. “Add task”, “Start focus”, “Do daily review”).
  - Same style (e.g. primary/focus variant) for that button across the app.
- **Why**: Clear “main thing to do” per screen.

### 14. **Dark mode toggle**
- **Current**: Likely system preference only.
- **Ideas**:
  - Header or settings: “Theme: Light / Dark / System” with instant switch.
  - Persist in localStorage (or user prefs API if you add one).
- **Why**: User control and comfort.

### 15. **Command palette (⌘K) enhancements**
- **Current**: CommandPalette exists; ⌘K opens it; navigation + a few actions.
- **Ideas**:
  - Show keyboard shortcut next to each command (e.g. “Dashboard  g d”).
  - Optional: “Quick add task” from palette (inline form or link to tasks?new=1 with focus on title).
  - Optional: recent pages or “resume last focus task”.
- **Why**: Power users discover and use shortcuts; faster task creation.

---

## Lower priority / later

### 16. **Onboarding progress**
- Stepper or progress bar (e.g. “Step 2 of 4”) and “Skip” with confirmation and defaults (you already have defaults; expose skip clearly).

### 17. **Dashboard widgets / layout**
- Let users reorder or collapse cards (e.g. “Focus first”, “Overdue second”) and persist in localStorage or API.

### 18. **Inline edit**
- Click-to-edit for task title, project name, domain name on list/detail views (with save/cancel and escape to cancel).

### 19. **Charts on Analytics**
- Simple charts (e.g. completions per day, focus time per week) with a small library (e.g. Recharts) or CSS-only bars.

### 20. **Search**
- Global search (in header or command palette): tasks and projects by name, with links to open them.

---

## Suggested order to implement

1. **Quick wins**: Breadcrumbs everywhere, page loading consistency, form validation + success feedback.
2. **High impact**: Landing refresh, today summary strip, focus timer UX, empty states.
3. **Polish**: Tooltips, success animations, dark mode toggle, command palette shortcuts.
4. **Later**: List/card toggle, bottom nav/FAB, onboarding progress, inline edit, charts, search.

If you tell me which area you want to tackle first (e.g. “landing”, “focus timer”, “empty states”, or “breadcrumbs + loading”), I can outline concrete steps and copy/component changes next.
