import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let query = supabase
    .from('forum_threads')
    .select('*, users(id, name, avatar_url), forum_replies(count)')
    .order('created_at', { ascending: false });

  if (category && category !== 'all') query = query.eq('category', category);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ threads: data || [] });
}

export async function POST(request) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { title, content, category } = await request.json();

  if (!title || !content) return NextResponse.json({ error: 'Title and content required' }, { status: 400 });

  const { data, error } = await supabase.from('forum_threads').insert({
    user_id: user.userId,
    title,
    content,
    category: category || 'general',
  }).select('*, users(id, name, avatar_url)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ thread: data }, { status: 201 });
}
