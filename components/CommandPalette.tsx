"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Command = {
  id: string;
  label: string;
  shortcut?: string;
  href?: string;
  group: "navigate" | "actions";
};

const COMMANDS: Command[] = [
  { id: "home", label: "Home", href: "/", group: "navigate" },
  { id: "login", label: "Log in", href: "/auth/login", group: "navigate" },
  { id: "register", label: "Sign up", href: "/auth/register", group: "navigate" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", group: "navigate", shortcut: "g d" },
  { id: "focus", label: "Today's Focus", href: "/dashboard/focus", group: "navigate", shortcut: "g f" },
  { id: "tasks", label: "Tasks", href: "/dashboard/tasks", group: "navigate", shortcut: "g t" },
  { id: "projects", label: "Projects", href: "/dashboard/projects", group: "navigate", shortcut: "g p" },
  { id: "domains", label: "Domains", href: "/dashboard/domains", group: "navigate" },
  { id: "knowledge", label: "Knowledge", href: "/dashboard/knowledge", group: "navigate" },
  { id: "review-hub", label: "Reviews", href: "/dashboard/review", group: "navigate", shortcut: "g r" },
  { id: "review-daily", label: "Daily Review", href: "/dashboard/review/daily", group: "navigate" },
  { id: "review-backlog", label: "Backlog Review", href: "/dashboard/review/backlog", group: "navigate" },
  { id: "review-monthly", label: "Monthly Review", href: "/dashboard/review/monthly", group: "navigate" },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics", group: "navigate", shortcut: "g a" },
  { id: "profile", label: "Profile", href: "/profile", group: "navigate" },
  { id: "new-task", label: "New task", href: "/dashboard/tasks?new=1", group: "actions" },
  { id: "set-focus", label: "Set today's focus", href: "/dashboard/focus", group: "actions", shortcut: "g f" },
];

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { status } = useSession();

  const loggedIn = status === "authenticated";
  const commands = loggedIn
    ? COMMANDS.filter((c) => !["home", "login", "register"].includes(c.id))
    : COMMANDS.filter((c) => ["home", "login", "register", "dashboard"].includes(c.id));

  const filtered = query.trim()
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase().trim())
      )
    : commands;

  const runSelected = useCallback(() => {
    const cmd = filtered[selected];
    if (cmd?.href) {
      setOpen(false);
      setQuery("");
      setSelected(0);
      router.push(cmd.href);
    }
  }, [filtered, selected, router]);

  useEffect(() => {
    function togglePalette() {
      setOpen((o) => {
        const next = !o;
        if (next) {
          setQuery("");
          setSelected(0);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return next;
      });
    }
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        togglePalette();
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => (s + 1) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => (s - 1 + filtered.length) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        runSelected();
      }
    }
    function onOpenEvent() {
      setOpen(true);
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pcc:open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pcc:open-command-palette", onOpenEvent);
    };
  }, [open, filtered, runSelected]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const item = el.querySelector(`[data-index="${selected}"]`);
    item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected, filtered]);

  if (!open) return null;

  const navItems = filtered.filter((c) => c.group === "navigate");
  const actionItems = filtered.filter((c) => c.group === "actions");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/20 backdrop-blur-[2px]"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-card shadow-pcc-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or run a command…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            aria-label="Search commands"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
            ESC
          </kbd>
        </div>
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto py-2"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No commands match &quot;{query}&quot;
            </p>
          ) : (
            <>
              {navItems.length > 0 && (
                <div className="px-2 pb-1">
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Navigate
                  </p>
                  {navItems.map((cmd, i) => {
                    const flatIdx = filtered.indexOf(cmd);
                    const isSelected = flatIdx === selected;
                    return (
                      <button
                        key={cmd.id}
                        data-index={flatIdx}
                        onClick={() => cmd.href && router.push(cmd.href) && setOpen(false)}
                        onMouseEnter={() => setSelected(flatIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          isSelected
                            ? "bg-accent text-foreground"
                            : "text-foreground hover:bg-accent/50"
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="flex-1">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="text-xs text-muted-foreground font-mono px-1.5 py-0.5 rounded bg-muted/70">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {actionItems.length > 0 && (
                <div className="px-2 pt-2 border-t border-border mt-2">
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </p>
                  {actionItems.map((cmd, i) => {
                    const flatIdx = filtered.indexOf(cmd);
                    const isSelected = flatIdx === selected;
                    return (
                      <button
                        key={cmd.id}
                        data-index={flatIdx}
                        onClick={() => cmd.href && router.push(cmd.href) && setOpen(false)}
                        onMouseEnter={() => setSelected(flatIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          isSelected
                            ? "bg-accent text-foreground"
                            : "text-foreground hover:bg-accent/50"
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="flex-1">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="text-xs text-muted-foreground font-mono px-1.5 py-0.5 rounded bg-muted/70">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>↑↓ to move · Enter to run</span>
          <span className="hidden sm:inline">⌘K to open</span>
        </div>
      </div>
    </div>
  );
}
