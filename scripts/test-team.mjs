// Team feature test against a LOCAL production-mode server (default
// http://localhost:3100) using the real database. Usage:
//   node scripts/test-team.mjs smoke   (table not created yet)
//   node scripts/test-team.mjs         (full run, after team-migration.sql)
// Test members are named "ZZ Test ..." and deleted at the end; uploaded test
// files are removed from storage too.
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';
import fs from 'fs';

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
const admin = (m, p, body) => api(m, p, { token: adminToken, body });
const getAbout = async () => (await fetch(BASE + '/about')).text();
// The About page is cached; a write refreshes it, so poll briefly.
async function aboutEventually(pred, ms = 6000) {
  const end = Date.now() + ms;
  let html = '';
  while (Date.now() < end) { html = await getAbout(); if (pred(html)) return { ok: true, html }; await sleep(300); }
  return { ok: false, html };
}
const cardOf = (html, name) => {
  const start = html.indexOf(`data-testid="team-card-${name}"`);
  if (start < 0) return null;
  const next = html.indexOf('data-testid="team-card-', start + 10);
  return html.slice(start, next < 0 ? undefined : next);
};

const mode = process.argv[2] || 'full';

if (mode === 'smoke') {
  const list = await admin('GET', '/api/admin/team');
  t('admin list without table returns setupRequired (not 500)', list.status === 200 && list.data.setupRequired === true, JSON.stringify(list));
  const create = await admin('POST', '/api/admin/team', { name: 'ZZ Test', role: 'x' });
  t('create without table returns 503 setup notice (not 500)', create.status === 503 && create.data.setupRequired === true, JSON.stringify(create));
  const html = await getAbout();
  t('About page keeps its built-in text when the table is missing', html.includes('Our small team handles design') && !html.includes('Meet the Team'));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

const storageFiles = [];
const pathFromUrl = (url) => decodeURIComponent(new URL(url).pathname.split('/product-images/')[1] || '');

async function cleanup() {
  console.log('\n--- cleanup ---');
  const { data: gone, error } = await supabase.from('team_members').delete().like('name', 'ZZ Test%').select('name');
  console.log('team members deleted:', gone?.map((m) => m.name), error?.message || '');
  if (storageFiles.length) {
    const { data, error: se } = await supabase.storage.from('product-images').remove(storageFiles);
    console.log('storage files removed:', data?.map((f) => f.name), se?.message || '');
  }
  const { count: leftTest } = await supabase.from('team_members').select('id', { count: 'exact', head: true }).like('name', 'ZZ Test%');
  const { count: total } = await supabase.from('team_members').select('id', { count: 'exact', head: true });
  console.log(`remaining -> ZZ Test rows: ${leftTest}, total team_members rows: ${total}`);
}

try {
  // ---------- baseline ----------
  const base = await admin('GET', '/api/admin/team');
  t('admin list works', base.status === 200 && Array.isArray(base.data.members) && !base.data.setupRequired, JSON.stringify(base).slice(0, 200));
  const baselineIds = base.data.members.map((m) => m.id);
  console.log(`INFO  existing members before test: ${baselineIds.length} (no seed: the About page had no team list)`);

  // ---------- auth ----------
  const fakeId = '00000000-0000-4000-8000-000000000000';
  for (const [label, m, p, body] of [
    ['GET list', 'GET', '/api/admin/team'],
    ['POST create', 'POST', '/api/admin/team', { name: 'ZZ Test anon', role: 'x' }],
    ['PUT reorder', 'PUT', '/api/admin/team', { ids: [fakeId] }],
    ['PUT member', 'PUT', `/api/admin/team/${fakeId}`, { toggleOnly: true, isVisible: false }],
    ['DELETE member', 'DELETE', `/api/admin/team/${fakeId}`],
  ]) {
    const anon = await api(m, p, { body });
    const cust = await api(m, p, { token: userToken, body });
    t(`${label}: anonymous blocked (401/403), customer 403`, [401, 403].includes(anon.status) && cust.status === 403, `anon ${anon.status}, customer ${cust.status}`);
  }

  // ---------- input validation ----------
  const bad = (body) => admin('POST', '/api/admin/team', body);
  t('empty name -> 400', (await bad({ name: '  ', role: 'Designer' })).status === 400);
  t('missing role -> 400', (await bad({ name: 'ZZ Test NoRole' })).status === 400);
  t('javascript: photo URL -> 400', (await bad({ name: 'ZZ Test JS', role: 'x', photoUrl: 'javascript:alert(1)' })).status === 400);
  t('data: photo URL -> 400', (await bad({ name: 'ZZ Test Data', role: 'x', photoUrl: 'data:text/html,<script>1</script>' })).status === 400);
  t('name over 80 chars -> 400', (await bad({ name: 'ZZ Test ' + 'a'.repeat(80), role: 'x' })).status === 400);
  t('bio over 500 chars -> 400', (await bad({ name: 'ZZ Test Bio', role: 'x', bio: 'a'.repeat(501) })).status === 400);
  t('badge over 40 chars -> 400', (await bad({ name: 'ZZ Test Badge', role: 'x', badge: 'a'.repeat(41) })).status === 400);

  // ---------- add ----------
  const A = await admin('POST', '/api/admin/team', { name: 'ZZ Test Alpha', role: 'Lead Artist', bio: 'Paints pets.', badge: '🖌️ Art & Design', avatar: '🎨', gradient: 'not-a-colour' });
  t('add member (invalid gradient falls back to purple)', A.status === 201 && A.data.member.gradient === 'purple' && A.data.member.is_visible === true, JSON.stringify(A.data));
  const B = await admin('POST', '/api/admin/team', { name: 'ZZ Test Bravo', role: 'Support', gradient: 'blue' });
  const C = await admin('POST', '/api/admin/team', { name: 'ZZ Test Charlie', role: 'Ops', gradient: 'green', badge: '', bio: '' });
  t('new members go to the end (sort_order increases)', B.data.member.sort_order === A.data.member.sort_order + 1 && C.data.member.sort_order === B.data.member.sort_order + 1, `${A.data.member.sort_order}/${B.data.member.sort_order}/${C.data.member.sort_order}`);
  t('default avatar applied when none given', B.data.member.avatar === '🙂');
  const idA = A.data.member.id, idB = B.data.member.id, idC = C.data.member.id;

  const shown = await aboutEventually((h) => h.includes('ZZ Test Alpha'));
  t('member appears on the About page right away', shown.ok);
  t('section is titled "Meet the Team" once members exist', shown.html.includes('Meet the Team') && !shown.html.includes('>Our Team<'));
  t('other About content untouched (mission cards, metadata)', shown.html.includes('Our Mission') && shown.html.includes('Quality Promise') && shown.html.includes('About Petnic Studio - Our Story'));
  const cardA = cardOf(shown.html, 'ZZ Test Alpha');
  t('card shows role, bio and badge', cardA && cardA.includes('Lead Artist') && cardA.includes('Paints pets.') && cardA.includes('Art &amp; Design'));
  const cardC = cardOf(shown.html, 'ZZ Test Charlie');
  t('no empty bio/badge boxes for a member without them', cardC && !cardC.includes('whitespace-pre-line') && !cardC.includes('px-3 py-1'));
  t('emoji avatar on the gradient is used when there is no photo', cardA.includes('from-purple-400') && cardA.includes('🎨') && !cardA.includes('<img'));

  // ---------- HTML in text is escaped ----------
  const X = await admin('PUT', `/api/admin/team/${idB}`, { name: 'ZZ Test Bravo', role: 'Support', bio: '<script>alert(1)</script><b>bold</b>', gradient: 'blue' });
  t('edit saves a bio containing HTML', X.status === 200);
  const esc = await aboutEventually((h) => h.includes('&lt;script&gt;'));
  t('HTML in a bio is escaped on the page (no live <script>/<b>)', esc.ok && !esc.html.includes('<script>alert(1)') && !esc.html.includes('<b>bold</b>'));

  // ---------- edit: name, photo, emptying bio/badge ----------
  const E = await admin('PUT', `/api/admin/team/${idA}`, { name: 'ZZ Test Alpha Renamed', role: 'Lead Artist', bio: '', badge: '', photoUrl: 'https://example.com/zz-test-photo.jpg', gradient: 'pink', avatar: '🎨' });
  t('edit name/photo/empty bio+badge saved', E.status === 200 && E.data.member.name === 'ZZ Test Alpha Renamed' && E.data.member.bio === null && E.data.member.badge === null && E.data.member.photo_url === 'https://example.com/zz-test-photo.jpg', JSON.stringify(E.data));
  const ed = await aboutEventually((h) => h.includes('ZZ Test Alpha Renamed'));
  const cardE = cardOf(ed.html, 'ZZ Test Alpha Renamed');
  t('renamed member shows photo (lazy, 80x80) and no empty boxes', ed.ok && cardE.includes('src="https://example.com/zz-test-photo.jpg"') && cardE.includes('loading="lazy"') && cardE.includes('width="80"') && !cardE.includes('whitespace-pre-line') && !cardE.includes('px-3 py-1'));
  t('old name no longer shown', !ed.html.includes('>ZZ Test Alpha<'));
  const noRole = await admin('PUT', `/api/admin/team/${idA}`, { name: 'ZZ Test Alpha Renamed', role: '' });
  t('edit with empty role -> 400', noRole.status === 400);

  // ---------- hide / show ----------
  const hide = await admin('PUT', `/api/admin/team/${idC}`, { toggleOnly: true, isVisible: false });
  t('hide member', hide.status === 200 && hide.data.member.is_visible === false);
  const hid = await aboutEventually((h) => !h.includes('ZZ Test Charlie'));
  t('hidden member disappears from About', hid.ok);
  const adminStillSees = (await admin('GET', '/api/admin/team')).data.members.some((m) => m.id === idC);
  t('hidden member still listed for the admin', adminStillSees);
  await admin('PUT', `/api/admin/team/${idC}`, { toggleOnly: true, isVisible: true });
  t('showing again brings it back', (await aboutEventually((h) => h.includes('ZZ Test Charlie'))).ok);

  // ---------- reorder ----------
  const order = async () => (await admin('GET', '/api/admin/team')).data.members.filter((m) => m.name.startsWith('ZZ Test')).map((m) => m.id);
  const re = await admin('PUT', '/api/admin/team', { ids: [idC, idA, idB] });
  const after = await order();
  t('reorder persists (C, A, B)', re.status === 200 && after.join() === [idC, idA, idB].join(), JSON.stringify(after));
  const reAbout = await aboutEventually((h) => h.indexOf('ZZ Test Charlie') > 0 && h.indexOf('ZZ Test Charlie') < h.indexOf('ZZ Test Alpha Renamed'));
  t('About page shows the new order', reAbout.ok);
  await admin('PUT', '/api/admin/team', { ids: [idA, idB, idC] });
  t('order restored (A, B, C)', (await order()).join() === [idA, idB, idC].join());
  t('reorder with a non-uuid -> 400', (await admin('PUT', '/api/admin/team', { ids: [idA, 'nope'] })).status === 400);
  t('reorder with duplicates -> 400', (await admin('PUT', '/api/admin/team', { ids: [idA, idA] })).status === 400);
  t('reorder with unknown id -> 404', (await admin('PUT', '/api/admin/team', { ids: [idA, fakeId] })).status === 404);
  t('reorder with empty list -> 400', (await admin('PUT', '/api/admin/team', { ids: [] })).status === 400);
  t('reorder with 101 ids -> 400', (await admin('PUT', '/api/admin/team', { ids: Array.from({ length: 101 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`) })).status === 400);
  t('PUT with invalid id -> 400', (await admin('PUT', '/api/admin/team/not-a-uuid', { toggleOnly: true, isVisible: true })).status === 400);
  t('PUT with unknown id -> 404', (await admin('PUT', `/api/admin/team/${fakeId}`, { toggleOnly: true, isVisible: true })).status === 404);
  t('DELETE with invalid id -> 400', (await admin('DELETE', '/api/admin/team/not-a-uuid')).status === 400);
  t('DELETE with unknown id -> 404', (await admin('DELETE', `/api/admin/team/${fakeId}`)).status === 404);

  // ---------- upload validation (opt-in strict mode) ----------
  const upload = async (bytes, name, type, purpose) => {
    const fd = new FormData();
    fd.append('file', new Blob([bytes], { type }), name);
    if (purpose) fd.append('purpose', purpose);
    const res = await fetch(BASE + '/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: fd });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  };
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const fakeText = await upload(Buffer.from('hello world, definitely not an image'), 'evil.png', 'image/png', 'team-photo');
  t('team-photo: a text file renamed .png is rejected by content', fakeText.status === 400 && /JPG, PNG or WebP/.test(fakeText.data.error), JSON.stringify(fakeText));
  const big = await upload(Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)]), 'big.png', 'image/png', 'team-photo');
  t('team-photo: over 5 MB rejected', big.status === 400 && /5 MB/.test(big.data.error), `${big.status} ${JSON.stringify(big.data)}`);
  const gif = await upload(Buffer.from('GIF89a\u0001\u0000\u0001\u0000'), 'a.gif', 'image/gif', 'team-photo');
  t('team-photo: GIF rejected', gif.status === 400);
  const ok = await upload(png, 'photo.png', 'image/png', 'team-photo');
  if (ok.data.url) storageFiles.push(pathFromUrl(ok.data.url));
  t('team-photo: a real PNG is accepted and returns a public URL', ok.status === 201 && /^https:\/\/.+\.png$/.test(ok.data.url || ''), JSON.stringify(ok));
  const anonUp = await fetch(BASE + '/api/upload', { method: 'POST', body: new FormData() });
  t('upload still requires admin', anonUp.status === 403 || anonUp.status === 401, `status ${anonUp.status}`);
  const legacy = await upload(Buffer.from('plain text product file'), 'guide.txt', 'text/plain');
  if (legacy.data.url) storageFiles.push(pathFromUrl(legacy.data.url));
  t('default uploads are unchanged (non-image product files still accepted)', legacy.status === 201 && !!legacy.data.url, JSON.stringify(legacy));

  // ---------- delete / empty states ----------
  t('delete Charlie', (await admin('DELETE', `/api/admin/team/${idC}`)).status === 200);
  t('deleted member disappears from About', (await aboutEventually((h) => !h.includes('ZZ Test Charlie'))).ok);
  await admin('PUT', `/api/admin/team/${idA}`, { toggleOnly: true, isVisible: false });
  await admin('PUT', `/api/admin/team/${idB}`, { toggleOnly: true, isVisible: false });
  const real = base.data.members.filter((m) => m.is_visible).length;
  if (real === 0) {
    const empty = await aboutEventually((h) => !h.includes('Meet the Team') && !h.includes('team-grid'));
    t('everyone hidden -> "Meet the Team" section gone, original text remains', empty.ok && empty.html.includes('Our small team handles design'));
  } else {
    console.log('INFO  skipped empty-state check because real visible members exist');
  }

  // ---------- originals untouched ----------
  const finalList = await admin('GET', '/api/admin/team');
  const originals = finalList.data.members.filter((m) => baselineIds.includes(m.id));
  t('original members untouched', originals.length === baselineIds.length);
} catch (e) {
  failed++;
  console.log('FAIL  test run crashed:', e);
} finally {
  await cleanup();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
