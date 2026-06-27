import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: thread, error } = await supabase
    .from('forum_threads')
    .select('*, users(id, name, avatar_url)')
    .eq('id', id)
    .single();

  if (error || !thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

  const { data: replies } = await supabase
    .from('forum_replies')
    .select('*, users(id, name, avatar_url)')
    .eq('thread_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ thread, replies: replies || [] });
}

export async function POST(request, { params }) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { content } = await request.json();

  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  const { data, error } = await supabase.from('forum_replies').insert({
    thread_id: id,
    user_id: user.userId,
    content,
  }).select('*, users(id, name, avatar_url)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reply: data }, { status: 201 });
}
