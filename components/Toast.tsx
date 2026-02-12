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
};

type ToastContextValue = {
  toast: (opts: { message: string; undo?: { label: string; action: () => void } }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {} };
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [nextId, setNextId] = useState(0);

  const toast = useCallback(
    (opts: { message: string; undo?: { label: string; action: () => void } }) => {
      const id = nextId;
      setNextId((n) => n + 1);
      setToasts((prev) => [...prev, { id, ...opts }]);
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
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-pcc-lg text-sm"
          >
            <span className="text-foreground">{t.message}</span>
            <div className="flex items-center gap-2 shrink-0">
              {t.undo && (
                <button
                  type="button"
                  onClick={() => handleUndo(t)}
                  className="text-primary font-medium hover:underline"
                >
                  {t.undo.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground"
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
