/**
 * SkillScout mark: a single stroke that bends into an "S", ending at an orange waypoint.
 * Read it as a route with a destination. The stroke uses currentColor, so it adapts to light and dark themes.
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className} focusable="false">
      <path
        d="M36 11.5C36 4.5 12.5 3.5 12.5 15.2C12.5 25.2 36 22.8 36 33.2C36 44.5 12.5 43.5 12.5 35.5"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="35.5" r="5" fill="#FF6B2B" />
    </svg>
  );
}

/** Mark plus wordmark. Wrap in a link where needed. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8 text-fg" />
      <span className="font-display text-[1.35rem] font-bold leading-none tracking-[-0.035em]">SkillScout</span>
    </span>
  );
}
