import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { priceItems } from '@/lib/pricing';
import { evaluateCoupon, claimCoupon, releaseCoupon, MSG } from '@/lib/coupons';
import { completePaidSession, expireSession } from '@/lib/orders-finalize';
import {
  buildPurchaseUnit,
  createPayPalOrder,
  getPayPalOrder,
  capturePayPalOrder,
  getPayPalCapture,
} from '@/lib/paypal';

// PayPal checkout logic. A PayPal order is tracked in payment_transactions
// under session_id "pp_<paypalOrderId>", so the success page, the download
// route, the status route and order finalising all work exactly as for Stripe.

export const ppSessionId = (orderId) => `pp_${orderId}`;
export const isPayPalOrderId = (id) => /^[A-Z0-9]{10,40}$/.test(String(id || ''));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STALE_AFTER_MS = 3 * 60 * 60 * 1000; // unapproved PayPal checkouts are released after 3 hours

const cents = (v) => Math.round(parseFloat(v) * 100);

function cleanAttribution(attribution) {
  const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'captured_at'];
  if (!attribution || typeof attribution !== 'object' || Array.isArray(attribution)) return null;
  const clean = {};
  for (const key of FIELDS) {
    if (typeof attribution[key] === 'string' && attribution[key]) clean[key] = attribution[key].slice(0, 255);
  }
  return Object.keys(clean).length ? clean : null;
}

// Unapproved PayPal checkouts never send an "expired" event, so give back any
// coupon use they reserved once they are old enough to be abandoned.
export async function sweepStalePayPalCheckouts() {
  try {
    const supabase = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
    const { data } = await supabase
      .from('payment_transactions')
      .select('session_id')
      .like('session_id', 'pp\\_%')
      .eq('payment_status', 'initiated')
      .lt('created_at', cutoff)
      .limit(50);
    for (const row of data || []) await expireSession(row.session_id);
  } catch (e) {
    console.error('PayPal stale sweep failed:', e);
  }
}

// Prices the cart on the server, applies the coupon, creates the PayPal order
// and records the pending transaction. Returns { status, body }.
export async function createCheckout(body) {
  const { cart_items, user_id, user_email, shipping, selected_design, attribution, couponCode } = body || {};

  if (!Array.isArray(cart_items) || cart_items.length === 0 || cart_items.length > 50) {
    return { status: 400, body: { error: 'Cart is empty' } };
  }
  if (user_email && !EMAIL_RE.test(user_email)) {
    return { status: 400, body: { error: 'Enter a valid email address' } };
  }

  const priced = await priceItems(cart_items);
  if (!priced.ok) return { status: 400, body: { error: priced.error } };
  const { lines, subtotal } = priced;

  let coupon = null;
  let discount = 0;
  if (couponCode) {
    const result = await evaluateCoupon(couponCode, subtotal, user_email, { requireEmail: true });
    if (!result.ok) return { status: 400, body: { error: result.error } };
    coupon = { id: result.coupon.id, code: result.coupon.code, discount: result.discount, subtotal };
    discount = result.discount;
  }
  const total = Math.round((subtotal - discount) * 100) / 100;
  if (total <= 0) {
    return { status: 400, body: { error: 'This order is free. Use the regular checkout button to complete it.' } };
  }

  if (coupon && !(await claimCoupon(coupon.id))) {
    return { status: 400, body: { error: MSG.usedUp } };
  }

  try {
    const { unit, shippingPreference } = buildPurchaseUnit({
      lines,
      discount,
      total,
      hasPhysical: lines.some((l) => !l.is_digital),
    });
    const order = await createPayPalOrder({ unit, shippingPreference, requestId: randomUUID() });

    const items = lines.map((l) => ({
      product_id: l.product_id,
      product_name: l.product_name,
      product_slug: l.product_slug,
      quantity: l.quantity,
      unit_price: l.unit_price,
      total: l.total,
      design_name: l.design_name,
      design_addition: l.design_addition,
      variation_options: l.variation_options,
      variation_addition: l.variation_addition,
    }));

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('payment_transactions').insert({
      session_id: ppSessionId(order.id),
      amount: total,
      currency: 'usd',
      status: 'pending',
      payment_status: 'initiated',
      user_id: user_id || null,
      user_email: user_email || null,
      metadata: {
        provider: 'paypal',
        items,
        shipping: shipping || null,
        selected_design: selected_design || null,
        attribution: cleanAttribution(attribution),
        ...(coupon ? { coupon } : {}),
        paypal: { order_id: order.id },
      },
      created_at: new Date().toISOString(),
    });
    if (error) throw new Error('Could not record the order');

    return { status: 200, body: { orderId: order.id } };
  } catch (e) {
    if (coupon) await releaseCoupon(coupon.id);
    console.error('PayPal create order failed:', e.message, e.paypal ? JSON.stringify(e.paypal) : '');
    return { status: 500, body: { error: 'Could not start PayPal checkout. Please try again.' } };
  }
}

function normaliseShipping(unit) {
  const s = unit?.shipping;
  if (!s) return null;
  const a = s.address || {};
  return {
    name: s.name?.full_name || null,
    line1: a.address_line_1 || null,
    line2: a.address_line_2 || null,
    city: a.admin_area_2 || null,
    state: a.admin_area_1 || null,
    postal_code: a.postal_code || null,
    country: a.country_code || null,
  };
}

// Captures (or, when `capture` is false, just reads) the PayPal order, checks
// the money matches what we priced on the server, then finishes the order.
// Returns { ok, ... } and never marks anything paid unless PayPal says the
// capture COMPLETED for exactly the expected amount.
export async function settlePayPalOrder(orderId, { capture = true } = {}) {
  if (!isPayPalOrderId(orderId)) return { ok: false, status: 400, error: 'Invalid PayPal order' };

  const supabase = getSupabaseAdmin();
  const sessionId = ppSessionId(orderId);
  const { data: tx } = await supabase.from('payment_transactions').select('*').eq('session_id', sessionId).maybeSingle();
  if (!tx) return { ok: false, status: 404, error: 'Order not found' };
  if (tx.payment_status === 'paid') return { ok: true, status: 200, sessionId, alreadyPaid: true };
  if (['expired', 'refunded', 'failed'].includes(tx.payment_status)) {
    return { ok: false, status: 409, error: 'This checkout has expired. Please start again.' };
  }

  let order;
  try {
    order = capture ? await capturePayPalOrder(orderId) : await getPayPalOrder(orderId);
  } catch (e) {
    if (e.issue === 'ORDER_ALREADY_CAPTURED') {
      order = await getPayPalOrder(orderId);
    } else if (e.issue === 'INSTRUMENT_DECLINED') {
      return { ok: false, status: 422, code: 'INSTRUMENT_DECLINED', error: 'Your payment method was declined. Please try another one.' };
    } else if (e.issue === 'ORDER_NOT_APPROVED') {
      return { ok: false, status: 400, error: 'The payment was not approved in PayPal.' };
    } else {
      console.error('PayPal capture failed:', e.message, e.paypal ? JSON.stringify(e.paypal) : '');
      return { ok: false, status: 502, error: 'PayPal could not complete the payment. You have not been charged.' };
    }
  }

  const unit = order.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  if (!cap) return { ok: false, status: 400, error: 'The payment was not completed.' };

  const paid = cap.amount;
  if (cap.status === 'COMPLETED') {
    if (paid?.currency_code !== 'USD' || cents(paid.value) !== Math.round(parseFloat(tx.amount) * 100)) {
      console.error(`PayPal amount mismatch for ${orderId}: captured ${paid?.value} ${paid?.currency_code}, expected ${tx.amount}`);
      await supabase.from('payment_transactions').update({
        metadata: { ...tx.metadata, paypal: { ...tx.metadata?.paypal, capture_id: cap.id, mismatch: true } },
        updated_at: new Date().toISOString(),
      }).eq('session_id', sessionId);
      return { ok: false, status: 400, error: 'The payment amount did not match the order. Please contact support.' };
    }
  }

  const payer = order.payer || {};
  const payerName = [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(' ') || null;
  const shippingAddress = normaliseShipping(unit);
  const breakdown = cap.seller_receivable_breakdown || {};
  const metadata = {
    ...tx.metadata,
    customer: { name: shippingAddress?.name || payerName },
    ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
    paypal: {
      ...tx.metadata?.paypal,
      order_id: orderId,
      capture_id: cap.id,
      capture_status: cap.status,
      payer_id: payer.payer_id || null,
      payer_email: payer.email_address || null,
      payer_name: payerName,
      fee: breakdown.paypal_fee?.value || null,
      net: breakdown.net_amount?.value || null,
    },
  };
  await supabase.from('payment_transactions').update({ metadata, updated_at: new Date().toISOString() }).eq('session_id', sessionId);

  if (cap.status === 'COMPLETED') {
    await completePaidSession(sessionId, { status: 'complete', paymentStatus: 'paid', customerEmail: payer.email_address || null });
    return { ok: true, status: 200, sessionId };
  }

  if (cap.status === 'PENDING') {
    // e.g. under PayPal review: the PAYMENT.CAPTURE.COMPLETED webhook finishes it later.
    await supabase.from('payment_transactions').update({ payment_status: 'pending', updated_at: new Date().toISOString() }).eq('session_id', sessionId).neq('payment_status', 'paid');
    return { ok: true, status: 200, sessionId, pending: true };
  }

  await expireSession(sessionId);
  return { ok: false, status: 402, error: 'PayPal declined the payment. You have not been charged.' };
}

// The buyer closed the PayPal window: free the reserved coupon use.
export async function cancelPayPalCheckout(orderId) {
  if (!isPayPalOrderId(orderId)) return;
  await expireSession(ppSessionId(orderId));
}

// A capture was denied/declined after approval.
export async function failPayPalCheckout(orderId) {
  if (!isPayPalOrderId(orderId)) return;
  await expireSession(ppSessionId(orderId));
}

// Refund/reversal webhook: look up the capture, and if it is fully refunded
// mark the payment and order refunded (downloads stop; revenue excludes it).
export async function handlePayPalRefund(captureId) {
  const supabase = getSupabaseAdmin();
  const { data: tx } = await supabase
    .from('payment_transactions')
    .select('session_id, payment_status, metadata')
    .eq('metadata->paypal->>capture_id', captureId)
    .maybeSingle();
  if (!tx) return { handled: false };

  const capture = await getPayPalCapture(captureId);
  const note = { refund_status: capture.status, refund_checked_at: new Date().toISOString() };
  const metadata = { ...tx.metadata, paypal: { ...tx.metadata?.paypal, ...note } };

  if (capture.status === 'REFUNDED') {
    await supabase.from('payment_transactions').update({ payment_status: 'refunded', status: 'refunded', metadata, updated_at: new Date().toISOString() }).eq('session_id', tx.session_id);
    await supabase.from('orders').update({ status: 'refunded', updated_at: new Date().toISOString() }).eq('payment_session_id', tx.session_id);
    return { handled: true, refunded: true };
  }
  // Partial refunds are recorded but the order stays paid.
  await supabase.from('payment_transactions').update({ metadata, updated_at: new Date().toISOString() }).eq('session_id', tx.session_id);
  return { handled: true, refunded: false };
}
