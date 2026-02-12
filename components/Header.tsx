"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type ReviewStatus = {
  dailyRequired: boolean;
  weeklyRequired: boolean;
  monthlyRequired: boolean;
};

const NAV_LINKS: Array<{ href: string; label: string; reviewKey?: boolean; title: string }> = [
  { href: "/dashboard", label: "Dashboard", title: "Home and today's overview" },
  { href: "/dashboard/domains", label: "Domains", title: "Life areas (work, health, etc.)" },
  { href: "/dashboard/projects", label: "Projects", title: "Projects under domains" },
  { href: "/dashboard/tasks", label: "Tasks", title: "All tasks across projects" },
  { href: "/dashboard/knowledge", label: "Knowledge", title: "Notes and references" },
  { href: "/dashboard/focus", label: "Daily focus", title: "Today's 3 focus tasks and timer" },
  { href: "/dashboard/review", label: "Reviews", reviewKey: true, title: "Daily, weekly, monthly, and backlog reviews" },
  { href: "/dashboard/analytics", label: "Analytics", title: "Completion and focus stats" },
  { href: "/dashboard/milestones", label: "Milestones", title: "Unlocked accomplishments and progress" },
];

type HeaderVariant = "minimal" | "full";

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function Header({ variant = "full" }: { variant?: HeaderVariant }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant === "full") {
      fetch("/api/review/status")
        .then((r) => (r.ok ? r.json() : null))
        .then(setReviewStatus)
        .catch(() => setReviewStatus(null));
    }
  }, [variant]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    if (userOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [userOpen]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/review") return pathname.startsWith("/dashboard/review");
    return pathname.startsWith(href);
  }

  const reviewsDue = reviewStatus && (reviewStatus.dailyRequired || reviewStatus.weeklyRequired || reviewStatus.monthlyRequired);

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {NAV_LINKS.map(({ href, label, reviewKey, title }) => {
        const active = isActive(href);
        const showBadge = reviewKey && reviewsDue;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            title={title}
            className={`
              h-10 flex items-center gap-1.5 px-2 sm:px-2.5 text-sm font-medium
              transition-colors rounded-md
              hover:text-foreground hover:bg-accent/50
              ${mobile ? "w-full justify-start" : "shrink-0"}
              ${active ? "text-foreground bg-accent" : "text-muted-foreground"}
            `}
          >
            {label}
            {showBadge && (
              <span
                className="w-2 h-2 rounded-full bg-warning shrink-0"
                title="Review due"
                aria-hidden
              />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-pcc">
        <div className="flex items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50"
              aria-label="Open navigation menu"
            >
              <MenuIcon />
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
            >
              <img src="/pcc-logo.svg" alt="" className="h-7 w-7" aria-hidden />
              PCC
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("pcc:open-command-palette"))}
              className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              title="Open command palette (⌘K)"
              aria-label="Open command palette"
            >
              <SearchIcon />
              <kbd className="font-mono">⌘K</kbd>
            </button>
          </div>

          {variant === "full" && (
            <nav className="hidden md:flex flex-1 min-w-0 justify-center">
              <div className="flex items-center gap-0.5 py-1">
                <NavLinks />
              </div>
            </nav>
          )}

          <div className="flex items-center gap-2 shrink-0" ref={userRef}>
            <ThemeToggle />
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-expanded={userOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <span
                  className="w-9 h-9 rounded-full bg-primary/15 text-primary font-medium text-sm flex items-center justify-center shrink-0"
                  aria-hidden
                >
                  {getInitials(session?.user?.name, session?.user?.email)}
                </span>
              </button>
              {userOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 py-1 rounded-lg border border-border bg-popover shadow-pcc-lg z-50"
                  role="menu"
                >
                  <Link
                    href="/profile"
                    onClick={() => setUserOpen(false)}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    role="menuitem"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {variant === "full" && mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-card border-l border-border shadow-pcc-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <img src="/pcc-logo.svg" alt="" className="h-6 w-6" aria-hidden />
                <span className="font-semibold text-foreground">PCC</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50"
                aria-label="Close navigation menu"
              >
                <XIcon />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1 overflow-y-auto">
              <NavLinks mobile />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
