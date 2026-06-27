import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { stripeClient } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const { session_id } = await params;
    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    const stripe = stripeClient;
    const supabase = getSupabaseAdmin();

    // Try Stripe first. If the Emergent proxy transiently 404s on a
    // freshly-created session, fall back to our pending DB record so the UI
    // can keep polling rather than erroring out.
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch (stripeErr) {
      const { data: pending } = await supabase
        .from('payment_transactions')
        .select('session_id, amount, currency, status, payment_status, user_email')
        .eq('session_id', session_id)
        .maybeSingle();
      if (pending) {
        return NextResponse.json({
          session_id,
          status: pending.status || 'open',
          payment_status: pending.payment_status || 'initiated',
          amount_total: Math.round(parseFloat(pending.amount) * 100),
          currency: pending.currency || 'usd',
          customer_email: pending.user_email || null,
          stale: true,
        });
      }
      throw stripeErr;
    }

    const status = session.status; // open | complete | expired
    const paymentStatus = session.payment_status; // unpaid | paid | no_payment_required

    // Update transaction record idempotently. Only flip to "paid" once.
    try {
      const { data: existing } = await supabase
        .from('payment_transactions')
        .select('id, payment_status')
        .eq('session_id', session_id)
        .maybeSingle();

      if (existing && existing.payment_status !== 'paid') {
        await supabase
          .from('payment_transactions')
          .update({
            status,
            payment_status: paymentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', session_id);

        // On successful payment, create an order if not already created.
        if (paymentStatus === 'paid') {
          const { data: tx } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('session_id', session_id)
            .single();

          if (tx) {
            const { data: existingOrder } = await supabase
              .from('orders')
              .select('id')
              .eq('payment_session_id', session_id)
              .maybeSingle();

            if (!existingOrder) {
              await supabase.from('orders').insert({
                user_id: tx.user_id,
                email: tx.user_email,
                total: tx.amount,
                status: 'paid',
                payment_session_id: tx.session_id,
                items: tx.metadata?.items || [],
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (dbErr) {
      console.error('payment status db update failed:', dbErr);
    }

    return NextResponse.json({
      session_id,
      status,
      payment_status: paymentStatus,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email || session.customer_email,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
