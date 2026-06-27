# Blog System Documentation

The blog supports two modes per post:
1. **Standard mode** — content lives in the `content` field (HTML); the site renders its own header (title, image, author meta).
2. **Full HTML mode** — admin uploads a complete HTML document into the `full_html_page` field; the entire article body is rendered natively without the standard wrapper.

In both modes, the post is **server-rendered** (SSR) with proper per-post canonical URL, OG tags, and Twitter Card metadata.

---

## 1. Files

| File | Purpose |
|---|---|
| `/app/app/(routes)/blog/page.js` | Blog index — lists published posts. |
| `/app/app/(routes)/blog/[slug]/page.js` | **Server component**. Fetches post by slug, sets metadata (title, description, canonical, OG, Twitter), sanitises full-HTML uploads. |
| `/app/app/(routes)/blog/[slug]/BlogPostClient.js` | Renders the post. Accepts `initialPost` from SSR; falls back to client fetch only if SSR didn't provide it. |
| `/app/app/api/blog/route.js` | Public read API. Supports `?slug=` for single post, plus list filters. Tolerates trailing whitespace + case via `ilike` fallback. |
| `/app/app/api/admin/blog/route.js` | Admin CRUD. Sanitises slug via `slugify()` on both POST and PUT. |
| `/app/components/views/admin/BlogManager.jsx` | Admin UI: editor with "Full HTML" toggle, image upload, category picker. |
| `/app/lib/slug.js` | `slugify()` — single source of truth for URL-safe slugs. |

---

## 2. Schema

```sql
CREATE TABLE blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  excerpt         TEXT,
  content         TEXT,              -- HTML for standard mode
  full_html_page  TEXT,              -- complete HTML for "Full HTML" mode
  image_url       TEXT,
  author_name     TEXT,
  author_role     TEXT,
  category_id     UUID REFERENCES blog_categories(id),
  status          TEXT DEFAULT 'draft',  -- draft | published
  featured        BOOLEAN DEFAULT FALSE,
  read_time       TEXT,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

The `full_html_page` column was added in Phase 11. Migration is in `/app/schema.sql`.

---

## 3. How to publish a post (admin)

1. Sign in as admin (`/admin`).
2. Go to **Blog Manager** → **+ New Post**.
3. Fill in:
   - **Title** — used for SEO `<title>` and OG tag.
   - **Slug** — auto-derived from title; you can override but it is always passed through `slugify()` server-side, so bad characters are stripped.
   - **Excerpt** — used for meta description and OG description.
   - **Image** — used for the OG / Twitter Card image and the in-post hero.
   - **Author name + role** — shown in the post header.
   - **Category** — assign to one of the blog categories.
   - **Read time**, **Featured**, **Status** (draft / published).
4. Choose **content mode**:
   - **Standard** — paste HTML into the `content` field. The site adds its own title/image/author header.
   - **Full HTML page** — paste a complete HTML document (with `<head>`, `<style>`, etc.) into `full_html_page`. The site strips SEO-conflicting head tags but preserves your styling.
5. Save → set status to **Published**.

---

## 4. Full HTML uploads — what gets stripped

When you toggle **Full HTML page** and paste a complete HTML document, the **server** runs `sanitizeFullHtmlPage()` (in `/app/app/(routes)/blog/[slug]/page.js`) before rendering it.

### ❌ Removed (so they don't fight our SEO)
- `<head>...</head>` block
- `<title>`, `<meta>` (description, viewport, og:*, twitter:*)
- `<link rel="canonical">`, `<link rel="alternate">`, `<link rel="icon">`, `<link rel="manifest">`
- `<base>`
- The `<html>` and `<body>` wrapper tags themselves (their contents are kept)

### ✅ Preserved (so your article still looks right)
- `<style>...</style>` blocks
- `<link rel="stylesheet">` (external CSS, fonts)
- `<link rel="preload">`, `preconnect`, `dns-prefetch`
- All your `<h1>`, `<p>`, `<div>`, `<img>`, inline scripts inside the body

**TL;DR for admins:** upload the file you authored — don't strip anything yourself. The sanitizer is a safety net.

### Where SEO data now comes from
| HTML tag | Source |
|---|---|
| `<title>` | `blog_posts.title` |
| `<meta name="description">` | `blog_posts.excerpt` (or first 160 chars of content) |
| `<link rel="canonical">` | `${NEXT_PUBLIC_SITE_URL}/blog/${slug}` |
| `og:title`, `og:description`, `og:image`, `og:url` | `title`, `excerpt`, `image_url`, canonical URL |
| `og:type`, `published_time`, `modified_time` | `'article'`, `published_at`, `updated_at` |
| `twitter:card` | `summary_large_image` |

---

## 5. URL slugs

Every slug is forced through `/app/lib/slug.js`'s `slugify()`:

```js
slugify("Buyer's Guide 2026!")  // -> "buyers-guide-2026"
slugify("  Hello   World  ")    // -> "hello-world"
slugify("café crème")            // -> "cafe-creme"
```

- Lowercase only
- ASCII letters, digits, single dashes
- Apostrophes / quotes are dropped (not converted to dashes)
- Accents are stripped
- No leading / trailing / consecutive dashes
- Always trimmed

If the slugified version collides with another post, the admin layer appends a short id suffix (`-a1b2c3d4`).

---

## 6. Tolerant lookup

`/api/blog?slug=foo` performs:
1. Exact match on `slug`.
2. If not found, `ilike` (case-insensitive) fallback on `slug` — keeps old shared/social links working even after slug normalisation.
3. Returns `{ error: 'Post not found' }` with HTTP 404 only if both miss.

The page-level fallback also calls `notFound()` so Next.js renders its 404 with `robots: noindex` — search engines won't index dead URLs.

---

## 7. Caching

`/app/(routes)/blog/[slug]/page.js` sets:

```js
export const revalidate = 300;
```

That means each post HTML is **regenerated at most every 5 minutes** in production. Edits via the admin panel will show up at the next revalidation tick (or immediately on the editing user's session because Next.js bypasses cache during admin requests).

If you ever need to invalidate immediately, call:
```bash
curl -X POST "$SITE_URL/api/revalidate?path=/blog/<slug>"  # endpoint not exposed by default
```

---

## 8. SEO data flow

```
Admin saves post
   │
   ▼
blog_posts row written  (title, slug, excerpt, image_url, ...)
   │
   ▼  (on next request to /blog/<slug>)
generateMetadata() in page.js  →  Next.js renders:
   <title>...</title>
   <meta name="description" content="...">
   <link rel="canonical" href="...">
   <meta property="og:*">
   <meta name="twitter:*">
   │
   ▼
BlogPostPage RSC renders BlogPostClient with initialPost  (no client fetch)
   │
   ▼
Browser sees fully-rendered HTML with proper SEO tags.
```
