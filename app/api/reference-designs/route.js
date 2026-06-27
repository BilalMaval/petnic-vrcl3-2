import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

// Public: Get active reference designs
export async function GET(request) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('reference_designs')
    .select('*')
    .eq('active', true)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ designs: data || [] });
}
