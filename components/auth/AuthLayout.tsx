"use client";

import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Id of the main form (e.g. "login-form") for skip link */
  formId?: string;
  /** Accessible label for skip link (e.g. "Skip to sign in form") */
  skipToFormLabel?: string;
}

export function AuthLayout({
  children,
  formId,
  skipToFormLabel,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Subtle gradient background (no image, no split) */}
      <div
        className="fixed inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/20"
        aria-hidden
      />

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 relative">
        {/* Skip link — first focusable for keyboard/screen reader */}
        {formId && skipToFormLabel && (
          <a
            href={`#${formId}`}
            className="
              sr-only
              focus:absolute focus:top-4 focus:left-6 focus:z-20 focus:px-4 focus:py-2
              focus:w-auto focus:h-auto focus:overflow-visible focus:m-0 focus:[clip:auto]
              focus:rounded-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
              bg-background text-foreground text-sm font-medium
            "
          >
            {skipToFormLabel}
          </a>
        )}

        {/* Logo + PCC at top */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg py-2 pr-2 text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background mb-8"
        >
          <img src="/pcc-logo.svg" alt="PCC" className="h-10 w-10 opacity-90" />
          <span className="text-xl font-semibold tracking-tight">PCC</span>
        </Link>

        {/* Form card — single column, centered */}
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </main>
  );
}
