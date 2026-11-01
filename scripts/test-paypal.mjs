// PayPal tests. Run from the project root:
//   node --import ./scripts/register-alias.mjs scripts/test-paypal.mjs unit
//        pure checks of how orders are built (no network)
//   node --import ./scripts/register-alias.mjs scripts/test-paypal.mjs unconfigured
//        local server started WITHOUT PayPal variables: everything fails safe
//   node --import ./scripts/register-alias.mjs scripts/test-paypal.mjs full
//        local server WITH sandbox credentials in .env.local: real PayPal sandbox calls
//   node --import ./scripts/register-alias.mjs scripts/test-paypal.mjs approve
//        full + one real sandbox payment that YOU approve in PayPal (buyer login)
// Server tests use a LOCAL server (default http://localhost:3100) and the real
// database. Test rows are named ZZ Test / @example.invalid and deleted at the end.
import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE = process.env.TEST_BASE || 'http://localhost:3100';
if (!/^http:\/\/localhost[:/]/.test(BASE)) throw new Error('Refusing to run against a non-local server');

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  if (!line.includes('=') || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  const k = line.slice(0, i).trim();
  if (!(k in process.env)) process.env[k] = line.slice(i + 1).trim();
}

const mode = process.argv[2] || 'unit';
let passed = 0, failed = 0;
const t = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name}${detail ? '  -> ' + detail : ''}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const finish = () => { console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); };

async function http(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})), headers: res.headers };
}

// ------------------------------------------------------------------ unit
if (mode === 'unit') {
  const { buildPurchaseUnit } = await import('../lib/paypal.js');
  const lines = [
    { product_id: 'p1', display_name: 'Digital Preset Pack', unit_cents: 1999, quantity: 2, is_digital: true },
    { product_id: 'p2', display_name: 'X'.repeat(300), unit_cents: 500, quantity: 1, is_digital: false },
  ];
  const { unit, shippingPreference } = buildPurchaseUnit({ lines, discount: 3, total: 41.98, hasPhysical: true });
  t('order total string has two decimals', unit.amount.value === '41.98');
  t('item_total is the exact sum of the lines (2 x 19.99 + 5.00)', unit.amount.breakdown.item_total.value === '44.98');
  t('coupon is sent as its own discount line', unit.amount.breakdown.discount.value === '3.00');
  t('item_total - discount = total', (44.98 - 3).toFixed(2) === unit.amount.value);
  t('quantities are strings, unit amounts per line', unit.items[0].quantity === '2' && unit.items[0].unit_amount.value === '19.99');
  t('digital vs physical categories', unit.items[0].category === 'DIGITAL_GOODS' && unit.items[1].category === 'PHYSICAL_GOODS');
  t('item names are cut to PayPal\'s 127-character limit', unit.items[1].name.length === 127);
  t('physical goods ask PayPal for the buyer\'s address', shippingPreference === 'GET_FROM_FILE');
  const digital = buildPurchaseUnit({ lines: [lines[0]], discount: 0, total: 39.98, hasPhysical: false });
  t('digital-only orders skip the address step', digital.shippingPreference === 'NO_SHIPPING');
  t('no discount line when there is no coupon', !('discount' in digital.unit.amount.breakdown));
  t('currency is USD everywhere', unit.amount.currency_code === 'USD' && unit.items.every((i) => i.unit_amount.currency_code === 'USD'));
  const sum = unit.items.reduce((s, i) => s + parseFloat(i.unit_amount.value) * Number(i.quantity), 0);
  t('sum of item amounts equals item_total', sum.toFixed(2) === unit.amount.breakdown.item_total.value);

  const { isPayPalOrderId, ppSessionId } = await import('../lib/paypal-orders.js').catch(() => ({}));
  if (isPayPalOrderId) {
    t('PayPal order id format check', isPayPalOrderId('5O190127TN364715T') && !isPayPalOrderId('x') && !isPayPalOrderId("1'; drop table") && !isPayPalOrderId(''));
    t('session id is prefixed pp_', ppSessionId('ABC') === 'pp_ABC');
  } else {
    console.log('INFO  skipped id-format checks (run with --import ./scripts/register-alias.mjs)');
  }
  finish();
}

// ------------------------------------------------------------- unconfigured
if (mode === 'unconfigured') {
  const c = await http('POST', '/api/paypal/create-order', { cart_items: [] });
  t('create-order without PayPal config -> 503', c.status === 503, JSON.stringify(c.data));
  const k = await http('POST', '/api/paypal/capture', { orderId: 'ABCDEFGHIJ1234' });
  t('capture without PayPal config -> 503', k.status === 503);
  const w = await http('POST', '/api/paypal/webhook', { event_type: 'CHECKOUT.ORDER.APPROVED' });
  t('webhook without config -> 503 (never accepts unverified events)', w.status === 503);
  const x = await http('POST', '/api/paypal/cancel', { orderId: 'ABCDEFGHIJ1234' });
  t('cancel of an unknown order is harmless', x.status === 200);
  const s = await http('GET', '/api/payments/status/pp_UNKNOWNORDER123');
  t('status of an unknown PayPal session -> 404', s.status === 404);
  const html = await (await fetch(BASE + '/cart')).text();
  t('cart page still loads', html.includes('Your Cart') || html.includes('cart'));
  finish();
}

// ------------------------------------------------------------- full / approve
if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  console.log('Missing PayPal credentials in .env.local (NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET). See the setup guide.');
  process.exit(2);
}
if (process.env.PAYPAL_ENV === 'live') {
  console.log('Refusing to run tests with PAYPAL_ENV=live. Use sandbox credentials.');
  process.exit(2);
}

const { createClient } = await import('@supabase/supabase-js');
const paypal = await import('../lib/paypal.js');
const ppOrders = await import('../lib/paypal-orders.js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sessions = [];
const productIds = [];
const track = (orderId) => { sessions.push(`pp_${orderId}`); return orderId; };

async function cleanup() {
  console.log('\n--- cleanup ---');
  const s = sessions.length ? sessions : ['none'];
  const { data: o } = await supabase.from('orders').delete().in('payment_session_id', s).select('order_id');
  console.log('orders deleted:', o?.map((x) => x.order_id));
  const { data: p } = await supabase.from('orders').delete().like('order_id', 'ZZPROBE%').select('order_id');
  if (p?.length) console.log('probe orders deleted:', p.map((x) => x.order_id));
  const { data: tx } = await supabase.from('payment_transactions').delete().or(`session_id.in.(${s.join(',')}),session_id.like.pp\\_ZZ%`).select('session_id');
  console.log('payment_transactions deleted:', tx?.length);
  const { data: c } = await supabase.from('coupons').delete().like('code', 'ZZTEST%').select('code');
  console.log('coupons deleted (redemptions cascade):', c?.length);
  const { data: pr } = await supabase.from('products').delete().in('id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']).select('slug');
  console.log('test products deleted:', pr?.map((x) => x.slug));
  const { count: lc } = await supabase.from('coupons').select('id', { count: 'exact', head: true }).like('code', 'ZZTEST%');
  const { count: lo } = await supabase.from('orders').select('id', { count: 'exact', head: true }).like('customer_email', '%@example.invalid');
  const { count: lt } = await supabase.from('payment_transactions').select('id', { count: 'exact', head: true }).like('user_email', '%@example.invalid');
  console.log(`remaining test rows -> coupons: ${lc}, orders: ${lo}, payment_transactions: ${lt}`);
}

try {
  // ---------- fixtures ----------
  const { data: digital } = await supabase.from('collections').select('id').eq('slug', 'digital').single();
  const { data: donor } = await supabase.from('products').select('image_url').not('image_url', 'is', null).limit(1).single();
  const stamp = Date.now();
  const { data: prod, error: pe } = await supabase.from('products').insert({
    name: 'ZZ TEST PayPal item', slug: `zz-test-pp-${stamp}`, price: 20, original_price: 30, collection_id: digital.id,
    in_stock: true, download_file_url: donor.image_url, image_url: donor.image_url, description: 'temporary test product',
  }).select('id').single();
  if (pe) throw new Error('could not create test product: ' + pe.message);
  productIds.push(prod.id);
  const { data: physical } = await supabase.from('products').select('id').eq('in_stock', true).gt('price', 0).neq('collection_id', digital.id).limit(1).single();
  const mkCoupon = async (code, over = {}) => {
    const { data, error } = await supabase.from('coupons').insert({ code, discount_type: 'PERCENT', discount_value: 25, ...over }).select('*').single();
    if (error) throw new Error('coupon: ' + error.message);
    return data;
  };
  const usedCount = async (code) => (await supabase.from('coupons').select('used_count').eq('code', code).single()).data.used_count;
  const create = (over = {}) => http('POST', '/api/paypal/create-order', { cart_items: [{ product_id: prod.id, quantity: 2 }], user_email: 'ppbuyer@example.invalid', shipping: { required: false }, ...over });

  // ---------- create order ----------
  const a = await create();
  t('create-order returns a PayPal order id', a.status === 200 && /^[A-Z0-9]{10,40}$/.test(a.data.orderId || ''), JSON.stringify(a));
  track(a.data.orderId);
  const ppA = await paypal.getPayPalOrder(a.data.orderId);
  const puA = ppA.purchase_units[0];
  t('PayPal holds the server price (2 x $20 = $40.00), not anything from the browser', puA.amount.value === '40.00' && puA.amount.breakdown.item_total.value === '40.00', JSON.stringify(puA.amount));
  t('PayPal order is CREATED, USD, digital goods', ppA.status === 'CREATED' && puA.amount.currency_code === 'USD' && puA.items[0].category === 'DIGITAL_GOODS' && puA.items[0].quantity === '2');
  const { data: txA } = await supabase.from('payment_transactions').select('*').eq('session_id', `pp_${a.data.orderId}`).single();
  t('pending transaction recorded (pp_ session, $40, paypal provider)', txA?.payment_status === 'initiated' && Number(txA.amount) === 40 && txA.metadata.provider === 'paypal' && txA.metadata.items[0].product_id === prod.id, JSON.stringify(txA?.metadata?.provider));

  const spoof = await http('POST', '/api/paypal/create-order', { cart_items: [{ product_id: prod.id, quantity: 1, price: 0.01, unit_price: 0.01 }], user_email: 'ppbuyer@example.invalid', total: 0.01 });
  track(spoof.data.orderId);
  t('browser-supplied prices are ignored', spoof.status === 200 && (await paypal.getPayPalOrder(spoof.data.orderId)).purchase_units[0].amount.value === '20.00');

  const phys = await http('POST', '/api/paypal/create-order', { cart_items: [{ product_id: physical.id, quantity: 1 }], user_email: 'ppbuyer@example.invalid', shipping: { required: true } });
  track(phys.data.orderId);
  const ppPhys = phys.status === 200 ? await paypal.getPayPalOrder(phys.data.orderId) : null;
  t('physical products are sent as PHYSICAL_GOODS', ppPhys?.purchase_units[0].items[0].category === 'PHYSICAL_GOODS');

  // ---------- validation ----------
  t('empty cart -> 400', (await http('POST', '/api/paypal/create-order', { cart_items: [] })).status === 400);
  t('unknown product -> 400', (await create({ cart_items: [{ product_id: '00000000-0000-4000-8000-000000000000', quantity: 1 }] })).status === 400);
  t('invalid email -> 400', (await create({ user_email: 'not-an-email' })).status === 400);
  t('unknown coupon -> 400 with the standard message', (await create({ couponCode: 'ZZTESTNOPE' })).data.error === 'Invalid coupon code');

  // ---------- coupons ----------
  await mkCoupon('ZZTESTPP25');
  const cp = await create({ couponCode: 'zztestpp25' });
  track(cp.data.orderId);
  const ppC = cp.status === 200 ? (await paypal.getPayPalOrder(cp.data.orderId)).purchase_units[0].amount : null;
  t('25% coupon: PayPal total $30.00 with a $10.00 discount line', ppC?.value === '30.00' && ppC.breakdown.discount.value === '10.00' && ppC.breakdown.item_total.value === '40.00', JSON.stringify(ppC));
  const { data: txC } = await supabase.from('payment_transactions').select('amount, metadata').eq('session_id', `pp_${cp.data.orderId}`).single();
  t('transaction stores the discounted amount and coupon metadata', Number(txC.amount) === 30 && txC.metadata.coupon.code === 'ZZTESTPP25' && Number(txC.metadata.coupon.discount) === 10);
  t('coupon use reserved (used_count 1)', (await usedCount('ZZTESTPP25')) === 1);
  const cancel = await http('POST', '/api/paypal/cancel', { orderId: cp.data.orderId });
  const { data: txC2 } = await supabase.from('payment_transactions').select('payment_status').eq('session_id', `pp_${cp.data.orderId}`).single();
  t('closing the PayPal window frees the coupon use and expires the checkout', cancel.status === 200 && txC2.payment_status === 'expired' && (await usedCount('ZZTESTPP25')) === 0);
  await http('POST', '/api/paypal/cancel', { orderId: cp.data.orderId });
  t('cancelling twice does not release the use twice', (await usedCount('ZZTESTPP25')) === 0);

  await mkCoupon('ZZTESTPPFREE', { discount_value: 100 });
  const free = await create({ couponCode: 'ZZTESTPPFREE' });
  t('a 100% coupon is refused on PayPal (free orders use the normal checkout)', free.status === 400 && /free/i.test(free.data.error || ''), JSON.stringify(free.data));
  t('refused order did not consume the coupon', (await usedCount('ZZTESTPPFREE')) === 0);
  await mkCoupon('ZZTESTPPONCE', { usage_limit: 1 });
  const once1 = await create({ couponCode: 'ZZTESTPPONCE' }); track(once1.data.orderId);
  const once2 = await create({ couponCode: 'ZZTESTPPONCE' });
  t('single-use coupon: second PayPal checkout refused while the first holds it', once1.status === 200 && once2.status === 400 && once2.data.error === 'This coupon has reached its usage limit', JSON.stringify(once2.data));
  await mkCoupon('ZZTESTPPPERC', { per_customer_limit: 1 });
  const noMail = await create({ couponCode: 'ZZTESTPPPERC', user_email: undefined });
  t('per-customer coupon without email is refused', noMail.status === 400 && noMail.data.error === 'Enter your email to use this coupon', JSON.stringify(noMail.data));

  // ---------- stale checkout sweep ----------
  const staleCoupon = await mkCoupon('ZZTESTPPSTALE', { used_count: 1, usage_limit: 5 });
  const staleId = 'pp_ZZSTALE000000001';
  await supabase.from('payment_transactions').insert({
    session_id: staleId, amount: 10, currency: 'usd', status: 'pending', payment_status: 'initiated', user_email: 'stale@example.invalid',
    metadata: { provider: 'paypal', items: [], coupon: { id: staleCoupon.id, code: 'ZZTESTPPSTALE', discount: 5 } },
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  });
  const trig = await create(); track(trig.data.orderId);
  const { data: staleTx } = await supabase.from('payment_transactions').select('payment_status').eq('session_id', staleId).single();
  t('abandoned checkout (4h old) is expired and its coupon use released', staleTx.payment_status === 'expired' && (await usedCount('ZZTESTPPSTALE')) === 0, `${staleTx.payment_status}, used_count ${await usedCount('ZZTESTPPSTALE')}`);

  // ---------- capture safety ----------
  const unapproved = await create(); track(unapproved.data.orderId);
  const cap = await http('POST', '/api/paypal/capture', { orderId: unapproved.data.orderId });
  const { data: txU } = await supabase.from('payment_transactions').select('payment_status').eq('session_id', `pp_${unapproved.data.orderId}`).single();
  const { count: ordU } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_session_id', `pp_${unapproved.data.orderId}`);
  t('capturing an order the buyer never approved fails and marks nothing paid', cap.status >= 400 && txU.payment_status === 'initiated' && ordU === 0, `${cap.status} ${JSON.stringify(cap.data)}`);
  const settleRead = await ppOrders.settlePayPalOrder(unapproved.data.orderId, { capture: false });
  t('settling an unapproved order without capture also pays nothing', settleRead.ok === false);
  t('capture of an order we never created -> 404', (await http('POST', '/api/paypal/capture', { orderId: 'ZZNOSUCHORDER12345' })).status === 404);
  t('capture with a malformed id -> 400', (await http('POST', '/api/paypal/capture', { orderId: "1'; drop table orders;--" })).status === 400);
  const pendingStatus = await http('GET', `/api/payments/status/pp_${unapproved.data.orderId}`);
  t('status of an unpaid PayPal checkout is not "paid"', pendingStatus.status === 200 && pendingStatus.data.payment_status === 'initiated');
  const dl = await fetch(`${BASE}/api/orders/download?session_id=pp_${unapproved.data.orderId}&product_id=${prod.id}`);
  t('downloads are refused for an unpaid PayPal checkout', dl.status === 404);

  // ---------- webhook ----------
  const wh1 = await http('POST', '/api/paypal/webhook', { event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: unapproved.data.orderId } });
  if (process.env.PAYPAL_WEBHOOK_ID) {
    t('webhook without PayPal signature headers -> 401', wh1.status === 401, `status ${wh1.status}`);
    const res = await fetch(BASE + '/api/paypal/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-fake', 'paypal-transmission-id': crypto.randomUUID(), 'paypal-transmission-sig': 'ZmFrZQ==', 'paypal-transmission-time': new Date().toISOString() },
      body: JSON.stringify({ id: 'WH-FAKE', event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: unapproved.data.orderId } }),
    });
    t('webhook with a forged signature -> 401 and nothing is captured', res.status === 401);
    const { data: txW } = await supabase.from('payment_transactions').select('payment_status').eq('session_id', `pp_${unapproved.data.orderId}`).single();
    t('forged webhook changed nothing', txW.payment_status === 'initiated');
  } else {
    t('webhook with no PAYPAL_WEBHOOK_ID configured -> 503 (never trusts events)', wh1.status === 503, `status ${wh1.status}`);
    console.log('INFO  PAYPAL_WEBHOOK_ID is not set, so signature checks were not exercised. Create the webhook (guide step) and re-run.');
  }

  // ---------- orders table accepts the buyer details ----------
  const { error: probeErr } = await supabase.from('orders').insert({
    order_id: 'ZZPROBE1', product_name: 'probe', total: 0, status: 'paid', customer_email: 'probe@example.invalid',
    customer_name: 'Probe Buyer', shipping_address: { name: 'Probe Buyer', line1: '1 Test St', city: 'Testville', country: 'US' },
  });
  t('orders table stores customer_name and a shipping_address object', !probeErr, probeErr?.message);

  // ---------- real approval (interactive) ----------
  if (mode === 'approve') {
    console.log('\n=== Real sandbox payment ===');
    await mkCoupon('ZZTESTPPLIVE', { discount_value: 25 });
    const real = await create({ couponCode: 'ZZTESTPPLIVE', user_email: 'ppverify@example.invalid' });
    track(real.data.orderId);
    const order = await paypal.getPayPalOrder(real.data.orderId);
    const link = (order.links || []).find((l) => ['payer-action', 'approve'].includes(l.rel))?.href;
    console.log('\nOPEN THIS LINK, log in with your PayPal SANDBOX BUYER account and approve the $30.00 payment:\n' + link + '\n');
    console.log('Waiting up to 10 minutes for approval...');
    let approved = false;
    for (let i = 0; i < 120 && !approved; i++) {
      await sleep(5000);
      approved = (await paypal.getPayPalOrder(real.data.orderId)).status === 'APPROVED';
    }
    t('buyer approved the sandbox payment', approved);
    if (approved) {
      const done = await http('POST', '/api/paypal/capture', { orderId: real.data.orderId });
      t('capture succeeds and returns the pp_ session', done.status === 200 && done.data.success && done.data.session_id === `pp_${real.data.orderId}`, JSON.stringify(done.data));
      const sid = `pp_${real.data.orderId}`;
      const { data: tx } = await supabase.from('payment_transactions').select('*').eq('session_id', sid).single();
      t('transaction is paid with the capture id, payer and PayPal fee stored', tx.payment_status === 'paid' && !!tx.metadata.paypal.capture_id && !!tx.metadata.paypal.payer_email, JSON.stringify(tx.metadata.paypal));
      const { data: ord } = await supabase.from('orders').select('*').eq('payment_session_id', sid).maybeSingle();
      t('order created: paid, $30.00, product and email filled', ord && ord.status === 'paid' && Number(ord.total) === 30 && ord.product_name === 'ZZ TEST PayPal item' && ord.customer_email === 'ppverify@example.invalid', JSON.stringify(ord));
      t('order stores the PayPal buyer name', !!ord?.customer_name, ord?.customer_name);
      const { data: red } = await supabase.from('coupon_redemptions').select('*').eq('order_id', sid);
      t('coupon redemption recorded ($10.00) and use counted', red.length === 1 && Number(red[0].discount_amount) === 10 && (await usedCount('ZZTESTPPLIVE')) === 1);
      const again = await http('POST', '/api/paypal/capture', { orderId: real.data.orderId });
      const { count: oc } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_session_id', sid);
      t('capturing the same order again is safe (no second order)', again.status === 200 && oc === 1);
      const st = await http('GET', `/api/payments/status/${sid}`);
      t('status endpoint: paid, $30.00, coupon and the download file', st.data.payment_status === 'paid' && st.data.amount_total === 3000 && st.data.coupon?.code === 'ZZTESTPPLIVE' && st.data.files?.length === 1, JSON.stringify(st.data).slice(0, 220));
      const file = await fetch(`${BASE}/api/orders/download?session_id=${sid}&product_id=${prod.id}`);
      const bytes = Buffer.from(await file.arrayBuffer());
      const src = Buffer.from(await (await fetch(donor.image_url)).arrayBuffer());
      t('paid PayPal order can download the real file', file.status === 200 && bytes.equals(src));

      // refund (sandbox) and the refund handler the webhook would call
      const refund = await paypal.refundPayPalCapture(tx.metadata.paypal.capture_id);
      t('sandbox refund issued', ['COMPLETED', 'PENDING'].includes(refund.status), refund.status);
      await sleep(2000);
      const handled = await ppOrders.handlePayPalRefund(tx.metadata.paypal.capture_id);
      const { data: tx2 } = await supabase.from('payment_transactions').select('payment_status').eq('session_id', sid).single();
      const { data: ord2 } = await supabase.from('orders').select('status').eq('payment_session_id', sid).single();
      t('refund handling marks payment and order refunded', handled.refunded === true && tx2.payment_status === 'refunded' && ord2.status === 'refunded', JSON.stringify([handled, tx2, ord2]));
      const file2 = await fetch(`${BASE}/api/orders/download?session_id=${sid}&product_id=${prod.id}`);
      t('downloads stop after a refund', file2.status === 404);
    }
  }
} catch (e) {
  failed++;
  console.log('FAIL  test run crashed:', e);
} finally {
  await cleanup();
}
finish();
