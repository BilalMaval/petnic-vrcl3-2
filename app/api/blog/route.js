import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Public: Get all published blog posts
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const slug = searchParams.get('slug');

  // Single post by slug. Trim and lowercase to be tolerant of legacy slugs and URL casing.
  if (slug) {
    const cleanSlug = String(slug).trim();
    let { data, error } = await supabase
      .from('blog_posts')
      .select('*, blog_categories(id, name, slug)')
      .eq('slug', cleanSlug)
      .eq('status', 'published')
      .maybeSingle();

    // Fallback: case-insensitive lookup so old links keep working.
    if (!data) {
      const fb = await supabase
        .from('blog_posts')
        .select('*, blog_categories(id, name, slug)')
        .ilike('slug', cleanSlug)
        .eq('status', 'published')
        .maybeSingle();
      data = fb.data;
      error = fb.error;
    }

    if (error || !data) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ post: data });
  }

  // List posts
  let query = supabase
    .from('blog_posts')
    .select('*, blog_categories(id, name, slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (category && category !== 'all') {
    const { data: cat } = await supabase.from('blog_categories').select('id').eq('slug', category).single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (featured === 'true') query = query.eq('featured', true);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ posts: data || [] });
}
