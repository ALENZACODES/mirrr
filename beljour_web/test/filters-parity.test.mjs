// FX1 Python -> TypeScript parity (A5), from parity/filters-fx1.json written by
// api/plumb_api/filters/parity.py: every colour op, the strength scaling, curves, hue bands,
// every recipe's LUT at 30 and 100, tetrahedral apply, glow and position light (whole and as
// a tile), the guard, full renders with mesh masks and the photo cast. LUTs within 1e-5, op
// values within 1e-9, bytes within one level. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as O from "../dist/js/filters/colour/ops.js";
import * as LUT from "../dist/js/filters/colour/lut.js";
import * as C from "../dist/js/filters/colour/curves.js";
import * as G from "../dist/js/filters/masks/guard.js";
import * as E from "../dist/js/filters/runtime/engine.js";
import { catalogue } from "../dist/js/filters/recipe/registry.js";

const P = JSON.parse(readFileSync(new URL("../../parity/filters-fx1.json", import.meta.url), "utf8"));
const bytes = (b64) => new Uint8Array(Buffer.from(b64, "base64"));
const mask = (b64, w, h) => b64 === null ? null
  : { width: w, height: h, channels: 1, data: Float32Array.from(bytes(b64), (v) => v / P.maskSteps) };
const faces = P.faces.map((f) => ({ ...f, img: { width: f.w, height: f.h, channels: 3, data: bytes(f.image) },
  masks: { skin: mask(f.skin, f.w, f.h), person: mask(f.person, f.w, f.h), source: "landmarks", note: "" } }));
const worst = (a, b) => { let w = 0; for (let i = 0; i < a.length; i++) w = Math.max(w, Math.abs(a[i] - b[i])); return w; };
const byteGap = (a, b, what) => {
  assert.equal(a.length, b.length, `${what}: length`);
  let w = 0, n = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d > 0) n++; w = Math.max(w, d); }
  assert.ok(w <= 1, `${what}: byte difference ${w}`);
  return n;
};

test("the vector file is synthetic, complete and has at least 40 vectors", () => {
  assert.equal(P.format, "beljour-parity-filters/1");
  assert.equal(P.lutSize, LUT.SIZE);
  assert.ok(P.vectorCount >= 40);
  assert.match(P.about, /no photo of a person/);
  assert.equal(P.luts.length, 2 * catalogue().recipes.length);
});

test("every pointwise colour op matches Python within 1e-9", () => {
  for (const v of P.ops) {
    const rgb = Float64Array.from(P.colours.flat());
    O.runOp(v.op, rgb, v.params);
    assert.ok(worst(rgb, v.out.flat()) <= 1e-9, `${v.op} ${JSON.stringify(v.params).slice(0, 60)}`);
  }
});

test("strength scaling gives the same parameters in both languages", () => {
  for (const v of P.scales) {
    const got = O.scaleParams(O.op(v.op), v.target, O.scaleFraction(v.scale, v.strength));
    const flat = (x) => JSON.stringify(x, (_k, val) => (typeof val === "number" ? Math.round(val * 1e10) / 1e10 : val));
    assert.equal(flat(got), flat(v.params), `${v.op} ${v.scale} ${v.strength}`);
  }
});

test("curve tangents, curve values and band weights match", () => {
  for (const v of P.curves) {
    const pts = C.checkPoints(v.points);
    assert.ok(worst(C.tangents(pts), v.tangents) <= 1e-12, "tangents");
    assert.ok(worst(C.evaluate(pts, v.x), v.y) <= 1e-12, "values");
  }
  P.bands.hues.forEach((h, i) => assert.ok(worst(O.bandWeights(h), P.bands.weights[i]) <= 1e-12, `hue ${h}`));
});

test("every recipe's LUT at strength 30 and 100 matches within 1e-5 (sampled points and the whole sum)", () => {
  for (const v of P.luts) {
    const p = E.plan(catalogue().get(v.recipe), { strength: v.strength, guard: false }, false, catalogue().addons, v.stats);
    const table = LUT.bake(E.colourTransform(p.stages));
    assert.ok(worst(LUT.sample(table, v.points).flat(), v.values.flat()) <= 1e-5, `${v.recipe} @ ${v.strength}`);
    let sum = 0; for (const x of table) sum += x;
    assert.equal(table.length, v.count);
    assert.ok(Math.abs(sum - v.sum) <= 1e-3, `${v.recipe} sum ${sum} vs ${v.sum}`);
  }
});

test("tetrahedral apply matches on random colours, ties and corners", () => {
  for (const v of P.tetra) {
    const p = E.plan(catalogue().get(v.recipe), { strength: v.strength, guard: false });
    const table = LUT.bake(E.colourTransform(p.stages));
    assert.ok(worst(LUT.apply(table, v.rgb.flat()), v.out.flat()) <= 1e-9, v.recipe);
  }
});

test("glow, vignette, centre light and graded tint match, whole and as an offset tile", () => {
  const block = { width: P.block.w, height: P.block.h, data: Float64Array.from(bytes(P.block.image), (b) => b / 255) };
  for (const v of P.spatial) {
    const [width, height, x0, y0, centre] = v.frame;
    const out = O.op(v.op).image(block, v.params, { width, height, x0, y0, faceCentre: centre.length ? centre : null });
    byteGap(LUT.toBytes(out.data), bytes(v.out), `${v.op} at ${x0},${y0}`);
  }
});

test("the guard matches Python on three tones in both modes, re-deriving the mid-grey rise", () => {
  for (const v of P.guard) {
    const f = faces[v.face];
    const p = E.plan(catalogue().get(v.recipe), { strength: v.strength }, true);
    const frame = E.wholeFrame(f.w, f.h);
    const look = E.look(f.img.data, f.w, f.h, p, frame);
    byteGap(look, bytes(v.look), `${v.recipe} look`);
    const rise = G.greyRise(E.look(E.greyPhoto(f.w * f.h), f.w, f.h, p, frame));
    assert.ok(Math.abs(rise.reduce((a, b) => a + b, 0) / rise.length - v.riseMean) <= 1e-6, "mid-grey rise");
    const stats = G.spreadStats(f.img.data, bytes(v.look), f.masks.skin.data);
    assert.ok(Math.abs(G.spreadScale(stats) - v.spreadScale) <= 1e-9, "spread scale");
    const out = G.guard(f.img.data, bytes(v.look), f.masks.skin, rise, v.mode);
    byteGap(out, bytes(v.out), `${v.recipe} ${v.mode} guard`);
  }
});

test("full renders match: default, strong, protect, background, guard off, presets, fade, fallback", () => {
  for (const v of P.renders) {
    const f = faces[v.face];
    const settings = { ...v.settings };
    if ("protect_skin" in settings) { settings.protectSkin = settings.protect_skin; delete settings.protect_skin; }
    if ("background_only" in settings) { settings.backgroundOnly = settings.background_only; delete settings.background_only; }
    const masks = v.masks ? f.masks : { skin: null, person: null, source: "none", note: "" };
    const res = E.render(f.img, v.recipe, settings, masks, f.faceCentre);
    assert.equal(res.plan.fallback, v.fallback, `${v.recipe} fallback`);
    assert.equal(res.plan.strength, v.strength, `${v.recipe} strength`);
    assert.deepEqual(res.plan.pending, v.pending, `${v.recipe} pending`);
    byteGap(res.look.data, bytes(v.look), `${v.recipe} look`);
    byteGap(res.image.data, bytes(v.out), `${v.recipe} ${JSON.stringify(v.settings)}`);
  }
});

test("the photo colour cast matches", () => {
  for (const v of P.casts) {
    const f = faces[v.face];
    const data = Uint8Array.from(f.img.data, (b, i) => Math.min(255, Math.max(0, b + v.shift[i % 3])));
    const [a, b] = O.photoCast(data, 255);
    assert.ok(Math.abs(a - v.cast[0]) <= 1e-9 && Math.abs(b - v.cast[1]) <= 1e-9, JSON.stringify(v.shift));
  }
});
