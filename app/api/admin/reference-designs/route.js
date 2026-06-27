import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

// Admin: Get all reference designs
export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('reference_designs')
    .select('*')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ designs: data || [] });
}

// Admin: Create reference design
export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const body = await request.json();

  const { data, error } = await supabase
    .from('reference_designs')
    .insert({
      name: body.name,
      image_url: body.image_url,
      style: body.style,
      price_addition: parseFloat(body.price_addition) || 0,
      sort_order: parseInt(body.sort_order) || 0,
      active: body.active !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ design: data }, { status: 201 });
}

// Admin: Update reference design
export async function PUT(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'Design ID required' }, { status: 400 });

  if (updates.price_addition) updates.price_addition = parseFloat(updates.price_addition);
  if (updates.sort_order) updates.sort_order = parseInt(updates.sort_order);

  const { data, error } = await supabase
    .from('reference_designs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ design: data });
}

// Admin: Delete reference design
export async function DELETE(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Design ID required' }, { status: 400 });

  const { error } = await supabase.from('reference_designs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
