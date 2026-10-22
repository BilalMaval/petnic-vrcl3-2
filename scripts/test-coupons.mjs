// Coupon system test against a LOCAL server (default http://localhost:3100)
// using the real database. Usage:
//   node scripts/test-coupons.mjs smoke   (tables not created yet)
//   node scripts/test-coupons.mjs         (full run, after coupons-migration.sql)
// Every row it creates is deleted at the end (coupons start with ZZTEST,
// customers use @example.invalid) and the cleanup output is printed.
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';
import fs from 'fs';
import crypto from 'node:crypto';

const BASE = process.env.TEST_BASE || 'http://localhost:3100';
if (!/^http:\/\/localhost[:/]/.test(BASE)) throw new Error('Refusing to run against a non-local server');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const secret = new TextEncoder().encode(env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 32));
const sign = (claims) => new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('15m').sign(secret);
const adminToken = await sign({ userId: 'test-admin', email: 'admin@example.invalid', role: 'admin' });
const userToken = await sign({ userId: 'test-user', email: 'user@example.invalid', role: 'user' });

let passed = 0, failed = 0;
const t = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name}${detail ? '  -> ' + detail : ''}`); }
};

const rid = () => crypto.randomBytes(3).toString('hex').toUpperCase();
const fakeIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

async function api(method, path, { token, body, ip, raw } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip || fakeIp(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const sessions = [];
const productIds = [];

async function cleanup() {
  console.log('\n--- cleanup ---');
  const { data: txs } = await supabase.from('payment_transactions').select('session_id').in('session_id', sessions.length ? sessions : ['none']);
  const { data: o1, error: e1 } = await supabase.from('orders').delete().in('payment_session_id', sessions.length ? sessions : ['none']).select('order_id');
  console.log('orders deleted:', o1?.map((o) => o.order_id), e1?.message || '');
  const { data: o2 } = await supabase.from('payment_transactions').delete().in('session_id', sessions.length ? sessions : ['none']).select('session_id');
  console.log('payment_transactions deleted:', o2?.length, '(of', txs?.length, 'found)');
  const { data: c, error: e3 } = await supabase.from('coupons').delete().like('code', 'ZZTEST%').select('code');
  console.log('coupons deleted (redemptions cascade):', c?.length, e3?.message || '');
  const { data: p } = await supabase.from('products').delete().in('id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']).select('slug');
  console.log('test products deleted:', p?.map((x) => x.slug));
  const { count: leftC } = await supabase.from('coupons').select('id', { count: 'exact', head: true }).like('code', 'ZZTEST%');
  const { count: leftO } = await supabase.from('orders').select('id', { count: 'exact', head: true }).like('customer_email', '%@example.invalid');
  const { count: leftT } = await supabase.from('payment_transactions').select('id', { count: 'exact', head: true }).like('user_email', '%@example.invalid');
  console.log(`remaining test rows -> coupons: ${leftC}, orders: ${leftO}, payment_transactions: ${leftT}`);
}

const mode = process.argv[2] || 'full';

if (mode === 'smoke') {
  const list = await api('GET', '/api/admin/coupons', { token: adminToken });
  t('admin list without tables returns setupRequired (not 500)', list.status === 200 && list.data.setupRequired === true, JSON.stringify(list));
  const { data: anyProduct } = await supabase.from('products').select('id').eq('in_stock', true).gt('price', 0).limit(1).single();
  const v = await api('POST', '/api/coupons/validate', { body: { code: 'ANYTHING', items: [{ productId: anyProduct.id, quantity: 1 }] } });
  t('validate without tables says "Coupons are not available yet"', v.status === 400 && v.data.error === 'Coupons are not available yet', JSON.stringify(v));
  const create = await api('POST', '/api/admin/coupons', { token: adminToken, body: { code: 'ZZTESTX', discountType: 'PERCENT', discountValue: 10 } });
  t('create without tables returns 503 setup notice (not 500)', create.status === 503 && create.data.setupRequired === true, JSON.stringify(create));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

try {
  // ---------- fixtures: temp products ----------
  const { data: digital } = await supabase.from('collections').select('id').eq('slug', 'digital').single();
  const { data: donor } = await supabase.from('products').select('image_url').not('image_url', 'is', null).limit(1).single();
  const stamp = Date.now();
  const mkProduct = async (suffix, price, original) => {
    const { data, error } = await supabase.from('products').insert({
      name: `ZZ TEST ${suffix}`, slug: `zz-test-${suffix}-${stamp}`, price, original_price: original,
      collection_id: digital.id, in_stock: true, download_file_url: donor.image_url, image_url: donor.image_url,
      description: 'temporary test product',
    }).select('id, slug').single();
    if (error) throw new Error('could not create test product: ' + error.message);
    productIds.push(data.id);
    return data;
  };
  const paid = await mkProduct('paid', 20, 30);   // sale price 20, regular 30
  const freeP = await mkProduct('free', 0, 0);
  const { data: physical } = await supabase.from('products').select('id').eq('in_stock', true).gt('price', 0).neq('collection_id', digital.id).limit(1).single();
  const item = (id = paid.id, quantity = 1, extra = {}) => ({ productId: id, quantity, ...extra });
  const validate = (code, items, email) => api('POST', '/api/coupons/validate', { body: { code, items, email } });
  const mk = (over = {}) => api('POST', '/api/admin/coupons', { token: adminToken, body: { code: 'ZZTEST' + rid(), discountType: 'PERCENT', discountValue: 10, ...over } });
  const order = (over = {}) => api('POST', '/api/payments/checkout', {
    body: { origin_url: BASE, shipping: { required: false }, cart_items: [{ product_id: paid.id, quantity: 1 }], ...over },
  });

  // ---------- auth ----------
  const anonList = await api('GET', '/api/admin/coupons');
  t('anonymous cannot list (blocked)', anonList.status === 401 || anonList.status === 403, `status ${anonList.status} (project guard returns 403 for both anon and customer)`);
  const custList = await api('GET', '/api/admin/coupons', { token: userToken });
  t('customer role blocked on list', custList.status === 403, `status ${custList.status}`);
  const anonCreate = await api('POST', '/api/admin/coupons', { body: { code: 'ZZTESTANON', discountType: 'PERCENT', discountValue: 5 } });
  t('anonymous cannot create', anonCreate.status === 403 || anonCreate.status === 401, `status ${anonCreate.status}`);
  const custCreate = await api('POST', '/api/admin/coupons', { token: userToken, body: { code: 'ZZTESTCUST', discountType: 'PERCENT', discountValue: 5 } });
  t('customer cannot create', custCreate.status === 403, `status ${custCreate.status}`);
  const fakeId = '00000000-0000-4000-8000-000000000000';
  t('anonymous blocked on PUT', (await api('PUT', `/api/admin/coupons/${fakeId}`, { body: { toggleOnly: true, isActive: false } })).status >= 401);
  t('customer blocked on DELETE', (await api('DELETE', `/api/admin/coupons/${fakeId}`, { token: userToken })).status === 403);

  const list = await api('GET', '/api/admin/coupons', { token: adminToken });
  t('admin list works', list.status === 200 && Array.isArray(list.data.coupons) && !list.data.setupRequired, JSON.stringify(list).slice(0, 200));

  // ---------- create / validation of input ----------
  const pct = await mk({ code: 'ZZTESTPCT', discountValue: 10 });
  t('create percent coupon', pct.status === 201 && pct.data.coupon.discount_type === 'PERCENT', JSON.stringify(pct));
  const dupe = await mk({ code: 'zztestpct' });
  t('duplicate code, other letter case -> 409', dupe.status === 409 && /already exists/.test(dupe.data.error), JSON.stringify(dupe));
  t('percent over 100 -> 400', (await mk({ discountValue: 101 })).status === 400);
  t('bad characters in code -> 400', (await mk({ code: 'ZZ TEST!!' })).status === 400);
  t('short code -> 400', (await mk({ code: 'AB' })).status === 400);
  t('zero value -> 400', (await mk({ discountValue: 0 })).status === 400);
  t('usage limit 0 -> 400', (await mk({ usageLimit: 0 })).status === 400);
  const fixed = await mk({ code: 'ZZTESTFIX', discountType: 'FIXED', discountValue: 5, maxDiscountAmount: 3 });
  t('fixed coupon ignores max discount (percent-only)', fixed.status === 201 && fixed.data.coupon.max_discount_amount === null, JSON.stringify(fixed.data));

  // ---------- region / time math ----------
  const zone = async (over) => (await mk(over));
  const r1 = await zone({ startDate: '2026-07-15', startTime: '00:01', startTimezone: 'America/New_York', expiresDate: '2026-07-20', expiresTime: '23:59', endTimezone: 'America/Los_Angeles' });
  t('NY 00:01 summer -> 04:01Z', r1.data.coupon?.starts_at?.startsWith('2026-07-15T04:01:00'), r1.data.coupon?.starts_at);
  t('LA 23:59 summer -> next day 06:59Z', r1.data.coupon?.expires_at?.startsWith('2026-07-21T06:59:00'), r1.data.coupon?.expires_at);
  const r2 = await zone({ startDate: '2026-12-15', startTime: '00:01', startTimezone: 'America/New_York', expiresDate: '2026-12-20', expiresTime: '23:59', endTimezone: 'America/Los_Angeles' });
  t('NY 00:01 winter -> 05:01Z', r2.data.coupon?.starts_at?.startsWith('2026-12-15T05:01:00'), r2.data.coupon?.starts_at);
  t('LA 23:59 winter -> next day 07:59Z', r2.data.coupon?.expires_at?.startsWith('2026-12-21T07:59:00'), r2.data.coupon?.expires_at);
  const r3 = await zone({ startDate: '2026-12-15', expiresDate: '2026-12-20' });
  t('default times (dates only) -> NY 00:01 / LA 23:59', r3.data.coupon?.starts_at?.startsWith('2026-12-15T05:01:00') && r3.data.coupon?.expires_at?.startsWith('2026-12-21T07:59:00') && r3.data.coupon.start_timezone === 'America/New_York' && r3.data.coupon.end_timezone === 'America/Los_Angeles', JSON.stringify(r3.data.coupon));
  const r4 = await zone({ startDate: '2026-12-15', startTimezone: 'Mars/Base' });
  t('unknown region falls back to default', r4.status === 201 && r4.data.coupon.start_timezone === 'America/New_York' && r4.data.coupon.starts_at.startsWith('2026-12-15T05:01:00'), JSON.stringify(r4.data.coupon));
  t('garbage date -> 400', (await zone({ startDate: 'not-a-date' })).status === 400);
  t('expiry before start -> 400', (await zone({ startDate: '2026-12-20', expiresDate: '2026-12-15' })).status === 400);
  const r5 = await zone({});
  t('empty dates -> starts now / never expires', r5.data.coupon?.starts_at === null && r5.data.coupon?.expires_at === null);

  // ---------- validation messages ----------
  const v1 = await validate('ZZTESTPCT', [item()]);
  t('percent math on SALE price (10% of 20 = 2.00)', v1.status === 200 && v1.data.subtotal === 20 && v1.data.discount === 2 && v1.data.total === 18, JSON.stringify(v1.data));
  t('response never leaks the internal coupon id', v1.data.coupon && !('id' in v1.data.coupon));
  const v2 = await api('POST', '/api/coupons/validate', { body: { code: 'zztestpct', items: [{ productId: paid.id, quantity: 1, price: 0.01, unit_price: 0.01 }], email: 'x@example.invalid' } });
  t('browser-supplied price is ignored; lowercase code accepted', v2.status === 200 && v2.data.subtotal === 20, JSON.stringify(v2.data));
  const v3 = await validate('ZZTESTPCT', [item(paid.id, 3)]);
  t('quantity multiplies server price (3 x 20 = 60)', v3.data.subtotal === 60 && v3.data.discount === 6, JSON.stringify(v3.data));
  const minC = await mk({ code: 'ZZTESTMIN', minOrderAmount: 50 });
  const v4 = await validate('ZZTESTMIN', [item()]);
  t('minimum order message', v4.status === 400 && v4.data.error === 'Minimum order of $50.00 required for this coupon', JSON.stringify(v4.data));
  t('minimum met with quantity 3', (await validate('ZZTESTMIN', [item(paid.id, 3)])).status === 200);
  const capC = await mk({ code: 'ZZTESTCAP', discountValue: 50, maxDiscountAmount: 5 });
  const v5 = await validate('ZZTESTCAP', [item()]);
  t('max discount cap (50% of 20 capped at 5)', v5.data.discount === 5 && v5.data.total === 15, JSON.stringify(v5.data));
  const fixC = await validate('ZZTESTFIX', [item()]);
  t('fixed discount', fixC.data.discount === 5 && fixC.data.total === 15, JSON.stringify(fixC.data));
  await mk({ code: 'ZZTESTBIG', discountType: 'FIXED', discountValue: 500 });
  const big = await validate('ZZTESTBIG', [item()]);
  t('fixed discount never exceeds subtotal', big.data.discount === 20 && big.data.total === 0, JSON.stringify(big.data));
  await mk({ code: 'ZZTESTTINY', discountType: 'FIXED', discountValue: 19.8 });
  const tiny = await validate('ZZTESTTINY', [item()]);
  t('total between $0 and $0.50 is refused', tiny.status === 400 && /under \$0\.50/.test(tiny.data.error), JSON.stringify(tiny.data));
  const past = await mk({ code: 'ZZTESTPAST', startDate: '2020-01-01', expiresDate: '2020-01-02' });
  const v6 = await validate('ZZTESTPAST', [item()]);
  t('expired coupon message', past.status === 201 && v6.data.error === 'This coupon has expired', JSON.stringify(v6.data));
  await mk({ code: 'ZZTESTFUT', startDate: '2099-01-01' });
  const v7 = await validate('ZZTESTFUT', [item()]);
  t('not-started coupon message', v7.data.error === 'This coupon is not active yet', JSON.stringify(v7.data));
  const off = await mk({ code: 'ZZTESTOFF', isActive: false });
  const v8 = await validate('ZZTESTOFF', [item()]);
  const v9 = await validate('ZZTESTNOPE', [item()]);
  t('disabled and unknown give the identical message', v8.data.error === 'Invalid coupon code' && v8.data.error === v9.data.error, `${v8.data.error} / ${v9.data.error}`);
  const v10 = await validate('ZZTESTPCT', [item(freeP.id)]);
  t('free-only cart refused', v10.data.error === 'Coupons apply to paid items only', JSON.stringify(v10.data));
  const v11 = await validate('ZZTESTPCT', [item(paid.id), item(freeP.id)]);
  t('free items never discounted (mixed cart)', v11.data.subtotal === 20 && v11.data.discount === 2, JSON.stringify(v11.data));
  t('unknown product rejected', (await validate('ZZTESTPCT', [item(fakeId)])).status === 400);
  t('empty cart rejected', (await validate('ZZTESTPCT', [])).status === 400);

  // ---------- toggle / edit / delete ----------
  const tog = await api('PUT', `/api/admin/coupons/${off.data.coupon.id}`, { token: adminToken, body: { toggleOnly: true, isActive: true } });
  t('toggle enables coupon', tog.status === 200 && tog.data.coupon.is_active === true && (await validate('ZZTESTOFF', [item()])).status === 200);
  const edit = await api('PUT', `/api/admin/coupons/${pct.data.coupon.id}`, { token: adminToken, body: { code: 'ZZTESTPCT', discountType: 'PERCENT', discountValue: 25, description: 'edited' } });
  t('full edit', edit.status === 200 && Number(edit.data.coupon.discount_value) === 25, JSON.stringify(edit.data));
  t('bad id on PUT -> 400', (await api('PUT', '/api/admin/coupons/not-a-uuid', { token: adminToken, body: { toggleOnly: true, isActive: true } })).status === 400);
  t('unused coupon can be deleted', (await api('DELETE', `/api/admin/coupons/${minC.data.coupon.id}`, { token: adminToken })).status === 200);

  // ---------- orders: free (100%) path, limits, download ----------
  await mk({ code: 'ZZTESTFREE', discountValue: 100 });
  const mail = (n) => `${n}-${rid()}@example.invalid`;
  const free1 = await order({ couponCode: 'ZZTESTFREE', user_email: mail('buyer') });
  if (free1.data.session_id) sessions.push(free1.data.session_id);
  t('100% coupon completes with no payment step', free1.status === 200 && free1.data.free === true && /session_id=free_/.test(free1.data.url), JSON.stringify(free1.data));
  const sid = free1.data.session_id;
  const { data: ord } = await supabase.from('orders').select('*').eq('payment_session_id', sid).maybeSingle();
  t('order stored: total 0, status paid, name/email filled', ord && Number(ord.total) === 0 && ord.status === 'paid' && ord.order_id && ord.customer_email?.endsWith('@example.invalid') && ord.product_name === 'ZZ TEST paid', JSON.stringify(ord));
  const { data: txr } = await supabase.from('payment_transactions').select('*').eq('session_id', sid).maybeSingle();
  t('transaction paid with coupon metadata (items untouched)', txr?.payment_status === 'paid' && txr.metadata?.coupon?.code === 'ZZTESTFREE' && Number(txr.metadata.coupon.discount) === 20 && Array.isArray(txr.metadata.items) && !('coupon' in (txr.metadata.items[0] || {})), JSON.stringify(txr?.metadata?.coupon));
  const { data: cpn } = await supabase.from('coupons').select('used_count').eq('code', 'ZZTESTFREE').single();
  const { data: reds } = await supabase.from('coupon_redemptions').select('*').eq('order_id', sid);
  t('used_count bumped and redemption recorded', cpn.used_count === 1 && reds.length === 1 && Number(reds[0].discount_amount) === 20 && reds[0].order_number === ord.order_id, JSON.stringify({ cpn, reds }));
  const st = await api('GET', `/api/payments/status/${sid}`);
  t('status endpoint reports paid, $0 total, coupon and the download file', st.data.payment_status === 'paid' && st.data.amount_total === 0 && st.data.coupon?.code === 'ZZTESTFREE' && st.data.files?.length === 1, JSON.stringify(st.data));
  const dl = await api('GET', `/api/orders/download?session_id=${sid}&product_id=${paid.id}`, { raw: true });
  const dlBytes = Buffer.from(await dl.arrayBuffer());
  const srcBytes = Buffer.from(await (await fetch(donor.image_url)).arrayBuffer());
  t('download serves the real file as an attachment', dl.status === 200 && /attachment/.test(dl.headers.get('content-disposition') || '') && dlBytes.length > 0 && dlBytes.equals(srcBytes), `status ${dl.status}, ${dlBytes.length} vs ${srcBytes.length} bytes, ${dl.headers.get('content-disposition')}`);
  t('download for a product not in the order -> 404', (await api('GET', `/api/orders/download?session_id=${sid}&product_id=${freeP.id}`)).status === 404);
  t('download with unknown session -> 404', (await api('GET', `/api/orders/download?session_id=free_nope&product_id=${paid.id}`)).status === 404);
  const statAgain = await api('GET', `/api/payments/status/${sid}`);
  const { count: ordCount } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_session_id', sid);
  const { data: cpn2 } = await supabase.from('coupons').select('used_count').eq('code', 'ZZTESTFREE').single();
  t('re-polling status does not duplicate order or coupon use', statAgain.status === 200 && ordCount === 1 && cpn2.used_count === 1);

  // single-use
  await mk({ code: 'ZZTESTONCE', discountValue: 100, usageLimit: 1 });
  const once1 = await order({ couponCode: 'ZZTESTONCE', user_email: mail('a') });
  if (once1.data.session_id) sessions.push(once1.data.session_id);
  const once2 = await order({ couponCode: 'ZZTESTONCE', user_email: mail('b') });
  t('single-use coupon works once, then is refused', once1.status === 200 && once2.status === 400 && once2.data.error === 'This coupon has reached its usage limit', JSON.stringify([once1.status, once2.data]));

  // per-customer
  await mk({ code: 'ZZTESTPERC', discountValue: 100, perCustomerLimit: 1 });
  const same = mail('same');
  const pc1 = await order({ couponCode: 'ZZTESTPERC', user_email: same });
  if (pc1.data.session_id) sessions.push(pc1.data.session_id);
  const pc2 = await order({ couponCode: 'ZZTESTPERC', user_email: same.toUpperCase() });
  const pc3 = await order({ couponCode: 'ZZTESTPERC', user_email: mail('other') });
  if (pc3.data.session_id) sessions.push(pc3.data.session_id);
  const pc4 = await order({ couponCode: 'ZZTESTPERC' });
  t('per-customer limit by email (case-insensitive); other email OK', pc1.status === 200 && pc2.status === 400 && pc2.data.error === 'You have already used this coupon' && pc3.status === 200, JSON.stringify([pc1.status, pc2.data, pc3.status]));
  t('per-customer coupon without email is refused at order time', pc4.status === 400 && pc4.data.error === 'Enter your email to use this coupon', JSON.stringify(pc4.data));
  const pcv = await validate('ZZTESTPERC', [item()]);
  t('validate without email flags requiresEmail', pcv.status === 200 && pcv.data.coupon.requiresEmail === true);

  // refusals create nothing
  const { count: txBefore } = await supabase.from('payment_transactions').select('id', { count: 'exact', head: true });
  const { count: ordBefore } = await supabase.from('orders').select('id', { count: 'exact', head: true });
  const bad = await order({ couponCode: 'ZZTESTNOPE', user_email: mail('bad') });
  const noMail = await order({ couponCode: 'ZZTESTFREE', user_email: undefined });
  const phys = await order({ couponCode: 'ZZTESTFREE', user_email: mail('phys'), cart_items: [{ product_id: physical.id, quantity: 1 }] });
  const { count: txAfter } = await supabase.from('payment_transactions').select('id', { count: 'exact', head: true });
  const { count: ordAfter } = await supabase.from('orders').select('id', { count: 'exact', head: true });
  t('invalid coupon at order time -> 400 and nothing created', bad.status === 400 && bad.data.error === 'Invalid coupon code' && txBefore === txAfter && ordBefore === ordAfter, JSON.stringify(bad));
  t('free order without email -> 400', noMail.status === 400 && /email/i.test(noMail.data.error), JSON.stringify(noMail.data));
  t('free order with a physical product -> 400 (no use burned)', phys.status === 400 && /digital/i.test(phys.data.error), JSON.stringify(phys.data));
  const { data: cpn3 } = await supabase.from('coupons').select('used_count').eq('code', 'ZZTESTFREE').single();
  t('refused orders did not consume coupon uses', cpn3.used_count === 1, `used_count ${cpn3.used_count}`);

  // paid path (needs a Stripe key, which the local .env.local does not have)
  await mk({ code: 'ZZTESTPAIDPATH', discountValue: 10, usageLimit: 5 });
  const paidTry = await order({ couponCode: 'ZZTESTPAIDPATH', user_email: mail('paid') });
  const { data: cpn4 } = await supabase.from('coupons').select('used_count').eq('code', 'ZZTESTPAIDPATH').single();
  console.log(`INFO  paid-path order locally -> ${paidTry.status} ${JSON.stringify(paidTry.data)} (expected: fails at Stripe because no key is configured locally)`);
  t('failure after claim releases the coupon use', paidTry.status === 500 && cpn4.used_count === 0, `status ${paidTry.status}, used_count ${cpn4.used_count}`);

  // delete rules
  const usedDel = await api('DELETE', `/api/admin/coupons/${(await supabase.from('coupons').select('id').eq('code', 'ZZTESTFREE').single()).data.id}`, { token: adminToken });
  t('used coupon cannot be deleted (409, disable instead)', usedDel.status === 409 && /Disable/.test(usedDel.data.error), JSON.stringify(usedDel.data));
  const listAfter = await api('GET', '/api/admin/coupons', { token: adminToken });
  const freeRow = listAfter.data.coupons.find((c) => c.code === 'ZZTESTFREE');
  t('admin list shows used_count and total_discounted', freeRow?.used_count === 1 && freeRow.total_discounted === 20, JSON.stringify(freeRow));

  // rate limit (same IP, 16 calls)
  const sameIp = '203.0.113.77';
  let limited = 0;
  for (let i = 0; i < 17; i++) {
    const r = await api('POST', '/api/coupons/validate', { ip: sameIp, body: { code: 'ZZTESTPCT', items: [item()] } });
    if (r.status === 429) limited++;
  }
  t('rate limit: the 16th+ call from one IP gets 429', limited >= 1, `${limited} limited of 17`);
} catch (e) {
  failed++;
  console.log('FAIL  test run crashed:', e);
} finally {
  await cleanup();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
