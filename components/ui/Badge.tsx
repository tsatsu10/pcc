import { type HTMLAttributes } from "react";

export type BadgeVariant = "backlog" | "focus" | "done" | "postponed" | "overdue" | "default" | "secondary";

const variantStyles: Record<BadgeVariant, string> = {
  backlog: "bg-muted text-muted-foreground",
  focus: "bg-primary/15 text-primary",
  done: "bg-success/15 text-success",
  postponed: "bg-warning/15 text-warning",
  overdue: "bg-destructive/15 text-destructive",
  default: "bg-muted text-muted-foreground",
  secondary: "bg-secondary text-secondary-foreground",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `.trim()}
      {...props}
    />
  );
}
