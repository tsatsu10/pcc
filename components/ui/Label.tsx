import { forwardRef, type LabelHTMLAttributes } from "react";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = "", ...props }, ref) => (
    <label
      ref={ref}
      className={`block text-sm font-medium text-foreground mb-1 ${className}`.trim()}
      {...props}
    />
  )
);

Label.displayName = "Label";
