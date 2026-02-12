export function FieldError({
  children,
  id,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      id={id}
      className={`text-sm text-destructive mt-1 ${className}`.trim()}
      role="alert"
    >
      {children}
    </p>
  );
}
