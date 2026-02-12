# Auth pages (login/register) – UI/UX issues and fixes

Todo list from the analysis and what was done.

---

## 1. Background image content (distracting text)

**Issue:** Left-panel background image could show other brands or text (e.g. “ACME POS” on a laptop), which confuses users.

**Fix:** Stronger overlay on the brand panel when a background image is used:
- `AuthLayout.tsx`: overlay updated from `bg-primary/75` and `dark:bg-primary/85` to `bg-primary/85` and `dark:bg-primary/90` so the image is more subdued and any text in it is harder to read.

**Optional:** Prefer images without visible product names or UI; use neutral scenes (desk, nature, abstract).

---

## 2. Placeholder contrast (accessibility)

**Issue:** Placeholder text in dark mode might not meet contrast guidelines (WCAG).

**Fix:** Dark-mode placeholder color updated in `app/globals.css`:
- `.dark input::placeholder` and `.dark textarea::placeholder` set to `hsl(215 18% 72%)` for better contrast on dark backgrounds.

---

## 3. Touch targets (44px minimum)

**Issue:** Links and buttons must meet minimum touch target size (~44px) for mobile.

**Fix:**
- Auth footer “Sign in” / “Sign up” links in `AuthCard.tsx`: `min-h-[44px]`, `min-w-[44px]`, `py-2`, `px-3`, `inline-flex`, `items-center`, `justify-center` so the tap area is at least 44×44px.
- Primary CTA: “Create account” / “Sign in” use `Button` with `size="lg"` (height 44px). No change needed.

---

## 4. Focus visibility (keyboard users)

**Issue:** All interactive elements need a clear focus indicator.

**Fix:**
- `app/globals.css`: base rule so `a:focus-visible` and `button:focus-visible` use `outline: none` and rely on component focus rings.
- `AuthLayout.tsx`: PCC logo link now has `focus-visible:ring-2 focus-visible:ring-primary-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary` and `rounded-lg py-2 pr-2` for a visible focus ring on the blue panel.
- `AuthCard.tsx`: footer links use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` so focus is visible on the form side.

(Inputs, PasswordInput toggle, and Button already had focus styles.)

---

## Summary

| Issue                         | Status | Where changed                          |
|------------------------------|--------|----------------------------------------|
| Stronger image overlay       | Done   | `components/auth/AuthLayout.tsx`       |
| Placeholder contrast (dark)  | Done   | `app/globals.css`                      |
| 44px touch targets           | Done   | `components/auth/AuthCard.tsx`         |
| Focus-visible on auth UI     | Done   | `globals.css`, `AuthLayout`, `AuthCard`|

Validation errors, loading state (“Creating account…” / “Signing in…”), and success message after registration were already implemented and left as-is.
