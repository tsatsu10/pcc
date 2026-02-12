"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "./Button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

const FOCUSABLE = "input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])";

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "md",
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !contentRef.current) return;
    const first = contentRef.current.querySelector<HTMLElement>(
      `[data-autofocus], ${FOCUSABLE}`
    );
    first?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-normal animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={`
          relative w-full rounded-xl border border-border bg-background p-6
          shadow-pcc-xl animate-in fade-in scale-in duration-200
          ${maxWidthClasses[maxWidth]}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-semibold text-foreground mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = "" }: ModalFooterProps) {
  return (
    <div
      className={`flex gap-2 justify-end mt-6 pt-4 border-t border-border ${className}`.trim()}
    >
      {children}
    </div>
  );
}
