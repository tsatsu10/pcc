"use client";

interface AuthCardProps {
  children: React.ReactNode;
  /** Card title (e.g. "Sign in", "Create your account") */
  title: string;
  /** Short subtitle below the title */
  subtitle?: string;
  /** Optional extra content above the form (e.g. success message) */
  topMessage?: React.ReactNode;
  /** Footer link line (e.g. "Don't have an account? Sign up") */
  footer: React.ReactNode;
}

export function AuthCard({ children, title, subtitle, topMessage, footer }: AuthCardProps) {
  const titleId = "auth-card-title";
  return (
    <section
      aria-labelledby={titleId}
      className="
        rounded-2xl border border-border bg-card text-card-foreground
        shadow-pcc-lg dark:shadow-pcc-dark
        p-6 sm:p-8
      "
    >
      <h1 id={titleId} className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
      {topMessage && <div className="mt-4">{topMessage}</div>}
      <div className="mt-6">{children}</div>
      <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground [&_a]:inline-flex [&_a]:py-2 [&_a]:px-3 [&_a]:min-h-[44px] [&_a]:min-w-[44px] [&_a]:items-center [&_a]:justify-center [&_a]:rounded [&_a]:focus:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2 [&_a]:focus-visible:ring-offset-background">
        {footer}
      </div>
    </section>
  );
}
