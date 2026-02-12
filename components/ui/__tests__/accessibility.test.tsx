/**
 * NFR-5: Critical-path accessibility tests (WCAG 2.1 Level A).
 * Run axe on core UI patterns used in auth, onboarding, and focus flows.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Button, Input, Label } from "../index";

describe("Accessibility (NFR-5)", () => {
  it("form with label and input has no axe violations", async () => {
    const { container } = render(
      <form aria-label="Test form">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" aria-required />
        <Button type="submit">Submit</Button>
      </form>
    );
    const results = await axe(container);
    // vitest-axe extends expect at runtime via vitest.setup.ts
    (expect(results) as unknown as { toHaveNoViolations(): void }).toHaveNoViolations();
  });

  it("button with accessible name has no axe violations", async () => {
    const { container } = render(
      <main>
        <h1>Daily focus</h1>
        <Button type="button" aria-label="Add to focus">
          Add to focus
        </Button>
      </main>
    );
    const results = await axe(container);
    (expect(results) as unknown as { toHaveNoViolations(): void }).toHaveNoViolations();
  });

  it("login-style form (auth flow) has no axe violations", async () => {
    const { container } = render(
      <main>
        <h1>Sign in</h1>
        <p>Sign in to your workspace.</p>
        <form aria-label="Sign in">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" required placeholder="you@example.com" aria-invalid={false} />
          <Label htmlFor="login-password">Password</Label>
          <Input id="login-password" type="password" required aria-invalid={false} />
          <Button type="submit">Sign in</Button>
        </form>
      </main>
    );
    const results = await axe(container);
    (expect(results) as unknown as { toHaveNoViolations(): void }).toHaveNoViolations();
  });
});
