import Link from 'next/link';
import { SearchX } from 'lucide-react';

export function EmptyState({ query, related }: { query: string; related: string[] }) {
  return (
    <div className="card-surface p-8 text-center">
      <SearchX aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-orange" />
      <h2 className="font-display text-2xl font-bold">No exact matches for “{query}”</h2>
      <p className="mt-2 text-muted">but try these related skills…</p>
      {related.length > 0 && (
        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {related.map((r) => (
            <li key={r}>
              <Link
                href={`/search?q=${encodeURIComponent(r)}`}
                className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-cyan hover:text-accent"
              >
                {r}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
