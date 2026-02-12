"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcuts for PCC
 * 
 * Shortcuts:
 * - g d: Go to Dashboard
 * - g f: Go to Daily Focus
 * - g p: Go to Projects
 * - g t: Go to Tasks
 * - g a: Go to Analytics
 * - ?: Show help (future)
 */

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let lastKey = "";
    const timeout = 1000; // 1 second to complete sequence
    let timer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Handle 'g' as first key (like Gmail/GitHub)
      if (e.key === "g") {
        lastKey = "g";
        clearTimeout(timer);
        timer = setTimeout(() => {
          lastKey = "";
        }, timeout);
        return;
      }

      // Handle second key after 'g'
      if (lastKey === "g") {
        clearTimeout(timer);
        lastKey = "";

        switch (e.key) {
          case "d":
            router.push("/dashboard");
            break;
          case "f":
            router.push("/dashboard/focus");
            break;
          case "p":
            router.push("/dashboard/projects");
            break;
          case "t":
            router.push("/dashboard/tasks");
            break;
          case "a":
            router.push("/dashboard/analytics");
            break;
          case "r":
            router.push("/dashboard/review");
            break;
        }
      }

      // Command+K / Ctrl+K for command palette (future)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("pcc:open-command-palette"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [router]);

  return null; // No visual component, just event handling
}
