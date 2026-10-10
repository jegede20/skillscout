'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

/** Shown when a dashboard page throws, instead of a blank screen. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-content px-4 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">Something went wrong</p>
      <h1 className="mt-3 font-display text-4xl font-bold">This page could not load.</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">Try again. If it keeps happening, sign out and back in.</p>
      <button type="button" onClick={reset} className="btn-primary mt-8">
        <RotateCcw aria-hidden="true" className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
