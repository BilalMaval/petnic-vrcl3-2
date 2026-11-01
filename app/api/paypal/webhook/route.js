import { NextResponse } from 'next/server';
import { verifyPayPalWebhook, paypalConfigured } from '@/lib/paypal';
import { settlePayPalOrder, failPayPalCheckout, handlePayPalRefund } from '@/lib/paypal-orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PayPal webhook. Every event is verified with PayPal before it is acted on;
// anything unverified is rejected. Handlers are idempotent, so PayPal's
// retries (and the browser flow running at the same time) are safe.
export async function POST(request) {
  if (!paypalConfigured() || !process.env.PAYPAL_WEBHOOK_ID) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
  }

  const raw = await request.text();
  let event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  if (!(await verifyPayPalWebhook(request.headers, event))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const resource = event.resource || {};
    switch (event.event_type) {
      // Buyer approved but the browser never came back: capture from here.
      case 'CHECKOUT.ORDER.APPROVED':
        await settlePayPalOrder(resource.id, { capture: true });
        break;

      // A held payment cleared (or the capture completed): finish the order.
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        if (orderId) await settlePayPalOrder(orderId, { capture: false });
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED': {
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        if (orderId) await failPayPalCheckout(orderId);
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED':
      case 'PAYMENT.CAPTURE.REVERSED': {
        // A refund event's resource is the refund; its "up" link points at the capture.
        const up = (resource.links || []).find((l) => l.rel === 'up')?.href || '';
        const captureId = event.event_type === 'PAYMENT.CAPTURE.REVERSED' ? resource.id : up.split('/').pop();
        if (captureId) await handlePayPalRefund(captureId);
        break;
      }

      default:
        break; // other events are acknowledged and ignored
    }
  } catch (e) {
    console.error('PayPal webhook handler failed:', event.event_type, e);
    // 500 makes PayPal retry later.
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
