import { type HTMLAttributes } from "react";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

const variantClasses = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

export function ProgressBar({
  value,
  label,
  showPercentage = false,
  size = "md",
  variant = "default",
  className = "",
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));
  
  // Auto-variant based on progress value
  const autoVariant =
    variant === "default"
      ? percentage >= 75
        ? "success"
        : percentage >= 50
        ? "default"
        : percentage >= 25
        ? "warning"
        : "danger"
      : variant;

  return (
    <div className={`w-full ${className}`} {...props}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="text-xs font-medium text-foreground">{percentage}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-muted rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${variantClasses[autoVariant]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
