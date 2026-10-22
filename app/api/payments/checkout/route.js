import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { stripeClient } from '@/lib/stripe';
import { priceItems } from '@/lib/pricing';
import { evaluateCoupon, claimCoupon, releaseCoupon, MSG } from '@/lib/coupons';
import { completePaidSession } from '@/lib/orders-finalize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  // Set once a coupon use has been reserved, so any later failure can give it back.
  let claimedCouponId = null;

  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const {
      cart_items,
      origin_url,
      user_id,
      user_email,
      shipping,
      selected_design,
      attribution,
      couponCode,
    } = body;

    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!origin_url) {
      return NextResponse.json({ error: 'Origin URL required' }, { status: 400 });
    }

    // Server-side price validation: real prices come from the database.
    const priced = await priceItems(cart_items);
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: 400 });
    }
    const { lines, subtotal } = priced;

    // Coupon: re-evaluated here on the server; the browser's earlier
    // validate call is only a preview.
    let coupon = null;
    let discount = 0;
    if (couponCode) {
      const result = await evaluateCoupon(couponCode, subtotal, user_email, { requireEmail: true });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      coupon = { id: result.coupon.id, code: result.coupon.code, discount: result.discount, subtotal };
      discount = result.discount;
    }
    const total = Math.round((subtotal - discount) * 100) / 100;
    const isFree = !!coupon && total === 0;

    if (isFree) {
      if (!user_email || !EMAIL_RE.test(user_email)) {
        return NextResponse.json({ error: 'Enter your email to complete a free order' }, { status: 400 });
      }
      // No Stripe session means no shipping-address step, so only digital items.
      if (lines.some((l) => !l.is_digital)) {
        return NextResponse.json({ error: 'Free orders are only available for digital products' }, { status: 400 });
      }
    }

    if (coupon) {
      if (!(await claimCoupon(coupon.id))) {
        return NextResponse.json({ error: MSG.usedUp }, { status: 400 });
      }
      claimedCouponId = coupon.id;
    }

    const validatedItems = lines.map((l) => ({
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

    const txMetadata = {
      items: validatedItems,
      shipping: shipping || null,
      selected_design: selected_design || null,
      attribution: cleanAttribution(attribution),
      ...(coupon ? { coupon } : {}),
    };

    // ---- Free order (100% coupon): no payment step ----------------------
    if (isFree) {
      const sessionId = `free_${randomUUID()}`;
      const { error: insertErr } = await supabase.from('payment_transactions').insert({
        session_id: sessionId,
        amount: 0,
        currency: 'usd',
        status: 'open',
        payment_status: 'initiated',
        user_id: user_id || null,
        user_email,
        metadata: txMetadata,
        created_at: new Date().toISOString(),
      });
      if (insertErr) throw new Error('Could not record the order');

      await completePaidSession(sessionId, { status: 'complete', paymentStatus: 'paid', customerEmail: user_email });
      claimedCouponId = null;

      return NextResponse.json({
        url: `${origin_url}/checkout/success?session_id=${sessionId}`,
        session_id: sessionId,
        free: true,
      });
    }

    // ---- Paid order via Stripe ------------------------------------------
    const lineItems = lines.map((l) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: l.display_name,
          images: l.image_url ? [l.image_url] : [],
        },
        unit_amount: l.unit_cents,
      },
      quantity: l.quantity,
    }));

    const stripe = stripeClient;
    const sessionParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${origin_url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin_url}/checkout/cancel`,
      metadata: {
        user_id: user_id || '',
        user_email: user_email || '',
        items_count: String(validatedItems.length),
        ...(coupon ? { coupon_code: coupon.code } : {}),
      },
    };

    if (user_email) {
      sessionParams.customer_email = user_email;
    }

    if (shipping && shipping.required) {
      sessionParams.shipping_address_collection = {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'PT', 'PL'],
      };
    }

    if (coupon) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(discount * 100),
        currency: 'usd',
        duration: 'once',
        max_redemptions: 1,
        name: coupon.code.slice(0, 40),
      });
      sessionParams.discounts = [{ coupon: stripeCoupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Record pending payment transaction. Without a coupon this stays
    // non-fatal as before; with one it must succeed, because this record is
    // what later records the redemption and releases the use if abandoned.
    try {
      const { error: insertErr } = await supabase.from('payment_transactions').insert({
        session_id: session.id,
        amount: total,
        currency: 'usd',
        status: 'pending',
        payment_status: 'initiated',
        user_id: user_id || null,
        user_email: user_email || null,
        metadata: txMetadata,
        created_at: new Date().toISOString(),
      });
      if (insertErr) throw insertErr;
    } catch (txErr) {
      console.error('payment_transactions insert failed:', txErr);
      if (coupon) throw new Error('Could not record the order');
    }

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    if (claimedCouponId) await releaseCoupon(claimedCouponId);
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}

// First-touch marketing attribution (utm_*/fbclid) captured client-side.
// Allow-listed so only known fields can land in the metadata column.
function cleanAttribution(attribution) {
  const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'captured_at'];
  if (!attribution || typeof attribution !== 'object' || Array.isArray(attribution)) return null;
  const clean = {};
  for (const key of FIELDS) {
    if (typeof attribution[key] === 'string' && attribution[key]) clean[key] = attribution[key].slice(0, 255);
  }
  return Object.keys(clean).length ? clean : null;
}
