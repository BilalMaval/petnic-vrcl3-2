# Environment Variables Reference

Every variable lives in `/app/.env`. Never commit secrets.

> The two **protected** variables are auto-injected by the platform and must not be removed:
> - `REACT_APP_BACKEND_URL` (frontend → backend public URL)
> - `MONGO_URL` / `DATABASE_URL` (database connection, set per env)

---

## Required (must be set in every environment)

| Variable | Purpose | Example |
|---|---|---|
| `REACT_APP_BACKEND_URL` | Public URL of the app. Used by the frontend for API calls. | `https://petnic-deploy-ready.preview.emergentagent.com` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used for SEO tags and webhook URLs. | `https://www.petnicstudio.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. | `https://yflekqkckhnzbkssccwc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (browser-safe). | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only). Used by API routes. | `eyJhbG...` |
| `DATABASE_URL` | Pooled Postgres connection string (PgBouncer). For application reads/writes. | `postgresql://...:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Direct Postgres connection (port 5432). For migrations and admin scripts. | `postgresql://...:5432/postgres` |
| `ADMIN_EMAIL` | Seeded admin account email. | `admin@petnicstudio.com` |
| `ADMIN_PASSWORD` | Seeded admin password (hashed on first run). | `PetnicAdmin2024!` |

---

## Stripe

| Variable | Required when | Purpose |
|---|---|---|
| `STRIPE_API_KEY` | Always | Stripe secret key. `sk_test_emergent` routes via Emergent proxy; `sk_live_*` hits real Stripe. |
| `STRIPE_WEBHOOK_SECRET` | Live mode | `whsec_*` — enables signature verification on `/api/webhook/stripe`. Skipped in test mode. |

See [STRIPE.md](STRIPE.md) for go-live steps.

---

## Email (Brevo)

| Variable | Purpose |
|---|---|
| `BREVO_API_KEY` | Brevo HTTP API key for sending transactional + marketing email. |
| `BREVO_SENDER_EMAIL` | "From" address — must be a verified sender in Brevo. |
| `BREVO_SENDER_NAME` | Display name on outbound mail. |

---

## LLMs & AI Image Generation

| Variable | Purpose |
|---|---|
| `EMERGENT_LLM_KEY` | Universal key for OpenAI / Anthropic / Gemini text + image generation via emergentintegrations. |
| `NEXT_PUBLIC_EMERGENT_LLM_KEY` | Same key, exposed for client-side calls. |
| `AI_HORDE_API_KEY` | Free AI Horde key for stable diffusion image generation. |

---

## Analytics

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement id (e.g. `G-XXXXXXX`). |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification token. Optional. |

---

## Optional / future

| Variable | When set |
|---|---|
| `CJ_ACCESS_TOKEN` | When you wire the real CJ Dropshipping API. Currently **MOCKED**. |
| `APP_URL` | Legacy alias for `NEXT_PUBLIC_SITE_URL`; used by older email templates. Keep in sync. |

---

## Worked example (`/app/.env` minimal)

```bash
# Public
REACT_APP_BACKEND_URL=https://www.petnicstudio.com
NEXT_PUBLIC_SITE_URL=https://www.petnicstudio.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres

# Admin
ADMIN_EMAIL=admin@petnicstudio.com
ADMIN_PASSWORD=ChangeMe123!

# Stripe (live)
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=hello@petnicstudio.com
BREVO_SENDER_NAME=Petnic Studio

# AI
EMERGENT_LLM_KEY=sk-emergent-...
NEXT_PUBLIC_EMERGENT_LLM_KEY=sk-emergent-...
AI_HORDE_API_KEY=...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
```

---

## After changing `.env`

```bash
sudo supervisorctl restart backend frontend
```

(Hot reload does **not** pick up `.env` changes.)
