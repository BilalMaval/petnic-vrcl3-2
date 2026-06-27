import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, name, role, avatar_url, created_at')
    .eq('id', user.userId)
    .single();

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_email', profile?.email)
    .order('created_at', { ascending: false });

  return NextResponse.json({ user: profile, orders: orders || [] });
}

export async function PUT(request) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { name, avatar_url } = await request.json();

  const updates = { updated_at: new Date().toISOString() };
  if (name) updates.name = name;
  if (avatar_url) updates.avatar_url = avatar_url;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.userId)
    .select('id, email, name, role, avatar_url')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
