import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { parseTeamInput, isMissingTable, isUuid, refreshAbout } from '@/lib/team';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SETUP_MESSAGE = 'The team table is missing. Run team-migration.sql in your database console first.';
const MAX_TEAM = 100;

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ members: [], setupRequired: true, message: SETUP_MESSAGE });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ members: data || [] });
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  const parsed = parseTeamInput(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getSupabaseAdmin();
  // New members go to the end of the list.
  const { data: last, error: lastErr } = await supabase
    .from('team_members')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (lastErr) {
    if (isMissingTable(lastErr)) return NextResponse.json({ error: SETUP_MESSAGE, setupRequired: true }, { status: 503 });
    return NextResponse.json({ error: lastErr.message }, { status: 500 });
  }
  const nextOrder = (last?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('team_members')
    .insert({ ...parsed.values, sort_order: nextOrder })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  refreshAbout();
  return NextResponse.json({ member: data }, { status: 201 });
}

// Reorder: { ids: [...] } -> sort_order 1..n in that order.
export async function PUT(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_TEAM) {
    return NextResponse.json({ error: `Send between 1 and ${MAX_TEAM} ids` }, { status: 400 });
  }
  if (!ids.every(isUuid) || new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: 'Every id must be a valid, unique member id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: findErr } = await supabase.from('team_members').select('id').in('id', ids);
  if (findErr) {
    if (isMissingTable(findErr)) return NextResponse.json({ error: SETUP_MESSAGE, setupRequired: true }, { status: 503 });
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }
  if ((existing || []).length !== ids.length) {
    return NextResponse.json({ error: 'One or more members were not found' }, { status: 404 });
  }

  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from('team_members')
      .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
      .eq('id', ids[i]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  refreshAbout();
  return NextResponse.json({ success: true });
}
