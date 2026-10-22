import { getSupabaseAdmin } from '@/lib/supabase';
import {
  ZONE_IDS,
  DEFAULT_START_ZONE,
  DEFAULT_END_ZONE,
  DEFAULT_START_TIME,
  DEFAULT_END_TIME,
  zonedToUtcIso,
} from '@/lib/coupon-time';

// Server-only coupon logic. Route files can only export HTTP handlers in
// Next.js, so everything reusable lives here.

export const MSG = {
  invalid: 'Invalid coupon code',
  notActive: 'This coupon is not active yet',
  expired: 'This coupon has expired',
  usedUp: 'This coupon has reached its usage limit',
  paidOnly: 'Coupons apply to paid items only',
  alreadyUsed: 'You have already used this coupon',
  needEmail: 'Enter your email to use this coupon',
  unavailable: 'Coupons are not available yet',
  tooSmall: 'This coupon would leave an order total under $0.50. Add more items or use a different coupon.',
};

export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

// Postgres "undefined_table" or PostgREST "table not in schema cache".
export function isMissingTable(error) {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || '');
}

export function isUniqueViolation(error) {
  return !!error && (error.code === '23505' || /duplicate key|already exists/i.test(error.message || ''));
}

const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
export { isUuid };

// ilike treats % and _ as wildcards, and codes may contain "_", so escape
// them and then confirm an exact (case-insensitive) match in JS.
async function findCoupon(supabase, code) {
  const pattern = code.replace(/[\\%_]/g, '\\$&');
  const { data, error } = await supabase.from('coupons').select('*').ilike('code', pattern).limit(5);
  if (error) return { error };
  const row = (data || []).find((c) => normalizeCode(c.code) === code) || null;
  return { row };
}

function publicCoupon(c, requiresEmail) {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    type: c.discount_type,
    value: Number(c.discount_value),
    expiresAt: c.expires_at,
    endTimezone: c.end_timezone || DEFAULT_END_ZONE,
    requiresEmail: !!requiresEmail,
  };
}

// Validates a code against a server-priced subtotal.
// Returns { ok: true, discount, total, coupon } or { ok: false, error }.
// `requireEmail` is true at order time: a per-customer limit can't be
// enforced without an email, so the order is refused instead of skipping it.
export async function evaluateCoupon(rawCode, subtotal, email, { requireEmail = false } = {}) {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: 'Enter a coupon code' };

  const supabase = getSupabaseAdmin();
  const { row: c, error } = await findCoupon(supabase, code);
  if (error) {
    if (isMissingTable(error)) return { ok: false, error: MSG.unavailable };
    console.error('coupon lookup failed:', error);
    return { ok: false, error: MSG.unavailable };
  }
  // Unknown and disabled codes share one message so codes can't be probed.
  if (!c || !c.is_active) return { ok: false, error: MSG.invalid };

  const now = Date.now();
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { ok: false, error: MSG.notActive };
  if (c.expires_at && new Date(c.expires_at).getTime() <= now) return { ok: false, error: MSG.expired };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return { ok: false, error: MSG.usedUp };

  const subtotalCents = Math.round((Number(subtotal) || 0) * 100);
  if (subtotalCents <= 0) return { ok: false, error: MSG.paidOnly };

  const min = Number(c.min_order_amount) || 0;
  if (min > 0 && subtotalCents < Math.round(min * 100)) {
    return { ok: false, error: `Minimum order of $${min.toFixed(2)} required for this coupon` };
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  let requiresEmail = false;
  if (c.per_customer_limit != null) {
    if (!cleanEmail) {
      if (requireEmail) return { ok: false, error: MSG.needEmail };
      requiresEmail = true;
    } else {
      const { count, error: countErr } = await supabase
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', c.id)
        .eq('email', cleanEmail);
      if (countErr) {
        console.error('coupon redemption count failed:', countErr);
        return { ok: false, error: MSG.unavailable };
      }
      if ((count || 0) >= c.per_customer_limit) return { ok: false, error: MSG.alreadyUsed };
    }
  }

  let discountCents;
  if (c.discount_type === 'PERCENT') {
    discountCents = Math.round((subtotalCents * Number(c.discount_value)) / 100);
    if (c.max_discount_amount != null) discountCents = Math.min(discountCents, Math.round(Number(c.max_discount_amount) * 100));
  } else {
    discountCents = Math.round(Number(c.discount_value) * 100);
  }
  discountCents = Math.min(discountCents, subtotalCents);

  const totalCents = subtotalCents - discountCents;
  // Stripe refuses card charges under $0.50 (and a $0 session entirely), so a
  // total must be exactly 0 (handled as a free order) or at least $0.50.
  if (totalCents > 0 && totalCents < 50) return { ok: false, error: MSG.tooSmall };

  return {
    ok: true,
    discount: discountCents / 100,
    total: totalCents / 100,
    coupon: publicCoupon(c, requiresEmail),
  };
}

// Atomically takes one use (SQL function, see coupons-migration.sql).
export async function claimCoupon(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('claim_coupon', { p_id: id });
  if (error) {
    console.error('claim_coupon failed:', error);
    return false;
  }
  return data === true;
}

export async function releaseCoupon(id) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc('release_coupon', { p_id: id });
  if (error) console.error('release_coupon failed:', error);
}

// Idempotent: the (coupon_id, order_id) unique index ignores a second insert
// when the webhook and the status poll both finish the same order.
export async function recordRedemption({ couponId, orderId, orderNumber, email, discount }) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('coupon_redemptions').insert({
    coupon_id: couponId,
    order_id: orderId || null,
    order_number: orderNumber || null,
    email: email ? String(email).trim().toLowerCase() : null,
    discount_amount: discount,
  });
  if (error && !isUniqueViolation(error)) console.error('recordRedemption failed:', error);
}

// ---- Admin input parsing -------------------------------------------------

const optionalNumber = (v, label, { integer = false, min = 0, minExclusive = false } = {}) => {
  if (v === undefined || v === null || v === '') return { value: null };
  const n = Number(v);
  if (!Number.isFinite(n) || (integer && !Number.isInteger(n)) || (minExclusive ? n <= min : n < min)) {
    return { error: `${label} must be ${integer ? 'a whole number' : 'a number'} ${minExclusive ? 'greater than' : 'of at least'} ${min}` };
  }
  return { value: n };
};

// Validates admin input and converts start/end wall-clock times to UTC on the
// server. Returns { error } (400) or { values } ready for the coupons table.
export function parseCouponInput(body) {
  const b = body || {};

  const code = normalizeCode(b.code);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return { error: 'Code must be 3-32 characters: letters, numbers, - or _' };
  }

  const type = String(b.discountType || '').toUpperCase();
  if (type !== 'PERCENT' && type !== 'FIXED') return { error: 'Discount type must be Percentage or Fixed' };

  const value = Number(b.discountValue);
  if (!Number.isFinite(value) || value <= 0) return { error: 'Discount value must be greater than 0' };
  if (type === 'PERCENT' && value > 100) return { error: 'Percentage cannot be more than 100' };

  const description = String(b.description || '').trim();
  if (description.length > 200) return { error: 'Description must be 200 characters or fewer' };

  const min = optionalNumber(b.minOrderAmount, 'Minimum order');
  if (min.error) return { error: min.error };
  const max = optionalNumber(b.maxDiscountAmount, 'Maximum discount', { minExclusive: true });
  if (max.error) return { error: max.error };
  const usage = optionalNumber(b.usageLimit, 'Total uses', { integer: true, min: 1 });
  if (usage.error) return { error: usage.error };
  const perCustomer = optionalNumber(b.perCustomerLimit, 'Uses per customer', { integer: true, min: 1 });
  if (perCustomer.error) return { error: perCustomer.error };

  // An unknown region falls back to the default instead of erroring.
  const startZone = ZONE_IDS.includes(b.startTimezone) ? b.startTimezone : DEFAULT_START_ZONE;
  const endZone = ZONE_IDS.includes(b.endTimezone) ? b.endTimezone : DEFAULT_END_ZONE;

  let startsAt = null;
  let expiresAt = null;
  try {
    startsAt = zonedToUtcIso(b.startDate || '', b.startTime || DEFAULT_START_TIME, startZone) || null;
    expiresAt = zonedToUtcIso(b.expiresDate || '', b.expiresTime || DEFAULT_END_TIME, endZone) || null;
  } catch {
    return { error: 'Invalid start or expiry date/time' };
  }
  if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
    return { error: 'Expiry must be after the start' };
  }

  return {
    values: {
      code,
      description: description || null,
      discount_type: type,
      discount_value: value,
      min_order_amount: min.value ?? 0,
      max_discount_amount: type === 'PERCENT' ? max.value : null,
      starts_at: startsAt,
      expires_at: expiresAt,
      start_timezone: startZone,
      end_timezone: endZone,
      usage_limit: usage.value,
      per_customer_limit: perCustomer.value,
      is_active: b.isActive === undefined ? true : !!b.isActive,
    },
  };
}
