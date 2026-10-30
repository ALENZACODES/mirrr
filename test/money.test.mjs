import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { productData, shopForLook, withUtm, createStore, createWaitlistLimiter, normaliseEmail, normaliseRef, CLIENT_EVENTS } from '../src/money/store.js';
import { LOOKS } from '../src/look_engine.js';

const D = productData();
const STYLE_MATCH = ['west_african_glow', 'rooibos_glow', 'mehndi_bride', 'desi_baddie', 'persian_queen', 'hammam_goddess', 'k_beauty_seoul', 'loc_journey'];

test('every product carries its source page, price as shown, currency and checked_at', () => {
  const ps = Object.values(D.products);
  assert.ok(ps.length >= 40, `only ${ps.length} products`);
  for (const p of ps) {
    for (const k of ['id', 'brand', 'name', 'category', 'retailer', 'url', 'source_url', 'price_text', 'currency', 'checked_at']) assert.ok(p[k], `${p.id} missing ${k}`);
    assert.match(p.url, /^https:\/\/[a-z0-9.-]+\/products\/[a-z0-9-]+$/);
    assert.match(p.source_url, /^https:\/\//);
    assert.ok(['USD', 'CAD'].includes(p.currency), `${p.id} currency ${p.currency}`);
    assert.ok(Number.isFinite(p.price_min) && p.price_min > 0 && p.price_max >= p.price_min);
    assert.ok(p.price_text.includes(p.currency));
    assert.ok(!Number.isNaN(Date.parse(p.checked_at)));
    if (p.ownership) {
      assert.ok(p.ownership.label && p.ownership.detail);
      assert.ok(p.ownership.sources.length >= 1 && p.ownership.sources.every(s => /^https:\/\//.test(s)));
    }
  }
});

test('ownership labels stay within what the sources say', () => {
  const allowed = new Set(['Black-owned', 'Black-founded', 'Owned by women of colour', 'Indigenous-owned, Canadian', 'South Asian-founded']);
  for (const p of Object.values(D.products)) if (p.ownership) assert.ok(allowed.has(p.ownership.label), p.ownership.label);
});

test('sets reference real products and mapped looks exist', () => {
  const ids = new Set(LOOKS.map(l => l.id));
  for (const [look, set] of Object.entries(D.looks)) {
    assert.ok(D.sets[set], `${look} -> missing set ${set}`);
    assert.ok(ids.has(look) || STYLE_MATCH.includes(look), `unknown look ${look}`);
  }
  for (const s of Object.values(D.sets)) for (const id of s.products) assert.ok(D.products[id], `missing product ${id}`);
});

test('all 8 Style Match looks have named products', () => {
  for (const id of STYLE_MATCH) assert.ok(shopForLook(id)?.products.length >= 5, id);
});

test('shop links carry the UTM tags and nothing claims affiliate', () => {
  const s = shopForLook('hip_hop_glam');
  for (const p of s.products) {
    const u = new URL(p.shop_url);
    assert.equal(u.searchParams.get('utm_source'), 'mirrr');
    assert.equal(u.searchParams.get('utm_medium'), 'app');
    assert.equal(u.searchParams.get('utm_campaign'), 'qloo2026');
  }
  assert.ok(!/affiliate link/i.test(JSON.stringify(D.products)));
  assert.equal(new URL(withUtm('https://example.com/p?x=1')).searchParams.get('x'), '1');
});

test('unsourced looks get no products (honest fallback)', () => {
  assert.equal(shopForLook('not_a_look'), null);
});

test('waitlist validates email and dedupes; removal works and never logs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mirrr-wl-'));
  const s = createStore({ dir });
  const logs = []; const orig = console.log; console.log = (...a) => logs.push(a.join(' '));
  try {
    assert.equal(s.joinWaitlist('not-an-email', 'tryon').ok, false);
    assert.equal(s.joinWaitlist('a@b', 'tryon').ok, false);
    assert.equal(s.joinWaitlist(42).ok, false);
    assert.equal(s.joinWaitlist('Her.Name@Example.com', 'tryon').ok, true);
    assert.equal(s.joinWaitlist('her.name@example.com', 'leap').already, true);
    assert.equal(s._waitlistSize(), 1);
    const file = JSON.parse(readFileSync(join(dir, 'waitlist.json'), 'utf-8'));
    assert.equal(file.entries[0].email, 'her.name@example.com');
    assert.equal(file.entries[0].moment, 'tryon');
    assert.equal(s.leaveWaitlist('HER.NAME@example.com').ok, true);
    assert.equal(s._waitlistSize(), 0);
    assert.equal(s.leaveWaitlist('nobody@example.com').ok, true);
    assert.equal(s.stats().events.waitlist_signup, 1);
    assert.ok(!JSON.stringify(s.stats()).includes('example.com'));
  } finally { console.log = orig; }
  assert.ok(!logs.join('\n').includes('example.com'));
});

test('waitlist limiter allows 5 per window per address, then refuses', () => {
  let t = 0;
  const allow = createWaitlistLimiter({ max: 5, windowMs: 1000, now: () => t });
  for (let i = 0; i < 5; i++) assert.equal(allow('1.2.3.4'), true);
  assert.equal(allow('1.2.3.4'), false);
  assert.equal(allow('5.6.7.8'), true);
  t = 1001;
  assert.equal(allow('1.2.3.4'), true);
});

test('referral codes are counted as aggregates only, with a cap and format check', () => {
  const s = createStore({ dir: mkdtempSync(join(tmpdir(), 'mirrr-ref-')) });
  assert.equal(s.countRef('card-hiphopglam'), true);
  assert.equal(s.countRef('CARD-HIPHOPGLAM'), true);
  assert.equal(s.countRef('<script>'), false);
  assert.equal(s.countRef('x'.repeat(40)), false);
  const st = s.stats();
  assert.deepEqual(st.top_referral_codes, [{ code: 'card-hiphopglam', landings: 2 }]);
  assert.equal(st.events.ref_landing, 2);
  assert.equal(normaliseRef('ok-code'), 'ok-code');
  assert.equal(normaliseEmail(' A@B.CO '), 'a@b.co');
});

test('stats shape: counters for every event, no personal fields', () => {
  const s = createStore({ dir: mkdtempSync(join(tmpdir(), 'mirrr-st-')) });
  for (const e of CLIENT_EVENTS) assert.equal(s.count(e), true);
  assert.equal(s.count('made_up'), false);
  const st = s.stats();
  assert.deepEqual(Object.keys(st).sort(), ['counting_since', 'events', 'privacy', 'storage', 'top_referral_codes', 'waitlist']);
  for (const e of ['taste_run', 'tryon_complete', 'plan_save', 'leap_result', 'share', 'product_click', 'waitlist_signup', 'ref_landing']) assert.equal(typeof st.events[e], 'number');
  assert.deepEqual(Object.keys(st.waitlist), ['on_list']);
  s._flush();
  assert.ok(readdirSync(s.dir).includes('counters.json'));
});
