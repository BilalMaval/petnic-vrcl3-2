import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { GRADIENT_KEYS, DEFAULT_GRADIENT, DEFAULT_AVATAR } from '@/lib/team-gradients';

// Server-only team logic. Route files can only export HTTP handlers in
// Next.js, so everything reusable lives here.

export function isMissingTable(error) {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || '');
}

export const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));

// Visible members in display order for the About page.
//   null  -> table missing or database error: the page keeps its built-in text
//   []    -> everyone hidden or removed: the whole section is hidden
// Never throws, so a database problem can't break the About page.
export async function getVisibleTeam() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, role, bio, badge, avatar, photo_url, gradient')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      if (!isMissingTable(error)) console.error('getVisibleTeam failed:', error);
      return null;
    }
    return data || [];
  } catch (e) {
    console.error('getVisibleTeam crashed:', e);
    return null;
  }
}

// The About page is cached; refresh it after every write so edits show
// within moments. A failed refresh is harmless (the page also revalidates on a timer).
export function refreshAbout() {
  try { revalidatePath('/about'); } catch (e) { console.error('revalidate /about failed:', e); }
}

const text = (v) => String(v ?? '').trim();

// Validates admin input. Returns { error } (400) or { values } for the table.
export function parseTeamInput(body) {
  const b = body || {};

  const name = text(b.name);
  if (!name) return { error: 'Name is required' };
  if (name.length > 80) return { error: 'Name must be 80 characters or fewer' };

  const role = text(b.role);
  if (!role) return { error: 'Role is required' };
  if (role.length > 100) return { error: 'Role must be 100 characters or fewer' };

  const bio = text(b.bio);
  if (bio.length > 500) return { error: 'Bio must be 500 characters or fewer' };

  const badge = text(b.badge);
  if (badge.length > 40) return { error: 'Badge must be 40 characters or fewer' };

  const avatar = text(b.avatar) || DEFAULT_AVATAR;
  if (Array.from(avatar).length > 8) return { error: 'Avatar must be 8 characters or fewer' };

  // Only plain http(s) image URLs; rejects javascript:, data:, etc.
  const photoUrl = text(b.photoUrl);
  if (photoUrl) {
    let ok = false;
    try { ok = ['http:', 'https:'].includes(new URL(photoUrl).protocol); } catch { ok = false; }
    if (!ok) return { error: 'Photo URL must start with http:// or https://' };
  }

  return {
    values: {
      name,
      role,
      bio: bio || null,
      badge: badge || null,
      avatar,
      photo_url: photoUrl || null,
      gradient: GRADIENT_KEYS.includes(b.gradient) ? b.gradient : DEFAULT_GRADIENT,
      is_visible: b.isVisible === undefined ? true : !!b.isVisible,
    },
  };
}
