import { type HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        rounded-lg border border-border bg-card p-6 text-card-foreground
        shadow-pcc
        ${className}
      `.trim()}
      {...props}
    />
  );
}

export function CardHeader({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 ${className}`.trim()} {...props} />;
}

export function CardTitle({
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-lg font-semibold text-foreground ${className}`.trim()}
      {...props}
    />
  );
}

export function CardContent({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={className.trim()} {...props} />;
}
