import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import { sendEmail, getEmailVerificationHtml, getWelcomeEmailHtml } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://petnicstudio.com';

// POST /api/auth/verify-email - Resend verification email by email address
export async function POST(request) {
  const supabase = getSupabaseAdmin();
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, email_verified')
    .eq('email', email)
    .single();

  if (!user) {
    // Don't reveal if user exists
    return NextResponse.json({ success: true, message: 'If an account exists, a verification email will be sent' });
  }

  if (user.email_verified) {
    return NextResponse.json({ success: true, message: 'Email already verified. You can log in now.' });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  await supabase
    .from('users')
    .update({ verification_token: verificationToken })
    .eq('id', user.id);

  // Send verification email
  const verifyUrl = `${APP_URL}/auth/verify?token=${verificationToken}`;
  const emailResult = await sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Verify Your Email - PETNIC STUDIO',
    htmlContent: getEmailVerificationHtml(user.name, verifyUrl),
  });

  console.log('Resend verification email result:', emailResult);

  return NextResponse.json({ success: true, message: 'Verification email sent! Please check your inbox.' });
}

// GET /api/auth/verify-email?token=xxx - Verify the token
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, email_verified')
    .eq('verification_token', token)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 });
  }

  // Mark email as verified
  await supabase
    .from('users')
    .update({ 
      email_verified: true, 
      verification_token: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  // Send welcome email now that user is verified
  const welcomeResult = await sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Welcome to PETNIC STUDIO! 🐾',
    htmlContent: getWelcomeEmailHtml(user.name),
  });
  console.log('Welcome email result:', welcomeResult);

  return NextResponse.json({ success: true, message: 'Email verified successfully! You can now log in.' });
}
