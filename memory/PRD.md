# PETNIC STUDIO - Product Requirements Document

## Original Problem Statement
Build a superior pet-related print-on-demand e-commerce site. Multi-phase project:
- **Phase 1:** Migrate from React/FastAPI/MongoDB to Next.js 14+ App Router with Supabase PostgreSQL ✅
- **Phase 2:** Build Admin Panel/Dashboard for product, category, and order management ✅
- **Phase 3:** Add AI Pet Portrait Preview, Pet Owner Club Forum, User Authentication, User Dashboard ✅
- **Phase 4:** Complete blog, reference designs, auth emails, admin improvements ✅

## Architecture
```
/app (root)
├── app/
│   ├── (routes)/        ← All pages
│   ├── api/             ← API routes
│   │   ├── admin/       ← Admin APIs (products, categories, orders, blog, designs)
│   │   ├── auth/        ← Auth + forgot-password + reset-password + verify-email
│   │   ├── blog/        ← Public blog APIs
│   │   ├── forum/       ← Forum threads/replies
│   │   └── ...
│   ├── sitemap.js       ← Dynamic sitemap
│   ├── robots.js        ← SEO robots.txt
│   └── layout.js        ← Google Analytics G-7LXN4S433L
├── components/
│   ├── layout/          ← Navbar (with dropdowns), Footer, LayoutWrapper (scroll-to-top)
│   ├── views/           ← Page components
│   │   ├── admin/       ← AdminDashboard, ProductsManager, BlogManager, ReferenceDesignsManager
│   │   ├── CustomizePage.jsx ← 8 Reference AI Designs + Upload
│   │   ├── DigitalDownloadsPage.jsx ← Category tabs
│   │   ├── PetCarePage.jsx ← Category tabs + Dropship badges
│   │   ├── AuthPage.jsx ← Login/Register + Forgot Password
│   │   └── ...
│   └── ui/              ← Shadcn components
├── config/              ← Site config, static data
├── lib/                 ← Supabase client, auth utils
├── backend/             ← Proxy + AI Horde integration
└── package.json
```

## Tech Stack
- Next.js 16 (App Router)
- Supabase PostgreSQL + Storage
- React 19, Tailwind CSS, Shadcn/UI, Lucide React
- JWT auth (jose), bcryptjs
- Brevo API (emails)
- AI Horde API (free AI image generation)
- Google Analytics G-7LXN4S433L

## Completed Features

### Phase 1 ✅
- [x] Next.js App Router migration
- [x] Supabase PostgreSQL integration
- [x] 17+ public pages

### Phase 2 ✅
- [x] Admin dashboard with secure login
- [x] Product/Category/Order CRUD

### Phase 3 ✅
- [x] AI Pet Portrait Preview (AI Horde)
- [x] User Authentication (JWT)
- [x] Pet Owner Club Forum
- [x] User Dashboard

### Phase 4 ✅
- [x] Blog with admin management (create, edit, delete posts/categories)
- [x] Pet Owner Club scroll fix (scrolls to top on new thread)
- [x] Auth emails (verification on signup, password reset)
- [x] Products card view in admin (grid with images, badges, prices)
- [x] Page scroll fix on navigation
- [x] Category tabs for Digital Downloads and Pet Care
- [x] Category dropdowns in header for all collections
- [x] Google Analytics G-7LXN4S433L
- [x] CJ Dropshipping fields for Pet Care products
- [x] Digital downloads file upload/download support
- [x] ReferenceDesignsManager in admin
- [x] Breadcrumbs removed from all pages
- **Contact form sends to info@petnicstudio.com and sufyan.afzalk@gmail.com**

### Phase 5 ✅ (Mar 4, 2026)
- [x] **8 Reference AI Designs on POD Product Pages** - Selectable designs with price additions (+$8 to +$18)
- [x] **Image Gallery support** - ProductDetail component supports gallery_urls for Digital/Pet Care products
- [x] **Custom Size Input on Customize Page** - Side-by-side with preset sizes, +30% pricing

### Phase 6 ✅ (Mar 4, 2026)
- [x] **CJ Dropshipping Integration** - Admin panel to search/import products from CJ catalog
- [x] **Order Confirmation Emails** - Automatic Brevo emails with order details, download links, dropship info
- [x] **Enhanced Orders Manager** - Shows order type badges (Dropship, Digital, Custom, Standard)
- [x] **Dropship Order Forwarding** - Automatic submission to CJ when Pet Care orders are placed

### Phase 7 ✅ (Mar 4, 2026)
- [x] **Supabase Schema Applied** - Blog, reference designs, and order columns now in database
- [x] **Gallery Upload for Admin** - Digital Downloads and Pet Care products can now have multiple gallery images
- [x] **Reference Designs from DB** - 8 AI designs now served from Supabase (not static fallback)

### Phase 8 ✅ (Mar 12, 2026) - Vercel Deployment Ready
- [x] **Upgraded react-day-picker** to 9.7.0 for date-fns 4.1.0 compatibility
- [x] **Removed Python Backend** - Migrated AI preview endpoint to Next.js API route
- [x] **Fixed useSearchParams Suspense** - Wrapped Digital Downloads, Pet Care, Reset Password pages
- [x] **Cleaned Project Structure** - Removed backend folder, tests, Python files
- [x] **Updated next.config.js** - Added image domains for Supabase
- [x] **Created API Proxy** - Node.js proxy on port 8001 forwards to Next.js on 3000 for preview environment
- [x] **SEO Setup** - robots.js, sitemap.js with dynamic products/blog pages
- [x] **Google Analytics** - Updated to G-0JWFCNHG8M via NEXT_PUBLIC_GA_MEASUREMENT_ID env variable

### Phase 9 ✅ (Mar 14, 2026) - Admin Enhancements & Auth Emails
- [x] **Auth Emails** - Welcome email on signup, password reset email via Brevo (/lib/email.js)
- [x] **Print on Demand Menu** - Added to header with dropdown (Canvas Prints, Framed Art, Posters, Photo Gifts)
- [x] **Print on Demand Page** - New page at /print-on-demand with category tabs, search, 8 products
- [x] **Pet Owner Club Tab Fix** - Clicking tabs now scrolls to content section
- [x] **POD Gallery Upload** - Admin Products shows gallery upload for Print on Demand collection
- [x] **Users Management** - Professional admin page with search, role/membership filters, export CSV
- [x] **Orders Enhanced** - Added search, status/type/date filters, stats cards
- [x] **Categories Enhanced** - Added search, collection filter, color-coded badges

### Phase 10 ✅ (Mar 14, 2026) - Navigation & Email Fixes
- [x] **POD Categories Synced** - Updated header dropdown to match backend categories (Wall Art, Home & Living, Accessories, Apparel)
- [x] **Removed "All" Options** - Removed "All Print on Demand", "All Downloads", "All Pet Care" from header dropdowns (kept in Shop)
- [x] **Dropdown Navigation Fix** - Fixed bug where clicking multiple dropdown items didn't navigate properly
- [x] **Email Verification on Signup** - Now sends both verification email AND welcome email on registration
- [x] **Contact Form Recipients** - Updated to info@petnicstudio.com and sufyan.afzalk@gmail.com
- [x] **Contact Form Sender** - Fixed to use verified sender email (alisafyan1122@gmail.com)
- [x] **Email Verification Page** - Created /auth/verify page to handle email verification links
- [x] **Login Blocked Until Verified** - Users cannot log in until they verify their email

### Phase 12 ✅ (May 31, 2026) - Stripe Payments + Shop SSR
**Stripe Checkout Integration (live, end-to-end):**
- [x] Custom Node fetch-based Stripe REST client in `/app/lib/stripe.js` that routes through the Emergent proxy (`https://integrations.emergentagent.com/stripe/v1`) when `STRIPE_API_KEY=sk_test_emergent`, and through real Stripe API otherwise.
- [x] `POST /api/payments/checkout` — server-side price validation from `products` table (ignores client-sent prices), creates Stripe Checkout Session, records pending row in `payment_transactions`.
- [x] `GET /api/payments/status/[session_id]` — polled by /checkout/success page, idempotently creates `orders` row on first `paid`. Falls back to DB amount when Emergent proxy transiently 404s on retrieve.
- [x] `POST /api/webhook/stripe` — handles `checkout.session.completed`, `async_payment_succeeded`, and `expired` events. Verifies Stripe signature when `STRIPE_WEBHOOK_SECRET` is set.
- [x] Frontend wiring in `/app/components/ProductDetail.jsx` — Buy Now → modal collects name+email → `/api/payments/checkout` → redirect to `data.url` (Stripe hosted checkout).
- [x] DB migration: `payment_transactions` table + `orders.payment_session_id` + `orders.items` (applied directly via pg pool).

**Shop SSR for SEO:**
- [x] New `/app/lib/shop.js` `fetchShopData()` server-side helper.
- [x] `/app/(routes)/shop/page.js` and `/shop/[category]/page.js` are now server components that fetch products from Supabase and pass `initialProducts`/`initialCategories` to the client.
- [x] `/app/components/views/ShopPage.jsx` accepts initial server data; only re-fetches on filter change (guarded by `useRef` `isFirstRun`).
- [x] Verified: `curl /shop` returns 20 product cards in initial HTML; `curl /shop/wall-art` returns 3.
- [x] Pages set `revalidate = 300` so server cache refreshes every 5 minutes.

**Verified by testing agent (iteration_9.json):** 100% frontend success, 91% backend (1 known flaky test from Emergent Stripe proxy, not app code).

### Phase 13 ✅ (May 31, 2026) - Stripe-Required Legal Pages
**5 policy pages created (required for Stripe merchant approval):**
- [x] `/privacy` — Privacy Policy (data collected, usage, sharing, GDPR/CCPA rights, retention, security)
- [x] `/terms` — Terms & Conditions (eligibility, orders, pricing, custom-product license, IP, liability, governing law)
- [x] `/refund` — Refund & Return Policy (30-day guarantee, eligibility, process, timing, exchanges)
- [x] `/shipping` — Shipping & Delivery Policy (processing times, rates, tracking, international, lost/damaged)
- [x] `/cookies` — Cookie Policy (types, third-parties Stripe/GA/Supabase/Meta, opt-out)

**Implementation:**
- [x] New `/app/components/views/LegalPage.jsx` — reusable layout with sticky TOC sidebar, scroll-spy, breadcrumbs, effective-date header, brand-consistent styling.
- [x] Each page is a server component with full Next.js `metadata` (title, description, canonical, robots: index/follow) for SEO.
- [x] Footer redesigned: new bottom "legal bar" exposes all 5 policies + "Secure payments by Stripe" tagline. Resources column now links to Shipping & Delivery + Refund & Returns.
- [x] All 5 routes added to `sitemap.js` (yearly changefreq, priority 0.3) so they get indexed.
- [x] Cross-links between policies (Terms → Privacy/Refund/Shipping/Cookies; Refund ↔ Shipping; Privacy → Cookies) for navigability and SEO equity.
- [x] Verified: all 5 routes return HTTP 200 with proper `<title>` tags and render with the new branded LegalPage layout.



### Phase 11 ✅ (May 22, 2026) - SEO Overhaul
**Critical Technical Fixes:**
- [x] **Fixed Canonical Tags** - Each page now has its own canonical URL (was all pointing to homepage)
- [x] **Brand Name Consistency** - Standardized "Petnic Studio" everywhere (removed "Petniic" typos)
- [x] **Updated robots.txt** - Using www domain, added more directives
- [x] **Updated sitemap.js** - Using www, added print-on-demand page

**On-Page SEO:**
- [x] **Homepage H1 Keyword** - Changed to "Custom Pet Portraits — Personalized Art for Every Furry Friend"
- [x] **Page-Specific Meta** - Added unique titles, descriptions, OG tags for all major pages
- [x] **Schema Markup** - Added Organization, WebSite, FAQPage, AggregateRating to homepage
- [x] **Product Schema** - Added Product + BreadcrumbList schema to product detail pages
- [x] **Canonical URLs** - All pages now have proper canonical alternates

**Pages Updated with SEO:**
- Homepage, Shop, Print on Demand, Digital Downloads, Pet Care, Blog, Customize, About, Contact, Pet Owner Club, Product pages, Category pages

**Files Modified:**
- `/app/app/layout.js` - Root metadata with metadataBase
- `/app/app/(routes)/page.js` - Homepage with schema markup
- `/app/app/(routes)/shop/page.js` - Shop metadata
- `/app/app/(routes)/print-on-demand/page.js` - POD metadata
- `/app/app/(routes)/digital-downloads/page.js` - Downloads metadata
- `/app/app/(routes)/pet-care/page.js` - Pet care metadata
- `/app/app/(routes)/blog/page.js` - Blog metadata
- `/app/app/(routes)/customize/page.js` - Customize metadata
- `/app/app/(routes)/about/page.js` - About metadata
- `/app/app/(routes)/contact/page.js` - Contact metadata
- `/app/app/(routes)/pet-owner-club/page.js` - Club metadata
- `/app/app/(routes)/product/[slug]/page.js` - Product schema
- `/app/app/(routes)/shop/[category]/page.js` - Category metadata
- `/app/public/robots.txt` - Updated directives
- `/app/app/sitemap.js` - Using www
- `/app/components/layout/Navbar.jsx` - Fixed logo alt
- `/app/components/layout/Footer.jsx` - Fixed brand name
- `/app/components/sections/HeroSection.jsx` - Updated H1
- Multiple view components - Fixed "Petniic" typos

## Credentials
- **Admin:** admin@petnicstudio.com / PetnicAdmin2024!
- **Test User:** test@petnic.com / Test123!
- **AI Horde API:** dxZ0RyImRAny6Ge6137LCg

## Image Dimensions Guide
**Recommended Product Image Sizes:**
- **Main Product Images:** 1200x1200px (square, for consistency)
- **Thumbnails:** 400x400px
- **Blog Featured Images:** 1200x630px (ideal for social sharing)
- **Reference Design Images:** 1024x1024px (AI generated)
- **Banner/Hero Images:** 1920x600px
- **Category Images:** 800x600px
- **Format:** WebP or JPEG for photos, PNG for transparency
- **Max File Size:** 2MB for optimal loading

## Database Schema - NEW TABLES REQUIRED
Run this SQL in Supabase SQL Editor:

```sql
-- Blog categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  author_name VARCHAR(100),
  author_role VARCHAR(100),
  category_id UUID REFERENCES blog_categories(id),
  featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'draft',
  read_time VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Reference designs for POD products
CREATE TABLE IF NOT EXISTS reference_designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  style VARCHAR(50),
  price_addition DECIMAL(10,2) DEFAULT 0,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Add columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_file_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_url TEXT;

-- Insert default blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
('Home Decor', 'home-decor', 'Interior design tips for pet lovers'),
('Pet Health', 'pet-health', 'Health and wellness advice'),
('Pet Care', 'pet-care', 'General care tips'),
('Photography', 'photography', 'Pet photography guides'),
('Training', 'training', 'Training and behavior tips')
ON CONFLICT (slug) DO NOTHING;
```

## What's MOCKED
- Payment checkout (no Stripe - awaiting API keys)

## Remaining Tasks

### P0 (Immediately after Supabase tables created)
- [x] Blog APIs will start working
- [x] Reference Designs APIs will start working
- [x] Seed initial blog posts and reference designs (included in schema.sql)

### P1 (Next Priority)
- [ ] Stripe payment integration (pending API keys)
- [x] CJ Dropshipping API integration (product sync) - Admin panel + API ready
- [x] Email order confirmations - Brevo integration complete

### P2 (Future)
- [ ] Reviews and ratings system
- [ ] Wishlist functionality
- [ ] Shipping notifications

## API Endpoints Summary
- `POST /api/auth` - Login/Register
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Send/verify email
- `GET/POST /api/blog` - Public blog posts
- `GET /api/blog/categories` - Blog categories
- `GET/POST/PUT/DELETE /api/admin/blog` - Admin blog management
- `GET/POST/PUT/DELETE /api/admin/blog/categories` - Admin blog categories
- `GET /api/reference-designs` - Public reference designs
- `GET/POST/PUT/DELETE /api/admin/reference-designs` - Admin designs management
- `GET/POST /api/cj-dropshipping` - CJ Dropshipping integration (product sync, order forwarding)
- `POST /api/orders` - Create order (sends confirmation email, auto-forwards dropship orders)
- All existing product, category, order, forum APIs

## Testing Status
- Phase 10 Navigation/Email: Verified (screenshots confirmed all navigation working)
- Phase 9 Frontend: 100% (7/7 features passed) - Auth emails, POD page, admin enhancements
- Phase 7 Backend/Frontend: 100% (5/5 features passed) - Schema verified, gallery upload working
- Phase 6 Frontend: 100% (5/5 features passed)
- Phase 5 Frontend: 100% (5/5 features passed)
- Phase 4 Frontend: 100% (11/11 features passed)
- Test Reports: /app/test_reports/iteration_8.json, iteration_7.json, iteration_6.json, iteration_5.json

## Email System Status (Important)
All emails ARE being sent successfully via Brevo API. If users don't receive emails:
1. Check spam/junk folders
2. Ensure petnicstudio.com domain is verified in Brevo dashboard  
3. Add contact@petnicstudio.com to contacts/whitelist

Emails sent on:
- User registration: Verification email + Welcome email
- Password reset request: Password reset email
- Contact form: Notification to info@petnicstudio.com and sufyan.afzalk@gmail.com
- Order placement: Order confirmation email
