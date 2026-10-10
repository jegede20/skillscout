import 'server-only';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession, serverStorageEnabled } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * Stores a profile photo for the signed-in user and returns its public URL.
 * The path is built on the server from the verified user id, so a user can only write to their own folder.
 */
export async function POST(req: Request) {
  if (!serverStorageEnabled) return NextResponse.json({ error: 'Photo uploads are not available right now.' }, { status: 503 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: 'Photo uploads are not configured.' }, { status: 503 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to change your photo.' }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No image received.' }, { status: 400 });
  const ext = EXTENSIONS[file.type];
  if (!ext) return NextResponse.json({ error: 'Use a JPG, PNG or WebP image.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Image must be under 2 MB.' }, { status: 413 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Create the public bucket on first use, so no manual dashboard step is needed.
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) return NextResponse.json({ error: 'Could not save the photo.' }, { status: 500 });
  if (!buckets?.some((b) => b.id === BUCKET)) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: Object.keys(EXTENSIONS),
    });
    if (error && !/already exists/i.test(error.message)) return NextResponse.json({ error: 'Could not save the photo.' }, { status: 500 });
  }

  const path = `${session.user.id}/${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: 'Could not save the photo.' }, { status: 500 });

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
