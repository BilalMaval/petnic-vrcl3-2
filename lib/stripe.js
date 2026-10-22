/**
 * Minimal Stripe REST client.
 *
 * The official Stripe Node SDK has no `basePath` option, so it can't route through
 * Emergent's proxy at `https://integrations.emergentagent.com/stripe/v1/...`.
 * This client speaks Stripe's REST API directly using `fetch` + Basic auth, which
 * works against both the proxy (when STRIPE_API_KEY === sk_test_emergent) and the
 * real Stripe API for production keys.
 */

const PROXY_BASE = 'https://integrations.emergentagent.com/stripe/v1';
const STRIPE_BASE = 'https://api.stripe.com/v1';

function getBaseUrl() {
  const apiKey = process.env.STRIPE_API_KEY || '';
  return apiKey.includes('sk_test_emergent') ? PROXY_BASE : STRIPE_BASE;
}

function getAuthHeader() {
  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) throw new Error('STRIPE_API_KEY is not configured');
  return 'Basic ' + Buffer.from(apiKey + ':').toString('base64');
}

/**
 * Convert a JS object into Stripe's form-encoded format with bracket notation
 * for nested keys/arrays. Example:
 *   { line_items: [{ price_data: { currency: 'usd' } }] }
 *   -> line_items[0][price_data][currency]=usd
 */
function encode(obj, prefix = '', out = []) {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => encode(v, `${prefix}[${i}]`, out));
  } else if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      const key = prefix ? `${prefix}[${k}]` : k;
      encode(v, key, out);
    }
  } else {
    out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(obj))}`);
  }
  return out;
}

async function stripeRequest(method, path, params) {
  const url = `${getBaseUrl()}${path}`;
  const init = {
    method,
    headers: {
      Authorization: getAuthHeader(),
      'Stripe-Version': '2024-06-20',
    },
  };

  if (params && (method === 'POST' || method === 'PUT')) {
    init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    init.body = encode(params).join('&');
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.raw || `Stripe API error (${res.status})`;
    const err = new Error(msg);
    err.statusCode = res.status;
    err.response = data;
    throw err;
  }
  return data;
}

export const stripeClient = {
  checkout: {
    sessions: {
      create: (params) => stripeRequest('POST', '/checkout/sessions', params),
      retrieve: (id) => stripeRequest('GET', `/checkout/sessions/${id}`),
    },
  },
  // One-time Stripe coupon mirroring a validated store coupon, so the
  // discount appears as its own line on Stripe's hosted checkout page.
  coupons: {
    create: (params) => stripeRequest('POST', '/coupons', params),
  },
  webhooks: {
    /**
     * Verify a Stripe webhook signature.
     * Returns the parsed event object, or throws on invalid signature.
     */
    constructEvent: async (rawBody, signature, secret) => {
      const crypto = await import('node:crypto');
      const parts = Object.fromEntries(
        signature.split(',').map((kv) => kv.split('=').map((s) => s.trim()))
      );
      const timestamp = parts.t;
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');
      const sigs = signature
        .split(',')
        .filter((s) => s.startsWith('v1='))
        .map((s) => s.slice(3));
      const ok = sigs.some((s) => {
        const a = Buffer.from(s, 'hex');
        const b = Buffer.from(expected, 'hex');
        return a.length === b.length && crypto.timingSafeEqual(a, b);
      });
      if (!ok) {
        const err = new Error('Invalid Stripe webhook signature');
        err.statusCode = 400;
        throw err;
      }
      return JSON.parse(rawBody);
    },
  },
};
