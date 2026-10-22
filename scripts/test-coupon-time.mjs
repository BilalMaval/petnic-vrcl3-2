import assert from 'node:assert/strict';
import { ZONES, zonedToUtcIso, utcIsoToZoned } from '../lib/coupon-time.js';

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`ok - ${name}`); };

const cases = [
  ['2026-10-30', '00:01', 'America/New_York', '2026-10-30T04:01:00.000Z'],
  ['2026-11-02', '00:01', 'America/New_York', '2026-11-02T05:01:00.000Z'],
  ['2026-10-30', '23:59', 'America/Los_Angeles', '2026-10-31T06:59:00.000Z'],
  ['2026-11-02', '23:59', 'America/Los_Angeles', '2026-11-03T07:59:00.000Z'],
  ['2026-10-20', '00:01', 'Europe/London', '2026-10-19T23:01:00.000Z'],
  ['2026-10-27', '00:01', 'Europe/London', '2026-10-27T00:01:00.000Z'],
];
for (const [d, t, z, expected] of cases) {
  check(`${z} ${d} ${t} -> ${expected}`, () => assert.equal(zonedToUtcIso(d, t, z), expected));
}

for (const z of ZONES) {
  for (const [d, t] of [['2026-01-15', '00:01'], ['2026-07-15', '23:59'], ['2026-11-01', '12:30']]) {
    check(`round trip ${z.id} ${d} ${t}`, () => {
      const back = utcIsoToZoned(zonedToUtcIso(d, t, z.id), z.id);
      assert.deepEqual(back, { date: d, time: t });
    });
  }
}

check('unknown zone throws', () => assert.throws(() => zonedToUtcIso('2026-11-02', '00:01', 'Mars/Base')));
check('garbage date throws', () => assert.throws(() => zonedToUtcIso('nope', '00:01', 'UTC')));
check('empty date returns empty string', () => assert.equal(zonedToUtcIso('', '00:01', 'UTC'), ''));

console.log(`\n${passed} checks passed`);
