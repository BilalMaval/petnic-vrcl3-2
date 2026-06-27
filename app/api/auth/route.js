import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import crypto from 'crypto';
import { sendEmail, getEmailVerificationHtml } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) || 'petnic-secret-key-fallback-32ch');
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://petnicstudio.com';

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  const { email, password, name, action } = await request.json();

  if (action === 'register') {
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const hash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase.from('users').insert({
      email, password_hash: hash, name, role: 'user', verification_token: verificationToken, email_verified: false,
    }).select('id, email, name, role, avatar_url, email_verified').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send verification email - THIS IS THE ONLY EMAIL ON SIGNUP
    const verifyUrl = `${APP_URL}/auth/verify?token=${verificationToken}`;
    const verifyEmailResult = await sendEmail({
      to: email,
      toName: name,
      subject: 'Verify Your Email - PETNIC STUDIO',
      htmlContent: getEmailVerificationHtml(name, verifyUrl),
    });
    console.log('Verification email result:', verifyEmailResult);

    // Return success but indicate email verification is required
    return NextResponse.json({ 
      success: true,
      message: 'Account created! Please check your email to verify your account before logging in.',
      requiresVerification: true,
      email: user.email
    }, { status: 201 });
  }

  // Login
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, avatar_url, password_hash, email_verified')
    .eq('email', email)
    .single();

  if (error || !user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  // Check if email is verified
  if (!user.email_verified) {
    return NextResponse.json({ 
      error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      requiresVerification: true,
      email: user.email
    }, { status: 403 });
  }

  // Update last login
  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

  const token = await new SignJWT({ userId: user.id, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const { password_hash, email_verified, ...safeUser } = user;
  return NextResponse.json({ user: safeUser, token });
}
