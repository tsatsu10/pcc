import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => (
    <input
      ref={ref}
      className={`
        h-10 w-full rounded-lg border px-3 py-2 text-sm
        bg-background text-foreground placeholder:text-muted-foreground
        transition-colors duration-fast
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
        disabled:cursor-not-allowed disabled:opacity-50
        ${error ? "border-destructive" : "border-input"}
        ${className}
      `.trim()}
      {...props}
    />
  )
);

Input.displayName = "Input";
