import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { searchBodySchema } from '@/lib/schemas';
import { searchResources, normalizeQuery, deriveSkillName } from '@/lib/search';
import { generateAIRoadmap, sanitizeAIRoadmap, buildTemplateRoadmap, statusFromOutcome } from '@/lib/roadmap';
import { cacheGet, cacheSet, allowAIRequest } from '@/lib/cache';
import type { Filters, SearchResponse, RoadmapStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_MS = 24 * 60 * 60 * 1000; // spec: 24h cache

function clientId(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'anon';
}

export async function POST(req: Request) {
  const started = Date.now();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }
  const parsed = searchBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }

  const { query, level, filters = {} } = parsed.data as { query: string; level?: SearchResponse['difficulty']; filters?: Filters };
  const effectiveLevel = level ?? filters.difficulty ?? 'beginner';

  // 1. Normalise + hash -> cache key
  const norm = normalizeQuery(query);
  const cacheKey = createHash('sha256')
    .update(`${norm}|${effectiveLevel}|${JSON.stringify(filters)}`)
    .digest('hex');

  // 2. Cache hit -> return immediately
  const cached = await cacheGet<SearchResponse>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true, tookMs: Date.now() - started }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // 3. Query the verified catalogue (full-text-style ranking with filters)
  const found = searchResources(query, filters);
  const skillName = deriveSkillName(query);

  // 4. Roadmap: AI if allowed, otherwise verified template
  let roadmapStatus: RoadmapStatus;
  let roadmap;
  if (found.resources.length === 0) {
    roadmap = buildTemplateRoadmap(skillName, effectiveLevel, []);
    roadmapStatus = 'fallback';
  } else if (!process.env.GROQ_API_KEY) {
    // AI disabled: template only, and no rate-limit budget is spent.
    roadmap = buildTemplateRoadmap(skillName, effectiveLevel, found.resources.slice(0, 8));
    roadmapStatus = 'fallback';
  } else if (!(await allowAIRequest(clientId(req)))) {
    roadmap = buildTemplateRoadmap(skillName, effectiveLevel, found.resources.slice(0, 8));
    roadmapStatus = 'rate_limited';
  } else {
    const outcome = await generateAIRoadmap({
      query,
      level: effectiveLevel,
      resources: found.resources.slice(0, 12),
    });
    if (outcome.ok) {
      roadmap = sanitizeAIRoadmap(outcome.data, found.resources);
      // If the AI ended up referencing nothing valid, fall back to the template rather than show an empty plan.
      if (roadmap.weeklyRoadmap.every((w) => w.resources.length === 0)) {
        roadmap = buildTemplateRoadmap(roadmap.skillName || skillName, effectiveLevel, found.resources.slice(0, 8));
        roadmapStatus = 'fallback';
      } else {
        roadmapStatus = 'ai';
      }
    } else {
      roadmap = buildTemplateRoadmap(skillName, effectiveLevel, found.resources.slice(0, 8));
      roadmapStatus = statusFromOutcome(outcome.reason);
    }
  }

  const response: SearchResponse = {
    cacheKey,
    query,
    exactMatch: found.exactMatch,
    relatedSkills: found.relatedSkills,
    categoryIds: found.categoryIds,
    resources: found.resources,
    roadmap,
    roadmapStatus,
    prerequisites: roadmap.prerequisites,
    estimatedHours: roadmap.estimatedTotalHours,
    difficulty: roadmap.difficulty,
    cached: false,
    tookMs: Date.now() - started,
  };

  // 5. Cache only AI-generated plans (the template is cheap to recompute)
  if (roadmapStatus === 'ai') await cacheSet(cacheKey, response, TTL_MS);

  return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
}

