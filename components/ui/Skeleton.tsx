export function SkeletonCard() {
  return (
    <div className="card-surface p-5" aria-hidden="true">
      <div className="skeleton mb-4 h-4 w-24 rounded-full" />
      <div className="skeleton mb-3 h-6 w-4/5 rounded-md" />
      <div className="skeleton mb-2 h-3 w-full rounded" />
      <div className="skeleton mb-5 h-3 w-2/3 rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton h-4 rounded ${className}`} />;
}
