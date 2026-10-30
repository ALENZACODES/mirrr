// Business entry points: bundles, routine cross-sell, brand/stylist interest forms, taste trends, and the honest pages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { bundles, productsByCategory, createBizStore } from '../src/money/biz.js';
import { productData } from '../src/money/store.js';
import { handleMoney } from '../src/money/routes.js';

const D = productData();
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const earn = readFileSync(new URL('../public/earn.js', import.meta.url), 'utf8');

async function call(method, path, body) {
  let status = 0, json = null;
  const res = {};
  const sendJSON = (_r, s, j) => { status = s; json = j; };
  const handled = await handleMoney(method, path, new URL(`http://x${path}`), {}, res, { sendJSON, readBody: async () => body, address: `t-${Math.random()}` });
  return { handled, status, json };
}

test('bundles are the real product lists, with honest totals and tagged links', () => {
  const b = bundles();
  assert.equal(b.length, Object.keys(D.sets).length);
  for (const x of b) {
    assert.equal(x.count, D.sets[x.id].products.length);
    const sum = D.sets[x.id].products.reduce((s, id) => { const p = D.products[id]; s[p.currency] = (s[p.currency] ?? 0) + p.price_min; return s; }, {});
    for (const [c, v] of Object.entries(sum)) assert.ok(Math.abs(x.totals[c] - v) < 0.01, `${x.id} ${c}`);
    for (const p of x.products) assert.match(p.shop_url, /utm_source=mirrr.*utm_content=bundle_/);
  }
});

test('the bundles endpoint serves every bundle, not a look lookup', async () => {
  const { status, json } = await call('GET', '/api/shop/bundles');
  assert.equal(status, 200);
  assert.equal(json.bundles.length, Object.keys(D.sets).length);
  assert.match(json.note, /No affiliate deal/);
});

test('routine cross-sell only returns products of the asked categories, from the catalogue', async () => {
  for (const [r, cats] of [['lips', ['lip']], ['brow_kohl', ['brow', 'liner']], ['complexion', ['foundation', 'concealer', 'setting']], ['skin', ['prep', 'setting']]]) {
    const { status, json } = await call('GET', `/api/shop/routine/${r}`);
    assert.equal(status, 200);
    assert.ok(json.products.length > 0, r);
    for (const p of json.products) { assert.ok(cats.includes(p.category)); assert.ok(D.products[p.id]); assert.match(p.shop_url, /utm_content=routine_/); }
  }
  const none = await call('GET', '/api/shop/routine/nails');
  assert.deepEqual(none.json.products, [], 'no invented nail products');
  assert.deepEqual(productsByCategory(['nail_polish']), []);
});

test('interest forms: consent must be ticked, email valid, kind known; removal answers the same either way', () => {
  const s = createBizStore({ dir: mkdtempSync(join(tmpdir(), 'biz-')) });
  assert.equal(s.joinInterest({ kind: 'brand', email: 'a@brand.com' }).ok, false);
  assert.equal(s.joinInterest({ kind: 'brand', email: 'nope', consent: true }).ok, false);
  assert.equal(s.joinInterest({ kind: 'sponsor', email: 'a@brand.com', consent: true }).ok, false);
  assert.equal(s.joinInterest({ kind: 'brand', email: 'a@brand.com', consent: true, type: 'black_owned' }).ok, true);
  assert.equal(s.joinInterest({ kind: 'brand', email: 'A@Brand.com', consent: true }).already, true);
  assert.equal(s.joinInterest({ kind: 'pro', email: 'b@salon.com', consent: true, type: 'hacker' }).ok, true);
  assert.deepEqual(s.interestCounts(), { brand: 1, pro: 1 });
  assert.deepEqual(s.leaveInterest('a@brand.com'), { ok: true });
  assert.deepEqual(s.leaveInterest('never@x.com'), { ok: true });
  assert.deepEqual(s.interestCounts(), { brand: 0, pro: 1 });
});

test('interest endpoint refuses without consent and counts sign-ups only as totals', async () => {
  assert.equal((await call('POST', '/api/interest', { kind: 'pro', email: 'c@salon.com' })).status, 400);
  const ok = await call('POST', '/api/interest', { kind: 'pro', email: `c${Date.now()}@salon.com`, consent: true });
  assert.equal(ok.status, 200);
  const st = await call('GET', '/api/stats');
  assert.ok(st.json.events.pro_interest >= 1);
  assert.ok(st.json.interest_lists.pro >= 1);
  assert.ok(!JSON.stringify(st.json).includes('@salon.com'), 'no emails in stats');
});

test('trends count only Qloo tags and top look ids from live runs, never inputs', () => {
  const s = createBizStore({ dir: mkdtempSync(join(tmpdir(), 'biz-')) });
  assert.equal(s.recordTrend({ meta: { provenance: { qloo_powered: false, used: [{ name: 'x' }] } } }), false);
  s.recordTrend({ entities: [{ input: 'Burna Boy' }], looks: [{ id: 'afrobeats_concert' }], meta: { provenance: { qloo_powered: true, used: [{ name: 'Afrobeats' }, { name: 'naija' }] } } });
  const t = s.trends();
  assert.equal(t.live_qloo_taste_runs, 1);
  assert.deepEqual(t.top_qloo_tags.map(x => x.name).sort(), ['afrobeats', 'naija']);
  assert.deepEqual(t.top_looks, [{ name: 'afrobeats_concert', count: 1 }]);
  assert.ok(!JSON.stringify(t).includes('Burna'));
});

test('pages are reachable from home, nav, footer and Help, with honest status and nothing pre-ticked', () => {
  for (const h of ['#money', '#shop', '#brands', '#pros', '#guides']) {
    assert.ok(html.includes(`class="earn-home-card" href="${h}"`), `home ${h}`);
    assert.ok(html.includes(`<a href="${h}">`), `footer ${h}`);
  }
  assert.match(html, /class="nav-link nav-earn" href="#money"/);
  assert.match(html, /<script src="earn\.js" defer><\/script>/);
  assert.ok(!/type="checkbox"[^>]*checked/.test(earn), 'no pre-ticked box');
  assert.ok(!/<option[^>]*selected/.test(earn), 'no pre-selected option');
  for (const s of ['Built today', 'Ready to switch on', 'Planned', 'available, not yet sold', 'No revenue has been earned yet', 'no affiliate deal'.replace('no', 'No')]) assert.ok(earn.includes(s), s);
  assert.ok(!/\b(ChatGPT|OpenAI|Gemini|Claude|Fenty|Sephora|Ulta)\b/.test(earn), 'no AI tool or competitor names');
  assert.ok(!/\b(men|man|beard)\b/i.test(earn), 'women-only copy');
});
