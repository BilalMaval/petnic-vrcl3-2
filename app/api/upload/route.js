import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const TEAM_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

// Checks the file's real signature instead of trusting the browser-supplied type.
function detectImageType(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', type: 'image/png' };
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp', type: 'image/webp' };
  return null;
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let ext = file.name.split('.').pop();
  let contentType = file.type;

  // Opt-in strict mode for profile photos. Other callers (product files,
  // blog and product images) keep the original permissive behaviour.
  if (formData.get('purpose') === 'team-photo') {
    if (buffer.length > TEAM_PHOTO_MAX_BYTES) {
      return NextResponse.json({ error: 'Photo must be 5 MB or smaller' }, { status: 400 });
    }
    const detected = detectImageType(buffer);
    if (!detected) {
      return NextResponse.json({ error: 'Photo must be a JPG, PNG or WebP image' }, { status: 400 });
    }
    ext = detected.ext;
    contentType = detected.type;
  }
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, buffer, { contentType, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl }, { status: 201 });
}
