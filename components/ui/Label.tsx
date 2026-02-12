import { forwardRef, type LabelHTMLAttributes } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Show a required indicator (e.g. asterisk) for accessibility and clarity */
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={`block text-sm font-medium text-foreground mb-1 ${className}`.trim()}
      {...props}
    >
      {children}
      {required && (
        <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
      )}
    </label>
  )
);

Label.displayName = "Label";
