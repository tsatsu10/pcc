import { type InputHTMLAttributes, forwardRef } from "react";

export interface DateInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="date"
          className={`
            h-10 w-full rounded-lg border border-input bg-background px-3 py-2 
            text-sm text-foreground 
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? "border-destructive" : ""}
            ${className}
          `.trim()}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

DateInput.displayName = "DateInput";
