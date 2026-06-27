import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Server-side fetch for the shop catalog so initial HTML contains real product
 * data (critical for SEO/indexing instead of relying on client-side hydration).
 */
export async function fetchShopData({ category } = {}) {
  const supabase = getSupabaseAdmin();

  let productsQuery = supabase
    .from('products')
    .select('*, collections(name, slug), categories(name, slug)')
    .eq('in_stock', true)
    .order('sort_order', { ascending: true });

  if (category && category !== 'all') {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();
    if (cat) productsQuery = productsQuery.eq('category_id', cat.id);
  }

  const [productsRes, collectionsRes] = await Promise.all([
    productsQuery,
    supabase
      .from('collections')
      .select('id, name, slug, categories(id, name, slug)')
      .order('sort_order', { ascending: true }),
  ]);

  const products = productsRes.data || [];
  const collections = collectionsRes.data || [];
  const categories = collections.flatMap((c) =>
    (c.categories || []).map((cat) => ({ ...cat, collectionName: c.name }))
  );

  return { products, categories };
}
