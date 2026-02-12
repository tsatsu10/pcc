import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  heading: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "celebratory";
}

export function EmptyState({
  icon,
  heading,
  description,
  action,
  className = "",
  variant = "default",
}: EmptyStateProps) {
  const isCelebratory = variant === "celebratory";
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 px-4 text-center ${
        isCelebratory ? "text-success" : ""
      } ${className}`.trim()}
    >
      {icon && (
        <div
          className={`mb-3 [&>svg]:!w-10 [&>svg]:!h-10 ${
            isCelebratory ? "text-success" : "text-muted-foreground"
          }`}
        >
          {icon}
        </div>
      )}
      <p
        className={`text-sm font-medium ${
          isCelebratory ? "text-success" : "text-foreground"
        }`}
      >
        {heading}
      </p>
      {description && (
        <p
          className={`mt-1 text-sm max-w-[240px] ${
            isCelebratory ? "text-success/90" : "text-muted-foreground"
          }`}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
