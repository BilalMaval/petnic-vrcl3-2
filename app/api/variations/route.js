import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Public: resolve the active variation groups that apply to a given product.
// Default resolution is the union of:
//  - global groups (apply to every product)
//  - category groups assigned to the product's category (via variation_group_categories)
//  - product groups where this product was explicitly assigned
// An admin can then force any group ON or OFF for one specific product via
// product_variation_overrides - that always wins over the default above.
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const categoryId = searchParams.get('categoryId');

  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });

  const { data: globalGroups, error: globalError } = await supabase
    .from('variation_groups')
    .select('*, variation_options(*)')
    .eq('is_active', true)
    .eq('scope', 'global');
  if (globalError) return NextResponse.json({ error: globalError.message }, { status: 500 });

  let categoryScoped = [];
  if (categoryId) {
    const { data: catLinks, error: catError } = await supabase
      .from('variation_group_categories')
      .select('variation_groups(*, variation_options(*))')
      .eq('category_id', categoryId);
    if (catError) return NextResponse.json({ error: catError.message }, { status: 500 });
    categoryScoped = (catLinks || []).map((row) => row.variation_groups).filter((g) => g && g.is_active);
  }

  const { data: productGroups, error: pgError } = await supabase
    .from('variation_group_products')
    .select('variation_groups(*, variation_options(*))')
    .eq('product_id', productId);
  if (pgError) return NextResponse.json({ error: pgError.message }, { status: 500 });

  const productScoped = (productGroups || [])
    .map((row) => row.variation_groups)
    .filter((g) => g && g.is_active);

  const defaultApplicable = [...(globalGroups || []), ...categoryScoped, ...productScoped]
    .filter((g, idx, arr) => arr.findIndex((x) => x.id === g.id) === idx);

  const { data: overrides, error: ovError } = await supabase
    .from('product_variation_overrides')
    .select('variation_group_id, included')
    .eq('product_id', productId);
  if (ovError) return NextResponse.json({ error: ovError.message }, { status: 500 });

  const overrideMap = new Map((overrides || []).map((o) => [o.variation_group_id, o.included]));

  let finalGroups = defaultApplicable.filter((g) => overrideMap.get(g.id) !== false);

  const forcedInIds = (overrides || []).filter((o) => o.included === true).map((o) => o.variation_group_id);
  const missingForcedIds = forcedInIds.filter((id) => !finalGroups.some((g) => g.id === id));
  if (missingForcedIds.length > 0) {
    const { data: forcedGroups, error: forcedError } = await supabase
      .from('variation_groups')
      .select('*, variation_options(*)')
      .eq('is_active', true)
      .in('id', missingForcedIds);
    if (forcedError) return NextResponse.json({ error: forcedError.message }, { status: 500 });
    finalGroups = [...finalGroups, ...(forcedGroups || [])];
  }

  const all = finalGroups
    .map((g) => ({
      ...g,
      variation_options: (g.variation_options || []).sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  return NextResponse.json({ groups: all });
}
