import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { stripeClient } from '@/lib/stripe';
import { buildOrderFromTransaction } from '@/lib/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const stripe = stripeClient;
    let event;

    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // No webhook secret configured – parse the body without verification.
      // The frontend polling on /api/payments/status remains the source of truth.
      event = JSON.parse(rawBody);
    }

    const supabase = getSupabaseAdmin();

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const sessionId = session.id;
      const paymentStatus = session.payment_status === 'paid' ? 'paid' : 'pending';

      // Idempotent update + order creation.
      const { data: existing } = await supabase
        .from('payment_transactions')
        .select('id, payment_status')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing && existing.payment_status !== 'paid') {
        await supabase
          .from('payment_transactions')
          .update({
            status: session.status,
            payment_status: paymentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId);

        if (paymentStatus === 'paid') {
          const { data: tx } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('session_id', sessionId)
            .single();

          if (tx) {
            const { data: existingOrder } = await supabase
              .from('orders')
              .select('id')
              .eq('payment_session_id', sessionId)
              .maybeSingle();

            if (!existingOrder) {
              await supabase.from('orders').insert(buildOrderFromTransaction(tx));
            }
          }
        }
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await supabase
        .from('payment_transactions')
        .update({
          status: 'expired',
          payment_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', session.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
