const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.yflekqkckhnzbkssccwc:NQnmVqFklMIdXRWO@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function seed() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected. Seeding...');

  // Clear existing data
  await client.query('DELETE FROM forum_replies');
  await client.query('DELETE FROM forum_threads');
  await client.query('DELETE FROM orders');
  await client.query('DELETE FROM products');
  await client.query('DELETE FROM categories');
  await client.query('DELETE FROM collections');

  // Create Collections
  const colRes = await client.query(`
    INSERT INTO collections (name, slug, description, image_url, sort_order) VALUES
    ('Print on Demand', 'pod', 'Custom personalized pet products — canvas prints, mugs, t-shirts, blankets and more', 'https://images.unsplash.com/photo-1602935236192-6079fcde06f5?w=800&q=80', 1),
    ('Digital Downloads', 'digital', 'Premium digital resources for pet lovers — templates, presets, eBooks, courses', 'https://images.unsplash.com/photo-1609992556760-d3884bb23eca?w=800&q=80', 2),
    ('Pet Care', 'petcare', 'Essential pet care products — grooming, health, wellness, nutrition', 'https://images.unsplash.com/photo-1631511231050-24f8dba10537?w=800&q=80', 3)
    RETURNING id, slug
  `);
  const cols = {};
  colRes.rows.forEach(r => cols[r.slug] = r.id);
  console.log('Collections:', Object.keys(cols));

  // Create Categories
  const catRes = await client.query(`
    INSERT INTO categories (collection_id, name, slug, description, sort_order) VALUES
    ($1, 'Wall Art', 'wall-art', 'Custom canvas prints, framed portraits, and art prints', 1),
    ($1, 'Home & Living', 'home-living', 'Blankets, pillows, mugs and home decor', 2),
    ($1, 'Accessories', 'accessories', 'Phone cases, tote bags, keychains', 3),
    ($1, 'Apparel', 'apparel', 'T-shirts, hoodies, and custom pet clothing', 4),
    ($2, 'Templates', 'templates', 'Professional design templates for pet portraits', 1),
    ($2, 'Presets', 'presets', 'Photo editing presets for pet photography', 2),
    ($2, 'eBooks', 'ebooks', 'Expert guides on pet care and training', 3),
    ($2, 'Printables', 'printables', 'Printable party kits, cards, and decorations', 4),
    ($2, 'Courses', 'courses', 'Video courses on pet training and photography', 5),
    ($3, 'Grooming', 'grooming', 'Shampoos, brushes, and grooming essentials', 1),
    ($3, 'Health', 'health', 'Dental care, joint support, vitamins', 2),
    ($3, 'Wellness', 'wellness', 'Anxiety relief, calming products', 3),
    ($3, 'Nutrition', 'nutrition', 'Probiotics, supplements, organic food', 4)
    RETURNING id, slug, collection_id
  `, [cols.pod, cols.digital, cols.petcare]);
  const cats = {};
  catRes.rows.forEach(r => cats[r.slug] = r.id);
  console.log('Categories:', Object.keys(cats));

  // Create POD Products
  await client.query(`
    INSERT INTO products (collection_id, category_id, name, slug, description, price, original_price, image_url, badge, rating, review_count, in_stock, featured, customizable) VALUES
    ($1, $2, 'Royal Pet Portrait Canvas', 'royal-pet-portrait-canvas', 'Transform your beloved pet into royalty with our stunning, museum-grade canvas portrait. Hand-finished by expert artisans using archival inks on premium cotton canvas.', 79.99, 129.99, 'https://images.unsplash.com/photo-1602935236192-6079fcde06f5?w=600&q=80', 'Best Seller', 4.9, 2847, true, true, true),
    ($1, $3, 'Custom Pet Photo Blanket', 'custom-pet-photo-blanket', 'Snuggle up with your pets adorable face on a plush, ultra-soft sherpa blanket. Machine washable and incredibly cozy.', 54.99, 89.99, 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80', 'Popular', 4.8, 1923, true, true, true),
    ($1, $4, 'Pet Portrait Phone Case', 'pet-portrait-phone-case', 'Carry your pet everywhere with a custom portrait phone case. Durable polycarbonate with a premium matte finish.', 29.99, 44.99, 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=600&q=80', 'New', 4.7, 3156, true, true, true),
    ($1, $2, 'Watercolor Pet Art Print', 'watercolor-pet-art-print', 'A beautiful watercolor-style art print of your pet, printed on museum-quality fine art paper with archival inks.', 49.99, 79.99, 'https://images.unsplash.com/photo-1609992556760-d3884bb23eca?w=600&q=80', 'Editor Pick', 4.9, 1567, true, true, true),
    ($1, $3, 'Custom Pet Mug Set', 'custom-pet-mug-set', 'Start your morning with your pets smile. Set of 2 premium ceramic mugs featuring your custom pet portrait.', 34.99, 49.99, 'https://images.unsplash.com/photo-1559932199-d6da2ce8fa4e?w=600&q=80', 'Top Rated', 4.8, 2234, true, true, true),
    ($1, $5, 'Pet Photo T-Shirt', 'pet-photo-tshirt', 'Wear your love for your pet with a custom portrait tee. 100% combed cotton, pre-shrunk, available in multiple colors.', 39.99, 59.99, 'https://images.unsplash.com/photo-1651461665523-cdefddb5a3ba?w=600&q=80', NULL, 4.6, 1890, true, true, true),
    ($1, $2, 'Pop Art Pet Canvas', 'pop-art-pet-canvas', 'Bold, colorful pop-art style canvas of your pet. A statement piece for any room.', 89.99, 139.99, 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80', 'Trending', 4.8, 1345, true, true, true),
    ($1, $3, 'Pet Photo Pillow', 'pet-photo-pillow', 'Custom printed throw pillow with your pets face. Soft polyester with hidden zipper.', 44.99, 64.99, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80', NULL, 4.7, 987, true, true, true)
  `, [cols.pod, cats['wall-art'], cats['home-living'], cats['accessories'], cats['apparel']]);

  // Create Digital Products
  await client.query(`
    INSERT INTO products (collection_id, category_id, name, slug, description, price, original_price, image_url, badge, rating, review_count, featured, file_format, file_size) VALUES
    ($1, $2, 'Watercolor Pet Portrait Template Pack', 'watercolor-pet-portrait-template', 'Professional templates for creating stunning watercolor-style pet portraits. Includes 15 unique styles.', 29.99, 49.99, 'https://images.unsplash.com/photo-1602935236192-6079fcde06f5?w=600&q=80', 'Best Seller', 4.9, 1245, true, 'PSD, Procreate', '2.4 GB'),
    ($1, $3, 'Pet Photography Lightroom Presets', 'pet-photography-lightroom-presets', '25 professional Lightroom presets designed specifically for pet photography.', 19.99, 34.99, 'https://images.unsplash.com/photo-1609992556760-d3884bb23eca?w=600&q=80', 'Popular', 4.8, 892, true, 'XMP, DNG', '156 MB'),
    ($1, $4, 'Complete Pet Care eBook Bundle', 'pet-care-ebook-bundle', 'Comprehensive expert guide covering pet care, training, nutrition and wellness. 5 books included.', 39.99, 69.99, 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80', 'Expert Authored', 4.9, 2156, true, 'PDF, EPUB', '85 MB'),
    ($1, $5, 'Pet Birthday Party Printable Kit', 'pet-birthday-printable-kit', 'Adorable printable decorations for your pet birthday party. Banners, invites, cake toppers.', 14.99, 24.99, 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=600&q=80', NULL, 4.7, 567, false, 'PDF, PNG', '320 MB'),
    ($1, $2, 'Pet Memorial Design Templates', 'pet-memorial-design-templates', 'Beautiful memorial templates for honoring your beloved companion. 20 unique designs.', 24.99, 39.99, 'https://images.unsplash.com/photo-1559932199-d6da2ce8fa4e?w=600&q=80', 'Heartfelt', 4.9, 1890, false, 'PSD, Canva', '1.8 GB'),
    ($1, $6, 'Dog Training Masterclass Video Course', 'dog-training-masterclass', 'Complete 8-hour video course on positive reinforcement dog training by certified trainers.', 49.99, 99.99, 'https://images.unsplash.com/photo-1560743641-3914f2c45636?w=600&q=80', 'Top Rated', 4.8, 3421, true, 'MP4, PDF', '12 GB')
  `, [cols.digital, cats['templates'], cats['presets'], cats['ebooks'], cats['printables'], cats['courses']]);

  // Create Pet Care Products
  await client.query(`
    INSERT INTO products (collection_id, category_id, name, slug, description, price, original_price, image_url, badge, rating, review_count, featured, ingredients, weight) VALUES
    ($1, $2, 'Organic Coconut Oil Pet Shampoo', 'organic-coconut-oil-pet-shampoo', 'Gentle, sulfate-free formula with organic coconut oil and oatmeal. Soothes dry, itchy skin.', 18.99, 27.99, 'https://images.unsplash.com/photo-1631511231050-24f8dba10537?w=600&q=80', 'Organic', 4.8, 2345, true, 'Organic Coconut Oil, Oatmeal, Aloe Vera, Vitamin E', '16 oz'),
    ($1, $3, 'Premium Dental Care Chews', 'premium-dental-care-chews', 'Veterinarian-recommended dental chews that reduce tartar buildup by 80%. All-natural ingredients.', 24.99, 34.99, 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=600&q=80', 'Vet Approved', 4.7, 1876, true, 'Rice Flour, Coconut Oil, Parsley, Mint, Calcium', '12 oz'),
    ($1, $4, 'Calming Anxiety Relief Treats', 'calming-anxiety-relief-treats', 'Natural calming treats with chamomile, valerian root and L-theanine. Perfect for storms and travel.', 22.99, 32.99, 'https://images.unsplash.com/photo-1623099354893-9a1fbd0dbb3f?w=600&q=80', 'Best Seller', 4.9, 3210, true, 'Chamomile, Valerian Root, L-Theanine, Passionflower', '90 chews'),
    ($1, $3, 'Joint Support Supplement', 'joint-support-supplement', 'Advanced glucosamine and chondroitin formula with MSM and turmeric for optimal joint health.', 34.99, 49.99, 'https://images.unsplash.com/photo-1516750105099-4b8a83e217ee?w=600&q=80', 'Vet Recommended', 4.8, 2567, true, 'Glucosamine, Chondroitin, MSM, Turmeric, Omega-3', '120 tablets'),
    ($1, $2, 'Luxury Pet Grooming Brush Set', 'luxury-pet-grooming-brush-set', 'Professional 5-piece grooming kit with ergonomic bamboo handles. Suitable for all coat types.', 29.99, 44.99, 'https://images.unsplash.com/photo-1631511231050-24f8dba10537?w=600&q=80', NULL, 4.7, 1456, false, NULL, '5 pieces'),
    ($1, $5, 'Probiotic Digestive Support', 'probiotic-digestive-support', '10 billion CFU probiotic blend with prebiotics for optimal digestive health.', 27.99, 39.99, 'https://images.unsplash.com/photo-1623099354893-9a1fbd0dbb3f?w=600&q=80', 'Natural', 4.9, 1890, false, '10 Probiotic Strains, Prebiotic Fiber, Pumpkin, Ginger', '60 chews')
  `, [cols.petcare, cats['grooming'], cats['health'], cats['wellness'], cats['nutrition']]);

  // Create admin user
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('PetnicAdmin2024!', 10);
  await client.query(`
    INSERT INTO users (email, password_hash, name, role) VALUES
    ('admin@petnicstudio.com', $1, 'Admin', 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'admin'
  `, [hash]);

  const counts = await client.query(`
    SELECT 
      (SELECT count(*) FROM collections) as cols,
      (SELECT count(*) FROM categories) as cats,
      (SELECT count(*) FROM products) as prods,
      (SELECT count(*) FROM users) as users
  `);
  console.log('Seed complete:', counts.rows[0]);
  await client.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
