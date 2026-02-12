# Auth experience – full redesign plan

Plan first; implement in phases. Covers login and register only (no password reset in scope).

---

## 1. Current state (what we have)

- **Layout:** Split screen: left = brand panel (image or gradient + orbs), right = form in a card.
- **Brand panel:** Full-height on desktop; image with dark overlay, or animated gradient + floating orbs. PCC logo, “Personal Command Center”, tagline.
- **Form side:** Centered card (rounded-2xl, border, shadow) with title, subtitle, fields, primary CTA, footer link.
- **Pages:** `/auth/login`, `/auth/register`; same layout, different taglines and images (milad.jpg, walling.jpg).
- **Features:** Skip link, PasswordInput show/hide, required indicators, error focus, autocomplete, 44px touch targets, focus-visible rings.

**Pain points to address in redesign:**
- Split + image can feel busy or inconsistent with the rest of the app.
- Overlay (blue → black) still competes with the form for attention.
- Two different background images for login vs register can feel disjointed.
- Desire for a clearer, more cohesive “whole” that fits PCC’s product tone.

---

## 2. Design direction (goals)

- **Calm and focused** – Auth should feel minimal and trustworthy, not flashy.
- **One system** – Login and register should feel like one flow (same layout, same visual language).
- **Brand clarity** – PCC identity (logo, name, one short line) is clear without overpowering the form.
- **Accessibility and UX** – Keep skip link, focus management, touch targets, and validation behavior; improve where needed.
- **Performance and simplicity** – Prefer less asset/motion dependency where it doesn’t add value.

---

## 3. Layout options (pick one direction)

**Option A – Centered single column (no split)**  
- One full-width column; background = solid or very subtle pattern (no photo).
- Logo + product name at top; under it, one card (or card-like form) with title, form, CTA, footer link.
- Pros: Simple, fast, works everywhere; form is the only focus.  
- Cons: No “hero” moment; less dramatic.

**Option B – Split kept, but simplified**  
- Left: No photo. Solid color or very soft gradient (single brand color); logo + one line only.
- Right: Same as now (form card) or form without card on a light background.
- Pros: Clear separation, brand strip without image/overlay issues.  
- Cons: Still two-panel; need to tune “single color” so it’s not dull.

**Option C – Full-bleed background, form card centered**  
- Entire page: one background (e.g. very subtle gradient or pattern, or a single blurred/abstract image at low opacity).
- Single centered card (form only); logo and “PCC” above or inside the card.
- Pros: Modern, “floating card” look; one background for both pages.  
- Cons: Needs careful contrast so card and text meet WCAG.

**Option D – Minimal “app” style**  
- Top: Thin bar with logo + “PCC” (and maybe “Sign in” / “Create account” tab or link).
- Rest: White/background color; form is just title, fields, button, link—no card, no split.
- Pros: Feels like part of the product; minimal.  
- Cons: Less “landing” feel; might feel bare if not executed well.

**Recommendation:** **Option A or C** for a true “redesign the whole” with less reliance on split + overlay. A = safest and fastest; C = slightly more visual if we keep the background very subtle.

---

## 4. Visual system (apply to chosen layout)

- **Background**
  - No full-size photos with overlay for auth (remove current image + overlay).
  - Use: solid `bg-background`, or a very light gradient (e.g. `from-background to-muted/30`), or a very subtle pattern (dots/grid at low opacity). Same for light and dark.
- **Brand block**
  - Logo + “PCC” (and optionally “Personal Command Center” or one tagline).
  - Single location: top of page (Option A/C/D) or left strip (Option B). No long paragraphs.
- **Form container**
  - Either: card (border + shadow + radius) on a neutral background, or form with no card and clear spacing/typography.
  - One max-width (e.g. 400px) for the form; centered.
- **Typography**
  - One clear h1 per page (“Sign in” / “Create your account”).
  - Subtitle: one short line, muted.
  - Labels: medium weight; required * kept.
- **Colors**
  - Primary for CTA and primary links only.
  - Muted for subtitle and footer text; destructive for errors.
  - No large blocks of primary (no blue panel).
- **Motion**
  - No floating orbs or heavy animation on auth.
  - Optional: very subtle fade-in of the form on load (respect `prefers-reduced-motion`).
- **Spacing**
  - Consistent vertical rhythm (e.g. 4/6/8 scale); comfortable padding inside the form area.

---

## 5. Page-by-page (same for both)

- **Login**
  - One heading: “Sign in”.
  - Subtitle: e.g. “Sign in to your workspace.”
  - Fields: Email, Password (with show/hide).
  - CTA: “Sign in” (loading: “Signing in…”).
  - Footer: “Don’t have an account? Sign up” (link).
  - Optional: “Account created” message when `?registered=1`.
- **Register**
  - One heading: “Create your account”.
  - Subtitle: e.g. “Use your email and a secure password.”
  - Fields: Name, Email, Password (with show/hide).
  - CTA: “Create account” (loading: “Creating account…”).
  - Footer: “Already have an account? Sign in” (link).

No change to validation, error display, or redirect logic; only layout and visuals.

---

## 6. Responsive strategy

- **Desktop:** Chosen layout (e.g. centered card or split with minimal left).
- **Tablet:** Same as desktop; form max-width keeps line length readable.
- **Mobile:**
  - No split (stack or single column).
  - Logo + name at top; form below; full-width CTA; footer link with 44px min touch target.
  - Optional: reduce padding and font size slightly, but keep tap targets.

---

## 7. Implementation phases

**Phase 1 – Layout and shell**  
- Choose layout (A, B, C, or D).
- New `AuthLayout` (or rename): no image, no gradient orbs; only structure (e.g. centered content or split with solid left).
- Single background for both pages (e.g. `bg-background` or subtle gradient).
- Logo + “PCC” (and one tagline if desired) in the chosen brand block.

**Phase 2 – Form presentation**  
- `AuthCard` or equivalent: adjust to new layout (card vs no-card, spacing, border/shadow).
- Ensure one h1, one subtitle, spacing between label groups and CTA.
- Footer link styling (touch target, focus-visible) preserved.

**Phase 3 – Pages and behavior**  
- Wire login and register pages to new layout; remove image props and per-page taglines if we’re going single-system.
- Keep: form ids, skip link, autocomplete, required indicators, PasswordInput, error focus, aria-busy.
- Test light/dark and mobile.

**Phase 4 – Polish**  
- Optional subtle entrance animation (e.g. fade or short slide) with `prefers-reduced-motion` check.
- Final contrast and focus-visible pass; doc update in `Auth_UI_UX_Issues_And_Fixes.md` or replace with “Auth redesign” summary.

---

## 8. What to remove (after redesign)

- Background image support in auth (or keep as optional and unused by default).
- Animated gradient + orbs on auth.
- Different left-panel content per page (different images/taglines); replace with one shared brand block.
- Heavy overlay tuning (blue/black); no overlay if no image.

---

## 9. What to keep

- Skip link to form.
- Password show/hide.
- Required field indicators and validation behavior.
- Error focus and `aria-*` usage.
- 44px touch targets and focus-visible on interactive elements.
- Autocomplete and loading states.
- Callback URL handling and post-register redirect to login with message.

---

## 10. Decision needed from you

1. **Layout:** A (centered single column), B (split with solid left), C (full-bleed background + centered card), or D (minimal app bar + form)?
2. **Form container:** Card (border + shadow) or no card (flat form with spacing)?
3. **Tagline:** One line under logo (e.g. “Personal Command Center”) on auth, or logo + “PCC” only?

Once you pick (e.g. “Option A, with card, logo + PCC only”), implementation can follow this plan phase by phase.
