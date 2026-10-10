import { SkeletonCard } from '@/components/ui/Skeleton';

export function LoadingState() {
  return (
    <div>
      <p className="mb-6 flex items-center gap-3 font-display text-2xl font-bold" role="status" aria-live="polite">
        Scouting the best resources for you
        <span aria-hidden="true" className="inline-flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-orange animate-bounceDot"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
