import { NextResponse } from 'next/server';
import { feedbackBodySchema } from '@/lib/schemas';
import { getSession, serverStorageEnabled } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Stores roadmap feedback. Server storage happens only for a signed-in user rating one of their saved
 * roadmaps (a UUID id). Anything else, such as an unsaved search result, is accepted and kept in the browser.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }
  const parsed = feedbackBodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid feedback.' }, { status: 400 });
  const { roadmapId, rating, comment } = parsed.data;

  if (serverStorageEnabled && UUID.test(roadmapId)) {
    const session = await getSession();
    if (session) {
      // RLS: the roadmap must be visible to this user, so only their own roadmaps match.
      const { data: owned } = await session.supabase.from('roadmaps').select('id').eq('id', roadmapId).maybeSingle();
      if (owned) {
        const { error } = await session.supabase.from('feedback').insert({
          roadmap_id: roadmapId,
          user_id: session.user.id,
          rating,
          comment: comment ?? null,
        });
        if (error) return NextResponse.json({ error: 'Could not save feedback.' }, { status: 500 });
        return NextResponse.json({ ok: true, stored: 'server' }, { status: 201 });
      }
    }
  }
  return NextResponse.json({ ok: true, stored: 'browser' }, { status: 202 });
}
