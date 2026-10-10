import { NextResponse } from 'next/server';
import { swapBodySchema } from '@/lib/schemas';
import { RESOURCES, RESOURCE_BY_ID } from '@/lib/data/resources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Finds a verified alternative with overlapping tags. Prefers the same difficulty. */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }
  const parsed = swapBodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid resourceId or skillTags.' }, { status: 400 });

  const { resourceId, skillTags } = parsed.data;
  const current = RESOURCE_BY_ID.get(resourceId);
  const wanted = new Set([...skillTags, ...(current?.skillTags ?? [])].map((t) => t.toLowerCase()));

  const candidates = RESOURCES.filter(
    (r) => r.id !== resourceId && r.skillTags.some((t) => wanted.has(t.toLowerCase())),
  )
    .map((r) => {
      const overlap = r.skillTags.filter((t) => wanted.has(t.toLowerCase())).length;
      const sameLevel = current ? r.difficulty === current.difficulty : true;
      const sameCategory = current ? r.category === current.category : false;
      return { r, score: overlap * 2 + (sameLevel ? 3 : 0) + (sameCategory ? 4 : 0) + r.qualityScore / 10 };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0]?.r;
  if (!best) return NextResponse.json({ error: 'No alternative found for this resource yet.' }, { status: 404 });

  return NextResponse.json({ resource: best, sameDifficulty: current ? best.difficulty === current.difficulty : true });
}
