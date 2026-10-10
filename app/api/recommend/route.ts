import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recommendBodySchema } from '@/lib/schemas';
import { CATEGORIES } from '@/lib/categories';
import { allowAIRequest } from '@/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const AIRecs = z.object({
  recommendations: z
    .array(z.object({ skill: z.string().min(2).max(60), reason: z.string().min(2).max(200) }))
    .min(1)
    .max(3),
});

function clientId(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
}

/** Suggests 3 next skills. Uses Groq when configured, else picks categories the user has not chosen yet. */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }
  const parsed = recommendBodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { goal, interests, skills } = parsed.data;

  const fallback = CATEGORIES.filter((c) => !interests.includes(c.id) && !skills.some((s) => s.toLowerCase() === c.name.toLowerCase()))
    .slice(0, 3)
    .map((c) => ({ skill: c.name, reason: c.blurb, source: 'template' as const }));

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !(await allowAIRequest(clientId(req)))) return NextResponse.json({ recommendations: fallback });

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are SkillScout. Suggest exactly 3 practical, learnable skills for the user. Respond only as JSON: {"recommendations":[{"skill":"string","reason":"string"}]}. Do not include URLs.',
          },
          {
            role: 'user',
            content: `Goal: ${goal || 'not stated'}\nSkills already in progress: ${skills.join(', ') || 'none'}\nInterests: ${interests.join(', ') || 'none'}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('Groq error');
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsedAI = AIRecs.safeParse(JSON.parse(data.choices?.[0]?.message?.content ?? '{}'));
    if (!parsedAI.success) throw new Error('Invalid AI output');
    return NextResponse.json({
      recommendations: parsedAI.data.recommendations.map((r) => ({ ...r, source: 'ai' as const })),
    });
  } catch {
    return NextResponse.json({ recommendations: fallback });
  }
}
