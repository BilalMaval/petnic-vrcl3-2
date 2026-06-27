# Database Schema & Migrations

PostgreSQL on Supabase. Connection strings live in `/app/.env` as `DATABASE_URL` (pooled, port 6543) and `DIRECT_URL` (direct, port 5432).

The canonical schema is in **`/app/schema.sql`** at the repo root.

---

## 1. Tables

| Table | Purpose |
|---|---|
| `users` | Customer + admin accounts. `email_verified` gate on login. |
| `collections` | Top-level catalog grouping (POD, Digital, Pet Care, etc.). |
| `categories` | Sub-grouping within a collection. |
| `products` | Product catalog. `slug` unique, `in_stock` filter. |
| `orders` | Completed orders. `payment_session_id` links back to Stripe. |
| `payment_transactions` | All checkout sessions — initiated, pending, paid, expired. |
| `blog_posts` | Articles. `slug` unique. Has both `content` and `full_html_page`. |
| `blog_categories` | Blog topic taxonomy. |
| `reference_designs` | AI portrait style presets for POD. |
| `forum_threads` / `forum_replies` | Pet Owner Club community posts. |
| `newsletter_subscribers` | Brevo list mirror. |

---

## 2. Key columns

### `payment_transactions`
```sql
id              UUID PK DEFAULT gen_random_uuid()
session_id      VARCHAR(255) UNIQUE NOT NULL   -- Stripe checkout session id
amount          DECIMAL(10,2) NOT NULL
currency        VARCHAR(10) DEFAULT 'usd'
status          VARCHAR(50)                    -- open | complete | expired
payment_status  VARCHAR(50)                    -- initiated | unpaid | paid | failed
user_id         UUID
user_email      VARCHAR(255)
metadata        JSONB                          -- { items, shipping, ... }
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

Index: `(session_id)`, `(user_email)`.

### `orders` (additions)
```sql
payment_session_id   VARCHAR(255)   -- Stripe session_id; UNIQUE-ish via app-level idempotency
items                JSONB          -- snapshot of cart items at payment time
selected_design      VARCHAR(100)
design_addition      DECIMAL(10,2)
size                 VARCHAR(50)
style                VARCHAR(50)
custom_order         BOOLEAN
is_digital           BOOLEAN
is_dropship          BOOLEAN
cj_order_id          VARCHAR(100)
dropship_status      VARCHAR(50)
```

### `blog_posts`
```sql
id              UUID PK DEFAULT gen_random_uuid()
title           TEXT NOT NULL
slug            TEXT UNIQUE NOT NULL
excerpt         TEXT
content         TEXT             -- HTML (standard mode)
full_html_page  TEXT             -- complete HTML page (Full HTML mode)
image_url       TEXT
author_name     TEXT
author_role     TEXT
category_id     UUID REFERENCES blog_categories(id)
status          TEXT DEFAULT 'draft'   -- draft | published
featured        BOOLEAN DEFAULT FALSE
read_time       TEXT
published_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

---

## 3. Running migrations

Schema changes go in `/app/schema.sql` (idempotent — `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).

To apply schema changes locally (uses `DIRECT_URL` so DDL works):

```bash
cd /app
cat > /tmp/migrate.js <<'EOF'
const fs = require('fs');
const env = Object.fromEntries(
  fs.readFileSync('/app/.env','utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.split('=')[0], l.split('=').slice(1).join('=')])
);
const { Pool } = require('/app/node_modules/pg');
(async () => {
  const pool = new Pool({ connectionString: env.DIRECT_URL });
  const sql = fs.readFileSync('/app/schema.sql','utf8');
  await pool.query(sql);
  console.log('Migration OK');
  await pool.end();
})();
EOF
node /tmp/migrate.js
```

Or paste `schema.sql` content into Supabase Studio → SQL Editor.

---

## 4. Seeding

`/app/scripts/seed.js` seeds:
- Default `collections` (POD, Digital Downloads, Pet Care)
- Default `categories` per collection
- Default `blog_categories`
- Default `reference_designs` (8 AI styles)
- Admin user (idempotent based on `ADMIN_EMAIL`)

Run with:
```bash
node /app/scripts/seed.js
```

---

## 5. Backups & exports

Supabase project dashboard → **Database → Backups**. Daily automatic snapshots, point-in-time restore available on Pro plan.

For a quick CSV export of a specific table:
```sql
COPY payment_transactions TO '/tmp/tx.csv' WITH CSV HEADER;
```

(Use Supabase SQL Editor or `psql` against `DIRECT_URL`.)

---

## 6. Index recommendations

Already created via `schema.sql`:
- `idx_payment_tx_session_id` on `payment_transactions(session_id)`
- `idx_payment_tx_email` on `payment_transactions(user_email)`
- `slug` UNIQUE on `products`, `blog_posts`, `categories`, `collections`

Add as you scale:
- `idx_orders_user_id` on `orders(user_id)` (when `/account/orders` ships).
- `idx_blog_posts_status_published` on `blog_posts(status, published_at DESC)` for the index page.

---

## 7. Slug cleanup playbook

If bad slugs ever land in the DB (e.g., from an older import):

```js
// /tmp/fix_slugs.js
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync('/app/.env','utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.split('=')[0], l.split('=').slice(1).join('=')]));
const { Pool } = require('/app/node_modules/pg');

function slugify(s='') {
  return String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().trim().replace(/['"`]/g,'').replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-');
}

(async () => {
  const pool = new Pool({ connectionString: env.DIRECT_URL });
  const r = await pool.query("SELECT id, slug, title FROM blog_posts");  // or products
  for (const row of r.rows) {
    const clean = slugify(row.slug || row.title);
    if (clean !== row.slug) {
      const dup = await pool.query("SELECT id FROM blog_posts WHERE slug=$1 AND id<>$2", [clean, row.id]);
      const final = dup.rows.length ? `${clean}-${row.id.slice(0,8)}` : clean;
      await pool.query("UPDATE blog_posts SET slug=$1 WHERE id=$2", [final, row.id]);
      console.log(`'${row.slug}' → '${final}'`);
    }
  }
  await pool.end();
})();
```

This is exactly how the May 2026 blog cleanup was done.
