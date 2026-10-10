import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, serverStorageEnabled } from '@/lib/supabase/server';
import { RESOURCE_BY_ID } from '@/lib/data/resources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const roadmapSchema = z.object({
  skillName: z.string().min(1).max(120),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTotalHours: z.number().min(0).max(5000),
  prerequisites: z.array(z.string().max(160)).max(12),
  weeklyRoadmap: z
    .array(
      z.object({
        week: z.number().int().min(1).max(52),
        title: z.string().max(200),
        topics: z.array(z.string().max(160)).max(10),
        milestone: z.string().max(400),
        resources: z
          .array(
            z.object({
              resourceId: z.string().max(64),
              title: z.string().max(200),
              platform: z.string().max(80),
              url: z.string().max(500),
              estimatedHours: z.number().min(0).max(500),
              action: z.string().max(300),
            }),
          )
          .max(6),
      }),
    )
    .min(1)
    .max(12),
  notes: z.string().max(600).optional(),
  source: z.enum(['ai', 'template']),
});

const saveSchema = z.object({
  userQuery: z.string().trim().min(2).max(200),
  roadmap: roadmapSchema,
});

/**
 * Rebuilds the stored plan from the verified catalogue. Any resource id we don't recognise is dropped,
 * and title, platform, and URL always come from the catalogue, never from the client.
 */
function sanitizeRoadmap(input: z.infer<typeof roadmapSchema>) {
  return {
    ...input,
    weeklyRoadmap: input.weeklyRoadmap.map((w, i) => ({
      week: i + 1,
      title: w.title,
      topics: w.topics,
      milestone: w.milestone,
      resources: w.resources.flatMap((r) => {
        const db = RESOURCE_BY_ID.get(r.resourceId);
        if (!db) return [];
        return [{ resourceId: db.id, title: db.title, platform: db.platform, url: db.url, estimatedHours: r.estimatedHours, action: r.action }];
      }),
    })),
  };
}

function toClient(row: Record<string, any>, feedback?: 'up' | 'down') {
  const completed: Record<string, boolean> = {};
  for (const p of (row.roadmap_progress ?? []) as { week_number: number; resource_id: string; is_completed: boolean }[]) {
    if (p.is_completed) completed[`${p.week_number}:${p.resource_id}`] = true;
  }
  return {
    id: row.id as string,
    skillName: row.skill_name as string,
    userQuery: row.user_query as string,
    difficulty: row.difficulty as 'beginner' | 'intermediate' | 'advanced',
    estimatedTotalHours: Number(row.estimated_total_hours ?? 0),
    createdAt: row.created_at as string,
    roadmap: row.roadmap_data,
    completed,
    feedback,
    remote: true,
  };
}

export async function GET() {
  if (!serverStorageEnabled) return NextResponse.json({ error: 'Server storage is not configured.' }, { status: 503 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { supabase, user } = session;

  const { data: rows, error } = await supabase
    .from('roadmaps')
    .select('id, skill_name, user_query, difficulty, estimated_total_hours, roadmap_data, created_at, roadmap_progress(week_number, resource_id, is_completed)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Could not load roadmaps.' }, { status: 500 });

  const { data: feedbackRows } = await supabase
    .from('feedback')
    .select('roadmap_id, rating, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const latestFeedback = new Map<string, 'up' | 'down'>();
  for (const f of feedbackRows ?? []) if (!latestFeedback.has(f.roadmap_id)) latestFeedback.set(f.roadmap_id, f.rating);

  return NextResponse.json({ roadmaps: (rows ?? []).map((r) => toClient(r, latestFeedback.get(r.id))) });
}

export async function POST(req: Request) {
  if (!serverStorageEnabled) return NextResponse.json({ error: 'Server storage is not configured.' }, { status: 503 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }
  const parsed = saveSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid roadmap.' }, { status: 400 });

  const roadmap = sanitizeRoadmap(parsed.data.roadmap);
  const { supabase, user } = session;
  const { data, error } = await supabase
    .from('roadmaps')
    .insert({
      user_id: user.id,
      skill_name: roadmap.skillName,
      user_query: parsed.data.userQuery,
      difficulty: roadmap.difficulty,
      estimated_total_hours: roadmap.estimatedTotalHours,
      roadmap_data: roadmap,
    })
    .select('id')
    .single();
  if (error || !data) return NextResponse.json({ error: 'Could not save roadmap.' }, { status: 500 });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
