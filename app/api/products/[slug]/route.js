import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request, { params }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data: product, error } = await supabase
    .from('products')
    .select('*, collections(name, slug), categories(name, slug)')
    .eq('slug', slug)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const { data: related } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, image_url, badge, rating, review_count')
    .eq('collection_id', product.collection_id)
    .neq('slug', slug)
    .limit(4);

  return NextResponse.json({ product, related: related || [] });
}
