import { CATEGORIES } from '@/lib/categories';
import { RESOURCES } from '@/lib/data/resources';
import type { CategoryId, Difficulty, Filters, Resource } from '@/lib/types';

const STOP = new Set([
  'i', 'want', 'to', 'learn', 'how', 'a', 'an', 'the', 'for', 'of', 'and', 'in', 'on', 'get',
  'job', 'be', 'become', 'with', 'my', 'some', 'is', 'at', 'do', 'make', 'it', 'like', 'fun',
  'skill', 'skills', 'course', 'courses', 'learning', 'basics', 'beginner', 'advanced', 'intermediate',
  'like', 'pro', 'tech', 'way', 'best',
]);

// Short forms users type -> the words our tags use.
const SYNONYMS: Record<string, string[]> = {
  js: ['javascript'],
  ts: ['typescript'],
  ml: ['machine learning'],
  ai: ['artificial intelligence'],
  ux: ['ux design'],
  ui: ['ui design'],
  seo: ['seo'],
  k8s: ['kubernetes'],
  py: ['python'],
};

// Keyword hints that point a free-text query at a category ("guitar" -> music).
const CATEGORY_HINTS: Partial<Record<CategoryId, string[]>> = {
  programming: ['coding', 'code', 'developer', 'software', 'engineer', 'algorithms', 'programming', 'tech', 'technology', 'career', 'job'],
  'web-development': ['website', 'web', 'frontend', 'front-end', 'backend', 'react', 'html', 'css', 'node'],
  'data-science': ['data', 'analytics', 'pandas', 'sql', 'statistics', 'excel', 'visualization'],
  'ai-ml': ['ai', 'ml', 'machine learning', 'deep learning', 'neural', 'llm', 'chatbot'],
  'ui-ux-design': ['ux', 'ui', 'figma', 'user research', 'product design', 'usability'],
  'graphic-design': ['photoshop', 'illustrator', 'logo', 'typography', 'branding', 'canva'],
  'digital-marketing': ['marketing', 'seo', 'social media', 'ads', 'growth', 'content marketing'],
  photography: ['camera', 'photo', 'photos', 'lightroom', 'lens', 'exposure'],
  'video-editing': ['video', 'videos', 'premiere', 'davinci', 'youtube', 'editing', 'edit', 'editor', 'film'],
  'music-production': ['music', 'guitar', 'piano', 'singing', 'drums', 'beats', 'audio', 'daw', 'ableton'],
  'foreign-languages': ['language', 'languages', 'spanish', 'french', 'german', 'japanese', 'mandarin', 'italian', 'portuguese'],
  'personal-finance': ['money', 'budget', 'budgeting', 'invest', 'investing', 'finance', 'savings', 'debt'],
  cooking: ['recipe', 'recipes', 'kitchen', 'baking', 'chef', 'food'],
  fitness: ['workout', 'gym', 'exercise', 'yoga', 'running', 'strength', 'muscle'],
  'public-speaking': ['speech', 'presentation', 'speak', 'speaking', 'debate', 'pitch'],
  'creative-writing': ['writing', 'novel', 'story', 'fiction', 'poetry', 'screenwriting', 'poem'],
  cybersecurity: ['security', 'hacking', 'pentest', 'penetration', 'ethical hacking', 'infosec'],
  'cloud-computing': ['cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'terraform', 'serverless'],
};

const DIFF_ORDER: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Category ids a free-text query maps to. Used to label history rows that come from the server. */
export function categoriesForQuery(query: string): CategoryId[] {
  const norm = normalizeQuery(query);
  return matchCategories(norm, tokenize(norm));
}

export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(norm: string): string[] {
  return norm
    .split(/[\s,/]+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function matchCategories(norm: string, tokens: string[]): CategoryId[] {
  const hits: CategoryId[] = [];
  const allWords = norm.split(/[\s,/]+/);
  for (const [cat, words] of Object.entries(CATEGORY_HINTS) as [CategoryId, string[]][]) {
    const hit = words.some((w) => (w.includes(' ') ? norm.includes(w) : allWords.includes(w) || tokens.includes(w)));
    if (hit) hits.push(cat);
  }
  // Also match category names themselves, e.g. "photography" or "ui/ux".
  for (const c of CATEGORIES) {
    const name = c.name.toLowerCase();
    if (norm.includes(name) || tokens.some((t) => name.split(/[\s/]+/).includes(t))) {
      if (!hits.includes(c.id)) hits.push(c.id);
    }
  }
  return hits;
}

const MIN_SCORE = 3;

function hasWord(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(text);
}

function passes(res: Resource, f: Filters): boolean {
  if (f.difficulty && res.difficulty !== f.difficulty) return false;
  if (f.format && res.format !== f.format) return false;
  if (f.duration === 'short' && res.durationHours > 5) return false;
  if (f.duration === 'medium' && (res.durationHours <= 5 || res.durationHours > 30)) return false;
  if (f.duration === 'long' && res.durationHours <= 30) return false;
  return true;
}

export interface SearchResult {
  resources: Resource[];
  exactMatch: boolean;
  relatedSkills: string[];
  categoryIds: CategoryId[];
}

/** Ranks resources for a free-text query. Pure function: safe to unit test. */
export function searchResources(query: string, filters: Filters = {}, limit = 24): SearchResult {
  const norm = normalizeQuery(query);
  const baseTokens = tokenize(norm);
  const tokens = new Set(baseTokens);
  for (const t of baseTokens) for (const s of SYNONYMS[t] ?? []) tokens.add(s);
  const categoryIds = matchCategories(norm, baseTokens);
  const termList = [...tokens];

  const scored: { res: Resource; score: number }[] = [];
  for (const res of RESOURCES) {
    if (!passes(res, filters)) continue;
    const tags = res.skillTags.map((t) => t.toLowerCase());
    const title = res.title.toLowerCase();
    const desc = res.description.toLowerCase();
    let score = 0;

    for (const term of termList) {
      if (tags.includes(term)) score += 6;
      else if (term.length >= 5 && tags.some((t) => t.split(' ').some((w) => w.startsWith(term)))) score += 3;
      if (hasWord(title, term)) score += 4;
      if (term.length >= 4 && hasWord(desc, term)) score += 1;
    }
    if (tags.includes(norm)) score += 10; // full-phrase exact match
    if (categoryIds.includes(res.category)) score += 4;
    // Description-only hits (score < 3) are too noisy to count as a match.
    if (score >= MIN_SCORE) scored.push({ res, score });
  }

  scored.sort((a, b) => b.score - a.score || b.res.qualityScore - a.res.qualityScore);
  const top = scored[0]?.score ?? 0;

  if (scored.length > 0) {
    return {
      resources: scored.slice(0, limit).map((s) => s.res),
      exactMatch: top >= 6,
      relatedSkills: [],
      categoryIds,
    };
  }

  // No match: show the best-quality resources from related categories (or overall) as a fallback.
  const pool = RESOURCES.filter((res) => passes(res, filters));
  const fallback = pool
    .slice()
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .filter((res) => categoryIds.length === 0 || categoryIds.includes(res.category))
    .slice(0, 6);
  const relatedSkills = CATEGORIES.filter((c) => !categoryIds.includes(c.id))
    .slice(0, 6)
    .map((c) => c.name);

  return {
    resources: fallback.length ? fallback : pool.slice(0, 6),
    exactMatch: false,
    relatedSkills,
    categoryIds,
  };
}

/** Human-friendly skill name from a free-text query, e.g. "I want to learn guitar" -> "Guitar". */
export function deriveSkillName(query: string): string {
  const tokens = tokenize(normalizeQuery(query));
  const words = (tokens.length ? tokens : normalizeQuery(query).split(' ')).slice(0, 4);
  return words
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
    .slice(0, 80) || 'Your Skill';
}

export function bucketOf(hours: number): 'short' | 'medium' | 'long' {
  return hours <= 5 ? 'short' : hours <= 30 ? 'medium' : 'long';
}

export function diffRank(d: Difficulty): number {
  return DIFF_ORDER[d];
}
