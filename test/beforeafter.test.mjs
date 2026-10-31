// Before & After studio: own photo or a natural-look model, makeup on the still photo, step-by-step looks,
// and a photo-set manifest that keeps the gallery hidden until complete sets exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYERS, LOOKS, choiceAfter, describeStep, loadManifest, FOUNDATION } from '../public/beforeafter-core.js';
import { CROSS_SELL_IDS } from './fixtures/beforeafter-routines.mjs';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const read = f => readFileSync(join(PUB, f), 'utf8');

test('the view is in the page, linked from the nav, and loads its script', () => {
  const html = read('index.html');
  assert.match(html, /<section id="view-beforeafter" class="view hidden">/);
  assert.match(html, /<button class="nav-link" data-view="beforeafter">Before &amp; After<\/button>/);
  assert.match(html, /<script type="module" src="beforeafter.js"><\/script>/);
});

test('photo choice: her own photo (upload or camera) or a natural-look model, nothing pre-picked', () => {
  const html = read('index.html');
  const sec = html.slice(html.indexOf('id="view-beforeafter"'), html.indexOf('id="view-face"'));
  assert.match(sec, /Use my photo<input type="file" id="baFile"/);
  assert.match(sec, /Take a photo<input type="file" id="baCam" accept="image\/\*" capture="user"/);
  assert.match(sec, /Pick a natural-look model/);
  assert.match(sec, /id="baModels"[^>]* hidden>/, 'model grid closed until she asks');
  assert.match(sec, /It is never uploaded/);
  assert.doesNotMatch(sec, /\bchecked\b|aria-pressed="true"/);
  assert.doesNotMatch(sec, /generated/i, 'no "generated" captions in the app');
  const js = read('beforeafter.js');
  assert.match(js, /aria-pressed="false" data-ba-model/);
  assert.match(js, /<option value="" disabled selected>Choose…<\/option><option value="none">None<\/option>/);
  assert.match(js, /\$\('baLook'\)\.innerHTML = `<option value="" disabled selected>Choose…<\/option>/);
  assert.doesNotMatch(js, /generated/i);
});

test('her photo never leaves the tab: no upload calls in the studio', () => {
  const js = read('beforeafter.js');
  assert.doesNotMatch(js, /method:\s*'POST'|FormData|sendBeacon|XMLHttpRequest/);
  const fetches = js.match(/fetch\(`?[^)]*/g) || [];
  assert.ok(fetches.every(f => /\/api\/shop\/routine\/|\/beforeafter\/manifest\.json/.test(f)), fetches.join(' | '));
});

test('the studio reuses the try-on geometry and does not touch the live try-on files', () => {
  const js = read('beforeafter.js');
  assert.match(js, /from '\.\/tryon-geometry\.js'/);
  assert.doesNotMatch(js, /from '\.\/tryon\.js'/);
});

test('every layer has colours, and amount sliders exist for colour layers', () => {
  for (const l of LAYERS) assert.ok(l.values.length >= 3, l.id);
  assert.equal(FOUNDATION.length, 11);
  assert.ok(LAYERS.find(l => l.id === 'foundation').extra.some(([v]) => v === 'match'));
});

test('step-by-step looks: 3 to 5 steps, each adds to the last, products only from real routines', () => {
  for (const look of LOOKS) {
    assert.ok(look.steps.length >= 3 && look.steps.length <= 5, look.id);
    assert.deepEqual(choiceAfter(look, 0), {}, 'skin prep adds no colour');
    const last = choiceAfter(look, look.steps.length - 1);
    for (let k = 0; k < look.steps.length; k++) for (const key of Object.keys(choiceAfter(look, k))) assert.ok(key in last);
    for (const s of look.steps) assert.ok(CROSS_SELL_IDS.includes(s.routine), `${look.id}/${s.name}: ${s.routine}`);
  }
  assert.deepEqual(describeStep(LOOKS[0].steps[3]), ['Lips: Dusty rose, creme']);
});

test('the routine ids the steps use exist on the server', () => {
  const src = readFileSync(join(PUB, '..', 'src', 'money', 'routes.js'), 'utf8');
  for (const id of CROSS_SELL_IDS) assert.match(src, new RegExp(`\\b${id}: \\[`));
});

test('manifest: shipped empty and disabled, so the photo gallery stays hidden', () => {
  const m = JSON.parse(read('beforeafter/manifest.json'));
  assert.equal(m.enabled, false);
  assert.deepEqual(loadManifest(m), { enabled: false, models: [], skipped: [] });
});

test('manifest: a complete set appears with paths under /beforeafter/<id>/; broken ones are skipped', () => {
  const good = { id: 'amara', name: 'Soft glam', before: 'before.webp', after: 'after.webp', steps: [{ name: 'Skin prep', image: 'step-1.webp', routine: 'skin' }, { name: 'Base', image: 'step-2.webp' }, { name: 'Eyes', image: 'step-3.webp', routine: 'eyes' }] };
  const r = loadManifest({ enabled: true, models: [good, { ...good, id: '../x' }, { ...good, id: 'b', after: '' }, { ...good, id: 'c', steps: good.steps.slice(0, 2) }, { ...good, id: 'd', steps: [...good.steps.slice(0, 2), { name: '', image: 'x.webp' }] }, { ...good, id: 'e', before: 'http://evil.example/x.png' }] });
  assert.equal(r.enabled, true);
  assert.equal(r.models.length, 1);
  assert.equal(r.models[0].before, '/beforeafter/amara/before.webp');
  assert.equal(r.models[0].steps[2].image, '/beforeafter/amara/step-3.webp');
  assert.equal(r.models[0].steps[1].routine, '');
  assert.deepEqual(r.skipped.map(s => s.id), ['../x', 'b', 'c', 'd', 'e']);
  assert.equal(loadManifest({ enabled: false, models: [good] }).enabled, false, 'the flag still gates it');
  assert.equal(loadManifest(null).enabled, false);
});
