'use client';

import { MotionConfig } from 'framer-motion';
import Script from 'next/script';
import { useEffect } from 'react';

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export function Providers({ children }: { children: React.ReactNode }) {
  // Register the service worker (production only; avoids caching during development).
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return (
    // reducedMotion="user" disables transform/opacity animations when the OS asks for reduced motion.
    <MotionConfig reducedMotion="user">
      {children}
      {PLAUSIBLE_DOMAIN && (
        <Script
          src="https://plausible.io/js/script.js"
          data-domain={PLAUSIBLE_DOMAIN}
          strategy="lazyOnload"
        />
      )}
    </MotionConfig>
  );
}
