import WebSocket from 'ws';
// Node 20 has no global WebSocket; supabase-js realtime needs one even when unused.
if (!(globalThis as { WebSocket?: unknown }).WebSocket) (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
/**
 * Loads the verified catalogue into Supabase so roadmap_progress foreign keys resolve.
 * Usage: npm run seed   (needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local)
 * Safe to re-run: rows are upserted by id, which is derived from each URL.
 */
import { existsSync, readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { RESOURCES } from '../lib/data/resources';

// Minimal .env.local loader so the script works without extra flags.
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local) first.');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const rows = RESOURCES.map((r) => ({
    id: r.id,
    title: r.title,
    platform: r.platform,
    url: r.url,
    description: r.description,
    skill_tags: r.skillTags,
    category: r.category,
    subcategory: r.subcategory ?? null,
    format: r.format,
    difficulty: r.difficulty,
    duration_hours: r.durationHours,
    prerequisites: r.prerequisites,
    quality_score: r.qualityScore,
    is_free: true,
    is_verified: true,
  }));

  const { error } = await supabase.from('resources').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} verified resources.`);
}

main();
