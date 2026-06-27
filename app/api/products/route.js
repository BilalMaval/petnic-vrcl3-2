import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('collection');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort');
  const featured = searchParams.get('featured');

  let query = supabase
    .from('products')
    .select('*, collections(name, slug), categories(name, slug)')
    .eq('in_stock', true);

  if (collection) {
    const { data: col } = await supabase.from('collections').select('id').eq('slug', collection).single();
    if (col) query = query.eq('collection_id', col.id);
  }

  if (category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (featured === 'true') {
    query = query.eq('featured', true);
  }

  if (sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (sort === 'price_desc') query = query.order('price', { ascending: false });
  else if (sort === 'rating') query = query.order('rating', { ascending: false });
  else if (sort === 'newest') query = query.order('created_at', { ascending: false });
  else query = query.order('sort_order', { ascending: true });

  const { data: products, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: products || [], total: products?.length || 0 });
}
