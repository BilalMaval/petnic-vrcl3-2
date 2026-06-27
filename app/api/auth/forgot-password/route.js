import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import { sendEmail, getPasswordResetEmailHtml } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://petnicstudio.com';

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('email', email)
    .single();

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true, message: 'If an account exists, a reset email will be sent' });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  await supabase
    .from('users')
    .update({ reset_token: resetToken, reset_token_expires: resetTokenExpires })
    .eq('id', user.id);

  // Send reset email
  const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;
  const emailResult = await sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Reset Your Password - PETNIC STUDIO',
    htmlContent: getPasswordResetEmailHtml(user.name, resetUrl),
  });

  console.log('Password reset email result:', emailResult);

  return NextResponse.json({ success: true, message: 'If an account exists, a reset email will be sent' });
}
