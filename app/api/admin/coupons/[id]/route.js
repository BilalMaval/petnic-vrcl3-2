import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { parseCouponInput, isMissingTable, isUniqueViolation, isUuid } from '@/lib/coupons';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid coupon id' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  let update;
  if (body?.toggleOnly) {
    update = { is_active: !!body.isActive };
  } else {
    const parsed = parseCouponInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
    update = parsed.values;
  }

  const { data, error } = await supabase
    .from('coupons')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ error: 'Coupon tables are missing', setupRequired: true }, { status: 503 });
    if (isUniqueViolation(error)) return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

  return NextResponse.json({ coupon: data });
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid coupon id' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: coupon, error: findErr } = await supabase.from('coupons').select('id, used_count').eq('id', id).maybeSingle();
  if (findErr) {
    if (isMissingTable(findErr)) return NextResponse.json({ error: 'Coupon tables are missing', setupRequired: true }, { status: 503 });
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }
  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

  const { count } = await supabase
    .from('coupon_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', id);

  // A coupon with any use (or an in-flight checkout holding one) keeps its
  // history; disabling it is the safe alternative.
  if ((count || 0) > 0 || coupon.used_count > 0) {
    return NextResponse.json({ error: 'This coupon has been used. Disable it instead of deleting it.' }, { status: 409 });
  }

  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
