import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { stripeClient } from '@/lib/stripe';
import { completePaidSession, expireSession, listDownloadableFiles } from '@/lib/orders-finalize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const { session_id } = await params;
    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Free (100% coupon) and PayPal orders never touch Stripe; the database
    // record is the source of truth (PayPal is captured and verified server-side).
    if (session_id.startsWith('free_') || session_id.startsWith('pp_')) {
      const { data: tx } = await supabase
        .from('payment_transactions')
        .select('session_id, amount, currency, status, payment_status, user_email, metadata')
        .eq('session_id', session_id)
        .maybeSingle();
      if (!tx) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      const paid = tx.payment_status === 'paid';
      const items = paid ? tx.metadata?.items || [] : [];
      return NextResponse.json({
        session_id,
        status: paid ? 'complete' : tx.status,
        payment_status: tx.payment_status,
        amount_total: Math.round(parseFloat(tx.amount) * 100),
        currency: tx.currency || 'usd',
        customer_email: tx.user_email || null,
        items,
        files: paid ? await listDownloadableFiles(items) : [],
        coupon: tx.metadata?.coupon ? { code: tx.metadata.coupon.code, discount: tx.metadata.coupon.discount } : null,
      });
    }

    const stripe = stripeClient;

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
    const customerEmail = session.customer_details?.email || session.customer_email || null;

    // Update the transaction idempotently: the first caller to see "paid"
    // creates the order (see lib/orders-finalize.js).
    try {
      if (status === 'expired') {
        await expireSession(session_id);
      } else {
        await completePaidSession(session_id, { status, paymentStatus, customerEmail });
      }
    } catch (dbErr) {
      console.error('payment status db update failed:', dbErr);
    }

    // Once paid, surface the itemized breakdown stored at checkout time so
    // the success page can fire an itemized purchase event and offer downloads.
    let items = [];
    let files = [];
    let coupon = null;
    if (paymentStatus === 'paid') {
      try {
        const { data: txRow } = await supabase
          .from('payment_transactions')
          .select('metadata')
          .eq('session_id', session_id)
          .maybeSingle();
        items = txRow?.metadata?.items || [];
        files = await listDownloadableFiles(items);
        coupon = txRow?.metadata?.coupon ? { code: txRow.metadata.coupon.code, discount: txRow.metadata.coupon.discount } : null;
      } catch (itemsErr) {
        console.error('Failed to load items for analytics:', itemsErr);
      }
    }

    return NextResponse.json({
      session_id,
      status,
      payment_status: paymentStatus,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: customerEmail,
      items,
      files,
      coupon,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
