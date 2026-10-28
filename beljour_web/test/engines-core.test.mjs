// R3 E04 TypeScript core: buffers, colour, filters, masks, pyramids, blending.
// Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";

import * as B from "../dist/js/engines/core/buffer.js";
import * as C from "../dist/js/engines/core/colour.js";
import * as F from "../dist/js/engines/core/filters.js";
import * as M from "../dist/js/engines/core/mask.js";
import * as P from "../dist/js/engines/core/pyramid.js";
import * as L from "../dist/js/engines/core/blend.js";
import * as core from "../dist/js/engines/core/index.js";

let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const plane = (w, h, f) => { const m = B.floatImage(w, h, 1, true); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m.data[y * w + x] = f(x, y); return m; };
const bytes = (w, h, c, f) => { const img = B.byteImage(w, h, c); for (let i = 0; i < img.data.length; i++) img.data[i] = f(i); return img; };
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

test("index re-exports every core module", () => {
  for (const name of ["blend", "buffer", "colour", "filters", "mask", "pyramid"]) assert.equal(typeof core[name], "object", name);
});

test("round half to even matches NumPy rint", () => {
  assert.deepEqual([0.5, 1.5, 2.5, -0.5, -1.5, 2.4, 2.6].map(B.roundHalfEven), [0, 2, 2, -0, -2, 2, 3]);
});

test("decode and encode round-trip every byte", () => {
  const img = bytes(256, 1, 3, (i) => Math.floor(i / 3));
  assert.deepEqual(Array.from(B.encode(B.decode(img)).data), Array.from(img.data));
  close(B.SRGB_TO_LINEAR[255], 1);
  close(B.SRGB_TO_LINEAR[10], 10 / 255 / 12.92);
  assert.throws(() => B.encode({ width: 1, height: 1, channels: 3, data: new Float64Array([NaN, 0, 0]) }), RangeError);
});

test("RGBA import and export", () => {
  const rgba = B.fromRGBA({ width: 2, height: 1, data: new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8]) });
  assert.equal(rgba.channels, 4);
  const rgb = { width: 1, height: 1, channels: 3, data: new Uint8Array([9, 8, 7]) };
  assert.deepEqual(Array.from(B.toRGBA(rgb)), [9, 8, 7, 255]);
  assert.throws(() => B.fromRGBA({ width: 2, height: 2, data: new Uint8ClampedArray(3) }), RangeError);
  assert.throws(() => B.floatImage(0, 3), RangeError);
});

test("remap: identity, linear light midpoint and premultiplied alpha", () => {
  const img = bytes(5, 4, 3, () => Math.floor(rand() * 256));
  const { mapX, mapY } = B.identityMaps(5, 4);
  assert.deepEqual(Array.from(B.remap(img, mapX, mapY).data), Array.from(img.data));
  const pair = { width: 2, height: 1, channels: 3, data: new Uint8Array([0, 0, 0, 255, 255, 255]) };
  const half = { width: 1, height: 1, channels: 1, data: new Float64Array([0.5]) };
  const zero = { width: 1, height: 1, channels: 1, data: new Float64Array([0]) };
  assert.equal(B.remap(pair, half, zero).data[0], 188);
  assert.equal(B.remap(pair, half, zero, { linearLight: false }).data[0], 128);
  const rgba = { width: 2, height: 1, channels: 4, data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 0]) };
  assert.deepEqual(Array.from(B.remap(rgba, half, zero).data), [255, 0, 0, 128]);
  const flat = bytes(4, 4, 3, () => 200);
  const id = B.identityMaps(4, 4);
  const shifted = { ...id.mapX, data: id.mapX.data.map((v) => v - 0.5) };
  const edge = B.remap(flat, shifted, id.mapY, { border: "constant" });
  assert.ok(edge.data[0] < 200 && edge.data[6] === 200);
});

test("colour: CIEDE2000 published pairs and conversions", () => {
  const pairs = [[[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425], [[50, 0, 0], [50, -1, 2], 2.3669],
    [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792], [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1.0]];
  for (const [a, b, want] of pairs) close(C.ciede2000(a, b), want, 1e-4);
  assert.deepEqual(C.hexToRgb("#0055A4"), [0, 85, 164]);
  assert.equal(C.rgbToHex([0, 85, 164]), "#0055A4");
  const back = C.labToRgb(C.rgbToLab([25, 125, 205]));
  back.forEach((v, i) => close(v, [25, 125, 205][i], 0.01));
  assert.throws(() => C.hexToRgb("#12345"), RangeError);
  assert.throws(() => C.srgbDecode(1.2), RangeError);
  assert.throws(() => C.ciede2000([1, 2, 3], [1, 2, 3], 0), RangeError);
});

test("colour: OKLab reference values and mixing", () => {
  const red = C.rgbToOklab([255, 0, 0]);
  [0.62796, 0.22486, 0.12585].forEach((v, i) => close(red[i], v, 1e-4));
  close(C.rgbToOklab([255, 255, 255])[0], 1, 1e-6);
  C.mixOklab([10, 20, 200], [240, 200, 10], 0).forEach((v, i) => close(v, [10, 20, 200][i], 1e-3));
  assert.throws(() => C.mixOklab([0, 0, 0], [1, 1, 1], 2), RangeError);
  const lab = C.pixelLab(25, 125, 205);
  C.rgbToLab([25, 125, 205]).forEach((v, i) => close(lab[i], v, 1e-9));
});

test("filters: box mean, reflect101, gradient, quantile", () => {
  assert.deepEqual([-3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((i) => F.reflect101(i, 4)), [3, 2, 1, 0, 1, 2, 3, 2, 1, 0]);
  const img = plane(7, 6, () => rand());
  const r = 2, out = F.boxMean(img, r);
  for (const [x, y] of [[0, 0], [3, 2], [6, 5]]) {
    let s = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      s += img.data[Math.min(Math.max(y + dy, 0), 5) * 7 + Math.min(Math.max(x + dx, 0), 6)];
    }
    close(out.data[y * 7 + x], s / 25, 1e-12);
  }
  const ramp = plane(5, 3, (x, y) => 2 * x + 3 * y);
  const [gx, gy] = F.gradient(ramp);
  assert.ok(gx.data.every((v) => v === 2) && gy.data.every((v) => v === 3));
  close(F.quantile([3, 1, 2, 4], 0.5), 2.5);
  close(F.quantile([5], 0.9), 5);
  assert.throws(() => F.quantile([], 0.5), RangeError);
  assert.throws(() => F.boxMean(img, 1.5), RangeError);
});

test("masks: shapes and combinations", () => {
  const rect = M.rectangle(10, 10, 2, 3, 7, 8);
  assert.equal(M.coverage(rect), 25 / 100);
  assert.deepEqual(M.boundingBox(rect), [2, 3, 7, 8]);
  assert.equal(M.boundingBox(M.emptyMask(3, 3)), null);
  const square = M.polygon(10, 10, [[2, 3], [7, 3], [7, 8], [2, 8]]);
  assert.deepEqual(Array.from(square.data), Array.from(rect.data));
  const halfEdge = M.polygon(6, 6, [[1.5, 1], [4, 1], [4, 4], [1.5, 4]], 4);
  assert.equal(halfEdge.data[2 * 6 + 1], 0.5);
  const star = Array.from({ length: 5 }, (_, k) => [16 + 14 * Math.cos(((90 + 144 * k) * Math.PI) / 180), 16 - 14 * Math.sin(((90 + 144 * k) * Math.PI) / 180)]);
  const s = M.polygon(32, 32, star, 4);
  assert.equal(s.data[16 * 32 + 16], 0, "even-odd leaves the star's centre empty");
  assert.equal(s.data[5 * 32 + 16], 1);
  const a = M.ellipse(9, 9, 4, 4, 3, 3), b = M.invert(a);
  assert.equal(M.coverage(M.union(a, b)), 1);
  assert.equal(M.coverage(M.intersection(a, b)), 0);
  assert.equal(M.coverage(M.subtract(a, a)), 0);
  assert.throws(() => M.union(a, M.emptyMask(3, 3)), RangeError);
  assert.throws(() => M.polygon(4, 4, [[0, 0], [1, 1]]), RangeError);
  assert.throws(() => M.ellipse(4, 4, 1, 1, 0, 1), RangeError);
});

test("distance transform is exact against brute force", () => {
  for (let trial = 0; trial < 40; trial++) {
    const w = 1 + Math.floor(rand() * 11), h = 1 + Math.floor(rand() * 11);
    const on = Array.from({ length: w * h }, () => rand() < 0.15);
    const got = M.squaredEdt(on, w, h);
    if (!on.some(Boolean)) { assert.ok(got.every((v) => v === -1)); continue; }
    for (let i = 0; i < w * h; i++) {
      let best = Infinity;
      on.forEach((v, j) => { if (v) best = Math.min(best, (i % w - j % w) ** 2 + (Math.floor(i / w) - Math.floor(j / w)) ** 2); });
      assert.equal(got[i], best);
    }
  }
});

test("dilate, erode and feather", () => {
  const dot = M.emptyMask(11, 11); dot.data[5 * 11 + 5] = 1;
  const disc = M.dilate(dot, 3);
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) assert.equal(disc.data[y * 11 + x], (x - 5) ** 2 + (y - 5) ** 2 <= 9 ? 1 : 0);
  const sq = M.rectangle(20, 20, 6, 6, 14, 14);
  assert.deepEqual(Array.from(M.erode(M.dilate(sq, 2), 2).data), Array.from(sq.data));
  const big = M.rectangle(24, 24, 6, 6, 18, 18);
  const inside = M.feather(big, 4, "inside");
  for (let i = 0; i < big.data.length; i++) if (!big.data[i]) assert.equal(inside.data[i], 0);
  assert.equal(inside.data[12 * 24 + 12], 1);
  const outside = M.feather(big, 4, "outside");
  assert.ok(outside.data[12 * 24 + 4] > 0);
  const centred = M.feather(big, 4, "centered");
  assert.ok(centred.data[12 * 24 + 6] > 0.5 && centred.data[12 * 24 + 5] < 0.5);
  assert.throws(() => M.feather(big, 2, "sideways"), RangeError);
  assert.throws(() => M.dilate(big, -1), RangeError);
});

test("guided filter: flat guide is a double box blur; edges are kept", () => {
  const src = plane(12, 10, () => rand());
  const flat = plane(12, 10, () => 0.4);
  const got = M.guidedFilter(flat, src, 2, 1e-3), want = F.boxMean(F.boxMean(src, 2), 2);
  got.data.forEach((v, i) => close(v, want.data[i], 1e-9));
  const w = 32, h = 32;
  const photo = bytes(w, h, 3, (i) => (Math.floor(i / 3) % w >= 16 ? 230 : 0));
  const coarse = plane(w, h, (x, y) => (x >= 16 + ((y * 7) % 5) - 2 ? 1 : 0));
  const refined = M.edgeAwareFeather(coarse, photo, 4, 1e-4), blurred = M.blur(coarse, 4);
  const column = (m, x) => { let s = 0; for (let y = 0; y < h; y++) s += m.data[y * w + x]; return s / h; };
  assert.ok(column(refined, 15) < 0.3 && column(refined, 16) > 0.7);
  assert.ok(column(blurred, 15) > 0.3 && column(blurred, 15) < 0.7);
  const band = M.edgeBand(M.rectangle(20, 20, 5, 5, 15, 15), 1);
  assert.equal(band[10 * 20 + 10], 0);
  assert.equal(band[10 * 20 + 5], 1);
  assert.throws(() => M.guidedFilter(flat, src, 0, 1e-3), RangeError);
});

test("pyramids collapse back exactly", () => {
  for (const [w, h, c] of [[23, 17, 1], [8, 8, 3], [5, 1, 1], [2, 31, 2]]) {
    const img = B.floatImage(w, h, c, true);
    img.data.forEach((_, i) => (img.data[i] = rand()));
    const back = P.collapse(P.laplacian(img, 5));
    back.data.forEach((v, i) => close(v, img.data[i], 1e-12));
  }
  const flat = B.floatImage(10, 13, 3, true); flat.data.fill(0.25);
  const small = P.down(flat);
  assert.deepEqual([small.width, small.height], [5, 7]);
  small.data.forEach((v) => close(v, 0.25));
  assert.equal(P.maxLevels(64, 64, 8), 4);
  assert.throws(() => P.up(small, 20, 13), RangeError);
});

test("blend modes follow the W3C formulas", () => {
  const px = (r, g, b) => [r, g, b];
  assert.deepEqual(L.modePixel("multiply", px(0.5, 0.2, 1), px(0.5, 0.8, 0)).map((v) => +v.toFixed(12)), [0.25, 0.16, 0]);
  assert.deepEqual(L.modePixel("color-dodge", px(0, 0.5, 0.5), px(1, 1, 0)), [0, 1, 0.5]);
  assert.deepEqual(L.modePixel("color-burn", px(1, 0.5, 0.5), px(0, 0, 1)), [1, 0, 0.5]);
  const base = px(0.2, 0.5, 0.7), top = px(0.9, 0.1, 0.3);
  close(L.lum(L.modePixel("color", base, top)), L.lum(base), 1e-12);
  close(L.lum(L.modePixel("luminosity", base, top)), L.lum(top), 1e-12);
  L.modePixel("soft-light", base, px(0.5, 0.5, 0.5)).forEach((v, i) => close(v, base[i], 1e-12));
  assert.throws(() => L.modePixel("glow", base, top), RangeError);
});

test("applyMode, alphaBlend and multiband blend", () => {
  const base = bytes(7, 6, 3, () => Math.floor(rand() * 256)), top = bytes(7, 6, 4, () => Math.floor(rand() * 256));
  assert.deepEqual(Array.from(L.applyMode(base, top, "multiply", { opacity: 0 }).data), Array.from(base.data));
  const left = M.rectangle(7, 6, 0, 0, 3, 6);
  const out = L.applyMode(base, top, "screen", { mask: left, space: "linear" });
  for (let y = 0; y < 6; y++) for (let x = 3; x < 7; x++) for (let c = 0; c < 3; c++) {
    assert.equal(out.data[(y * 7 + x) * 3 + c], base.data[(y * 7 + x) * 3 + c]);
  }
  const a = bytes(32, 32, 3, () => 70), b = bytes(32, 32, 3, () => 190);
  assert.deepEqual(Array.from(L.multibandBlend(a, b, M.fullMask(32, 32)).data), Array.from(b.data));
  assert.deepEqual(Array.from(L.alphaBlend(a, b, M.emptyMask(32, 32)).data), Array.from(a.data));
  assert.throws(() => L.applyMode(base, top, "multiply", { opacity: 2 }), RangeError);
});
