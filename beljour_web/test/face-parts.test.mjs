// Face part controls in the browser: same results as Python, region, alpha, no-op, caps, fold guard,
// coded refusals and the opt-in Previews section. Drawn meshes and pixels only.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { byteImage } from '../dist/js/engines/core/buffer.js';
import { faceFrame } from '../dist/js/engines/shape/geometry.js';
import * as P from '../dist/js/engines/shape/parts.js';
import { renderPreviews } from '../dist/js/screens/previews.js';
import { CONTROLS as SHAPE_CONTROLS } from '../dist/js/engines/shape/geometry.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { localPhoto } from './helpers/local-photo.mjs';

const vectors = JSON.parse(readFileSync(new URL('../../api/tests/goldens/face-parts.json', import.meta.url)));
const tol = vectors.float_tolerance;
const [W, H] = vectors.image;
const near = (a, b, label) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${label}: ${a}, expected ${b}`);
const front = vectors.faces.front;

function drawn(channels = 4) {
  const img = byteImage(W, H, channels);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * channels;
    img.data[i] = 60 + ((x >> 2) % 2) * 120 + (y % 7) * 3;
    img.data[i + 1] = 90 + ((y >> 2) % 2) * 100;
    img.data[i + 2] = (x * 3 + y * 5) % 251;
    if (channels === 4) img.data[i + 3] = y < 6 ? 0 : x < 5 ? 128 : 255;
  }
  return img;
}
function insideRing(plan, x, y) {
  return P.hullDistance(plan.region.hull, [x, y]) <= P.RING_FACTOR * plan.region.margin + 1;
}

test('the table and constants match Python', () => {
  assert.equal(vectors.format, 'beljour-face-parts/1');
  assert.equal(vectors.author, 'John Khan');
  assert.equal(vectors.version, P.VERSION);
  assert.deepEqual(JSON.parse(JSON.stringify(P.PART_SPEC)), vectors.spec);
  const c = vectors.constants;
  assert.deepEqual([P.RING_FACTOR, P.LAYOUT_FACTOR, P.CLEARANCE, P.MIN_MARGIN_IOD, P.MIN_PART_IOD, P.MAX_MOVE_IOD,
    P.APERTURE_CAP, P.BAND_SOFT, P.IDENTITY_MINIMUM, P.MIN_STRENGTH, P.GEOMETRY_TAU],
  [c.ring_factor, c.layout_factor, c.clearance, c.min_margin_iod, c.min_part_iod, c.max_move_iod,
    c.aperture_cap, c.band_soft, c.identity_minimum, c.min_strength, c.geometry_tau]);
  assert.deepEqual([...P.IDENTITY_IDS], c.identity_ids);
  assert.equal(P.CONTROLS.length, 14);
});

test('part regions match Python', () => {
  for (const r of vectors.regions) {
    const mesh = vectors.faces[r.mesh], core = P.INSTANCES.find(([p, s]) => p === r.part && s === r.side)[2];
    const region = P.partRegion(mesh, faceFrame(mesh), r.part, r.side, core);
    near(region.margin, r.margin, `${r.mesh} ${r.part} margin`);
    assert.equal(region.ring.length, r.ring.length);
    region.ring.forEach((p, i) => { near(p[0], r.ring[i][0], 'ring x'); near(p[1], r.ring[i][1], 'ring y'); });
  }
});

for (const [k, c] of vectors.cases.entries()) test(`case ${k}: ${c.mesh} ${Object.keys(c.values).join('+')} matches Python`, () => {
  const mesh = vectors.faces[c.mesh];
  let refused = null;
  try {
    const targets = P.targetMesh(mesh, c.values, c.strength);
    const moved = [];
    targets.forEach((p, i) => { if (p[0] !== mesh[i][0] || p[1] !== mesh[i][1]) moved.push([i, p[0], p[1]]); });
    assert.equal(moved.length, c.moved.length);
    moved.forEach((m, i) => { assert.equal(m[0], c.moved[i][0]); near(m[1], c.moved[i][1], 'x'); near(m[2], c.moved[i][2], 'y'); });
    const out = P.renderParts(byteImage(W, H, 3), mesh, c.values, { strength: c.strength, optedIn: c.opted_in });
    assert.equal(out.metrics.parts.length, c.guard.length);
    out.metrics.parts.forEach((row, i) => { assert.equal(row.part, c.guard[i][0]); near(row.guardScale, c.guard[i][2], 'guard'); });
    if (c.changed_pixels !== undefined) assert.equal(out.metrics.changedPixels, c.changed_pixels, 'changed pixel count');
  } catch (error) {
    if (!(error instanceof P.PartRefusal)) throw error;
    refused = error.code;
  }
  assert.equal(refused, c.refused);
});

test('rendered pixels are byte-identical to Python', () => {
  const img = byteImage(W, H, 3);  // the striped pattern of make_face_part_vectors.py
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    img.data[i] = 60 + ((x >> 2) % 2) * 120 + (y % 7) * 3;
    img.data[i + 1] = 90 + ((y >> 2) % 2) * 100;
    img.data[i + 2] = (x * 3 + y * 5) % 251;
  }
  assert.ok(vectors.pixels.length >= 5);
  for (const c of vectors.pixels) {
    const out = P.renderParts(img, front, c.values, { optedIn: true });
    assert.equal(out.metrics.changedPixels, c.changed_pixels, JSON.stringify(c.values));
    assert.equal(createHash('sha256').update(out.image.data).digest('hex'), c.sha256, JSON.stringify(c.values));
  }
});

test('changes stay inside the part ring and alpha is untouched', () => {
  const img = drawn(4);
  for (const id of ['nose_width', 'nose_tip', 'upper_lip', 'lip_corners', 'eye_size', 'brow_arch']) {
    const out = P.renderParts(img, front, { [id]: 100 }, { optedIn: true });
    let changed = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      assert.equal(out.image.data[i + 3], img.data[i + 3]);
      if (out.image.data[i] === img.data[i] && out.image.data[i + 1] === img.data[i + 1] && out.image.data[i + 2] === img.data[i + 2]) continue;
      changed++;
      assert.ok(out.plans.some((plan) => insideRing(plan, x, y)), `${id} changed (${x}, ${y}) outside its part`);
    }
    assert.ok(changed > 0, id);
    assert.ok(out.metrics.identitySimilarity >= P.IDENTITY_MINIMUM);
    assert.ok(out.metrics.minJacobian > 0.2);
  }
});

test('strength zero and neutral amounts return the original bytes', () => {
  const img = drawn(4);
  for (const [values, strength] of [[{ nose_width: 100, eye_size: 100 }, 0], [{ lip_fullness: 0 }, 1], [{}, 1]]) {
    const out = P.renderParts(img, front, values, { strength });
    assert.deepEqual(new Uint8Array(out.image.data), new Uint8Array(img.data));
    assert.equal(out.metrics.changedPixels, 0);
  }
});

test('eye opening and movement caps hold', () => {
  const out = P.renderParts(drawn(3), front, { eye_size: 100, eye_opening: 100 }, { optedIn: true });
  for (const side of ['right', 'left']) assert.ok(Math.abs(out.metrics.apertureChangePercent[side]) <= 12 + 1e-9);
  const all = Object.fromEntries(P.CONTROLS.map((c) => [c.id, 100]));
  const every = P.renderParts(drawn(3), front, all, { optedIn: true });
  assert.ok(every.metrics.maxMoveIodPercent <= P.MAX_MOVE_IOD * 100 + 1e-9);
});

test('the fold guard reduces a crowded edit and keeps it fold-free', () => {
  const out = P.renderParts(drawn(3), vectors.faces.crowded, { brow_height: -100, brow_arch: -100, brow_tail: -100 }, { optedIn: true });
  assert.ok(out.metrics.guardScale > 0 && out.metrics.guardScale < 1);
  assert.ok(out.metrics.minJacobian > 0.2 && out.metrics.minAreaRatio >= 0.2);
});

test('refusals are coded and keep the original', () => {
  const img = drawn(4), before = new Uint8Array(img.data);
  const code = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof P.PartRefusal); assert.equal(e.toJSON().reason_code, e.code); return e.code; } return null; };
  assert.equal(code(() => P.renderParts(img, front, { nose_width: 30 })), 'not_opted_in');
  assert.equal(code(() => P.renderParts(img, vectors.faces.touching, { brow_height: 50 }, { optedIn: true })), 'part_crowded');
  assert.equal(code(() => P.renderParts(img, vectors.faces.closed_eye, { eye_size: 50 }, { optedIn: true })), 'eye_closed');
  assert.equal(code(() => P.renderParts(img, front.map(([x, y]) => [x, y + 175]), { lip_fullness: 50 }, { optedIn: true })), 'part_outside_photo');
  assert.deepEqual(new Uint8Array(img.data), before);
  assert.throws(() => P.renderParts(img, front, { nose_size: 10 }, { optedIn: true }), /unknown or invalid/);
  assert.throws(() => P.renderParts(img, front, { nose_width: 101 }, { optedIn: true }), /unknown or invalid/);
});

test('Previews keeps face parts off until the person turns them on, then renders a labelled preview', async () => {
  const dom = installDOM(), oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('No network permitted'); };
  try {
    const p = localPhoto(), main = new Element('main');
    await renderPreviews(main, p.context, p.dependencies);
    assert.equal(main.querySelectorAll('input').length, SHAPE_CONTROLS.length);
    assert.equal(main.querySelector('#part-nose_width'), null);
    await buttonNamed(main, 'Turn on face part previews').click();
    assert.equal(buttonNamed(main, 'Turn on face part previews'), undefined);
    const sliders = main.querySelectorAll('input').filter((input) => input.id.startsWith('part-'));
    assert.equal(sliders.length, P.CONTROLS.length);
    assert.ok(sliders.every((s) => s.value === '0'));
    assert.match(main.textContent, /decision preview/);
    await buttonNamed(main, 'Show face part preview').click();
    assert.deepEqual(new Uint8Array(p.rendered.at(-1).image.data), new Uint8Array(p.image.data));
    const nose = main.querySelector('#part-nose_width'); nose.value = '60'; await nose.dispatch('change');
    await buttonNamed(main, 'Show face part preview').click();
    const last = p.rendered.at(-1);
    assert.notDeepEqual(new Uint8Array(last.image.data), new Uint8Array(p.image.data));
    assert.match(last.label, /Nose reshape decision preview/);
    assert.match(last.label, /simulation/);
    await buttonNamed(main, 'Reset face parts').click();
    assert.equal(nose.value, '0');
    assert.equal(p.context.redirected, undefined);
  } finally { dom.restore(); globalThis.fetch = oldFetch; }
});

test('a refusal on the Previews screen is shown in plain words', async () => {
  const dom = installDOM(); try {
    const p = localPhoto(), main = new Element('main');
    const closed = p.context.face.points.map((pt) => ({ ...pt }));
    closed[386] = { ...closed[374] };
    p.context.face = { ...p.context.face, points: closed };
    await renderPreviews(main, p.context, p.dependencies);
    await buttonNamed(main, 'Turn on face part previews').click();
    const eye = main.querySelector('#part-eye_size'); eye.value = '50'; await eye.dispatch('change');
    await buttonNamed(main, 'Show face part preview').click();
    assert.match(main.textContent, /This eye looks closed/);
    assert.match(main.textContent, /Your original is unchanged/);
    assert.equal(p.rendered.length, 0);
  } finally { dom.restore(); }
});
