// Closed-mouth expressions in the browser: same targets, guard scales, refusals and output bytes
// as Python on every shared vector, and the Previews section. Drawn meshes and pixels only.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { byteImage } from '../dist/js/engines/core/buffer.js';
import * as X from '../dist/js/engines/shape/expressions.js';
import { PartRefusal } from '../dist/js/engines/shape/parts.js';
import { renderPreviews } from '../dist/js/screens/previews.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { localPhoto } from './helpers/local-photo.mjs';

const vectors = JSON.parse(readFileSync(new URL('../../api/tests/goldens/expressions.json', import.meta.url)));
const [W, H] = vectors.image, tol = vectors.float_tolerance;
const near = (a, b, what) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${what}: ${a} vs ${b}`);
function pattern() {  // the striped pattern of make_face_part_vectors.py
  const img = byteImage(W, H, 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    img.data[i] = 60 + ((x >> 2) % 2) * 120 + (y % 7) * 3; img.data[i + 1] = 90 + ((y >> 2) % 2) * 100; img.data[i + 2] = (x * 3 + y * 5) % 251;
  }
  return img;
}

test('the table and constants match Python', () => {
  assert.equal(vectors.version, X.VERSION);
  assert.deepEqual(JSON.parse(JSON.stringify(X.EXPRESSIONS)), vectors.table.expressions);
  assert.equal(X.LABEL, vectors.table.label);
  assert.deepEqual([X.OPEN_MOUTH_RATIO, X.GAP_TOLERANCE], [vectors.constants.open_mouth_ratio, vectors.constants.gap_tolerance]);
});

test('every expression case matches Python, down to the output bytes', () => {
  const img = pattern();
  assert.ok(vectors.cases.some((c) => c.refused === 'mouth_open'));
  for (const [k, c] of vectors.cases.entries()) {
    let out = null, refused = null;
    try { out = X.renderExpression(img, vectors.faces[c.mesh], c.expression, { amount: c.amount, strength: c.strength }); }
    catch (error) { if (!(error instanceof X.ExpressionRefusal || error instanceof PartRefusal)) throw error; refused = error.code; }
    assert.equal(refused, c.refused, `case ${k}`);
    if (!out) continue;
    const mesh = vectors.faces[c.mesh], moved = [];
    out.targets.forEach((p, i) => { if (p[0] !== mesh[i][0] || p[1] !== mesh[i][1]) moved.push([i, p[0], p[1]]); });
    assert.equal(moved.length, c.moved.length, `case ${k} moved`);
    moved.forEach((m, i) => { assert.equal(m[0], c.moved[i][0]); near(m[1], c.moved[i][1], 'x'); near(m[2], c.moved[i][2], 'y'); });
    out.metrics.parts.forEach((row, i) => { assert.equal(row.part, c.guard[i][0]); near(row.guardScale, c.guard[i][2], 'guard'); });
    assert.equal(out.metrics.changedPixels, c.changed_pixels);
    assert.equal(createHash('sha256').update(out.image.data).digest('hex'), c.sha256, `case ${k} bytes`);
    assert.deepEqual(out.labels.slice(1), [X.LABEL]);
  }
});

test('unknown expressions and bad amounts are refused', () => {
  assert.throws(() => X.valuesFor('wink'), (e) => e instanceof X.ExpressionRefusal && e.code === 'unknown_expression');
  assert.throws(() => X.valuesFor('neutral', 101), RangeError);
  assert.deepEqual(X.catalogue(8).map((e) => e.id), ['neutral', 'serious']);
});

test('the Previews screen shows each expression with its label and explains a refusal', async () => {
  const dom = installDOM();
  try {
    const p = localPhoto(), main = new Element('main');
    await renderPreviews(main, p.context, p.dependencies);
    assert.match(main.textContent, /nothing new is drawn: no teeth, no closed eyes/);
    await buttonNamed(main, 'Show surprise').click();
    const last = p.rendered.at(-1);
    assert.notDeepEqual(new Uint8Array(last.image.data), new Uint8Array(p.image.data));
    assert.match(last.label, /Expression simulation from one photo/);
    const open = localPhoto(), screen = new Element('main');
    const points = open.context.face.points.map((pt) => ({ ...pt }));
    points[14] = { ...points[14], y: points[14].y + 0.05 };
    open.context.face = { ...open.context.face, points };
    await renderPreviews(screen, open.context, open.dependencies);
    await buttonNamed(screen, 'Show neutral').click();
    assert.match(screen.textContent, /mouth in this photo is open\. Your original is unchanged/);
  } finally { dom.restore(); }
});
