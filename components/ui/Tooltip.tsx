"use client";

import { type ReactNode, useState } from "react";

export interface TooltipProps {
  children: ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children, content, side = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <span
          role="tooltip"
          className={`absolute z-[100] min-w-[8rem] max-w-[20rem] px-3 py-2 text-sm text-popover-foreground bg-popover border border-border rounded-lg shadow-lg pointer-events-none ${positionClasses[side]}`}
        >
          {content}
        </span>
      )}
    </div>
  );
}
