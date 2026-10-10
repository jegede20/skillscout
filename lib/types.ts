export const CATEGORY_IDS = [
  'programming',
  'web-development',
  'data-science',
  'ai-ml',
  'ui-ux-design',
  'graphic-design',
  'digital-marketing',
  'photography',
  'video-editing',
  'music-production',
  'foreign-languages',
  'personal-finance',
  'cooking',
  'fitness',
  'public-speaking',
  'creative-writing',
  'cybersecurity',
  'cloud-computing',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Format = 'video' | 'text' | 'interactive' | 'podcast' | 'course' | 'book';
export type DurationBucket = 'short' | 'medium' | 'long';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string; // lucide icon name, mapped in components/ui/CategoryIcon.tsx
  blurb: string;
}

export interface Resource {
  id: string;
  title: string;
  platform: string;
  url: string;
  description: string;
  skillTags: string[];
  category: CategoryId;
  subcategory?: string;
  format: Format;
  difficulty: Difficulty;
  durationHours: number;
  prerequisites: string[];
  qualityScore: number;
  isFree: true;
  isVerified: true;
}

export interface Filters {
  difficulty?: Difficulty;
  format?: Format;
  duration?: DurationBucket;
}

export interface RoadmapResource {
  resourceId: string;
  title: string;
  platform: string;
  url: string; // always taken from the verified DB, never from the AI
  estimatedHours: number;
  action: string;
}

export interface RoadmapWeek {
  week: number;
  title: string;
  topics: string[];
  resources: RoadmapResource[];
  milestone: string;
}

export interface Roadmap {
  skillName: string;
  difficulty: Difficulty;
  estimatedTotalHours: number;
  prerequisites: string[];
  weeklyRoadmap: RoadmapWeek[];
  notes?: string;
  source: 'ai' | 'template';
}

export type RoadmapStatus = 'ai' | 'fallback' | 'timeout' | 'rate_limited';

export interface SearchResponse {
  cacheKey: string;
  query: string;
  exactMatch: boolean;
  relatedSkills: string[];
  categoryIds: CategoryId[];
  resources: Resource[];
  roadmap: Roadmap;
  roadmapStatus: RoadmapStatus;
  prerequisites: string[];
  estimatedHours: number;
  difficulty: Difficulty;
  cached: boolean;
  tookMs: number;
}
