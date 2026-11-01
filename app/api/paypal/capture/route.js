import { NextResponse } from 'next/server';
import { paypalConfigured } from '@/lib/paypal';
import { settlePayPalOrder } from '@/lib/paypal-orders';
import { allowRequest, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Called by the browser after the buyer approves the payment in PayPal. The
// money is captured and verified on the server; the browser is never trusted
// to say a payment succeeded.
export async function POST(request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'PayPal is not available right now.' }, { status: 503 });
  }
  if (!allowRequest(`paypal-capture:${clientIp(request)}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute and try again.' }, { status: 429 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  const result = await settlePayPalOrder(body?.orderId, { capture: true });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error, code: result.code }, { status: result.status });
  }
  return NextResponse.json({ success: true, session_id: result.sessionId, pending: !!result.pending });
}
