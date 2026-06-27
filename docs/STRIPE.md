# Stripe Payments — Setup & Go-Live Guide

This document explains how Stripe Checkout is wired into Petnic Studio, how to take a test order end-to-end, and how to flip the app from **test mode** (Emergent proxy) to **live mode** (real Stripe).

---

## 1. Architecture overview

```
┌──────────────┐       ┌──────────────────────────┐       ┌──────────────────────┐
│ ProductDetail│──────▶│ POST /api/payments/      │──────▶│ Stripe Checkout      │
│ (Buy Now)    │       │      checkout            │       │ (hosted page)        │
└──────────────┘       └──────────────────────────┘       └──────────────────────┘
                                  │                                  │
                                  │ inserts row                       │ redirect to
                                  ▼                                  ▼
                       ┌──────────────────────────┐       ┌──────────────────────┐
                       │ payment_transactions     │       │ /checkout/success    │
                       │ (status=pending)         │       │ ?session_id=...      │
                       └──────────────────────────┘       └──────────────────────┘
                                  ▲                                  │
                                  │                                  │ poll
                       ┌──────────────────────────┐       ┌──────────────────────┐
                       │ POST /api/webhook/stripe │◀──────│ GET /api/payments/   │
                       │ (asynchronous)           │       │     status/[id]      │
                       └──────────────────────────┘       └──────────────────────┘
                                  │
                                  ▼
                       ┌──────────────────────────┐
                       │ orders (status=paid)     │
                       │ — idempotent insert      │
                       └──────────────────────────┘
```

---

## 2. Files

| File | Purpose |
|---|---|
| `/app/lib/stripe.js` | Fetch-based REST client. Routes through `https://integrations.emergentagent.com/stripe/v1` when key is `sk_test_emergent`, else `api.stripe.com/v1`. |
| `/app/app/api/payments/checkout/route.js` | Creates a Checkout Session. Server-side price validation. |
| `/app/app/api/payments/status/[session_id]/route.js` | Polled by `/checkout/success`. Idempotent order creation on first "paid". Falls back to DB amount when Stripe transiently 404s. |
| `/app/app/api/webhook/stripe/route.js` | Webhook receiver. Signature verification when `STRIPE_WEBHOOK_SECRET` is set. |
| `/app/app/(routes)/checkout/success/page.js` | Polls payment status, shows order confirmation. |
| `/app/app/(routes)/checkout/cancel/page.js` | Soft-cancel landing page. |
| `/app/components/ProductDetail.jsx` | Buy Now → modal → `POST /api/payments/checkout` → `window.location = url`. |

---

## 3. Database tables

### `payment_transactions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id      VARCHAR(255) UNIQUE NOT NULL
amount          DECIMAL(10,2) NOT NULL
currency        VARCHAR(10) DEFAULT 'usd'
status          VARCHAR(50)  -- open | complete | expired
payment_status  VARCHAR(50)  -- initiated | unpaid | paid | failed
user_id         UUID
user_email      VARCHAR(255)
metadata        JSONB          -- { items: [...], shipping: {...} }
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `orders` (additional columns)
```sql
payment_session_id   VARCHAR(255)  -- Stripe session_id, used for idempotency
items                JSONB         -- snapshot of cart at payment time
status               VARCHAR(50)   -- includes 'paid'
```

The migration is in `/app/schema.sql`. Already applied to the Supabase instance.

---

## 4. Required env vars

```bash
# /app/.env
STRIPE_API_KEY=sk_test_emergent              # test mode (default)
STRIPE_WEBHOOK_SECRET=                       # optional in test, REQUIRED in live
NEXT_PUBLIC_SITE_URL=https://www.petnicstudio.com
```

When `STRIPE_API_KEY` does **not** contain `sk_test_emergent`, the client automatically points at `api.stripe.com/v1`. No code change needed.

---

## 5. End-to-end test (preview mode)

```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/.env | cut -d= -f2)

# 1. Create a checkout session
curl -s -X POST "$API_URL/api/payments/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_url": "'$API_URL'",
    "user_email": "test@petnic.test",
    "cart_items": [{ "product_id": "<UUID>", "quantity": 1 }],
    "shipping": { "required": true, "name": "Test User" }
  }'

# Response: { url: "https://checkout.stripe.com/...", session_id: "cs_test_..." }

# 2. Visit the URL in a browser, complete the test card:  4242 4242 4242 4242
# 3. Stripe redirects to /checkout/success?session_id=cs_test_...
# 4. The success page polls /api/payments/status/cs_test_... until paid
# 5. /api/payments/status creates a row in orders with status='paid' (idempotent)
```

---

## 6. Going live (production mode)

> Do this **after** Stripe approves your account for live charges.

### 6a. In your Stripe Dashboard
1. **Settings → Business → Public details** — add the 5 policy URLs:
   - Privacy Policy → `https://www.petnicstudio.com/privacy`
   - Terms → `https://www.petnicstudio.com/terms`
   - Refund Policy → `https://www.petnicstudio.com/refund`
   - Shipping Policy → `https://www.petnicstudio.com/shipping`
   - Cookie Policy → `https://www.petnicstudio.com/cookies`
2. **Developers → API keys** — copy your **live** secret key (`sk_live_...`).
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://www.petnicstudio.com/api/webhook/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.expired`
   - Copy the signing secret (`whsec_...`).

### 6b. Update `/app/.env`
```bash
STRIPE_API_KEY=sk_live_***********************
STRIPE_WEBHOOK_SECRET=whsec_*********************
NEXT_PUBLIC_SITE_URL=https://www.petnicstudio.com
```

### 6c. Restart
```bash
sudo supervisorctl restart backend frontend
```

### 6d. Verify
- Make a small live purchase (e.g., $1 product) with a real card.
- Check `payment_transactions` and `orders` for the new row.
- Confirm webhook event appears as "Succeeded" in Stripe Dashboard → Developers → Webhooks.

---

## 7. Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `Config object may only contain...` | Trying to use the official Stripe SDK with `basePath` | Already fixed — we use a custom REST client (`/app/lib/stripe.js`). |
| `No such checkout.session` immediately after create | Emergent Stripe proxy is occasionally not read-after-write consistent | The status endpoint already falls back to DB. Safe to ignore. Does **not** happen on real Stripe. |
| Webhook fires but no order created | `STRIPE_WEBHOOK_SECRET` not set, or signature mismatch | Set the secret, restart backend, re-test with `stripe trigger checkout.session.completed`. |
| Amount in checkout differs from product page | Client and DB price drifted (e.g., promo) | Checkout always uses DB price — update the product. |

---

## 8. Security checklist

- [x] All payment amounts come from the DB, never from the client.
- [x] `success_url` and `cancel_url` built from `origin_url` sent by frontend (no hardcoded URLs).
- [x] `payment_transactions` row created **before** redirect, so we can recover from polling failures.
- [x] Order creation is idempotent on `session_id`.
- [x] Webhook signature verified in live mode.
- [x] Stripe key is server-only (never exposed to the browser).
