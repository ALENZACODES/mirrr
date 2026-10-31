// Live try-on: the pure geometry and colour maths (the camera itself is proven in headless Chrome
// with a fake camera; see JUDGES.md). Also the view's rules: nothing pre-selected, camera only on tap,
// no frame upload, honest wig label.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIPS_OUTER, LIPS_INNER, EYE, toPixels, polygonArea, bbox, pointInPolygon, smoothClosed, smoothOpen,
  eyeOpenness, headPose, lashLine, lidPolygon, browPolygon, wigTransform, applyTransform, OneEuro,
  LandmarkSmoother, hexToRgb, rgbToLab, labToRgb, luma, blend, tintPixel, browPixel, maskedMeanL, wingTip, blushEllipse,
} from '../public/tryon-geometry.js';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

// A synthetic 478-point face: every point at the centre, then the parts we use placed like a real face.
function face({ eyeGap = 0.03, roll = 0 } = {}) {
  const L = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const put = (i, x, y) => { const c = Math.cos(roll), s = Math.sin(roll); const dx = x - 0.5, dy = y - 0.5; L[i] = { x: 0.5 + dx * c - dy * s, y: 0.5 + dx * s + dy * c, z: 0 }; };
  // lips: an ellipse, outer r=(0.08,0.04) at y=0.7, inner r=(0.06,0.01)
  LIPS_OUTER.forEach((i, k) => { const a = Math.PI - (2 * Math.PI * k) / LIPS_OUTER.length; put(i, 0.5 + 0.08 * Math.cos(a), 0.7 - 0.04 * Math.sin(a)); });
  LIPS_INNER.forEach((i, k) => { const a = Math.PI - (2 * Math.PI * k) / LIPS_INNER.length; put(i, 0.5 + 0.06 * Math.cos(a), 0.7 - 0.01 * Math.sin(a)); });
  for (const [side, cx] of [['right', 0.38], ['left', 0.62]]) {
    const e = EYE[side]; const dir = side === 'right' ? -1 : 1;
    e.upper.forEach((i, k) => { const u = k / (e.upper.length - 1); put(i, cx + dir * 0.05 * (1 - 2 * u), 0.42 - eyeGap * Math.sin(Math.PI * u)); });
    e.lower.forEach((i, k) => { const u = k / (e.lower.length - 1); put(i, cx + dir * 0.05 * (1 - 2 * u), 0.42 + eyeGap * 0.6 * Math.sin(Math.PI * u)); });
    put(e.top, cx, 0.42 - eyeGap); put(e.bottom, cx, 0.42 + eyeGap * 0.6);
  }
  [[70, 0.31, 0.34], [63, 0.34, 0.33], [105, 0.37, 0.325], [66, 0.40, 0.33], [107, 0.43, 0.335], [46, 0.31, 0.355], [53, 0.34, 0.35], [52, 0.37, 0.345], [65, 0.40, 0.35], [55, 0.43, 0.355]].forEach(([i, x, y]) => { put(i, x, y); });
  [[300, 0.69, 0.34], [293, 0.66, 0.33], [334, 0.63, 0.325], [296, 0.60, 0.33], [336, 0.57, 0.335], [276, 0.69, 0.355], [283, 0.66, 0.35], [282, 0.63, 0.345], [295, 0.60, 0.35], [285, 0.57, 0.355]].forEach(([i, x, y]) => { put(i, x, y); });
  put(234, 0.25, 0.5); put(454, 0.75, 0.5); put(1, 0.5, 0.55); put(10, 0.5, 0.2); put(152, 0.5, 0.85);
  put(205, 0.36, 0.58); put(123, 0.3, 0.52); put(425, 0.64, 0.58); put(352, 0.7, 0.52);
  return L;
}

test('toPixels scales normalised landmarks to the frame', () => {
  const L = face();
  const [p] = toPixels(L, [10], 640, 480);
  near(p[0], 320); near(p[1], 96);
});

test('lip polygon: outer encloses inner, mouth opening is excluded, bbox covers the lips', () => {
  const L = face(); const W = 1000, H = 1000;
  const outer = toPixels(L, LIPS_OUTER, W, H), inner = toPixels(L, LIPS_INNER, W, H);
  assert.ok(Math.abs(polygonArea(outer)) > Math.abs(polygonArea(inner)) * 3);
  near(Math.abs(polygonArea(outer)), Math.PI * 80 * 40, 400); // a 20-gon is close to the ellipse
  assert.ok(pointInPolygon([500, 730], outer), 'lower lip is inside the outer contour');
  assert.ok(!pointInPolygon([500, 730], inner), 'lower lip is outside the mouth opening');
  assert.ok(pointInPolygon([500, 700], inner), 'mouth centre is in the opening (left unpainted)');
  assert.ok(!pointInPolygon([500, 600], outer), 'nose area is not painted');
  const b = bbox(outer, 5); near(b.x, 415, 1); near(b.w, 170, 1);
});

test('smoothed curves pass through every landmark (no drift off the lip line)', () => {
  const pts = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const c = smoothClosed(pts);
  assert.equal(c.length, 4);
  c.forEach((s, i) => assert.deepEqual([s[4], s[5]], pts[(i + 1) % 4]));
  const o = smoothOpen(pts);
  assert.equal(o.length, 3); assert.deepEqual([o[2][4], o[2][5]], [0, 10]);
});

test('eye openness: open vs closed, and lashes hide below the threshold used by the view', () => {
  near(eyeOpenness(face({ eyeGap: 0.03 }), 'right'), 0.048 / 0.1, 1e-3);
  assert.ok(eyeOpenness(face({ eyeGap: 0.004 }), 'left') < 0.13);
  assert.match(readFileSync(join(PUB, 'tryon.js'), 'utf8'), /if \(open < 0\.13\) continue;/);
});

test('head pose: roll follows the eye line, yaw is 0 for a frontal face', () => {
  const p0 = headPose(face(), 1000, 1000); near(p0.roll, 0, 1e-9); near(p0.yaw, 0, 1e-9); near(p0.faceWidth, 500, 1e-6);
  const p1 = headPose(face({ roll: 0.2 }), 1000, 1000); near(p1.roll, 0.2, 1e-9);
});

test('lash line runs inner to outer with normals pointing up the lid', () => {
  const line = lashLine(face(), 'right', 1000, 1000);
  assert.equal(line.length, 9);
  assert.ok(line[0].p[0] > line[8].p[0], 'her right eye: inner corner is nearer the nose (larger x)');
  for (const { n } of line.slice(1, -1)) assert.ok(n[1] < 0, 'normal points up');
  const [base, tip] = wingTip(face(), 'right', 1000, 1000);
  assert.ok(tip[0] < base[0] && tip[1] < base[1], 'the wing flicks outward and up');
});

test('lid, brow and blush regions sit where they should', () => {
  const L = face(); const lid = lidPolygon(L, 'left', 1000, 1000);
  const lb = bbox(lid); assert.ok(lb.y + lb.h <= 421 && lb.y >= 330, 'lid is between the lash line and the brow');
  const brow = browPolygon(L, 'right', 1000, 1000); assert.equal(brow.length, 10);
  assert.ok(pointInPolygon([370, 337], brow));
  const bl = blushEllipse(L, 'left', 1000, 1000); assert.ok(bl.cx > 600 && bl.cy > 500 && bl.cy < 600 && bl.rx > bl.ry);
});

test('wig transform maps the cutout forehead and chin onto the user\'s, with scale and roll', () => {
  const m = wigTransform([100, 50], [100, 250], [300, 100], [300, 500]);
  assert.deepEqual(applyTransform(m, [100, 50]).map(Math.round), [300, 100]);
  assert.deepEqual(applyTransform(m, [100, 250]).map(Math.round), [300, 500]);
  const r = wigTransform([0, 0], [0, 100], [0, 0], [-100 * Math.sin(0.3), 100 * Math.cos(0.3)]);
  near(Math.atan2(r[1], r[0]), 0.3, 1e-9); near(Math.hypot(r[0], r[1]), 1, 1e-9);
  const y = wigTransform([0, 0], [0, 100], [0, 0], [0, 100], 1, 0.1);
  near(applyTransform(y, [0, 0])[0], -10, 1e-9); // a turned head slides the wig sideways
});

test('One Euro filter: still points stop jittering, fast moves are followed', () => {
  const f = new OneEuro({ minCutoff: 1, beta: 0.02 });
  let out = 0; let spread = 0;
  for (let i = 0; i < 60; i++) { const noisy = 100 + (i % 2 ? 1.5 : -1.5); out = f.filter(noisy, i / 30); if (i > 30) spread = Math.max(spread, Math.abs(out - 100)); }
  assert.ok(spread < 1.0, `jitter ${spread} reduced from 1.5`);
  const g = new OneEuro({ minCutoff: 1, beta: 0.05 }); let v = 0;
  for (let i = 0; i < 30; i++) v = g.filter(i * 20, i / 30);
  assert.ok(580 - v < 60, `lag ${580 - v}px on a fast move`);
  const s = new LandmarkSmoother({}, 640); const a = s.apply([{ x: 0.5, y: 0.5, z: 0 }], 0); assert.deepEqual([a[0].x, a[0].y], [0.5, 0.5]);
});

test('colour blends are the standard formulas', () => {
  assert.deepEqual(hexToRgb('#c0202a'), [192, 32, 42]); assert.deepEqual(hexToRgb('#fff'), [255, 255, 255]);
  near(luma(255, 255, 255), 255, 1e-9);
  near(blend.multiply(200, 255), 200); near(blend.multiply(200, 0), 0);
  near(blend.screen(0, 128), 128); near(blend.softLight(128, 128), 128, 0.6);
  const lab = rgbToLab(192, 32, 42); assert.deepEqual(labToRgb(...lab), [192, 32, 42]);
  near(rgbToLab(255, 255, 255)[0], 100, 1e-3);
});

test('lipstick keeps the lip\'s own light and texture, and finishes differ', () => {
  const red = [192, 32, 42]; const mean = 40;
  const bright = tintPixel(120, 80, 80, red, mean, 'creme'); const dark = tintPixel(60, 40, 40, red, mean, 'creme');
  assert.ok(luma(...bright) > luma(...dark) + 15, 'lit and shaded parts of the lip stay different');
  assert.ok(bright[0] > bright[1] * 2, 'it reads red');
  const deep = tintPixel(70, 45, 45, red, rgbToLab(70, 45, 45)[0], 'creme', 1, 1);
  assert.ok(luma(...deep) < luma(...red), 'on a deep lip the red reads deeper than the swatch, not neon');
  const matte = [tintPixel(120, 80, 80, red, mean, 'matte'), tintPixel(60, 40, 40, red, mean, 'matte')];
  assert.ok(luma(...matte[0]) - luma(...matte[1]) < luma(...bright) - luma(...dark), 'matte flattens shine');
  const hiG = tintPixel(170, 130, 130, red, mean, 'gloss'), hiC = tintPixel(170, 130, 130, red, mean, 'creme');
  assert.ok(luma(...hiG) > luma(...hiC), 'gloss turns highlights into shine');
  assert.deepEqual(tintPixel(10, 20, 30, red, mean, 'creme', 0), [10, 20, 30], 'outside the mask nothing changes');
  const half = tintPixel(100, 100, 100, red, mean, 'creme', 0.5), full = tintPixel(100, 100, 100, red, mean, 'creme', 1);
  assert.ok(Math.abs(half[0] - 100) < Math.abs(full[0] - 100), 'feathered edge is partial');
});

test('brow tint darkens hair more than skin and never lightens', () => {
  const tint = [59, 32, 22];
  const hair = browPixel(60, 45, 40, tint), skin = browPixel(160, 120, 100, tint);
  assert.ok(hair.every((v, i) => v <= [60, 45, 40][i]) && skin.every((v, i) => v <= [160, 120, 100][i]));
  assert.ok((60 - hair[0]) / 60 > (160 - skin[0]) / 160 - 0.05);
});

test('masked mean lightness uses only the masked pixels', () => {
  const d = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
  const m = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 0]);
  near(maskedMeanL(d, m, 2), 100, 1e-3);
});

test('view rules: camera only on tap, nothing pre-selected, nothing uploaded, honest wig label', () => {
  const js = readFileSync(join(PUB, 'tryon.js'), 'utf8'); const html = readFileSync(join(PUB, 'index.html'), 'utf8');
  assert.match(js, /<option value="" disabled selected>Choose…<\/option>/);
  assert.equal((js.match(/getUserMedia\(/g) || []).length, 1);
  assert.match(js, /\$\('toStart'\)\.addEventListener\('click', startCamera\)/);
  assert.doesNotMatch(js, /fetch\([^)]*(POST|toDataURL|toBlob)/);
  assert.doesNotMatch(js, /method: 'POST'/, 'no frame or photo is ever posted');
  assert.match(js, /Preview: placement follows your head; for an exact look see/);
  assert.match(html, /<button class="nav-link" data-view="tryon">Try it on \(live\)<\/button>/);
  assert.match(html, /<section id="view-tryon" class="view hidden">/);
  assert.equal((html.match(/data-tryon-open/g) || []).length, 4, 'home, Lips, Brow & Kohl and Wig Match each link to it');
  assert.match(html, /id="toSamples"/, 'judges without a camera get sample photos');
  assert.match(js, /useSample\(b\.dataset\.toSample\)/);
  assert.doesNotMatch(js, /aria-pressed="true"/, 'no sample is pre-selected');
  assert.match(html, /no frame or photo is uploaded/);
  for (const w of JSON.parse(js.match(/export const WIGS = (\[.*\]);/)[1])) assert.ok(existsSync(join(PUB, 'tryon', 'wigs', `${w.id}.webp`)), w.id);
});

test('wig affine puts the cutout eyes and chin exactly on hers', async () => {
  const { wigAffine: wa, applyTransform: ap } = await import('../public/tryon-geometry.js');
  const src = [[84, 200], [225, 213], [133, 380]]; const dst = [[300, 400], [480, 395], [390, 640]];
  const m = wa(src, dst);
  src.forEach((s, i) => { const q = ap(m, s); assert.ok(Math.hypot(q[0] - dst[i][0], q[1] - dst[i][1]) < 1e-6); });
});

test('lip texture: lightness detail is zero on a flat patch and kept through the colour', async () => {
  const { lightnessDetail: ld, tintPixel: tp, luma: lu } = await import('../public/tryon-geometry.js');
  const flat = new Uint8ClampedArray(5 * 5 * 4).fill(120);
  assert.ok(Math.max(...ld(flat, 5, 5, 1).map(Math.abs)) < 1e-6);
  const red = [192, 32, 42];
  assert.ok(lu(...tp(120, 80, 80, red, 40, 'creme', 1, 0.9, 6)) > lu(...tp(120, 80, 80, red, 40, 'creme', 1, 0.9, -6)) + 5, 'a lip line stays visible under the colour');
});

test('wig mesh: rings map her face outline onto the model outline, and the browser file parses', async () => {
  const { wigMesh: wm, wigAffine: wa, applyTransform: ap } = await import('../public/tryon-geometry.js');
  const circle = (cx, cy, r, n = 36, rot = 0) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(2 * Math.PI * i / n + rot), cy + r * 1.3 * Math.sin(2 * Math.PI * i / n + rot)]);
  const src = circle(200, 250, 80), dst = circle(400, 300, 100);
  const tris = wm(src, dst);
  assert.equal(tris.length, 36 * 2 * 5);
  for (const { s, d } of tris.slice(0, 20)) { const m = wa(s, d); s.forEach((p, i) => { const q = ap(m, p); assert.ok(Math.hypot(q[0] - d[i][0], q[1] - d[i][1]) < 1e-6); }); }
  const { execFileSync } = await import('node:child_process');
  execFileSync(process.execPath, ['--check', join(PUB, 'tryon.js')]);
  const js = readFileSync(join(PUB, 'tryon.js'), 'utf8');
  for (const w of JSON.parse(js.match(/export const WIGS = (\[.*\]);/)[1])) assert.equal(w.oval?.length, 36, `${w.id} has the model's face outline`);
});
