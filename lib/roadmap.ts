import { z } from 'zod';
import { diffRank } from '@/lib/search';
import type { Difficulty, Resource, Roadmap, RoadmapStatus, RoadmapWeek } from '@/lib/types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Override with GROQ_MODEL. llama-3.3-70b-versatile is not available on every Groq key.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const TIMEOUT_MS = 8000; // spec: roadmap in under 8s; past this we serve the template

// ---------- AI output schema (unknown keys such as "url" are stripped on purpose) ----------
const AIRoadmapSchema = z.object({
  skillName: z.string().min(1).max(120),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTotalHours: z.coerce.number().min(1).max(5000),
  prerequisites: z.array(z.string().max(160)).max(12).default([]),
  weeklyRoadmap: z
    .array(
      z.object({
        week: z.coerce.number().int().min(1).max(52),
        title: z.string().max(160),
        topics: z.array(z.string().max(160)).max(10).default([]),
        resources: z
          .array(
            z.object({
              resourceId: z.string().max(64),
              title: z.string().max(200).default(''),
              platform: z.string().max(80).default(''),
              estimatedHours: z.coerce.number().min(0).max(500).default(1),
              action: z.string().max(300).default(''),
            }),
          )
          .max(6)
          .default([]),
        milestone: z.string().max(300).default(''),
      }),
    )
    .min(1)
    .max(12),
  notes: z.string().max(600).optional(),
});

type AIRoadmap = z.infer<typeof AIRoadmapSchema>;

export function buildSystemPrompt(resources: Resource[]): string {
  const catalogue = resources
    .map(
      (r) =>
        `- resourceId: "${r.id}" | title: "${r.title}" | platform: "${r.platform}" | difficulty: ${r.difficulty} | hours: ${r.durationHours} | prerequisites: ${r.prerequisites.join(', ') || 'none'}`,
    )
    .join('\n');

  return `You are SkillScout's learning advisor AI. Your job is to create structured, actionable learning roadmaps.

RULES:
- ONLY recommend resources from this verified list. Use the exact resourceId value. Do NOT invent URLs or resources.
- Structure the roadmap as week-by-week JSON.
- Include prerequisites if the skill requires foundational knowledge.
- Estimate total hours realistically.
- Assess difficulty based on the user's described experience level.
- If the user's query is vague, ask clarifying questions in the "notes" field.
- Use 3 to 8 weeks. Each week should reference 1 to 3 resources.

VERIFIED RESOURCES:
${catalogue || '(none found; return an honest roadmap with empty resources arrays and say so in notes)'}

RESPOND IN THIS EXACT JSON FORMAT AND NOTHING ELSE:
{
  "skillName": "string",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTotalHours": number,
  "prerequisites": ["string"],
  "weeklyRoadmap": [
    {
      "week": number,
      "title": "string",
      "topics": ["string"],
      "resources": [
        { "resourceId": "UUID from the verified list", "title": "string", "platform": "string", "estimatedHours": number, "action": "string (what to do)" }
      ],
      "milestone": "string (what you should be able to do by end of week)"
    }
  ],
  "notes": "string (optional tips)"
}`;
}

async function callGroq(system: string, user: string, apiKey: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 2000,
      // gpt-oss models spend hidden reasoning tokens against the limit; low effort keeps roadmaps well under it.
      ...(MODEL.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal,
  });
  if (res.status === 429) throw new RateLimitedError();
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned no content');
  return content;
}

export type AIOutcome =
  | { ok: true; data: AIRoadmap }
  | { ok: false; reason: 'disabled' | 'timeout' | 'invalid' | 'error' | 'rate_limited' };

class RateLimitedError extends Error {}

/** Calls Groq once, retries once if the JSON is invalid. Never throws. */
export async function generateAIRoadmap(args: {
  query: string;
  level: Difficulty;
  resources: Resource[];
}): Promise<AIOutcome> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { ok: false, reason: 'disabled' };

  // Keep the prompt small: Groq's per-minute token limit is tight, and the top 12 matches are enough.
  const system = buildSystemPrompt(args.resources.slice(0, 12));
  const user = `Skill request: "${args.query}"\nUser's experience level: ${args.level}\nBuild the roadmap now.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const text = await callGroq(system, user, apiKey, controller.signal);
      const parsed = AIRoadmapSchema.safeParse(JSON.parse(text));
      if (parsed.success) return { ok: true, data: parsed.data };
      // invalid shape -> loop and retry once
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return { ok: false, reason: 'timeout' };
      if (err instanceof RateLimitedError) return { ok: false, reason: 'rate_limited' };
      if (err instanceof SyntaxError) continue; // bad JSON -> retry
      return { ok: false, reason: 'error' };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, reason: 'invalid' };
}

/** Replaces AI resource references with verified DB records. Anything unmatched is dropped. */
export function sanitizeAIRoadmap(ai: AIRoadmap, resources: Resource[]): Roadmap {
  const byId = new Map(resources.map((r) => [r.id, r]));
  const byTitle = new Map(resources.map((r) => [r.title.toLowerCase(), r]));

  const weeklyRoadmap: RoadmapWeek[] = ai.weeklyRoadmap.map((w, idx) => ({
    week: idx + 1,
    title: w.title,
    topics: w.topics,
    milestone: w.milestone,
    resources: w.resources
      .map((ref) => {
        const match =
          byId.get(ref.resourceId) ??
          byTitle.get(ref.title.toLowerCase()) ??
          resources.find((r) => ref.title && r.title.toLowerCase().includes(ref.title.toLowerCase()));
        if (!match) return null;
        return {
          resourceId: match.id,
          title: match.title,
          platform: match.platform,
          url: match.url,
          estimatedHours: ref.estimatedHours,
          action: ref.action,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
  }));

  return {
    skillName: ai.skillName,
    difficulty: ai.difficulty,
    estimatedTotalHours: Math.round(ai.estimatedTotalHours),
    prerequisites: ai.prerequisites,
    weeklyRoadmap,
    notes: ai.notes,
    source: 'ai',
  };
}

/** Study time for one resource in a plan: capped at ~10h so a 600h course counts as a realistic first slice. */
function weeklyHours(r: Resource): number {
  return Math.min(r.durationHours, 10);
}

/** Deterministic plan built only from verified resources. Used when AI is off, slow, or invalid. */
export function buildTemplateRoadmap(skillName: string, level: Difficulty, resources: Resource[]): Roadmap {
  const sorted = resources
    .slice()
    .sort((a, b) => diffRank(a.difficulty) - diffRank(b.difficulty) || b.qualityScore - a.qualityScore);

  // Start at the user's level if possible, then move up.
  const startRank = diffRank(level);
  const ordered = [
    ...sorted.filter((r) => diffRank(r.difficulty) === startRank),
    ...sorted.filter((r) => diffRank(r.difficulty) !== startRank),
  ].slice(0, 8);

  const chunks: Resource[][] = [];
  for (let i = 0; i < ordered.length; i += 2) chunks.push(ordered.slice(i, i + 2));

  const stageTitles = ['Foundations', 'Core Concepts', 'Hands-on Practice', 'Applied Projects', 'Going Deeper', 'Refinement'];

  const weeklyRoadmap: RoadmapWeek[] = chunks.map((group, idx) => {
    const lead = group[0];
    return {
      week: idx + 1,
      title: `${stageTitles[Math.min(idx, stageTitles.length - 1)]}: ${lead.title}`,
      topics: [...new Set(group.flatMap((r) => r.skillTags))].slice(0, 4),
      resources: group.map((r) => ({
        resourceId: r.id,
        title: r.title,
        platform: r.platform,
        url: r.url,
        estimatedHours: weeklyHours(r),
        action: `Work through "${r.title}" and take notes on the key ideas.`,
      })),
      milestone: `Explain the main ideas from "${lead.title}" in your own words and finish one small exercise.`,
    };
  });

  const prerequisites = [...new Set(ordered.flatMap((r) => r.prerequisites))].slice(0, 5);
  const estimatedTotalHours = Math.max(
    4,
    Math.round(weeklyRoadmap.reduce((sum, w) => sum + w.resources.reduce((s, r) => s + r.estimatedHours, 0), 0)),
  );

  return {
    skillName,
    difficulty: level,
    estimatedTotalHours,
    prerequisites,
    weeklyRoadmap,
    notes: resources.length
      ? 'This plan was assembled automatically from verified resources. Refresh for an AI-personalised version.'
      : 'We could not find verified resources for this skill yet. Try a broader term.',
    source: 'template',
  };
}

export function statusFromOutcome(reason: 'disabled' | 'timeout' | 'invalid' | 'error' | 'rate_limited'): RoadmapStatus {
  if (reason === 'timeout') return 'timeout';
  if (reason === 'rate_limited') return 'rate_limited';
  return 'fallback';
}
