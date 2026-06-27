import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Public: Get blog categories
export async function GET() {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data || [] });
}
