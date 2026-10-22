import { NextResponse } from 'next/server';
import { priceItems } from '@/lib/pricing';
import { evaluateCoupon } from '@/lib/coupons';
import { allowRequest, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public. The browser sends only ids and quantities; prices come from the DB.
export async function POST(request) {
  if (!allowRequest(`coupon-validate:${clientIp(request)}`, 15, 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const { code, items, email } = body || {};
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return NextResponse.json({ success: false, error: 'Your cart is empty' }, { status: 400 });
  }

  const priced = await priceItems(
    items.map((i) => ({
      product_id: i?.productId,
      quantity: i?.quantity,
      design_id: i?.designId || null,
      variation_option_ids: Array.isArray(i?.variationOptionIds) ? i.variationOptionIds : [],
    }))
  );
  if (!priced.ok) return NextResponse.json({ success: false, error: priced.error }, { status: 400 });

  const result = await evaluateCoupon(code, priced.subtotal, email);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });

  // The internal id is not needed by the browser.
  const { id: _internalId, ...coupon } = result.coupon;
  return NextResponse.json({
    success: true,
    subtotal: priced.subtotal,
    discount: result.discount,
    total: result.total,
    coupon,
  });
}
