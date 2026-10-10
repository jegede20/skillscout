/** Thin wrapper around Plausible custom events. No-ops if the script is not loaded. */
export type AnalyticsEvent =
  | 'search_performed'
  | 'roadmap_generated'
  | 'resource_clicked'
  | 'roadmap_saved'
  | 'feedback_given'
  | 'onboarding_completed'
  | 'sign_up';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  window.plausible?.(event, props ? { props } : undefined);
}
