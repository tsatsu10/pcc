import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "focus" | "success";
export type ButtonSize = "sm" | "default" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-primary",
  secondary:
    "bg-secondary text-secondary-foreground border border-border hover:bg-accent focus-visible:ring-ring",
  ghost:
    "text-foreground hover:bg-accent focus-visible:ring-ring",
  destructive:
    "bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:ring-destructive",
  focus:
    "bg-focus-active text-focus-active-foreground hover:opacity-90 focus-visible:ring-focus-active",
  success:
    "bg-success text-success-foreground hover:opacity-90 focus-visible:ring-success",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  default: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const baseStyles =
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50 disabled:pointer-events-none";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "default",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={styles}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
