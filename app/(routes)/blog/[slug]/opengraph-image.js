import { ImageResponse } from 'next/og';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const alt = 'Petnic Studio Blog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const supabase = getSupabaseAdmin();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  const title = post?.title || 'Petnic Studio Blog';
  const excerpt = post?.excerpt || 'Expert pet care tips & portrait guides';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #1A1A2E 0%, #2d2d4e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: 22, color: '#F97316', marginBottom: 32, letterSpacing: 4 }}>
          PETNIC STUDIO · BLOG
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
            maxWidth: 1000,
            lineHeight: 1.2,
          }}
        >
          {title.length > 70 ? title.slice(0, 70) + '…' : title}
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#cbd5e1',
            marginTop: 28,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          {excerpt.length > 100 ? excerpt.slice(0, 100) + '…' : excerpt}
        </div>
      </div>
    ),
    { ...size }
  );
}
