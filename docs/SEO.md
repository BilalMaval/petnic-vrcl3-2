# SEO & Server-Side Rendering Strategy

This document covers the SEO architecture, what's server-rendered, and the canonical URL strategy.

---

## 1. What's server-rendered (SSR)

| Page | SSR? | Notes |
|---|---|---|
| `/` (Home) | ✅ | Static metadata, schema markup. |
| `/shop` | ✅ | Products fetched from Supabase, full catalogue in initial HTML. |
| `/shop/[category]` | ✅ | Same, scoped by category. Per-category title/description/H1. |
| `/product/[slug]` | ✅ | Product schema + breadcrumb schema. |
| `/blog` | ✅ | Index of published posts. |
| `/blog/[slug]` | ✅ | Per-post canonical, OG, Twitter Card, article schema. |
| `/privacy`, `/terms`, `/refund`, `/shipping`, `/cookies` | ✅ | Stripe-required legal pages. |
| `/about`, `/contact`, `/customize`, etc. | ✅ | Static content. |
| `/pet-owner-club`, `/admin` | Client-only | Authenticated, no SEO value. |

**Key win:** Googlebot now sees the full product list on `/shop` (20+ cards), not an empty shell. Verified with:

```bash
curl -s https://petnic-deploy-ready.preview.emergentagent.com/shop | grep -c product-card-
# → 20
```

---

## 2. SSR implementation pattern

```js
// app/(routes)/shop/page.js — SERVER component
import { fetchShopData } from '@/lib/shop';
import ShopPageClient from '@/components/views/ShopPage';

export const metadata = { /* ...title, description, canonical, OG... */ };
export const revalidate = 300;  // ISR — re-generate at most every 5 min

export default async function ShopPage() {
  const { products, categories } = await fetchShopData();
  return <ShopPageClient initialProducts={products} initialCategories={categories} />;
}
```

The client component (`ShopPage.jsx`) accepts `initialProducts` + `initialCategories` as props. A `useRef` `isFirstRun` guard prevents a redundant client-side fetch on first render — only re-fetches when the user changes filters.

Same pattern for `/blog/[slug]` and `/shop/[category]`.

---

## 3. Canonical URL strategy

Every page sets a self-referencing canonical via `metadata.alternates.canonical`:

```js
alternates: {
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/shop/wall-art`
}
```

| Page | Canonical |
|---|---|
| `/shop` | `https://www.petnicstudio.com/shop` |
| `/shop/wall-art` | `https://www.petnicstudio.com/shop/wall-art` |
| `/blog/{slug}` | `https://www.petnicstudio.com/blog/{slug}` |
| `/product/{slug}` | `https://www.petnicstudio.com/product/{slug}` |
| `/privacy` | `https://www.petnicstudio.com/privacy` |
| Unknown blog slug → `notFound()` | `https://www.petnicstudio.com/blog` + `robots: noindex` |

> **Note:** in the preview environment `NEXT_PUBLIC_SITE_URL` points at the preview URL so canonicals are testable; switch it to `https://www.petnicstudio.com` for production.

### Why a server-side sanitizer for blog uploads?
Admins can upload a full HTML page that may include its own `<link rel="canonical">`. The sanitizer (`/app/app/(routes)/blog/[slug]/page.js → sanitizeFullHtmlPage`) strips those before rendering, so Google only sees the canonical we set via `generateMetadata`. See [BLOG.md](BLOG.md#4-full-html-uploads--what-gets-stripped).

---

## 4. Per-page metadata sources

| Page | `<title>` | `<description>` | `<og:image>` |
|---|---|---|---|
| Home | static | static | `/og-home.jpg` |
| `/shop` | static | static | `/og-shop.jpg` |
| `/shop/[cat]` | from `categoryMeta` lookup | from `categoryMeta` lookup | `/og-shop-{cat}.jpg` |
| `/product/[slug]` | `${product.name} — Petnic Studio` | `product.description` (truncated) | `product.image_url` |
| `/blog/[slug]` | `${post.title} \| Petnic Studio Blog` | `post.excerpt` | `post.image_url` |
| Legal pages | static (in `metadata`) | static | none |

---

## 5. Schema markup

Defined in `/app/app/layout.js` (Organization, WebSite) and on individual page components:

- **Home**: `Organization`, `WebSite`, `FAQPage`, `AggregateRating`
- **Product**: `Product` + `BreadcrumbList`
- **Blog post**: `Article` (via OG `og:type=article`)
- **Shop category**: `BreadcrumbList`

---

## 6. Sitemap & robots

`/app/app/sitemap.js` generates a dynamic sitemap by:
1. Listing all static pages (home, shop, blog, legal, etc.)
2. Querying `products` for in-stock items.
3. Querying `blog_posts` for published posts.
4. Querying `categories` for category pages.

Hosted at `/sitemap.xml` (Next.js auto-route).

`/app/app/robots.js` produces `/robots.txt`:
- Allows all crawlers.
- Excludes `/admin`, `/api`, `/account`, `/auth`.
- Points to the sitemap.

---

## 7. Performance & Core Web Vitals

- **ISR** (`revalidate = 300`) keeps server load low while keeping content fresh.
- Images use `loading="lazy"` outside the hero.
- Google Analytics is loaded via `next/script` with `strategy="afterInteractive"`.
- Tailwind purges unused classes for small CSS bundles.

---

## 8. Checklist for a new SSR page

1. Make `page.js` an **async server component** that fetches data via Supabase admin client.
2. Export `metadata` (title, description, **canonical**, OG, Twitter).
3. Set `export const revalidate = ...` if data is dynamic.
4. Pass fetched data as props to the client component for hydration.
5. Inside the client component, guard against double-fetching with `useRef`.
6. Add the URL to `/app/app/sitemap.js`.
7. Verify with `curl -s <url> | grep -E '<title|canonical|og:'`.
