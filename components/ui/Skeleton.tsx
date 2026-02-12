export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted ${className}`.trim()}
      aria-hidden
    />
  );
}

export function PageSkeleton({ className = "" }: { className?: string } = {}) {
  return (
    <main className={`p-6 sm:p-8 max-w-4xl space-y-6 ${className}`.trim()}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </main>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[75%]" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <main className="p-6 sm:p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="space-y-3">
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </div>
    </main>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}
