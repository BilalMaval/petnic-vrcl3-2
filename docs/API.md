# API Endpoints Reference

All backend routes live under `/api/*` (Kubernetes ingress rule).
The Next.js App Router file convention: `/app/app/api/<path>/route.js`.

---

## 🔓 Public API

### Products & Catalog

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List products. Query: `category`, `collection`, `search`, `sort`, `featured`. |
| `GET` | `/api/products/[slug]` | Single product by slug. Returns 404 if missing. |
| `GET` | `/api/collections` | List collections with nested categories. |
| `GET` | `/api/reference-designs` | List active POD reference designs. |

### Blog

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/blog` | List published posts. Query: `category`, `featured`, `slug` (returns single). Tolerates trailing whitespace + case. |
| `GET` | `/api/blog/categories` | List blog categories. |

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account → sends verification email. |
| `POST` | `/api/auth/verify-email` | Verify email token. |
| `POST` | `/api/auth/login` | Sign in (returns JWT). Requires `email_verified=true`. |
| `POST` | `/api/auth/forgot-password` | Send reset link. |
| `POST` | `/api/auth/reset-password` | Apply new password from token. |

### Newsletter

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/newsletter` | Subscribe an email to the marketing list. |

---

## 💳 Payments (Stripe)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/payments/checkout` | Create Stripe Checkout Session. Server-validates prices. Body: `{ origin_url, cart_items, user_email, shipping }`. Returns `{ url, session_id }`. |
| `GET` | `/api/payments/status/[session_id]` | Poll session status. Idempotent order creation on first "paid". Falls back to DB amount if Stripe transiently 404s. |
| `POST` | `/api/webhook/stripe` | Stripe webhook receiver. Verifies signature when `STRIPE_WEBHOOK_SECRET` is set. Handles `checkout.session.completed`, `async_payment_succeeded`, `expired`. |

See [STRIPE.md](STRIPE.md) for the full payment flow.

---

## 🤖 AI

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ai-preview` | Generate AI pet portrait preview from uploaded photo + style. Uses AI Horde. |

---

## 👤 Account (authenticated)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/account/orders` | List the signed-in user's orders. |
| `GET` | `/api/account/profile` | Read profile. |
| `PUT` | `/api/account/profile` | Update profile. |

JWT is sent as `Authorization: Bearer <token>` header.

---

## 🛡 Admin API (requires admin JWT)

All routes pass through `requireAdmin()` (`/app/lib/auth.js`) which 401s non-admin requests.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/products` | List products (incl. out-of-stock). |
| `POST` | `/api/admin/products` | Create product. |
| `PUT` | `/api/admin/products` | Update product (body: `{ id, ...updates }`). |
| `DELETE` | `/api/admin/products?id=...` | Delete product. |
| `GET` | `/api/admin/categories` | List categories. |
| `POST/PUT/DELETE` | `/api/admin/categories` | Mutate categories. |
| `GET` | `/api/admin/orders` | List all orders. |
| `PUT` | `/api/admin/orders` | Update order status. |
| `GET` | `/api/admin/blog` | List all posts (draft + published). |
| `POST` | `/api/admin/blog` | Create post. Slug is **auto-sanitised** via `slugify()`. |
| `PUT` | `/api/admin/blog` | Update post. Slug re-sanitised if changed. |
| `DELETE` | `/api/admin/blog?id=...` | Delete post. |
| `GET/POST/PUT/DELETE` | `/api/admin/blog/categories` | Manage blog categories. |
| `GET/POST/PUT/DELETE` | `/api/admin/reference-designs` | Manage POD reference designs. |

---

## 🗺 SEO Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/sitemap.xml` | Dynamic sitemap (products, blog, categories). |
| `GET` | `/robots.txt` | Generated from `/app/app/robots.js`. |

---

## 📝 Conventions

- All API routes return JSON.
- Errors look like `{ "error": "Human-readable message" }` with appropriate HTTP status.
- Successful mutations return the affected resource (e.g., `{ post: {...} }`).
- List endpoints return `{ posts: [...] }`, `{ products: [...] }`, etc.
- Auth header: `Authorization: Bearer <jwt>` (when required).
- Admin routes also accept the JWT in a `petnic_token` cookie (set on login).

---

## Quick curl examples

```bash
# Login as admin
TOKEN=$(curl -s -X POST "$URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@petnicstudio.com","password":"PetnicAdmin2024!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Fetch all blog posts (admin view)
curl -s "$URL/api/admin/blog" -H "Authorization: Bearer $TOKEN"

# Create a Stripe checkout
curl -s -X POST "$URL/api/payments/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_url": "'$URL'",
    "user_email": "test@petnic.test",
    "cart_items": [{ "product_id": "<UUID>", "quantity": 1 }]
  }'
```
