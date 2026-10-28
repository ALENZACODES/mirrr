// Lane F: browser-side tenths contract, identity-guard injection and preview caching.
// All pixels here are synthetic arrays; no provider calls or photos are loaded.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as Strength from "../dist/js/commerce/strength.js";
import * as Identity from "../dist/js/commerce/identity.js";
import * as Cache from "../dist/js/commerce/preview-cache.js";
import { auditPatches } from "../dist/js/engines/shade/reading.js";
import { DEEP_REFERENCE } from "../dist/js/engines/shade/deep-reference.js";
import { findFromPixels, matchShades } from "../dist/js/engines/shade/finder.js";

const SHADES = JSON.parse(readFileSync(
  new URL("../../api/plumb_api/engines/shade/deep_reference_shades.json", import.meta.url), "utf8"));
const source = "b".repeat(64);

test("1.0 and 5.0 accepted with strict tenths, bad values rejected", () => {
  assert.equal(Strength.validateLevel(1.0), 1.0);
  assert.equal(Strength.validateLevel(5.0), 5.0);
  for (let tick = 10; tick <= 50; tick++) {
    assert.equal(Strength.levelTicks(tick / 10), tick);
  }
  for (const bad of [0.9, 5.1, -1, 2.01, 2.35, NaN, Infinity, -Infinity, "3.0", true, false, null]) {
    assert.throws(() => Strength.validateLevel(bad), RangeError);
  }
  assert.equal(Strength.toLegacy(1.0), 0);
  assert.equal(Strength.toLegacy(5.0), 100);
  assert.deepEqual(Strength.legacyPresets(), {none: 1, subtle: 2, natural: 3, strong: 4, full: 5});
});

test("five steps remember levels independently by cosmetic type", () => {
  const memory = new Strength.LevelHistory();
  assert.equal(memory.get("cheek"), 3);
  assert.equal(memory.step("cheek", 1), 3.1);
  assert.equal(memory.step("cheek", -1), 3);
  assert.equal(memory.remember("lip", 5), 5);
  assert.equal(memory.step("lip", 1), 5);
  assert.equal(memory.remember("shade", 1), 1);
  assert.equal(memory.step("shade", -1), 1);
  assert.equal(memory.get("complexion"), 3);
  assert.equal(memory.snapshot().lip, 5);
  memory.clear();
  assert.equal(memory.get("lip"), 3);
  assert.throws(() => memory.remember("unknown", 3));
});

test("default lock invokes injected identity guard and rejects broken verdicts", async () => {
  let calls = 0;
  const fake = {
    guard(before, after, lockLevel) {
      calls++;
      assert.equal(before, "before");
      assert.equal(after, "edited");
      assert.equal(lockLevel, 5);
      return {image: "edited", lock_level: lockLevel, similarity: 0.99,
        blended: false, engine: "mock_guard", decision: "kept"};
    },
  };
  const result = await Identity.applyGuard("before", "edited", fake);
  assert.equal(calls, 1);
  assert.equal(result.engine, "mock_guard");
  const change = new Uint8ClampedArray([100, 100, 100, 255]);
  const after = new Uint8ClampedArray([120, 120, 120, 255]);
  const similarity = Identity.pixelSimilarity(change, after);
  assert.ok(similarity < Identity.lockThreshold(5));
  assert.ok(similarity > Identity.lockThreshold(1));
  await assert.rejects(Identity.applyGuard("before", "edited", {
    guard: () => ({image: null, similarity: 1}),
  }), /did not approve/);
});

test("photo hash, edit and tenths form a bounded local cache; five steps share one reading", () => {
  const cache = new Cache.PhotoEditCache();
  const readingKey = Cache.editKey(source, "shade-base", 3.0);
  let read = 0;
  for (const level of [1, 1.1, 2, 3.9, 5]) {
    Cache.editKey(source, "preview", level);
    assert.equal(cache.getOrCompute(readingKey, () => ++read), 1);
  }
  assert.equal(read, 1);
  assert.equal(cache.computes, 1);
  assert.equal(cache.hits, 4);
  cache.dropPhoto(source);
  assert.equal(cache.getOrCompute(readingKey, () => ++read), 2);
});

test("provider response cache is bounded and expires without persistent media", () => {
  let time = 1_000_000;
  const cache = new Cache.ProviderResponseCache(() => time);
  const key = source;
  const image = {image: "data:image/png;base64,QUJD", mime: "image/png"};
  assert.equal(cache.get(key), null);
  cache.put(key, image);
  assert.deepEqual(cache.get(key), image);
  assert.equal(cache.bytesUsed, image.image.length);
  time += 600_001;
  assert.equal(cache.get(key), null);
  assert.equal(cache.bytesUsed, 0);
  assert.equal(cache.hits, 1);
  assert.equal(cache.misses, 2);
});

test("deep anchors mirror original Python JSON without brand names", () => {
  assert.equal(SHADES.format, "beljour-shade-depth-extension/1");
  assert.deepEqual(DEEP_REFERENCE, SHADES.shades);
  assert.equal(DEEP_REFERENCE.length, 16);
  assert.equal(new Set(DEEP_REFERENCE.map((v) => v.undertone)).size, 4);
  for (const row of DEEP_REFERENCE) {
    assert.match(row.name, /^Reference /);
    assert.ok(row.lab[0] < 24);
    assert.equal(matchShades(row.lab, DEEP_REFERENCE)[0].delta_e, 0);
  }
  const raw = {cheek_right: Array(100).fill([60, 45, 35]), cheek_left: Array(100).fill([60, 45, 35])};
  assert.equal(typeof findFromPixels(raw).refused, "boolean");
});

test("opposite cheek lighting refuses without inventing a colour match", () => {
  const width = 32;
  const height = 16;
  const data = new Uint8Array(width * height * 3);
  const left = new Uint8Array(width * height);
  const right = new Uint8Array(width * height);
  const forehead = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const rgb = x < width / 2 ? [175, 100, 55] : [55, 100, 175];
    data.set(rgb, i * 3);
    if (x >= 2 && x <= 12 && y >= 3 && y <= 12) left[i] = 1;
    if (x >= 20 && x <= 30 && y >= 3 && y <= 12) right[i] = 1;
    if (y < 4 && x > 3 && x < 28) forehead[i] = 1;
  }
  const image = {width, height, channels: 3, data};
  const masks = {cheek_right: left, cheek_left: right, forehead};
  const {samples, audit} = auditPatches(image, masks, [1, 1, 1], "none", 12, 10);
  assert.ok(samples.cheek_right.length >= 12);
  assert.ok(samples.cheek_left.length >= 12);
  assert.equal(audit.usable, false);
  assert.equal(audit.reason, "mixed_lighting");
  assert.match(audit.note, /incompatible lighting/);
  assert.ok(audit.cheek_distance > 10);
  const uniform = data.slice();
  for (let y = 0; y < height; y++) for (let x = 16; x < width; x++) {
    uniform.set([175, 100, 55], (y * width + x) * 3);
  }
  const again = auditPatches({...image, data: uniform}, masks, [1, 1, 1], "neutral", 12, 10);
  assert.equal(again.audit.usable, true);
  assert.equal(again.audit.white_mode, "neutral");
});
