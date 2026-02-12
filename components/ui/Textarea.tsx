import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`
        min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm
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

Textarea.displayName = "Textarea";
