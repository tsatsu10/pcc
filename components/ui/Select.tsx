import { type SelectHTMLAttributes, forwardRef } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
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

Select.displayName = "Select";
