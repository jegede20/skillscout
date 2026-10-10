import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { RESOURCES } from '@/lib/data/resources';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsCounter } from '@/components/landing/StatsCounter';
import { CategoryGrid } from '@/components/landing/CategoryGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CTABanner } from '@/components/landing/CTABanner';

export const metadata: Metadata = {
  title: 'Learn Anything. Pay Nothing.',
  description: 'Describe any skill and get a curated list of free resources plus an AI-built week-by-week learning roadmap.',
  alternates: { canonical: '/' },
};

const learnersEnv = Number(process.env.NEXT_PUBLIC_LEARNER_COUNT);
const LEARNERS = Number.isFinite(learnersEnv) && learnersEnv > 0 ? learnersEnv : null;

export default function HomePage() {
  const skillCount = new Set(RESOURCES.flatMap((r) => r.skillTags)).size;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: 'SkillScout', url: siteUrl, description: metadata.description, inLanguage: 'en' },
      { '@type': 'Organization', name: 'SkillScout', url: siteUrl, logo: `${siteUrl}/icons/icon-512.png` },
    ],
  };

  return (
    <main className="space-y-28 pb-10 md:space-y-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HeroSection resourceCount={RESOURCES.length} />
      <StatsCounter resources={RESOURCES.length} skills={skillCount} learners={LEARNERS} />

      <section aria-labelledby="cats-title" className="mx-auto max-w-content px-4">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 id="cats-title" className="font-display text-4xl font-bold tracking-tight md:text-6xl">
            Pick a <span className="text-accent">world</span> to explore
          </h2>
          <p className="max-w-sm text-muted">{CATEGORIES.length} categories, from first line of code to first guitar chord.</p>
        </div>
        <CategoryGrid categories={CATEGORIES} />
      </section>

      <HowItWorks />
      <CTABanner />

      <p className="sr-only">
        <Link href="/search">Search all skills</Link>
      </p>
    </main>
  );
}
