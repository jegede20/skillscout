'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function SearchBar({ defaultValue = '', sticky = false }: { defaultValue?: string; sticky?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const term = value.trim();
    if (term.length < 2) {
      setError('Tell us a skill (at least 2 characters).');
      return;
    }
    setError(null);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={`${sticky ? 'sticky top-[64px] z-40 border-b border-line bg-bg/85 py-3 backdrop-blur-md' : ''}`}
    >
      <div className={`${sticky ? 'mx-auto max-w-content px-4' : ''}`}>
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface p-1.5 pl-5 focus-within:border-orange">
          <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-muted" />
          <label htmlFor={sticky ? 'sticky-search' : 'search-input'} className="sr-only">
            Search for a skill
          </label>
          <input
            id={sticky ? 'sticky-search' : 'search-input'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search any skill…"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'search-error' : undefined}
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-fg placeholder:text-muted focus:outline-none"
          />
          <button type="submit" className="btn-primary shrink-0 !px-5 !py-2 text-sm">
            Scout
          </button>
        </div>
        {error && (
          <p id="search-error" role="alert" className="mt-2 pl-5 text-sm text-advanced">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
