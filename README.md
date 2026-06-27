# Petnic Studio — Developer Documentation

Custom pet portrait & pet care ecommerce platform built on Next.js 16 (App Router), Supabase (PostgreSQL), Tailwind, Shadcn/UI, and Stripe.

> **Live preview URL** is provided in `frontend/.env` as `REACT_APP_BACKEND_URL`. Production is `https://www.petnicstudio.com`.

---

## 📑 Table of Contents

| Topic | File |
|---|---|
| Tech stack & project structure | `README.md` (this file) |
| Stripe payments setup & go-live | `docs/STRIPE.md` |
| Blog system & Full-HTML uploads | `docs/BLOG.md` |
| Legal / policy pages (Stripe-required) | `docs/LEGAL_PAGES.md` |
| SEO & SSR strategy | `docs/SEO.md` |
| Environment variables reference | `docs/ENVIRONMENT.md` |
| API endpoints reference | `docs/API.md` |
| Database schema & migrations | `docs/DATABASE.md` |
| Roadmap & changelog | `memory/PRD.md` |
| Test credentials | `memory/test_credentials.md` |

---

## 🛠 Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, RSC) |
| Database | **Supabase Postgres** (with service role for admin routes) |
| UI | **Tailwind CSS** + **Shadcn/UI** + Lucide Icons |
| Auth | JWT (jose) + bcryptjs, email verification via Brevo |
| Payments | **Stripe Checkout** (REST via `/app/lib/stripe.js`) |
| Email | **Brevo** (transactional + marketing) |
| AI Images | **AI Horde** (free), Emergent LLM key for text/image |
| Analytics | Google Analytics (`G-7LXN4S433L`) |

---

## 📁 Project Structure

```
/app
├── app/
│   ├── (routes)/                  # All pages
│   │   ├── auth/                  # Login/register + verify-email
│   │   ├── shop/                  # SSR product catalog
│   │   ├── product/[slug]/        # Product detail (SSR)
│   │   ├── blog/[slug]/           # Blog post (SSR + canonical)
│   │   ├── checkout/              # Stripe success + cancel pages
│   │   ├── privacy/               # Stripe-required policy pages
│   │   ├── terms/                 #   ↳ shares LegalPage layout
│   │   ├── refund/                #
│   │   ├── shipping/              #
│   │   ├── cookies/               #
│   │   ├── admin/                 # Admin dashboard
│   │   └── ...
│   ├── api/                       # All backend routes (must be /api/*)
│   │   ├── payments/              # checkout + status (Stripe)
│   │   ├── webhook/stripe/        # Stripe webhook listener
│   │   ├── blog/                  # Public blog API
│   │   ├── admin/                 # Admin-only mutations
│   │   └── ...
│   ├── sitemap.js                 # Dynamic sitemap
│   ├── robots.js                  # SEO robots
│   └── layout.js                  # Root metadata + GA
├── components/
│   ├── layout/                    # Navbar, Footer, LayoutWrapper
│   ├── views/                     # Page-level client components
│   │   ├── LegalPage.jsx          # Reusable layout for policy pages
│   │   ├── ShopPage.jsx           # Receives SSR initialProducts
│   │   ├── admin/                 # Admin dashboard components
│   │   └── ...
│   ├── ProductDetail.jsx          # Wired to /api/payments/checkout
│   └── ui/                        # Shadcn primitives
├── lib/
│   ├── supabase.js                # createClient + getSupabaseAdmin
│   ├── stripe.js                  # Fetch-based Stripe REST client (Emergent proxy aware)
│   ├── shop.js                    # fetchShopData() for SSR
│   ├── slug.js                    # slugify() — single source of truth
│   ├── auth.js                    # JWT + requireAdmin guard
│   └── email.js                   # Brevo wrapper
├── config/
│   ├── site.js
│   └── static-data.js             # Nav items, footer links, static fallbacks
├── docs/                          # Developer docs (you are here)
├── memory/                        # PRD, test credentials, run-time notes
└── schema.sql                     # Canonical DB schema
```

---

## 🚀 Getting Started

### Local development
```bash
yarn install
# Backend + frontend are managed by supervisor in the cloud env. Locally:
yarn dev          # starts Next.js on :3000
```

### Required environment variables
See [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for the full list.

### Hot reload
Both frontend and backend hot-reload automatically. Only restart supervisor after:
- editing `.env`
- installing new dependencies (`yarn add ...`)

```bash
sudo supervisorctl restart frontend
sudo supervisorctl restart backend
```

---

## 🏗 Architecture Highlights

### Stripe payments
- **Custom REST client** (`/app/lib/stripe.js`) auto-routes via the Emergent proxy when `STRIPE_API_KEY=sk_test_emergent`, and direct to `api.stripe.com` for real keys.
- Server-side **price validation** — checkout always re-reads prices from the `products` table.
- `payment_transactions` table tracks every checkout from "initiated" → "paid".
- Status polling on `/checkout/success` with DB fallback when the Emergent proxy transiently 404s.
- See **[docs/STRIPE.md](docs/STRIPE.md)** for the full flow + go-live steps.

### SEO + SSR
- `/shop`, `/shop/[category]`, and `/blog/[slug]` are **server-rendered** with proper per-page metadata.
- Initial HTML contains real product/blog data so Googlebot can index without running JS.
- Per-page `canonical`, OG, and Twitter Card tags are generated dynamically.
- See **[docs/SEO.md](docs/SEO.md)** for details.

### Blog with Full-HTML uploads
- Admins can upload a complete HTML page that renders natively inside the site frame.
- A **server-side sanitizer** strips `<head>`, `<title>`, `<meta>`, and SEO-conflicting `<link>` tags but **preserves `<style>` and stylesheet links** so the article's design survives.
- See **[docs/BLOG.md](docs/BLOG.md)**.

### Legal pages
Five Stripe-compliance pages share a single `LegalPage.jsx` layout with sticky TOC, breadcrumbs, and consistent branding:
- `/privacy`, `/terms`, `/refund`, `/shipping`, `/cookies`
- See **[docs/LEGAL_PAGES.md](docs/LEGAL_PAGES.md)**.

---

## ✅ Conventions

- **All backend routes start with `/api`** — required by the Kubernetes ingress.
- **Frontend uses `process.env.REACT_APP_BACKEND_URL`** for API calls.
- **Backend uses `process.env.MONGO_URL` / `DATABASE_URL` / `DIRECT_URL`** — never hard-coded.
- **`data-testid`** is required on every interactive element and user-facing value.
- **Edit existing files** rather than creating new ones whenever possible.
- **Slugs** are always run through `slugify()` from `/app/lib/slug.js`.

---

## 🧪 Testing & Credentials

Admin: `admin@petnicstudio.com` / `PetnicAdmin2024!`
See `memory/test_credentials.md`.

Latest test reports live in `/app/test_reports/iteration_*.json`.

---

## 📜 License

Proprietary. © Petnic Studio.
