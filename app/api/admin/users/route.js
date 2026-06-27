import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const role = searchParams.get('role');
  const membership = searchParams.get('membership');

  // Try with membership_type, fallback to basic query if column doesn't exist
  let query = supabase
    .from('users')
    .select('id, email, name, role, avatar_url, email_verified, created_at, last_login, updated_at')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (role && role !== 'all') {
    query = query.eq('role', role);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add default membership_type if not present
  const users = (data || []).map(u => ({
    ...u,
    membership_type: u.membership_type || 'free'
  }));

  return NextResponse.json({ users });
}

export async function PUT(request) {
  const supabase = getSupabaseAdmin();
  const { id, ...updates } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Remove password_hash from updates if present
  delete updates.password_hash;

  const { error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const { error } = await supabase.from('users').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
