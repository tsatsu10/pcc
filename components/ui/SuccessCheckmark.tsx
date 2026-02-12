"use client";

import { useEffect, useRef } from "react";

export function SuccessCheckmark({
  visible,
  onComplete,
  durationMs = 1500,
}: {
  visible: boolean;
  onComplete: () => void;
  durationMs?: number;
}) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      onCompleteRef.current();
    }, durationMs);
    return () => clearTimeout(t);
  }, [visible, durationMs]);

  if (!visible) return null;

  return (
    <div
      className="success-checkmark-wrap pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Task completed"
    >
      <div className="success-checkmark-inner rounded-full bg-success/90 p-4 text-success-foreground shadow-pcc-xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="block"
          aria-hidden
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </div>
  );
}
