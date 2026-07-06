/**
 * Loading placeholder — replaces plain "Loading…" text per Stitch motion spec.
 */
export default function Skeleton({ className = "", lines = 1 }) {
  if (lines === 1) {
    return <div className={`animate-pulse rounded-lg bg-surface-container-highest ${className}`} />;
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg bg-surface-container-highest ${className}`}
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function LotCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-2 w-14" />
        </div>
      </div>
    </div>
  );
}

export function StatRailSkeleton({ count = 3 }) {
  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="min-w-[150px] h-[88px] shrink-0 rounded-xl" />
      ))}
    </div>
  );
}
