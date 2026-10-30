/** WO-001 regression tests: evaluate the actual Style Match route and drawer code in isolation.
 * src/server.js calls server.listen() on import, so the route branch is compiled from source
 * instead. Run with: node --test test/wo001-style-match.test.mjs (npm test runs jest, which
 * does not pick up .mjs files).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serverSource = readFileSync(new URL('../src/server.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const originalDesiIV = JSON.parse(readFileSync(new URL('./fixtures/wo001-desi-IV-baseline.json', import.meta.url), 'utf8'));
const types = ['I', 'II', 'III', 'IV', 'V', 'VI'];

function between(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start + startToken.length);
  assert.ok(start !== -1 && end > start, `Could not locate ${startToken}`);
  return source.slice(start, end);
}

// Compile only the route branch, preserving its real GUIDE_DATA and selection logic.
// This calls the code under test; it does not reimplement nearest-type matching.
const routeSource = between(serverSource, '  // POST /api/style-match/guide', '  // 404\n');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const guideRoute = new AsyncFunction('method', 'path', 'req', 'res', 'readBody', 'sendJSON', routeSource);
const guideIds = [...between(routeSource, '    const GUIDE_DATA = {', '\n    const guide = GUIDE_DATA[lookId];')
  .matchAll(/^      ([a-z][a-z0-9_]*): \{$/gm)].map(match => match[1]);

async function getGuide(lookId, fitzpatrick) {
  const body = { lookId, undertone: 'neutral' };
  if (fitzpatrick !== undefined) body.fitzpatrick = fitzpatrick;
  return guideRoute('POST', '/api/style-match/guide', { body }, {}, async req => req.body,
    (_res, status, data) => { assert.equal(status, 200); return data; });
}

const htmlEscape = value => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const drawerSource = between(appSource, 'function flattenStyleProduct(value) {', "\ndocument.addEventListener('DOMContentLoaded', bootWithTrending);");

function makeDrawer(type, responseFor) {
  const els = Object.fromEntries(['smGuideDrawer', 'smGuideTitle', 'smGuideSteps', 'smGuideTips', 'smFitzpatrick']
    .map(key => [key, { innerHTML: '', textContent: '', value: '', classList: { remove() {} } }]));
  els.smFitzpatrick.value = type ?? '';
  const document = { getElementById: id => els[id] ?? null };
  const api = async (_path, _method, body) => responseFor(body);
  const openStyleGuide = new Function('document', 'api', 'esc', `${drawerSource}\nreturn openStyleGuide;`)(
    document, api, htmlEscape);
  return { openStyleGuide, els };
}

test('WO-001: all 8 guides × I–VI + missing: product strings only, no [object Object]', async () => {
  assert.equal(guideIds.length, 8, 'Update expected guide count if the catalogue grows');
  let cases = 0;
  for (const lookId of guideIds) {
    for (const type of [...types, undefined]) {
      const result = await getGuide(lookId, type);
      const caseName = `${lookId} / ${type ?? 'missing'}`;
      assert.ok(result.steps?.length, `Missing steps: ${caseName}`);
      assert.ok(types.includes(result.fitzpatrickUsed), `Missing valid fitzpatrickUsed: ${caseName}`);
      assert.equal(result.fitzpatrick, type ?? 'IV', `Requested skin type changed: ${caseName}`);
      for (const step of result.steps) {
        for (const [key, value] of Object.entries(step.products)) {
          assert.equal(typeof value, 'string', `Non-string ${key}: ${caseName} / ${step.stepName}`);
          assert.ok(!value.includes('[object Object]'), `Object interpolation ${key}: ${caseName}`);
        }
        assert.ok(!Object.keys(step.products).some(key => [...types, 'all'].includes(key)),
          `Raw skin-type map leaked: ${caseName}`);
      }
      assert.ok(!JSON.stringify(result).includes('[object Object]'), `Invalid JSON output: ${caseName}`);
      // Exercise the actual drawer builder for every response.
      const { openStyleGuide, els } = makeDrawer(type, () => result);
      await openStyleGuide(lookId);
      assert.ok(!els.smGuideSteps.innerHTML.includes('[object Object]'), `Invalid drawer HTML: ${caseName}`);
      cases++;
    }
  }
  assert.equal(cases, 56);
});

test('WO-001: nearest-type fallback is deterministic and visibly identified', async () => {
  for (const [lookId, type, expected] of [
    ['k_beauty_seoul', 'IV', 'III'],
    ['west_african_glow', 'IV', 'V'],
    ['loc_journey', 'IV', 'V'],
    ['desi_baddie', 'I', 'III'],
    ['persian_queen', 'VI', 'IV'],
    ['rooibos_glow', 'II', 'IV'],
  ]) {
    const data = await getGuide(lookId, type);
    assert.equal(data.fitzpatrickUsed, expected, `${lookId}/${type}`);
    const { openStyleGuide, els } = makeDrawer(type, () => data);
    await openStyleGuide(lookId);
    assert.ok(els.smGuideSteps.innerHTML.includes(`Showing Type ${expected}, the closest to your Type ${type}.`));
  }
  const exact = await getGuide('desi_baddie', 'IV');
  const { openStyleGuide, els } = makeDrawer('IV', () => exact);
  await openStyleGuide('desi_baddie');
  assert.ok(!els.smGuideSteps.innerHTML.includes('closest to your'), 'Exact matches must not show fallback notice');
  // "Any" is not a selection: the drawer must say which type it assumed, never "closest to your".
  const anyCase = await getGuide('k_beauty_seoul', undefined);
  const any = makeDrawer('', () => anyCase);
  await any.openStyleGuide('k_beauty_seoul');
  assert.ok(any.els.smGuideSteps.innerHTML.includes('Shades shown for Type III. Pick your skin type above'));
  assert.ok(!any.els.smGuideSteps.innerHTML.includes('closest to your'));
});

test('WO-001: desi_baddie/IV is byte-identical except for the new metadata fields', async () => {
  const { fitzpatrickUsed, fitzpatrickAvailable, ...actual } = await getGuide('desi_baddie', 'IV');
  assert.deepEqual(fitzpatrickAvailable, ['III', 'IV', 'V']);
  assert.equal(fitzpatrickUsed, 'IV');
  assert.equal(JSON.stringify(actual), JSON.stringify(originalDesiIV));
});

test('WO-001: drawer defensively flattens nested product objects', async () => {
  const fake = {
    lookId: 'desi_baddie', fitzpatrick: 'IV', fitzpatrickUsed: 'III',
    steps: [{ zone: 'skin', stepName: 'Base', technique: 'Test',
      products: { foundation: { label: 'Sample', shades: ['A', 'B'] } } }], proTips: [],
  };
  const { openStyleGuide, els } = makeDrawer('IV', () => fake);
  await openStyleGuide('desi_baddie');
  assert.ok(els.smGuideSteps.innerHTML.includes('label: Sample; shades: A, B'));
  assert.ok(!els.smGuideSteps.innerHTML.includes('[object Object]'));
});
