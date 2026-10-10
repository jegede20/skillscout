import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const DESCRIPTION = 'Your shortcut to any skill. Learn anything. Pay nothing. Free, curated learning resources and an AI-built week-by-week roadmap.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: 'SkillScout — Learn Anything. Pay Nothing.', template: '%s · SkillScout' },
  description: DESCRIPTION,
  applicationName: 'SkillScout',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'SkillScout', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }, { url: '/icons/icon-192.png', type: 'image/png' }],
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'SkillScout',
    title: 'SkillScout — Learn Anything. Pay Nothing.',
    description: DESCRIPTION,
    url: APP_URL,
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'SkillScout' }],
  },
  twitter: { card: 'summary', title: 'SkillScout', description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#FF6B2B',
  width: 'device-width',
  initialScale: 1,
};

// Runs before paint to avoid a light flash for dark-mode users.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen pb-20 md:pb-0">
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Navbar />
          <div id="main-content" tabIndex={-1} className="outline-none">
            {children}
          </div>
          <Footer />
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
