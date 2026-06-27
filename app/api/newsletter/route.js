import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  const { email } = await request.json();

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const { error } = await supabase.from('newsletter').upsert(
    { email, subscribed_at: new Date().toISOString() },
    { onConflict: 'email' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send welcome email via Brevo
  try {
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'PETNIC STUDIO', email: 'noreply@petnicstudio.com' },
          to: [{ email }],
          subject: 'Welcome to PETNIC STUDIO!',
          htmlContent: '<h2>Welcome to PETNIC STUDIO!</h2><p>Thank you for subscribing. Get ready for exclusive offers, pet care tips, and new product launches.</p><p>Use code <strong>WELCOME15</strong> for 15% off your first order!</p>',
        }),
      });
    }
  } catch (e) {
    console.error('Brevo email error:', e.message);
  }

  return NextResponse.json({ success: true, message: 'Subscribed successfully' });
}
