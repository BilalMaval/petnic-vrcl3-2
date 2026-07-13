-- PETNIC STUDIO Database Schema
-- Run this SQL in Supabase SQL Editor to enable all features

-- =============================================
-- BLOG SYSTEM
-- =============================================

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

-- =============================================
-- AI REFERENCE DESIGNS
-- =============================================

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

-- =============================================
-- USER AUTHENTICATION ENHANCEMENTS
-- =============================================

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- =============================================
-- PRODUCT ENHANCEMENTS
-- =============================================

-- Add columns to products table for digital downloads and dropshipping
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_file_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_url TEXT;

-- =============================================
-- ORDER ENHANCEMENTS
-- =============================================

-- Add columns to orders table for order types and dropshipping
ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_design VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_addition DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS style VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_dropship BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cj_order_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dropship_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_session_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;

-- =============================================
-- STRIPE PAYMENT TRANSACTIONS
-- =============================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'initiated',
  user_id UUID,
  user_email VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_tx_session_id ON payment_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_email ON payment_transactions(user_email);

-- =============================================
-- BLOG ENHANCEMENTS
-- =============================================

-- Add full_html_page column for complete HTML page uploads
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS full_html_page TEXT;

-- =============================================
-- BLOG SEO + FAQ ENHANCEMENTS
-- =============================================
-- meta_description: dedicated SEO meta description (falls back to excerpt if empty)
-- tags: comma-entered, stored as a text array for filtering/display
-- related_category_id / related_product_id: optional single link shown as a
--   "Shop the Look" style CTA under the article (either/or, not both required)
-- faqs: ordered array of { question, answer } objects rendered after the
--   article and emitted as FAQPage JSON-LD for rich results
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS related_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS related_product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_blog_posts_related_category ON blog_posts(related_category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_related_product ON blog_posts(related_product_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- =============================================
-- FIX: ALLOW PRODUCT DELETION WHEN ORDERS EXIST
-- =============================================

-- orders.product_id had no ON DELETE clause, so Postgres defaulted to
-- NO ACTION: deleting any product that was ever ordered raised a foreign
-- key violation. orders already stores product_name/product_slug as a
-- snapshot, so it's safe to null out product_id instead of blocking the delete.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- =============================================
-- PRODUCT VARIATIONS (Size, Frame Style, Color, etc.)
-- =============================================
-- A variation group can be assigned at three scopes:
--   'global'   -> applies to every product on the site
--   'category' -> applies to every product under one category (category_id set)
--   'product'  -> applies only to the specific products listed in
--                  variation_group_products (those products still belong to
--                  whatever category they're already in; this scope just
--                  narrows the assignment to a hand-picked product list)

CREATE TABLE IF NOT EXISTS variation_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  input_type TEXT NOT NULL DEFAULT 'select', -- 'select' | 'swatch' | 'button'
  scope TEXT NOT NULL DEFAULT 'global',      -- 'global' | 'category' | 'product'
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT variation_scope_valid CHECK (scope IN ('global', 'category', 'product')),
  CONSTRAINT variation_category_requires_id CHECK (
    (scope = 'category' AND category_id IS NOT NULL) OR (scope <> 'category')
  )
);

CREATE TABLE IF NOT EXISTS variation_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variation_group_id UUID NOT NULL REFERENCES variation_groups(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT,
  price_addition DECIMAL(10,2) DEFAULT 0,
  swatch_color TEXT,
  image_url TEXT,
  is_default BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many: which products a 'product'-scoped variation group applies to
CREATE TABLE IF NOT EXISTS variation_group_products (
  variation_group_id UUID NOT NULL REFERENCES variation_groups(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (variation_group_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_variation_groups_category ON variation_groups(category_id);
CREATE INDEX IF NOT EXISTS idx_variation_groups_scope ON variation_groups(scope);
CREATE INDEX IF NOT EXISTS idx_variation_options_group ON variation_options(variation_group_id);
CREATE INDEX IF NOT EXISTS idx_variation_group_products_product ON variation_group_products(product_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
('Home Decor', 'home-decor', 'Interior design tips for pet lovers'),
('Pet Health', 'pet-health', 'Health and wellness advice'),
('Pet Care', 'pet-care', 'General care tips'),
('Photography', 'photography', 'Pet photography guides'),
('Training', 'training', 'Training and behavior tips')
ON CONFLICT (slug) DO NOTHING;

-- Insert default reference designs (AI-generated pet portraits)
INSERT INTO reference_designs (name, image_url, style, price_addition, sort_order) VALUES
('Royal Portrait', 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/11faab607d7dfdaec837a6ca421e7369244f77bbbaabea7caedc8d34f5bf07a0.png', 'Renaissance', 15, 1),
('Watercolor Dream', 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/31cf0344eed89a11be88b5db76b107a0997f3fc000dbe4bf24011f19370fc976.png', 'Watercolor', 10, 2),
('Pop Art Style', 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/097e314d68b881e61ddc64e167bb4cd94331e59eccff0582fa8f002ce4074689.png', 'Pop Art', 12, 3),
('Minimalist Line', 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/d1d29644436b09b6ac43c931164715c89e977ff7f09fa689179db62b3f058836.png', 'Minimalist', 8, 4),
('Oil Masterpiece', 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/a54b09da7dfaf130c0aea05b11c47d1f14137401aa7437f6a78787859e99d267.png', 'Oil Painting', 18, 5),
('Neon Glow', 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/c72ddb46b2e864863327d1092bdf1947225321617d2d11b1e62c77aa3a63df5f.png', 'Neon', 14, 6),
('Pencil Sketch', 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/281636f64e373da47761d96f9e76d510631c888f794b21815caec0df9b825abe.png', 'Sketch', 10, 7),
('Cartoon Fun', 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/453fb1b37636087cfd3298bcca5cdc4a49efce15cf5ebf869e69a74780c4347a.png', 'Cartoon', 12, 8)
ON CONFLICT DO NOTHING;
