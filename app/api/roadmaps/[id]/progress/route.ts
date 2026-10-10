import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, serverStorageEnabled } from '@/lib/supabase/server';
import { RESOURCE_BY_ID } from '@/lib/data/resources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const bodySchema = z.object({
  weekNumber: z.number().int().min(1).max(52),
  resourceId: z.string().max(64),
  completed: z.boolean(),
});

/** Sets one resource's completion state for a roadmap the signed-in user owns. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!serverStorageEnabled) return NextResponse.json({ error: 'Server storage is not configured.' }, { status: 503 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: 'Invalid roadmap id.' }, { status: 400 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success || !RESOURCE_BY_ID.has(parsed.data.resourceId)) {
    return NextResponse.json({ error: 'Invalid progress update.' }, { status: 400 });
  }
  const { weekNumber, resourceId, completed } = parsed.data;
  const { supabase } = session;

  // RLS scopes this read to the caller's own roadmaps.
  const { data: owned } = await supabase.from('roadmaps').select('id').eq('id', params.id).maybeSingle();
  if (!owned) return NextResponse.json({ error: 'Roadmap not found.' }, { status: 404 });

  const { data: existing } = await supabase
    .from('roadmap_progress')
    .select('id')
    .eq('roadmap_id', params.id)
    .eq('week_number', weekNumber)
    .eq('resource_id', resourceId)
    .maybeSingle();

  const completedAt = completed ? new Date().toISOString() : null;
  const result = existing
    ? await supabase.from('roadmap_progress').update({ is_completed: completed, completed_at: completedAt }).eq('id', existing.id)
    : await supabase
        .from('roadmap_progress')
        .insert({ roadmap_id: params.id, week_number: weekNumber, resource_id: resourceId, is_completed: completed, completed_at: completedAt });

  if (result.error) return NextResponse.json({ error: 'Could not save progress.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
