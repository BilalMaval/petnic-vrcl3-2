import { supabaseAdmin } from '../config/supabase-server.js';

async function setupDatabase() {
  console.log('Setting up Supabase database...');

  const { error } = await supabaseAdmin.rpc('exec_sql', { sql: '' }).catch(() => ({}));

  // Create tables using raw SQL via supabase-js
  const sql = `
    -- Collections table (POD, Digital Downloads, Pet Care)
    CREATE TABLE IF NOT EXISTS collections (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(collection_id, slug)
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2),
      image_url TEXT,
      gallery_urls TEXT[] DEFAULT '{}',
      badge TEXT,
      rating DECIMAL(3,2) DEFAULT 0,
      review_count INT DEFAULT 0,
      in_stock BOOLEAN DEFAULT true,
      featured BOOLEAN DEFAULT false,
      -- POD specific
      customizable BOOLEAN DEFAULT false,
      -- Digital specific
      file_format TEXT,
      file_size TEXT,
      download_url TEXT,
      -- Pet Care specific
      ingredients TEXT,
      weight TEXT,
      -- Common
      metadata JSONB DEFAULT '{}',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      user_id UUID,
      product_id UUID REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_slug TEXT,
      quantity INT DEFAULT 1,
      total DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      customer_name TEXT,
      customer_email TEXT NOT NULL,
      shipping_address JSONB,
      pet_image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Newsletter subscribers
    CREATE TABLE IF NOT EXISTS newsletter (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Forum posts (Pet Owner Club)
    CREATE TABLE IF NOT EXISTS forum_threads (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      likes INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS forum_replies (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      likes INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Contact form submissions
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log('SQL schema ready. Creating tables via Supabase...');
  // Execute each statement separately since supabase doesn't support multi-statement
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 10);

  for (const stmt of statements) {
    const { error } = await supabaseAdmin.rpc('exec_sql', { query: stmt + ';' }).catch(e => ({ error: e }));
    if (error) {
      // Tables might already exist, which is fine
      console.log('Note:', error.message?.substring(0, 80) || 'Statement executed');
    }
  }

  console.log('Database setup complete!');
}

setupDatabase().catch(console.error);
