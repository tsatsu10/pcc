"use client";

import { useState, useId } from "react";
import { Input } from "./Input";
import type { InputProps } from "./Input";

/** Eye icon for "show password" */
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Eye-off icon for "hide password" */
function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export interface PasswordInputProps extends Omit<InputProps, "type"> {}

export function PasswordInput({ className = "", error, id: idProp, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const toggleId = `${inputId}-toggle`;

  return (
    <div className="relative">
      <Input
        id={inputId}
        type={visible ? "text" : "password"}
        error={error}
        className={`pr-10 ${className}`.trim()}
        {...props}
      />
      <button
        id={toggleId}
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="
          absolute right-2 top-1/2 -translate-y-1/2
          p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
          min-w-[44px] min-h-[44px] flex items-center justify-center -my-1
        "
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={0}
      >
        {visible ? (
          <EyeOffIcon className="w-5 h-5" />
        ) : (
          <EyeIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
