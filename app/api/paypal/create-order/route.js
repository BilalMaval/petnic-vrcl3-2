import { NextResponse } from 'next/server';
import { paypalConfigured } from '@/lib/paypal';
import { createCheckout, sweepStalePayPalCheckouts } from '@/lib/paypal-orders';
import { allowRequest, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public. Same inputs as /api/payments/checkout: the browser sends only ids,
// quantities and a coupon code; every price is read from the database.
export async function POST(request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'PayPal is not available right now.' }, { status: 503 });
  }
  if (!allowRequest(`paypal-create:${clientIp(request)}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute and try again.' }, { status: 429 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  // Opportunistic cleanup of abandoned PayPal checkouts (releases coupon uses).
  await sweepStalePayPalCheckouts();

  const result = await createCheckout(body);
  return NextResponse.json(result.body, { status: result.status });
}
