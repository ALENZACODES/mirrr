/** Full-frame, mask-safe and pause/resume export parity for opt-in textures.
 * These tests use generated colour arrays, not real photographs.
 * Created by John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { render, halo, plan, wholeFrame } from "../dist/js/filters/runtime/engine.js";
import { TiledRender, captureMasks, tileGrid } from "../dist/js/filters/runtime/tiles.js";
import { catalogue } from "../dist/js/filters/recipe/registry.js";

const C = catalogue();
function sample(width = 65, height = 71, tone = 2) {
  const n = width * height;
  const image = { width, height, channels: 3, data: new Uint8Array(n * 3) };
  const skin = new Float32Array(n), person = new Float32Array(n);
  const colours = [
    [226, 190, 174], [211, 161, 133], [166, 111, 89],
    [139, 91, 65], [88, 59, 49], [52, 39, 31],
  ];
  const base = colours[tone];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x, i = p * 3;
    const q = (x * 11 + y * 17) % 31 - 15;
    image.data[i] = Math.max(0, Math.min(255, base[0] + q));
    image.data[i + 1] = Math.max(0, Math.min(255, base[1] + q));
    image.data[i + 2] = Math.max(0, Math.min(255, base[2] + q));
    if (x < 7 && y < 7) image.data.fill(255, i, i + 3);
    const oval = ((x - width / 2) / (width * 0.36)) ** 2 +
      ((y - height / 2) / (height * 0.42)) ** 2;
    person[p] = oval <= 1 ? 1 : 0;
    skin[p] = oval <= 0.70 ? 1 : 0;
  }
  const mask = (data) => ({ width, height, channels: 1, data });
  return { image, masks: { skin: mask(skin), person: mask(person), source: "landmarks", note: "" } };
}
const equalBytes = (a, b) => assert.deepEqual(Buffer.from(a), Buffer.from(b));
const combos = [
  { grain: 75 }, { structure: 75 },
  { grain: 60, structure: 72 },
];
const maskModes = ["full", "skin-only", "none"];
const adjustMasks = (m, mode) => mode === "full" ? m
  : mode === "skin-only" ? { ...m, person: null }
    : { ...m, person: null, skin: null, source: "none" };

for (const [position, name] of [
  [0, "very light"], [2, "medium"], [5, "deep"],
]) {
  test(`${name}: opt-in textures export byte-exact under three mask modes`, () => {
    const { image, masks } = sample(65, 71, position);
    for (const addons of combos) {
      for (const maskMode of maskModes) {
        const m = adjustMasks(masks, maskMode);
        const settings = { strength: 24, guard: maskMode !== "none", addons };
        const before = Uint8Array.from(image.data);
        const full = render(image, "C08", settings, m);
        for (const size of [16, 24, 64]) {
          const tiled = new TiledRender(image, "C08", settings, m, null, size).runAll();
          equalBytes(full.image.data, tiled.image.data);
          equalBytes(full.look.data, tiled.look.data);
          equalBytes(image.data, before);
          assert.equal(full.plan.identity, false);
        }
      }
    }
  });
}

test("full twelve-megapixel geometry never affects the choice of grain seed", () => {
  const p = plan(C.get("C08"), { strength: 0, addons: { grain: 88 } }, true);
  const small = wholeFrame(320, 240);
  const large = wholeFrame(4000, 3000);
  assert.equal(halo(p, small), 0);
  assert.equal(halo(p, large), 0);
  assert.ok(p.stages.some((s) => s.op === "spatial.grain"));
});

test("structure halo grows with photo dimensions and is not based on tile width", () => {
  const p = plan(C.get("C08"), { strength: 0, addons: { structure: 90 } }, true);
  const small = wholeFrame(320, 240);
  const large = wholeFrame(4000, 3000);
  assert.ok(halo(p, small) >= 1);
  assert.ok(halo(p, large) > halo(p, small));
  assert.equal(halo(p, { ...large, x0: 300, y0: 450 }), halo(p, large));
});

test("combined stages need only the structure halo, not a grain halo", () => {
  const solo = plan(C.get("C08"), { strength: 0, addons: { structure: 80 } }, true);
  const pair = plan(C.get("C08"), { strength: 0,
    addons: { grain: 45, structure: 80 } }, true);
  const frame = wholeFrame(500, 700);
  assert.equal(halo(solo, frame), halo(pair, frame));
  assert.equal(pair.stages.at(-1).op, "spatial.grain");
});

test("odd dimensions and short edge tiles preserve the precise last row and column", () => {
  const { image, masks } = sample(67, 73, 3);
  for (const addons of combos) {
    const setting = { strength: 0, guard: false, addons };
    const full = render(image, "C08", setting, masks);
    for (const size of [16, 17, 31, 64]) {
      const tiled = new TiledRender(image, "C08", setting, masks, null, size).runAll();
      for (let x = 0; x < image.width; x++) {
        const i = ((image.height - 1) * image.width + x) * 3;
        equalBytes(full.image.data.subarray(i, i + 3), tiled.image.data.subarray(i, i + 3));
      }
      for (let y = 0; y < image.height; y++) {
        const i = (y * image.width + image.width - 1) * 3;
        equalBytes(full.image.data.subarray(i, i + 3), tiled.image.data.subarray(i, i + 3));
      }
    }
  }
});

test("repeated tiled exports are deterministic despite changes to tile size", () => {
  const { image, masks } = sample(51, 53, 1);
  const settings = { strength: 0, guard: true, addons: { grain: 80, structure: 70 } };
  const a = new TiledRender(image, "C08", settings, masks, null, 16).runAll();
  const b = new TiledRender(image, "C08", settings, masks, null, 19).runAll();
  const c = new TiledRender(image, "C08", settings, masks, null, 32).runAll();
  equalBytes(a.image.data, b.image.data);
  equalBytes(a.image.data, c.image.data);
  equalBytes(a.look.data, c.look.data);
});

test("mask snapshots isolate renders from edits performed between worker steps", () => {
  const { image, masks } = sample(51, 57, 4);
  const settings = { strength: 35, guard: true, addons: { grain: 65, structure: 55 } };
  const expected = new TiledRender(image, "C08", settings, masks, null, 16).runAll();
  const job = new TiledRender(image, "C08", settings, masks, null, 16);
  assert.equal(job.step(), false);
  masks.skin.data.fill(0);
  masks.person.data.fill(0);
  const actual = job.runAll();
  equalBytes(actual.image.data, expected.image.data);
  equalBytes(actual.look.data, expected.look.data);
});

test("source buffers are owned by each render, not read after construction", () => {
  const { image, masks } = sample(51, 57, 2);
  const settings = { strength: 0, guard: false, addons: { structure: 65 } };
  const expected = new TiledRender(image, "C08", settings, masks, null, 16).runAll();
  const job = new TiledRender(image, "C08", settings, masks, null, 16);
  image.data.fill(0);
  const actual = job.runAll();
  equalBytes(actual.image.data, expected.image.data);
});

test("result refuses to publish an unfinished export", () => {
  const { image, masks } = sample(45, 47, 1);
  const job = new TiledRender(image, "C08", { strength: 0,
    addons: { grain: 65 } }, masks, null, 16);
  assert.equal(job.done, false);
  assert.throws(() => job.result(), /not finished/);
  assert.equal(job.step(), false);
  assert.throws(() => job.result(), /not finished/);
  while (!job.done) job.step();
  assert.equal(job.done, true);
  assert.equal(job.result().image.data.length, image.data.length);
});

test("step count always moves forward and never repeats previous work", () => {
  const { image, masks } = sample(49, 54, 1);
  const job = new TiledRender(image, "C08", { strength: 0,
    addons: { grain: 70, structure: 70 } }, masks, null, 16);
  let previous = job.completed;
  for (let n = 0; n < job.total + 2 && !job.done; n++) {
    job.step();
    assert.ok(job.completed >= previous);
    assert.ok(job.completed <= job.total);
    previous = job.completed;
  }
  assert.equal(job.completed, job.total);
  assert.equal(job.current, "done");
});

test("the tile grid covers every pixel exactly once", () => {
  for (const [w, h, size] of [[51, 71, 16], [97, 83, 24], [64, 64, 64], [250, 40, 31]]) {
    const visits = new Uint8Array(w * h);
    const grid = tileGrid(w, h, size);
    for (const r of grid) for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) visits[y * w + x]++;
    }
    assert.ok(visits.every((n) => n === 1));
  }
});

test("mask capture rejects stale geometry, NaNs and out-of-range alpha", () => {
  const { image, masks } = sample(35, 39, 3);
  const original = captureMasks(masks, image.width, image.height);
  assert.notEqual(original.skin.data, masks.skin.data);
  assert.notEqual(original.person.data, masks.person.data);
  for (const bad of [NaN, Infinity, -Infinity, -0.01, 1.01]) {
    const corrupt = Float32Array.from(masks.skin.data);
    corrupt[5] = bad;
    assert.throws(() => captureMasks({ ...masks, skin: { ...masks.skin, data: corrupt } }, 35, 39), /alpha/);
  }
  assert.throws(() => captureMasks({ ...masks, skin: { ...masks.skin, width: 34 } }, 35, 39), /dimensions/);
});

test("a no-face render still uses the safe fallback contract", () => {
  const { image } = sample(49, 57, 5);
  const masks = { skin: null, person: null, source: "none", note: "" };
  for (const addon of combos) {
    const result = render(image, "C08", { strength: 87, addons: addon }, masks);
    assert.equal(result.plan.fallback, true);
    assert.equal(result.plan.strength, 30);
    assert.ok(result.notes.some((n) => n.includes("No skin outline")));
    assert.equal(result.image.data.length, image.data.length);
  }
});

test("protected skin remains exactly original even with both effects at 100", () => {
  const { image, masks } = sample(55, 61, 2);
  const settings = { strength: 0, protectSkin: true,
    addons: { grain: 100, structure: 100 } };
  const result = new TiledRender(image, "C08", settings, masks, null, 16).runAll();
  let protectedCount = 0;
  for (let p = 0; p < image.width * image.height; p++) {
    if (masks.skin.data[p] !== 1) continue;
    const i = p * 3;
    equalBytes(result.image.data.subarray(i, i + 3), image.data.subarray(i, i + 3));
    protectedCount++;
  }
  assert.ok(protectedCount > 50);
});

test("background only restores the full masked person", () => {
  const { image, masks } = sample(55, 61, 2);
  const settings = { strength: 0, backgroundOnly: true,
    addons: { grain: 100, structure: 100 } };
  const result = new TiledRender(image, "C08", settings, masks, null, 16).runAll();
  for (let p = 0; p < image.width * image.height; p++) {
    if (masks.person.data[p] !== 1) continue;
    const i = p * 3;
    equalBytes(result.image.data.subarray(i, i + 3), image.data.subarray(i, i + 3));
  }
});

test("reusing source masks across two jobs does not share a mutable snapshot", () => {
  const { image, masks } = sample(49, 53, 2);
  const setting = { strength: 0, addons: { grain: 75 } };
  const a = new TiledRender(image, "C08", setting, masks, null, 16);
  const b = new TiledRender(image, "C08", setting, masks, null, 16);
  a.step();
  b.step();
  masks.skin.data.fill(0);
  const first = a.runAll();
  const second = b.runAll();
  equalBytes(first.image.data, second.image.data);
});
