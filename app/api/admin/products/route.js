import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('collection');

  let query = supabase
    .from('products')
    .select('*, collections(name, slug), categories(name, slug), product_variation_overrides(variation_group_id, included)')
    .order('created_at', { ascending: false });
  if (collection) {
    const { data: col } = await supabase.from('collections').select('id').eq('slug', collection).single();
    if (col) query = query.eq('collection_id', col.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { variation_overrides, ...productFields } = body;

  const slug = productFields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data, error } = await supabase.from('products').insert({
    ...productFields,
    slug: productFields.slug || slug,
  }).select('*, collections(name, slug), categories(name, slug)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(variation_overrides) && variation_overrides.length > 0) {
    const rows = variation_overrides
      .filter((o) => o.variation_group_id && typeof o.included === 'boolean')
      .map((o) => ({ product_id: data.id, variation_group_id: o.variation_group_id, included: o.included }));
    if (rows.length > 0) {
      const { error: ovError } = await supabase.from('product_variation_overrides').insert(rows);
      if (ovError) return NextResponse.json({ error: ovError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PUT(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { id, variation_overrides, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('products').update(updates).eq('id', id)
    .select('*, collections(name, slug), categories(name, slug)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(variation_overrides)) {
    const { error: delErr } = await supabase.from('product_variation_overrides').delete().eq('product_id', id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    const rows = variation_overrides
      .filter((o) => o.variation_group_id && typeof o.included === 'boolean')
      .map((o) => ({ product_id: id, variation_group_id: o.variation_group_id, included: o.included }));
    if (rows.length > 0) {
      const { error: ovError } = await supabase.from('product_variation_overrides').insert(rows);
      if (ovError) return NextResponse.json({ error: ovError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
