import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Background: gradient orbs + grid */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,hsl(var(--primary)/0.06),transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        {/* Logo + eyebrow */}
        <div className="flex flex-col items-center gap-4 mb-2">
          <img
            src="/pcc-logo.svg"
            alt="PCC"
            className="h-12 w-12 opacity-90 animate-in fade-in duration-300"
          />
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
              Personal Command Center
            </p>
            <Tooltip
              content="Domains, projects, 3 daily focus tasks, and reviews—all in one place."
              side="top"
            >
              <button
                type="button"
                className="flex items-center justify-center w-6 h-6 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="What is PCC?"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center animate-in fade-in duration-500">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl md:tracking-[-0.02em] leading-[1.1]">
            Your life, one system.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            Plan less. Focus on three. Review and learn.
          </p>
        </div>

        {/* Visual: "three" focus metaphor */}
        <div className="mt-10 flex justify-center gap-2 animate-in slide-in-from-bottom-2 duration-500" aria-hidden>
          <span className="h-2 w-7 rounded-full bg-primary/20 dark:bg-primary/30" />
          <span className="h-2 w-10 rounded-full bg-primary/25 dark:bg-primary/35" />
          <span className="h-2 w-7 rounded-full bg-primary/20 dark:bg-primary/30" />
        </div>

        {/* Value + CTA block */}
        <div className="mt-12 sm:mt-14 text-center animate-in fade-in duration-500">
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            One place for domains, projects, and today’s three focus tasks. No overload—just clarity.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:px-8 text-base font-medium shadow-lg">
                Get started
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:px-8 text-base">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        {/* Features card */}
        <div className="mt-16 sm:mt-20 mx-auto max-w-lg animate-in slide-in-from-bottom-2 duration-500">
          <div className="rounded-2xl border border-border/80 bg-card/50 dark:bg-card/30 backdrop-blur-sm px-6 sm:px-8 py-6 sm:py-7 shadow-sm">
            <ul className="space-y-4" role="list">
              <li className="flex items-start gap-4 text-left">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  1
                </span>
                <div>
                  <span className="font-medium text-foreground">Max 3 focus tasks per day</span>
                  <span className="text-muted-foreground"> — Hard limit so you execute, not plan.</span>
                </div>
              </li>
              <li className="flex items-start gap-4 text-left">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  2
                </span>
                <div>
                  <span className="font-medium text-foreground">Daily and weekly reviews</span>
                  <span className="text-muted-foreground"> — Turn action into insight.</span>
                </div>
              </li>
              <li className="flex items-start gap-4 text-left">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  3
                </span>
                <div>
                  <span className="font-medium text-foreground">Domains, projects, tasks</span>
                  <span className="text-muted-foreground"> — All in one place.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
