import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { parseTeamInput, isMissingTable, isUuid, refreshAbout } from '@/lib/team';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid member id' }, { status: 400 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  let update;
  if (body?.toggleOnly) {
    update = { is_visible: !!body.isVisible };
  } else {
    const parsed = parseTeamInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
    update = parsed.values;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('team_members')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ error: 'The team table is missing', setupRequired: true }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Team member not found' }, { status: 404 });

  refreshAbout();
  return NextResponse.json({ member: data });
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid member id' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('team_members').delete().eq('id', id).select('id').maybeSingle();

  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ error: 'The team table is missing', setupRequired: true }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Team member not found' }, { status: 404 });

  refreshAbout();
  return NextResponse.json({ success: true });
}
