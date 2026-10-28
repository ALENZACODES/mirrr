// FX1 colour kernels in the browser: neutral ops, exact greys, scaling, the fallback, curves,
// the LUT (identity within 1e-6, exact on lattice points) and the position light.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as O from "../dist/js/filters/colour/ops.js";
import * as LUT from "../dist/js/filters/colour/lut.js";
import * as Sp from "../dist/js/filters/colour/space.js";
import * as C from "../dist/js/filters/colour/curves.js";
import * as L from "../dist/js/filters/light/position.js";
import * as GL from "../dist/js/filters/spatial/glow.js";
import * as E from "../dist/js/filters/runtime/engine.js";
import { catalogue } from "../dist/js/filters/recipe/registry.js";

const palette = (n = 300, seed = 7) => {
  let s = seed >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const out = [];
  for (let i = 0; i <= 16; i++) out.push(i / 16, i / 16, i / 16);
  for (let i = 0; i < n; i++) out.push(rnd(), rnd(), rnd());
  return Float64Array.from(out);
};
const worst = (a, b) => { let w = 0; for (let i = 0; i < a.length; i++) w = Math.max(w, Math.abs(a[i] - b[i])); return w; };
const run = (name, rgb, given = {}) => O.runOp(name, Float64Array.from(rgb), O.fullParams(O.op(name), given));

test("every colour op at its neutral values leaves colours within the OKLab round trip", () => {
  const rgb = palette();
  for (const [name, spec] of O.OPS) {
    if (spec.family !== "colour") continue;
    assert.ok(worst(run(name, rgb), rgb) <= 2e-6, name);
    assert.equal(O.isNeutral(name, O.fullParams(spec, {})), true, `${name} neutral`);
  }
  assert.equal(O.isNeutral("colour.exposure", { ev: 0.1 }), false);
  assert.equal(O.isNeutral("colour.contrast", { amount: 0, pivot: 0.3 }), true, "a fixed pivot alone does nothing");
});

test("greys stay exactly grey through every op that doesn't tint", () => {
  const greys = Float64Array.from({ length: 33 * 3 }, (_, i) => Math.floor(i / 3) / 32);
  for (const [name, given] of [["colour.contrast", { amount: 0.6 }], ["colour.saturation", { amount: 0.5 }], ["colour.fade", { amount: 0.7 }],
    ["colour.highlightRolloff", { amount: 1, chroma: -0.5 }], ["colour.tone", { shadows: 0.6 }], ["colour.vibrance", { amount: 0.7 }],
    ["colour.exposure", { ev: 0.4 }], ["colour.channelMixer", { matrix: [Sp.LUMA, Sp.LUMA, Sp.LUMA] }]]) {
    const out = run(name, greys, given);
    for (let i = 0; i < out.length; i += 3) assert.ok(out[i] === out[i + 1] && out[i + 1] === out[i + 2], `${name} at ${i / 3}`);
  }
  const lab = Sp.srgbToOklab(0.5, 0.5, 0.5, [0, 0, 0]);
  assert.equal(lab[1], 0); assert.equal(lab[2], 0);
});

test("white balance warms and keeps luminance; exposure is stops in linear light", () => {
  const rgb = [0.3, 0.5, 0.6];
  const warm = run("colour.whiteBalance", rgb, { temperature: 0.6 });
  assert.ok(warm[0] - warm[2] > rgb[0] - rgb[2]);
  const y = (c) => Sp.luminance(Sp.decode1(c[0]), Sp.decode1(c[1]), Sp.decode1(c[2]));
  assert.ok(Math.abs(y(warm) - y(rgb)) < 1e-9);
  const up = run("colour.exposure", rgb, { ev: 1 });
  assert.ok(Math.abs(Sp.decode1(up[1]) - 2 * Sp.decode1(rgb[1])) < 1e-12);
});

test("contrast keeps black, white and the pivot and never inverts", () => {
  for (const a of [-0.9, -0.2, 0.4, 0.9]) {
    assert.ok(Math.abs(O.contrastCurve(0, a, 0.6)) < 1e-12 && Math.abs(O.contrastCurve(1, a, 0.6) - 1) < 1e-12);
    assert.ok(Math.abs(O.contrastCurve(0.6, a, 0.6) - 0.6) < 1e-12);
    let prev = -1;
    for (let i = 0; i <= 400; i++) { const v = O.contrastCurve(i / 400, a, 0.6); assert.ok(v >= prev - 1e-12); prev = v; }
  }
});

test("band weights sum to one, peak at their centres and only two are ever on", () => {
  for (let h = 0; h < 360; h += 0.5) {
    const w = O.bandWeights(h);
    assert.ok(Math.abs(w.reduce((a, b) => a + b, 0) - 1) < 1e-12, `hue ${h}`);
    assert.ok(w.filter((x) => x > 0).length <= 2);
  }
  O.BAND_CENTRES.forEach((c, k) => assert.ok(Math.abs(O.bandWeights(c)[k] - 1) < 1e-12));
});

test("scaling rules and matrix scaling keep mono rows identical at full scale", () => {
  assert.deepEqual([0, 0.5, 1].map((s) => O.scaleFraction("linear", s)), [0, 0.5, 1]);
  assert.equal(O.scaleFraction("easeIn", 0.5), 0.25);
  assert.equal(O.scaleFraction("easeOut", 0.5), 0.75);
  assert.deepEqual([0, 0.01].map((s) => O.scaleFraction("step", s)), [0, 1]);
  assert.throws(() => O.scaleFraction("bounce", 0.5), /unknown scale/);
  const mono = [[0.3, 0.6, 0.1], [0.3, 0.6, 0.1], [0.3, 0.6, 0.1]];
  const full = O.scaleParams(O.op("colour.channelMixer"), { matrix: mono }, 1).matrix;
  assert.deepEqual(full[0], full[2]);
  const half = O.scaleParams(O.op("colour.contrast"), { amount: 0.4, pivot: 0.5 }, 0.5);
  assert.ok(Math.abs(half.amount - 0.2) < 1e-15); assert.equal(half.pivot, 0.5);
});

test("the missing-mask fallback zeroes skin-band hue turns and drops tints", () => {
  const kept = O.withoutSkinHue("colour.hsl", { bands: { orange: { hue: 10, chroma: 0.2, light: 0 }, blue: { hue: 10, chroma: 0, light: 0 } } });
  assert.equal(kept.bands.orange.hue, 0); assert.equal(kept.bands.orange.chroma, 0.2); assert.equal(kept.bands.blue.hue, 10);
  assert.equal(O.withoutSkinHue("colour.splitTone", {}), null);
  assert.equal(O.withoutSkinHue("light.grade", {}), null);
  assert.deepEqual(O.withoutSkinHue("colour.exposure", { ev: 0.2 }), { ev: 0.2 });
});

test("tone curves are monotone, pass their points and hold the ends", () => {
  const pts = C.checkPoints([[0.1, 0], [0.2, 0.9], [0.3, 0.92], [0.9, 1]]);
  const xs = Array.from({ length: 701 }, (_, i) => -0.2 + (1.4 * i) / 700);
  const ys = C.evaluate(pts, xs);
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] >= ys[i - 1] - 1e-12);
  for (const [x, y] of pts) assert.ok(Math.abs(C.evaluate(pts, [x])[0] - y) < 1e-12);
  assert.equal(ys[0], 0); assert.equal(ys[ys.length - 1], 1);
  assert.throws(() => C.checkPoints([[0, 0], [0, 1]]), /strictly increase/);
  assert.deepEqual(C.atStrength([[0, 0.2], [1, 0.8]], 0.5), [[0, 0.1], [1, 0.9]]);
});

test("the identity recipe bakes an identity LUT within 1e-6, and lattice points come back exactly", () => {
  const p = E.plan(catalogue().get("C08"), { strength: 0, guard: false });
  assert.deepEqual(p.stages, []);
  const table = LUT.bake(E.colourTransform(p.stages));
  assert.ok(worst(table, LUT.identity()) <= 1e-6);
  const strong = LUT.bake(E.colourTransform(E.plan(catalogue().get("C01"), { strength: 100, guard: false }).stages));
  const idx = [[0, 0, 0], [32, 32, 32], [7, 11, 31], [16, 0, 32], [31, 31, 0]];
  const rgb = idx.flatMap(([i, j, k]) => [i / 32, j / 32, k / 32]);
  assert.ok(worst(LUT.apply(strong, rgb), LUT.sample(strong, idx).flat()) <= 1e-12);
  const all = Uint8Array.from({ length: 256 * 3 }, (_, i) => Math.floor(i / 3));
  assert.deepEqual(Array.from(LUT.toBytes(LUT.applyBytes(LUT.identity(), all, 3))), Array.from(all), "identity LUT returns every byte");
  assert.throws(() => LUT.lattice(1), /2 to 65/);
});

test("vignette darkens corners only; centre light follows the face; glow only adds light", () => {
  const frame = { width: 101, height: 101, x0: 0, y0: 0, faceCentre: [30, 40] };
  const grey = { width: 101, height: 101, data: new Float64Array(101 * 101 * 3).fill(0.6) };
  const v = L.vignette(grey, O.fullParams(O.op("light.vignette"), { amount: 0.5 }), frame);
  const at = (b, x, y) => b.data[(y * b.width + x) * 3];
  assert.ok(Math.abs(at(v, 50, 50) - 0.6) < 1e-9);
  assert.ok(at(v, 0, 0) < 0.55);
  assert.deepEqual(L.centrePoint(O.fullParams(O.op("light.centre"), { follow: 1 }), frame), [30, 40]);
  assert.deepEqual(L.centrePoint(O.fullParams(O.op("light.centre"), {}), frame), [50.5, 45.45]);
  const spot = { width: 80, height: 80, data: new Float64Array(80 * 80 * 3).fill(0.25) };
  for (let y = 30; y < 50; y++) for (let x = 30; x < 50; x++) for (let c = 0; c < 3; c++) spot.data[(y * 80 + x) * 3 + c] = 0.98;
  const g = GL.glow(spot, O.fullParams(O.op("spatial.glow"), { amount: 0.5, radius: 0.06 }), { width: 80, height: 80, x0: 0, y0: 0, faceCentre: null });
  for (let i = 0; i < g.data.length; i++) assert.ok(g.data[i] >= spot.data[i] - 1e-12);
  assert.ok(at(g, 40, 28) > 0.26);
  assert.equal(GL.glowRadius(0.02, { width: 1000, height: 500 }), 5);
});

test("the op registry refuses duplicates and non-colour ops in runOp", () => {
  assert.throws(() => O.register(O.op("colour.tint")), /twice/);
  assert.throws(() => O.op("colour.nothing"), /unknown filter op/);
  assert.throws(() => O.runOp("spatial.glow", new Float64Array(3), {}), /not a pointwise/);
  const families = new Set([...O.OPS.values()].map((o) => o.family));
  assert.deepEqual([...families].sort(), ["colour", "light", "spatial"]);
});
