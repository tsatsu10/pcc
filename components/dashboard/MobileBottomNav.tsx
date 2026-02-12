"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: Array<{ href: string; label: string; pathMatch?: string | null }> = [
  { href: "/dashboard", label: "Home", pathMatch: "/dashboard" },
  { href: "/dashboard/focus", label: "Focus", pathMatch: "/dashboard/focus" },
  { href: "/dashboard/tasks", label: "Tasks", pathMatch: "/dashboard/tasks" },
  { href: "/dashboard/review", label: "Reviews", pathMatch: "/dashboard/review" },
  { href: "/dashboard/analytics", label: "Analytics", pathMatch: "/dashboard/analytics" },
  { href: "#", label: "More", pathMatch: null },
];

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function FocusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function TasksIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function ReviewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function AnalyticsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

const icons = [HomeIcon, FocusIcon, TasksIcon, ReviewIcon, AnalyticsIcon, MoreIcon];

const moreLinks = [
  { href: "/dashboard/domains", label: "Domains" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/knowledge", label: "Knowledge" },
  { href: "/dashboard/milestones", label: "Milestones" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-14">
          {navItems.map((item, i) => {
            const isMore = item.pathMatch === null;
            const isActive =
              !isMore &&
              (item.pathMatch === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.pathMatch ?? item.href));
            const Icon = icons[i];
            if (isMore) {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-2 px-1 rounded-lg transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-haspopup="dialog"
                  aria-expanded={moreOpen}
                  aria-label="More menu"
                >
                  <MoreIcon />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-2 px-1 rounded-lg transition-colors ${
                  isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="More menu"
        >
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-xl border-t border-border bg-background shadow-lg animate-in slide-in-from-bottom duration-200 pb-[env(safe-area-inset-bottom)]">
            <div className="p-4 pt-3">
              <p className="text-sm font-medium text-muted-foreground mb-3">Structure</p>
              <ul className="space-y-1">
                {moreLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className="block rounded-lg py-3 px-3 text-foreground font-medium hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
