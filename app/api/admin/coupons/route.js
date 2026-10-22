import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { parseCouponInput, isMissingTable, isUniqueViolation } from '@/lib/coupons';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SETUP_MESSAGE = 'Coupon tables are missing. Run coupons-migration.sql in your database console first.';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ coupons: [], setupRequired: true, message: SETUP_MESSAGE });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: redemptions } = await supabase.from('coupon_redemptions').select('coupon_id, discount_amount');
  const saved = {};
  for (const r of redemptions || []) {
    saved[r.coupon_id] = (saved[r.coupon_id] || 0) + Number(r.discount_amount || 0);
  }

  return NextResponse.json({
    coupons: (coupons || []).map((c) => ({ ...c, total_discounted: Math.round((saved[c.id] || 0) * 100) / 100 })),
  });
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = parseCouponInput(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('coupons').insert(parsed.values).select('*').single();

  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ error: SETUP_MESSAGE, setupRequired: true }, { status: 503 });
    // The unique-index error text may only contain 23505 / "already exists".
    if (isUniqueViolation(error)) return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ coupon: data }, { status: 201 });
}
