"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "pcc-theme";
type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "system" as Theme, setTheme: () => {}, resolved: "light" as const };
  return ctx;
}

function getStored(): Theme {
  if (typeof window === "undefined") return "system";
  const s = localStorage.getItem(STORAGE_KEY);
  if (s === "light" || s === "dark" || s === "system") return s;
  return "system";
}

function applyTheme(theme: Theme, prefersDark: boolean) {
  const root = document.documentElement;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  if (dark) root.classList.add("dark");
  else root.classList.remove("dark");
  return dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getStored());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const r = applyTheme(theme, prefersDark);
    setResolved(r);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (theme === "system") setResolved(applyTheme("system", mq.matches));
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [theme, mounted]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setResolved(applyTheme(t, prefersDark));
  }, []);

  const value: ThemeContextValue = { theme, setTheme, resolved };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
