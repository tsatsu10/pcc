# PCC UI/UX Design System

**Version 1.0** · Personal Command Center — Life Operating System  
*Simple, sophisticated, and purposeful.*

---

## 1. Design Philosophy

PCC follows a **minimal, command-center** aesthetic inspired by productivity tools like Linear, Toggl Track, and Notion. The design should feel:

- **Calm** — Reduce cognitive load; users are making decisions about their life.
- **Commanding** — Clear hierarchy, decisive actions, no ambiguity.
- **Spacious** — Ample whitespace; elements have room to breathe.
- **Consistent** — Same patterns everywhere; muscle memory builds quickly.
- **Accessible** — WCAG 2.1 AA contrast, focus states, semantic markup.

### Core Principles

1. **Content over chrome** — UI supports the content; it does not compete.
2. **Typography creates hierarchy** — Use weight and size, not color alone.
3. **Sparse color** — Reserved for focus, status, and feedback.
4. **Progressive disclosure** — Show essentials; reveal details on demand.
5. **One primary action per screen** — The Daily Focus view has one job: focus.

---

## 2. Color System

### Semantic Roles

Use semantic color names, not raw hues. This supports theming and accessibility.

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | Off-white / Mercury | Nordic Gray | Page background |
| `--foreground` | Near-black | Off-white | Primary text |
| `--muted` | Soft gray | Muted gray | Secondary text, hints |
| `--border` | Light gray | Dark gray | Borders, dividers |
| `--primary` | Desaturated blue | Lighter blue | Primary actions, links |
| `--primary-foreground` | White | Dark | Text on primary |
| `--secondary` | Light gray | Dark surface | Secondary buttons, surfaces |
| `--accent` | Subtle tint | Subtle tint | Hover, focus highlight |
| `--success` | Emerald | Emerald | Done, complete, positive |
| `--warning` | Amber | Amber | Postpone, caution |
| `--destructive` | Red | Softer red | Remove, destructive actions |
| `--focus-active` | Teal/emerald | Teal | Active focus session, timer |
| `--ring` | Primary / accent | Primary | Focus ring (keyboard nav) |

### PCC Brand Palette (Reference)

Inspired by Linear’s “comfortable on light and dark” approach:

- **Mercury White**: `#F4F5F8` — Light backgrounds
- **Nordic Gray**: `#222326` — Dark backgrounds, dark mode
- **Desaturated Blue**: `#5B7C99` — Primary accent (subtle)
- **Off-black**: `#0F1219` — Light-mode text
- **Off-white**: `#FAFBFC` — Light-mode surface

### Status Colors (Task/Project)

| Status | Light | Dark | Use |
|--------|-------|------|-----|
| `backlog` | Muted | Muted | Neutral, low emphasis |
| `focus` | Primary / accent | Primary | Active focus slot |
| `done` | Success (emerald) | Success | Completed |
| `postponed` | Warning (amber) | Warning | Deferred |
| `overdue` | Destructive (red) | Destructive | Past due |

---

## 3. Typography

### Font Stack

- **Primary (UI & Body)**: `Inter` — Neutral, readable, excellent for interfaces.
- **Alternative**: `Public Sans` — Slightly warmer, if Inter feels cold.
- **Monospace**: `JetBrains Mono` or `ui-monospace` — Timers, IDs, code.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale (Modular, 1.25 ratio)

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px | 16px | 400 | Captions, badges, metadata |
| `text-sm` | 14px | 20px | 400 | Body small, labels |
| `text-base` | 16px | 24px | 400 | Body default |
| `text-lg` | 18px | 28px | 400 | Lead paragraphs |
| `text-xl` | 20px | 28px | 600 | Page titles |
| `text-2xl` | 24px | 32px | 600 | Hero, onboarding |
| `text-3xl` | 30px | 36px | 700 | Landing headline |
| `display` | 36px | 40px | 700 | Rare, emphasis only |

### Typography Rules

- **Line length**: 60–80 characters for body text.
- **Emphasis**: Use `font-semibold` or `font-medium`, not only color.
- **Avoid**: All caps except acronyms (PCC, CRUD).
- **Links**: Underline on hover, or rely on color + context.

---

## 4. Spacing

### Base Unit: 4px

All spacing is a multiple of 4px for consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `0` | 0 | Reset |
| `1` | 4px | Tight inline gaps |
| `2` | 8px | Small gaps, icon padding |
| `3` | 12px | Form field padding |
| `4` | 16px | Default padding, gaps |
| `5` | 20px | Section spacing |
| `6` | 24px | Card padding |
| `8` | 32px | Section breaks |
| `10` | 40px | Page sections |
| `12` | 48px | Large gaps |
| `16` | 64px | Hero spacing |

### Layout Gutters

- **Mobile**: 16px (`p-4`)
- **Tablet / Desktop**: 24px (`p-6`) or 32px (`p-8`)

### Content Max Widths

- **Narrow (forms, focus)**: 448px (`max-w-md`)
- **Standard**: 672px (`max-w-2xl`)
- **Wide (dashboard, lists)**: 896px (`max-w-4xl`)
- **Full**: No cap for analytics, tables.

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-none` | 0 | Tables, strict layouts |
| `rounded-sm` | 4px | Badges, tags |
| `rounded` | 6px | Inputs, small buttons |
| `rounded-lg` | 8px | Cards, buttons, modals |
| `rounded-xl` | 12px | Large cards, hero sections |
| `rounded-2xl` | 16px | Onboarding, focus mode |

Use `rounded-lg` as the default for interactive elements.

---

## 6. Shadows

Keep shadows subtle. PCC should feel flat and calm.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Slight elevation |
| `shadow` | 0 1px 3px rgba(0,0,0,0.08) | Cards, dropdowns |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.07) | Modals |
| `shadow-lg` | 0 10px 25px rgba(0,0,0,0.1) | Overlays |

Dark mode: use `rgba(0,0,0,0.3)` or equivalent for depth.

---

## 7. Motion

### Durations

- **Instant**: 0ms — Toggle state
- **Fast**: 150ms — Hover, focus
- **Normal**: 200ms — Modals, dropdowns
- **Slow**: 300ms — Page transitions

### Easing

- **Default**: `ease-out` — Most transitions
- **Enter**: `ease-out` — Elements appearing
- **Exit**: `ease-in` — Elements leaving

### Guidelines

- Prefer `opacity` and `transform` for performance.
- Respect `prefers-reduced-motion`: disable or shorten animations.

---

## 8. Component Specifications

### Buttons

| Variant | Background | Text | Border | Use |
|---------|------------|------|--------|-----|
| **Primary** | `primary` / `foreground` | `primary-foreground` / `background` | None | Main CTAs |
| **Secondary** | `secondary` | `foreground` | `border` | Cancel, alternative actions |
| **Ghost** | Transparent | `foreground` | None | Nav, subtle actions |
| **Destructive** | `destructive` | White | None | Delete, remove |
| **Focus** | `focus-active` | White | None | Start timer, focus actions |

- **Height**: 36px (sm), 40px (default), 44px (lg)
- **Padding**: 12px–16px horizontal
- **Border radius**: `rounded-lg`
- **Disabled**: 50% opacity, `cursor-not-allowed`

### Inputs

- **Height**: 40px
- **Padding**: 12px 14px
- **Border**: 1px solid `border`
- **Focus**: 2px ring `ring` color, offset 2px
- **Placeholder**: `muted` color
- **Error**: Border `destructive`, optional message below

### Cards

- **Background**: `card` (slightly different from page background)
- **Border**: 1px `border` (or shadow-sm)
- **Radius**: `rounded-lg`
- **Padding**: 24px (`p-6`)

### Badges / Status Pills

- **Size**: `text-xs`, padding 4px 8px
- **Radius**: `rounded-sm` or `rounded-full`
- **Colors**: Map to status (backlog=muted, focus=primary, done=success, etc.)

### Modals / Dialogs

- **Overlay**: `bg-black/50` or `bg-black/40`
- **Panel**: `bg-background`, `rounded-xl`, `shadow-lg`
- **Max width**: 448px (form), 560px (wider content)
- **Padding**: 24px

### Navigation

- **Active link**: `font-medium`, `foreground`
- **Inactive**: `muted`, hover → `foreground`
- **Height**: 40px for clickable area
- **Underline or indicator**: Optional for active state

---

## 9. Screen-Specific Guidelines

### Landing Page

- Centered, max-width ~480px
- Headline: `text-3xl` or `text-4xl`, `font-bold`
- Subtitle: `text-base`, `muted`
- CTAs: Primary + Secondary, side by side on desktop

### Auth (Login / Register)

- Centered form, max-width 384px
- Single column
- Clear labels, helpful error messages
- Link to alternate auth flow (e.g. "No account? Sign up")

### Onboarding

- Stepper: clear step indicators (1, 2, 3, 4)
- One concept per step
- Skip/defaults: obvious but not pushy
- "Finish" on last step, "Continue" on others

### Dashboard

- Widget-based: Today’s Focus, Active Projects, Overdue, Review reminder
- Each widget: card with clear title
- Quick links to Focus, Tasks, Reviews

### Daily Focus

- **Primary**: 3 focus slots, prominent
- **Secondary**: Backlog list, assign-to-focus actions
- Timer: Large, readable (`tabular-nums`, `text-2xl` or larger)
- Start / Stop / Complete / Postpone: Clear, high contrast

### Lists (Tasks, Projects, Domains)

- Row: title, metadata, actions
- Hover: subtle background change
- Empty state: Short message + CTA to create

### Reviews

- Sections: Completed, Missed, Notes
- Text areas for reflection
- Submit: Primary button

### Analytics

- Charts: Use `chart-1` through `chart-5` for series
- Labels: `muted`
- Summary cards: Same as dashboard widgets

---

## 10. Accessibility

**Target:** WCAG 2.1 Level A for core flows (auth, onboarding, daily focus, daily/weekly review). NFR-5.

- **Color contrast**: 4.5:1 for body text, 3:1 for large text. Status and actions must not rely on color alone (use labels, icons, or text).
- **Focus ring**: Always visible on keyboard focus (`:focus-visible`). Logical tab order follows layout (e.g. focus slots → task actions → backlog).
- **Touch targets**: Interactive elements (buttons, links in nav) should be at least 44×44px where possible, especially on mobile.
- **Skip link**: "Skip to main content" on dashboard (optional but recommended).
- **Labels**: Every input has an associated `<label>` or `aria-label`. Decorative icons use `aria-hidden="true"`.
- **Live regions**: Use `aria-live="polite"` for dynamic content (e.g. timer); `role="alert"` for errors.
- **Motion**: Respect `prefers-reduced-motion: reduce` — disable or shorten non-essential animations.
- **Audit**: Run Lighthouse (Accessibility) and/or axe DevTools on Landing, Login, Register, Onboarding, Dashboard, Daily focus, Daily review, Weekly review. Fix critical and high-severity issues; document in `docs/Accessibility_Audit_*.md`.

---

## 11. Dark Mode

- Toggle via `prefers-color-scheme` or user preference
- All semantic tokens must have dark variants
- Reduce shadow intensity in dark mode
- Test all status colors for contrast

---

## 12. Implementation Reference

### Tailwind Config

Extend `theme` with:

- `colors` mapped to CSS variables (`background`, `foreground`, `primary`, etc.)
- `fontFamily` for Inter
- `borderRadius` overrides if needed
- `boxShadow` for PCC tokens

### CSS Variables (globals.css)

Define `:root` and `.dark` (or `[data-theme="dark"]`) with all semantic tokens. Use HSL or OKLCH for easier manipulation.

### shadcn/ui Alignment

When using shadcn:

- Set `baseColor` to `zinc` or `neutral`
- Use `cssVariables: true`
- Override `--primary` and related tokens to match PCC palette

---

## 13. Iconography

- **Library**: Lucide React (lightweight, consistent)
- **Size**: 16px default, 20px for emphasis, 24px for empty states
- **Stroke**: 1.5–2px
- **Color**: Inherit from parent or use `muted` for decorative icons

---

## 14. Empty States

- Icon (optional, large, muted)
- Short heading
- Brief explanation
- Primary CTA (e.g. "Create task", "Add project")

---

## Appendix A: Quick Reference

| Element | Classes (Tailwind) |
|---------|--------------------|
| Page title | `text-xl font-semibold text-foreground` |
| Body text | `text-sm text-foreground` |
| Muted text | `text-sm text-muted` |
| Primary button | `bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium hover:opacity-90` |
| Card | `rounded-lg border border-border bg-card p-6` |
| Input | `rounded-lg border border-input bg-background px-3 py-2 text-sm` |

---

*PCC Design System v1.0 — Align with PCC_Cursor_Build_Spec and PCC_Full_Requirements_and_Build_Order.*
