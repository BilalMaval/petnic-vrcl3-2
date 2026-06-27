import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/slug';

// Admin: Get all blog posts (including drafts)
export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, blog_categories(id, name, slug)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data || [] });
}

// Admin: Create blog post
export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const body = await request.json();

  const slug = slugify(body.slug || body.title || '');
  if (!slug) {
    return NextResponse.json({ error: 'A valid title or slug is required' }, { status: 400 });
  }
  
  const postData = {
    title: body.title,
    slug,
    excerpt: body.excerpt,
    content: body.content,
    image_url: body.image_url,
    author_name: body.author_name,
    author_role: body.author_role,
    category_id: body.category_id || null,
    featured: body.featured || false,
    status: body.status || 'draft',
    read_time: body.read_time,
    full_html_page: body.full_html_page || null,
    published_at: body.status === 'published' ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(postData)
    .select('*, blog_categories(id, name, slug)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data }, { status: 201 });
}

// Admin: Update blog post
export async function PUT(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

  // Always sanitize slug on update so users can't introduce bad characters.
  if (updates.slug !== undefined || updates.title !== undefined) {
    const candidate = updates.slug || updates.title || '';
    const cleaned = slugify(candidate);
    if (cleaned) updates.slug = cleaned;
    else delete updates.slug;
  }

  updates.updated_at = new Date().toISOString();
  if (updates.status === 'published' && !updates.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select('*, blog_categories(id, name, slug)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

// Admin: Delete blog post
export async function DELETE(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
