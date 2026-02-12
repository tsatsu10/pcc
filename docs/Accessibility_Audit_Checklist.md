# PCC — Accessibility Audit Checklist

**Purpose:** Support NFR-5 (WCAG 2.1 Level A for core flows). Use this checklist when running audits and fixing issues.

**Target pages:**

- Landing (`/`)
- Login (`/auth/login`), Register (`/auth/register`)
- Onboarding (step 1 and one other step)
- Dashboard (`/dashboard`)
- Daily focus (`/dashboard/focus`)
- Daily review (`/dashboard/review/daily`)
- Weekly review (`/dashboard/review/weekly`)

---

## 1. How to run an audit

### Lighthouse (Chrome DevTools)

1. Open Chrome DevTools → Lighthouse tab.
2. Select **Accessibility** only (or include Performance if desired).
3. Device: **Mobile** and **Desktop** (run both).
4. Run for each target page (or a representative set).
5. Note **score** and list of **failed** / **warnings**. Save a screenshot or copy the report.

### axe DevTools (browser extension or CLI)

- **Extension:** Install axe DevTools, open each page, run “Scan ALL of my page.” Export or copy the list of issues (Critical, Serious, Moderate).
- **CLI:** `npx @axe-core/cli http://localhost:3000/dashboard/focus` (and other URLs). Review output for violations.

### Automated a11y tests (NFR-5)

- **Vitest + vitest-axe:** Critical-path components are tested in `components/ui/__tests__/accessibility.test.tsx`. Run: `npm run test:run -- --testPathPattern=accessibility`. Add tests for new core flows (auth, onboarding, focus, reviews).

---

## 2. What to fix (priority)

| Priority | Issue type | Action |
|----------|------------|--------|
| **Critical** | Contrast below 4.5:1 (text), 3:1 (large text) | Adjust foreground/background tokens or use a darker/lighter variant. |
| **Critical** | Form control without label | Add `<label htmlFor="...">` or `aria-label`. |
| **Critical** | Missing alt on meaningful images | Add `alt` text. Decorative images: `alt=""`. |
| **High** | Focus not visible | Ensure `:focus-visible` ring is applied (e.g. `focus-visible:ring-2 focus-visible:ring-ring`). |
| **High** | Touch target &lt; 44px | Increase min height/width or padding (e.g. `min-h-[44px]` on buttons). |
| **High** | Dynamic content without live region | Add `aria-live="polite"` (e.g. timer) or `role="alert"` for errors. |
| **Medium** | Heading order (e.g. h1 → h3) | Use sequential headings (h1, then h2, etc.). |
| **Medium** | List not marked up | Use `<ul>`/`<ol>` and `<li>` for lists. |
| **Low** | Redundant title / label | Prefer a single clear label. |

---

## 3. Reduced motion

- Check that success checkmark and any entrance animations (e.g. `animate-in`) are disabled or shortened when `prefers-reduced-motion: reduce` is set.
- In CSS: `@media (prefers-reduced-motion: reduce) { ... }` or Tailwind `motion-reduce:animate-none` (or equivalent).

---

## 4. Documenting results

Create a dated report, e.g. `docs/Accessibility_Audit_2026-02-10.md`, with:

- **Tool and version** (e.g. Lighthouse 11, axe-core 4.x)
- **Pages audited**
- **Pass/fail score** per page (if applicable)
- **List of issues** (id, description, severity, page, fix status)
- **Fixes applied** (short note and file/component)

This checklist and the design system (Section 10. Accessibility) should be updated when new patterns or requirements are added.

---

*End of checklist*
