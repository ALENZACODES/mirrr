// R3 E29 quality checks and the §17 report format, TypeScript side.
// Author: John Khan.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import * as B from "../dist/js/engines/core/buffer.js";
import * as M from "../dist/js/engines/core/mask.js";
import * as Q from "../dist/js/quality/metrics.js";
import * as R from "../dist/js/quality/report.js";

let seed = 99;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const photo = (w = 40, h = 40) => { const img = B.byteImage(w, h, 3); img.data.forEach((_, i) => (img.data[i] = 40 + Math.floor(rand() * 160))); return img; };
const copy = (img) => ({ ...img, data: new Uint8Array(img.data) });
const set = (img, x, y, v) => { for (let c = 0; c < 3; c++) img.data[(y * img.width + x) * 3 + c] = v; };

test("Q1: inside passes, near edge allowed, far change fails", () => {
  const before = photo(), mask = M.rectangle(40, 40, 15, 15, 25, 25);
  const inside = copy(before);
  for (let y = 15; y < 25; y++) for (let x = 15; x < 25; x++) set(inside, x, y, 255);
  assert.ok(Q.q1OutsideMask(before, inside, mask).passed);
  const near = copy(before); set(near, 30, 20, 0);
  assert.ok(Q.q1OutsideMask(before, near, mask).passed);
  const far = copy(before); far.data[(2 * 40 + 2) * 3] = Math.min(255, far.data[(2 * 40 + 2) * 3] + 9);
  const check = Q.q1OutsideMask(before, far, mask);
  assert.equal(check.passed, false);
  assert.ok(Math.abs(check.measured.max - 9 / 255) < 1e-12);
  assert.equal(check.name, "Outside-mask invariance");
});

test("Q3: identity passes, a fold fails", () => {
  const { mapX, mapY } = B.identityMaps(20, 20);
  assert.ok(Q.q3FoldFree(mapX, mapY).passed);
  const folded = { ...mapX, data: Float64Array.from(mapX.data, (v) => (v >= 8 && v < 12 ? 19 - v : v)) };
  const check = Q.q3FoldFree(folded, mapY);
  assert.equal(check.passed, false);
  assert.ok(check.measured.folded_share > 0);
});

test("Q4: a hard edit edge fails where a feathered one passes", () => {
  const w = 64, h = 64, before = B.byteImage(w, h, 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = Math.floor(rand() * 12);
    before.data.set([90 + x + n, 100 + Math.floor(0.5 * y) + n, 120 + n], (y * w + x) * 3);
  }
  const hard = M.ellipse(w, h, 32, 32, 16, 16), soft = M.feather(hard, 8, "centered");
  const brighten = (mask) => {
    const out = copy(before);
    for (let i = 0; i < w * h; i++) for (let c = 0; c < 3; c++) {
      const lin = B.SRGB_TO_LINEAR[before.data[i * 3 + c]];
      const target = lin * 2 ** 0.3, t = mask.data[i];
      out.data[i * 3 + c] = B.encodeByte(lin * (1 - t) + Math.min(1, target) * t);
    }
    return out;
  };
  const hardCheck = Q.q4Seam(before, brighten(hard), hard), softCheck = Q.q4Seam(before, brighten(soft), soft);
  assert.equal(hardCheck.passed, false);
  assert.ok(softCheck.passed, JSON.stringify(softCheck.measured));
  const none = Q.q4Seam(before, before, M.fullMask(w, h));
  assert.equal(none.measured.band_pixels, 0);
});

test("Q5: determinism, digests and parity differences", () => {
  const img = photo(8, 8);
  assert.ok(Q.q5Determinism(() => copy(img)).passed);
  let n = 0;
  const drift = Q.q5Determinism(() => ({ width: 1, height: 1, channels: 1, data: new Uint8Array([n++]) }), 3);
  assert.equal(drift.passed, false);
  assert.equal(drift.measured.distinct_outputs, 3);
  assert.notEqual(Q.digest({ width: 2, height: 1, channels: 1, data: new Uint8Array(2) }), Q.digest({ width: 1, height: 2, channels: 1, data: new Uint8Array(2) }));
  assert.ok(Q.q5Parity([1, { x: 2 }], [1.001, { x: 2 }]).passed);
  assert.equal(Q.q5Parity([1], [1.01]).passed, false);
  assert.equal(Q.maxAbsDifference(null, null), 0);
  assert.equal(Q.maxAbsDifference(null, 1), Infinity);
  assert.equal(Q.maxAbsDifference({ a: 1 }, { b: 1 }), Infinity);
  assert.equal(Q.maxAbsDifference([1, 2], [1]), Infinity);
});

test("Q6: colour accuracy in linear light", () => {
  const img = photo(), mask = M.rectangle(40, 40, 5, 5, 20, 20);
  for (let y = 5; y < 20; y++) for (let x = 5; x < 20; x++) img.data.set([180, 40, 60], (y * 40 + x) * 3);
  assert.ok(Q.q6ColourAccuracy(img, mask, "#B4283C").passed);
  assert.equal(Q.q6ColourAccuracy(img, mask, "#3C28B4").passed, false);
  assert.equal(Q.q6ColourAccuracy(img, M.emptyMask(40, 40), "#B4283C").measured.reason, "empty mask");
  const pair = { width: 2, height: 1, channels: 3, data: new Uint8Array([0, 0, 0, 255, 255, 255]) };
  assert.ok(Math.abs(Q.maskedMeanColour(pair, M.fullMask(2, 1))[0] - 187.5) < 0.5);
});

test("Q9 and Q10", () => {
  assert.ok(Q.q9Monotonic([1, 2, 3.5]).passed);
  assert.equal(Q.q9Monotonic([1, 2, 2]).passed, false);
  assert.throws(() => Q.q9Monotonic([1]), RangeError);
  const img = photo();
  assert.equal(Q.effectStrength(img, img), 0);
  const skin = M.fullMask(40, 40);
  assert.ok(Q.q10TextureKept(img, img, skin).passed);
  const flat = B.byteImage(20, 20, 3); flat.data.fill(128);
  const none = Q.q10TextureKept(flat, flat, M.fullMask(20, 20));
  assert.ok(none.passed);
  assert.equal(none.measured.ratio, null);
  const smooth = copy(img); smooth.data.fill(120);
  assert.equal(Q.q10TextureKept(img, smooth, skin).passed, false);
});

test("report: build, summarise, validate, markdown", () => {
  const photos = [{ photo: "p1", synthetic: true, stop: "natural", checks: [Q.q9Monotonic([1, 2])] },
    { photo: "p2", synthetic: true, stop: null, checks: [Q.q9Monotonic([2, 1])] }];
  const report = R.buildReport("tint", "1.0.0", photos, "2026-10-22");
  assert.equal(report.language, "typescript");
  assert.deepEqual(report.summary, { checks: 2, passed: 1, failed: 1, passed_all: false, by_code: { Q9: { passed: 1, failed: 1 } } });
  assert.deepEqual(R.validateReport(JSON.parse(JSON.stringify(report))), []);
  assert.ok(R.validateReport({ ...report, tool_version: "1.0" }).length);
  assert.ok(R.validateReport({ ...report, summary: { ...report.summary, passed: 2 } }).includes("summary does not match the checks"));
  assert.ok(R.validateReport({ ...report, photos: [] }).length);
  assert.match(R.toMarkdown(report), /1 of 2 checks passed on synthetic photos only\./);
  assert.throws(() => R.buildReport("Bad Name", "1.0.0", photos), RangeError);
});

test("report: the Python sample passes the TypeScript validator", () => {
  const sample = JSON.parse(readFileSync(new URL("../../parity/report-sample-python.json", import.meta.url), "utf8"));
  assert.equal(sample.language, "python");
  assert.deepEqual(R.validateReport(sample), []);
  assert.ok(sample.summary.checks >= 10);
});
