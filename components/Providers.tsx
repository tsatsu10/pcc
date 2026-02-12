"use client";

import { SessionProvider } from "next-auth/react";
import { CommandPalette } from "@/components/CommandPalette";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          {children}
          <CommandPalette />
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
