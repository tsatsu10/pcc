"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastItem = {
  id: number;
  message: string;
  undo?: { label: string; action: () => void };
  variant?: "default" | "success" | "error" | "warning";
};

type ToastContextValue = {
  toast: (opts: { 
    message: string; 
    undo?: { label: string; action: () => void };
    variant?: "default" | "success" | "error" | "warning";
  }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {} };
  return ctx;
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-success/10 border-success/30",
  error: "bg-destructive/10 border-destructive/30",
  warning: "bg-warning/10 border-warning/30",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [nextId, setNextId] = useState(0);

  const toast = useCallback(
    (opts: { 
      message: string; 
      undo?: { label: string; action: () => void };
      variant?: "default" | "success" | "error" | "warning";
    }) => {
      const id = nextId;
      setNextId((n) => n + 1);
      setToasts((prev) => [...prev, { id, variant: opts.variant || "default", ...opts }]);
      const delay = opts.undo ? 5000 : 3000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, delay);
    },
    [nextId]
  );

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleUndo(t: ToastItem) {
    t.undo?.action();
    dismiss(t.id);
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {toasts.map((t, index) => (
          <div
            key={t.id}
            className={`flex items-center justify-between gap-3 rounded-lg border ${variantStyles[t.variant || "default"]} px-4 py-3 shadow-pcc-lg text-sm animate-in slide-in-from-bottom-2 duration-200`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="text-foreground">{t.message}</span>
            <div className="flex items-center gap-2 shrink-0">
              {t.undo && (
                <button
                  type="button"
                  onClick={() => handleUndo(t)}
                  className="text-primary font-medium hover:underline transition-colors duration-150"
                >
                  {t.undo.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
