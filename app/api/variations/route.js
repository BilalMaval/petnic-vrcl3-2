import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Public: resolve the active variation groups that apply to a given product.
// Returns the union of:
//  - global groups (apply to every product)
//  - category groups where category_id matches the product's category
//  - product groups where this product was explicitly assigned
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const categoryId = searchParams.get('categoryId');

  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });

  const orFilters = [`scope.eq.global`];
  if (categoryId) orFilters.push(`and(scope.eq.category,category_id.eq.${categoryId})`);

  const { data: groups, error } = await supabase
    .from('variation_groups')
    .select('*, variation_options(*)')
    .eq('is_active', true)
    .or(orFilters.join(','))
    .order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: productGroups, error: pgError } = await supabase
    .from('variation_group_products')
    .select('variation_groups(*, variation_options(*))')
    .eq('product_id', productId);
  if (pgError) return NextResponse.json({ error: pgError.message }, { status: 500 });

  const productScoped = (productGroups || [])
    .map((row) => row.variation_groups)
    .filter((g) => g && g.is_active);

  const all = [...(groups || []), ...productScoped]
    .filter((g, idx, arr) => arr.findIndex((x) => x.id === g.id) === idx)
    .map((g) => ({
      ...g,
      variation_options: (g.variation_options || []).sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  return NextResponse.json({ groups: all });
}
