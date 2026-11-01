// Minimal PayPal REST client (Orders v2, Payments v2, Webhooks) using fetch.
// Server-only: PAYPAL_CLIENT_SECRET must never reach the browser.
//
// Env:
//   NEXT_PUBLIC_PAYPAL_CLIENT_ID  public client id (also used by the buttons)
//   PAYPAL_CLIENT_SECRET          secret (server only)
//   PAYPAL_WEBHOOK_ID             id of the webhook registered in the PayPal dashboard
//   PAYPAL_ENV                    "live" for real money; anything else = sandbox

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';
const LIVE_BASE = 'https://api-m.paypal.com';

export const paypalMode = () => (process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox');
const baseUrl = () => (paypalMode() === 'live' ? LIVE_BASE : SANDBOX_BASE);

export function paypalConfigured() {
  return !!(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

let cachedToken = null; // { value, expiresAt }

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const auth = Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const err = new Error(data.error_description || 'PayPal authentication failed');
    err.status = res.status;
    throw err;
  }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in || 300) * 1000 };
  return cachedToken.value;
}

async function paypalFetch(method, path, { body, requestId } = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data.message || data.error_description || `PayPal API error (${res.status})`);
    err.status = res.status;
    err.issue = data.details?.[0]?.issue || data.name || null;
    err.paypal = data;
    throw err;
  }
  return data;
}

// Builds the single purchase unit for an order. Amounts are strings with two
// decimals; the item total must equal the sum of the lines exactly, and the
// discount (coupon) is sent as its own breakdown line.
export function buildPurchaseUnit({ lines, discount, total, hasPhysical }) {
  const money = (n) => ({ currency_code: 'USD', value: Number(n).toFixed(2) });
  const itemTotalCents = lines.reduce((s, l) => s + l.unit_cents * l.quantity, 0);
  const unit = {
    description: 'Petnic Studio order',
    items: lines.map((l) => ({
      name: String(l.display_name).slice(0, 127),
      quantity: String(l.quantity),
      unit_amount: money(l.unit_cents / 100),
      sku: String(l.product_id).slice(0, 127),
      category: l.is_digital ? 'DIGITAL_GOODS' : 'PHYSICAL_GOODS',
    })),
    amount: {
      ...money(total),
      breakdown: {
        item_total: money(itemTotalCents / 100),
        ...(discount > 0 ? { discount: money(discount) } : {}),
      },
    },
  };
  return { unit, shippingPreference: hasPhysical ? 'GET_FROM_FILE' : 'NO_SHIPPING' };
}

export function createPayPalOrder({ unit, shippingPreference, requestId }) {
  return paypalFetch('POST', '/v2/checkout/orders', {
    requestId,
    body: {
      intent: 'CAPTURE',
      purchase_units: [unit],
      application_context: {
        brand_name: 'Petnic Studio',
        user_action: 'PAY_NOW',
        shipping_preference: shippingPreference,
      },
    },
  });
}

export const getPayPalOrder = (orderId) => paypalFetch('GET', `/v2/checkout/orders/${encodeURIComponent(orderId)}`);

export const capturePayPalOrder = (orderId) =>
  paypalFetch('POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { requestId: `capture-${orderId}` });

export const getPayPalCapture = (captureId) => paypalFetch('GET', `/v2/payments/captures/${encodeURIComponent(captureId)}`);

// Full refund when no amount is given. Used by tests and available for admin refunds.
export const refundPayPalCapture = (captureId, amount) =>
  paypalFetch('POST', `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    requestId: `refund-${captureId}-${amount || 'full'}`,
    body: amount ? { amount: { currency_code: 'USD', value: Number(amount).toFixed(2) } } : {},
  });

// Asks PayPal to verify a webhook delivery. Returns true only on SUCCESS; any
// missing piece of config or header means the event is NOT trusted.
export async function verifyPayPalWebhook(headers, event) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const h = (name) => headers.get(name);
  const required = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'];
  if (required.some((n) => !h(n))) return false;
  try {
    const result = await paypalFetch('POST', '/v1/notifications/verify-webhook-signature', {
      body: {
        auth_algo: h('paypal-auth-algo'),
        cert_url: h('paypal-cert-url'),
        transmission_id: h('paypal-transmission-id'),
        transmission_sig: h('paypal-transmission-sig'),
        transmission_time: h('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: event,
      },
    });
    return result.verification_status === 'SUCCESS';
  } catch (e) {
    console.error('PayPal webhook verification call failed:', e.message);
    return false;
  }
}
