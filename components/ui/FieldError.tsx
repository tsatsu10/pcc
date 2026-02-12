import { forwardRef } from "react";

export const FieldError = forwardRef<
  HTMLParagraphElement,
  {
    children: React.ReactNode;
    id?: string;
    className?: string;
    tabIndex?: number;
  }
>(function FieldError({ children, id, className = "", tabIndex, ...props }, ref) {
  if (!children) return null;
  return (
    <p
      ref={ref}
      id={id}
      tabIndex={tabIndex}
      className={`text-sm text-destructive mt-1 ${className}`.trim()}
      role="alert"
      {...props}
    >
      {children}
    </p>
  );
});
