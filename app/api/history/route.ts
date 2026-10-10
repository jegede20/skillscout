import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, serverStorageEnabled } from '@/lib/supabase/server';
import { categoriesForQuery } from '@/lib/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  query: z.string().trim().min(2).max(200),
  resultsCount: z.number().int().min(0).max(500),
});

export async function GET() {
  if (!serverStorageEnabled) return NextResponse.json({ error: 'Server storage is not configured.' }, { status: 503 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { data, error } = await session.supabase
    .from('search_history')
    .select('id, query, results_count, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: 'Could not load history.' }, { status: 500 });

  return NextResponse.json({
    searches: (data ?? []).map((row) => ({
      id: row.id as string,
      query: row.query as string,
      resultsCount: (row.results_count as number) ?? 0,
      categoryIds: categoriesForQuery(row.query as string),
      createdAt: row.created_at as string,
    })),
  });
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
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid search record.' }, { status: 400 });

  const { error } = await session.supabase.from('search_history').insert({
    user_id: session.user.id,
    query: parsed.data.query,
    results_count: parsed.data.resultsCount,
  });
  if (error) return NextResponse.json({ error: 'Could not record search.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
