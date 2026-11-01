import { NextResponse } from 'next/server';
import { cancelPayPalCheckout } from '@/lib/paypal-orders';
import { allowRequest, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The buyer closed the PayPal window without paying. Frees any coupon use that
// was reserved for this checkout. A paid order can never be cancelled this way.
export async function POST(request) {
  if (!allowRequest(`paypal-cancel:${clientIp(request)}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  await cancelPayPalCheckout(body?.orderId);
  return NextResponse.json({ success: true });
}
