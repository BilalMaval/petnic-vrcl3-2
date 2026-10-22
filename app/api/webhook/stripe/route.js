import { NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe';
import { completePaidSession, expireSession } from '@/lib/orders-finalize';

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

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const paymentStatus = session.payment_status === 'paid' ? 'paid' : 'pending';

      // Idempotent: shared with the status poll, only the first to see
      // "paid" creates the order / records the coupon redemption.
      await completePaidSession(session.id, {
        status: session.status,
        paymentStatus,
        customerEmail: session.customer_details?.email || session.customer_email || null,
      });
    } else if (event.type === 'checkout.session.expired') {
      // Also gives back any coupon use reserved for this checkout.
      await expireSession(event.data.object.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
