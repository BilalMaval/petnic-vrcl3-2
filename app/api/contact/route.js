import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Contact form recipient emails
const CONTACT_EMAILS = ['info@petnicstudio.com', 'sufyan.afzalk@gmail.com'];

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { name, email, subject, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
  }

  const { error } = await supabase.from('contact_submissions').insert({ name, email, subject, message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send notification via Brevo to both admin emails
  try {
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'PETNIC STUDIO', email: process.env.BREVO_SENDER_EMAIL || 'alisafyan1122@gmail.com' },
          to: CONTACT_EMAILS.map(e => ({ email: e })),
          subject: `New Contact Form: ${subject || 'No subject'}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1A1A2E; border-bottom: 2px solid #F97316; padding-bottom: 10px;">New Contact Form Submission</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px 0; color: #666;"><strong>Name:</strong></td><td style="padding: 10px 0;">${name}</td></tr>
                <tr><td style="padding: 10px 0; color: #666;"><strong>Email:</strong></td><td style="padding: 10px 0;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding: 10px 0; color: #666;"><strong>Subject:</strong></td><td style="padding: 10px 0;">${subject || 'N/A'}</td></tr>
              </table>
              <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                <p style="color: #666; margin-bottom: 10px;"><strong>Message:</strong></p>
                <p style="color: #333; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="margin-top: 20px; color: #999; font-size: 12px;">This message was sent from the PETNIC STUDIO contact form.</p>
            </div>
          `,
        }),
      });
    }
  } catch (e) {
    console.error('Brevo notification error:', e.message);
  }

  return NextResponse.json({ success: true, message: 'Message sent successfully' });
}
