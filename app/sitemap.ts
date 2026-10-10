import type { MetadataRoute } from 'next';
import { CATEGORIES } from '@/lib/categories';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Built with Next's native sitemap support (replaces next-sitemap, which is not needed for App Router).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const statics = ['', '/search', '/about', '/auth/signup', '/auth/signin'].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }));
  const categories = CATEGORIES.map((c) => ({
    url: `${BASE}/search?q=${encodeURIComponent(c.name)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
  return [...statics, ...categories];
}
