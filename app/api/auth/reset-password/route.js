import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// POST /api/auth/reset-password
export async function POST(request) {
  const supabase = getSupabaseAdmin();
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  // Find user with valid token
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, reset_token_expires')
    .eq('reset_token', token)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
  }

  // Check if token expired
  if (new Date(user.reset_token_expires) < new Date()) {
    return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
  }

  // Update password and clear token
  const hash = await bcrypt.hash(password, 10);
  await supabase
    .from('users')
    .update({ 
      password_hash: hash, 
      reset_token: null, 
      reset_token_expires: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  return NextResponse.json({ success: true, message: 'Password updated successfully' });
}
