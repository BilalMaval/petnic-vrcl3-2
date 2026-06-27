import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

// Admin: list all variation groups with their options, category, and assigned products
export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();

  const { data: groups, error } = await supabase
    .from('variation_groups')
    .select(`
      *,
      categories(id, name, slug),
      variation_options(*),
      variation_group_products(product_id, products(id, name, slug, image_url))
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const normalized = (groups || []).map((g) => ({
    ...g,
    variation_options: (g.variation_options || []).sort((a, b) => a.sort_order - b.sort_order),
    products: (g.variation_group_products || []).map((p) => p.products).filter(Boolean),
    variation_group_products: undefined,
  }));

  return NextResponse.json({ groups: normalized });
}

// Admin: create a variation group + its options (+ product assignments if scope === 'product')
export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { options = [], product_ids = [], ...groupFields } = body;

  if (!groupFields.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!['global', 'category', 'product'].includes(groupFields.scope)) {
    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }
  if (groupFields.scope === 'category' && !groupFields.category_id) {
    return NextResponse.json({ error: 'category_id is required when scope is "category"' }, { status: 400 });
  }
  if (groupFields.scope === 'product' && product_ids.length === 0) {
    return NextResponse.json({ error: 'Select at least one product when scope is "product"' }, { status: 400 });
  }
  if (groupFields.scope !== 'category') groupFields.category_id = null;

  const { data: group, error: groupError } = await supabase
    .from('variation_groups')
    .insert(groupFields)
    .select()
    .single();
  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 });

  if (options.length > 0) {
    const rows = options.map((o, idx) => ({
      variation_group_id: group.id,
      label: o.label,
      value: o.value || o.label,
      price_addition: parseFloat(o.price_addition) || 0,
      swatch_color: o.swatch_color || null,
      image_url: o.image_url || null,
      is_default: !!o.is_default,
      sort_order: idx,
    }));
    const { error: optError } = await supabase.from('variation_options').insert(rows);
    if (optError) return NextResponse.json({ error: optError.message }, { status: 500 });
  }

  if (groupFields.scope === 'product' && product_ids.length > 0) {
    const rows = product_ids.map((pid) => ({ variation_group_id: group.id, product_id: pid }));
    const { error: assignError } = await supabase.from('variation_group_products').insert(rows);
    if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 });
  }

  return NextResponse.json({ group }, { status: 201 });
}

// Admin: update a variation group, replacing its options + product assignments
export async function PUT(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { id, options, product_ids, ...groupFields } = body;

  if (!id) return NextResponse.json({ error: 'Variation group ID required' }, { status: 400 });
  if (groupFields.scope && groupFields.scope === 'category' && !groupFields.category_id) {
    return NextResponse.json({ error: 'category_id is required when scope is "category"' }, { status: 400 });
  }
  if (groupFields.scope === 'product' && Array.isArray(product_ids) && product_ids.length === 0) {
    return NextResponse.json({ error: 'Select at least one product when scope is "product"' }, { status: 400 });
  }
  if (groupFields.scope && groupFields.scope !== 'category') groupFields.category_id = null;

  groupFields.updated_at = new Date().toISOString();

  const { data: group, error: groupError } = await supabase
    .from('variation_groups')
    .update(groupFields)
    .eq('id', id)
    .select()
    .single();
  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 });

  if (Array.isArray(options)) {
    const { error: delErr } = await supabase.from('variation_options').delete().eq('variation_group_id', id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    if (options.length > 0) {
      const rows = options.map((o, idx) => ({
        variation_group_id: id,
        label: o.label,
        value: o.value || o.label,
        price_addition: parseFloat(o.price_addition) || 0,
        swatch_color: o.swatch_color || null,
        image_url: o.image_url || null,
        is_default: !!o.is_default,
        sort_order: idx,
      }));
      const { error: optError } = await supabase.from('variation_options').insert(rows);
      if (optError) return NextResponse.json({ error: optError.message }, { status: 500 });
    }
  }

  if (Array.isArray(product_ids)) {
    const { error: delErr } = await supabase.from('variation_group_products').delete().eq('variation_group_id', id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    if (product_ids.length > 0) {
      const rows = product_ids.map((pid) => ({ variation_group_id: id, product_id: pid }));
      const { error: assignError } = await supabase.from('variation_group_products').insert(rows);
      if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ group });
}

// Admin: delete a variation group (cascades to its options + product assignments)
export async function DELETE(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Variation group ID required' }, { status: 400 });

  const { error } = await supabase.from('variation_groups').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
