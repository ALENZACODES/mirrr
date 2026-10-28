// R3: the TypeScript engine contract (§13 mirror), reference engines, resize and LCh, and the
// quality harness, whose report must match the Python one number for number.
// Author: John Khan.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import * as B from "../dist/js/engines/core/buffer.js";
import * as C from "../dist/js/engines/core/colour.js";
import * as K from "../dist/js/engines/core/composite.js";
import * as E from "../dist/js/engines/core/engine.js";
import * as M from "../dist/js/engines/core/mask.js";
import * as H from "../dist/js/quality/harness.js";
import { maxAbsDifference } from "../dist/js/quality/metrics.js";
import { validateReport } from "../dist/js/quality/report.js";

const img = (w, h, c, f) => { const out = B.byteImage(w, h, c); out.data.forEach((_, i) => (out.data[i] = f(i))); return out; };

test("hash noise matches the values pinned in the Python tests", () => {
  const noise = H.hashNoise(1, 3, 2);
  assert.deepEqual(Array.from(noise), [0.23478565004496854, -0.26606375537124016, 0.400069951034276,
    -0.12856000799440392, -0.34310982312381333, -0.4513340661536924]);
});

test("synthetic photo and texture thresholds", () => {
  const a = H.syntheticPhoto(3), b = H.syntheticPhoto(3);
  assert.deepEqual(Array.from(a.image.data), Array.from(b.image.data));
  assert.equal(a.photo, "synthetic-03");
  assert.deepEqual(Object.keys(a.masks).sort(), ["selection", "skin"]);
  assert.equal(H.textureMinimum(0, 3), 0.6);
  assert.equal(H.textureMinimum(2, 3), 0.35);
  assert.ok(Math.abs(H.textureMinimum(1, 3) - 0.475) < 1e-12);
});

test("runEngine enforces the contract", () => {
  const image = img(6, 5, 3, (i) => (i * 37) % 256);
  const sel = M.rectangle(6, 5, 1, 1, 4, 4);
  const ok = E.runEngine(new E.TintEngine(), image, null, { selection: sel }, { rgb: [200, 30, 40], strength: 1 });
  assert.equal(ok.provenance, "local");
  const leaky = { version: "0.0.1", run: (im) => { const out = { ...im, data: new Uint8Array(im.data) }; out.data[0] ^= 255;
    return { image: out, editMask: M.emptyMask(6, 5), metrics: {}, provenance: "local", pipelineVersion: "1" }; } };
  assert.throws(() => E.runEngine(leaky, image, null, {}, {}), /outside declared editMask/);
  const mutating = { version: "1", run: (im) => { image.data[1] ^= 1; return { image: im, editMask: M.fullMask(6, 5), metrics: {}, provenance: "local", pipelineVersion: "1" }; } };
  const before = image.data[1];
  assert.throws(() => E.runEngine(mutating, image, null, {}, {}), /mutated/);
  image.data[1] = before;
  const badMetric = { version: "1", run: (im) => ({ image: im, editMask: M.emptyMask(6, 5), metrics: { x: NaN }, provenance: "local", pipelineVersion: "1" }) };
  assert.throws(() => E.runEngine(badMetric, image, null, {}, {}), /non-finite/);
  const remote = { version: "1", run: (im) => ({ image: im, editMask: M.emptyMask(6, 5), metrics: {}, provenance: "youcam", pipelineVersion: "1" }) };
  assert.throws(() => E.runEngine(remote, image, null, {}, {}), /local provenance/);
  assert.throws(() => E.runEngine(new E.ExposureEngine(), image, null, {}, {}, -1), /seed/);
  assert.equal(E.validSeed(2n ** 64n - 1n), true);
  assert.equal(E.validSeed(2n ** 64n), false);
  assert.throws(() => E.runEngine(new E.TintEngine(), image, null, {}, { rgb: [1, 2, 3] }), /selection mask required/);
  assert.throws(() => E.runEngine(new E.ExposureEngine(), image, null, { selection: M.emptyMask(2, 2) }, {}), /match/);
});

test("reference engines: exposure brightens inside the mask only, tint reaches its colour", () => {
  const image = img(8, 8, 3, () => 100);
  const sel = M.rectangle(8, 8, 0, 0, 4, 8);
  const out = E.runEngine(new E.ExposureEngine(), image, null, { selection: sel }, { stops: 1 });
  assert.ok(out.image.data[0] > 100 && out.image.data[(0 * 8 + 6) * 3] === 100);
  assert.equal(out.metrics.coverage, 0.5);
  const tint = K.solid(image, [200, 30, 40], M.fullMask(8, 8));
  assert.deepEqual(Array.from(tint.data.slice(0, 3)), [200, 30, 40]);
  assert.deepEqual(Array.from(K.exposure(image, 0).data), Array.from(image.data));
  assert.throws(() => K.exposure(image, 9), RangeError);
  assert.equal(M.coverage(K.differenceMask(image, image)), 0);
});

test("resize: area average in linear light, bilinear identity, alpha", () => {
  const checker = img(2, 2, 3, (i) => ([0, 3].includes(Math.floor(i / 3)) ? 255 : 0));
  assert.equal(B.resizeArea(checker, 1, 1).data[0], 188);
  const same = img(5, 6, 3, (i) => (i * 13) % 256);
  assert.deepEqual(Array.from(B.resizeArea(same, 5, 6).data), Array.from(same.data));
  assert.deepEqual(Array.from(B.resizeBilinear(same, 5, 6).data), Array.from(same.data));
  const rgba = { width: 2, height: 1, channels: 4, data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 0]) };
  assert.deepEqual(Array.from(B.resizeArea(rgba, 1, 1).data), [255, 0, 0, 128]);
  assert.equal(B.resize(same, 10, 3).width, 10);
  assert.throws(() => B.resizeArea(same, 9, 2), RangeError);
  for (const [s, t] of [[10, 3], [7, 7], [9, 4]]) {
    for (const row of B.areaWeights(s, t)) assert.ok(Math.abs(row.reduce((a, [, w]) => a + w, 0) - 1) < 1e-12);
  }
});

test("LCh and hue rotation", () => {
  const lch = C.labToLch([52, 30, -40]);
  assert.ok(Math.abs(lch[1] - 50) < 1e-12 && lch[2] >= 0 && lch[2] < 360);
  C.lchToLab(lch).forEach((v, i) => assert.ok(Math.abs(v - [52, 30, -40][i]) < 1e-9));
  assert.deepEqual(C.labToLch([40, 0, 0]), [40, 0, 0]);
  assert.throws(() => C.lchToLab([50, -1, 0]), RangeError);
  C.rotateHue([180, 60, 70], 360).forEach((v, i) => assert.ok(Math.abs(v - [180, 60, 70][i]) < 1e-3));
});

test("harness report validates and matches the Python sample report", () => {
  const photos = [H.syntheticPhoto(1), H.syntheticPhoto(2)];
  const stops = [{ name: "natural", params: { rgb: [180, 40, 60], strength: 0.3 } },
    { name: "full", params: { rgb: [180, 40, 60], strength: 1.0 }, target: "#B4283C" }];
  const ts = H.run("tint", "1.0.0", new E.TintEngine(), photos, stops, { skin: "skin", created: "2026-10-22" });
  assert.deepEqual(validateReport(ts), []);
  const py = JSON.parse(readFileSync(new URL("../../parity/report-sample-python.json", import.meta.url), "utf8"));
  assert.deepEqual(ts.summary, py.summary);
  assert.equal(ts.photos.length, py.photos.length);
  ts.photos.forEach((entry, i) => {
    const other = py.photos[i];
    assert.equal(entry.photo, other.photo);
    assert.equal(entry.stop, other.stop);
    entry.checks.forEach((check, j) => {
      const twin = other.checks[j];
      assert.equal(check.code, twin.code);
      assert.equal(check.passed, twin.passed, `${entry.photo} ${entry.stop} ${check.code}`);
      assert.equal(check.rule, twin.rule);
      const strip = (m) => Object.fromEntries(Object.entries(m).filter(([k]) => k !== "sha256" && k !== "digest"));
      const diff = maxAbsDifference(strip(check.measured), strip(twin.measured));
      assert.ok(diff <= 1 / 255, `${entry.photo} ${check.code}: ${diff}`);
      assert.ok(maxAbsDifference(check.thresholds, twin.thresholds) < 1e-12);
    });
  });
  assert.throws(() => H.run("tint", "1.0.0", new E.TintEngine(), [], stops), RangeError);
});
