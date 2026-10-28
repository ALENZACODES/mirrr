// Lane B: decimal levels, mandatory CIELAB hue lock, tiled parity and teeth refusal.
// All fixtures are synthetic numeric arrays; no test faces, external assets or uploads.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as H from "../dist/js/filters/masks/hue-lock.js";
import * as L from "../dist/js/filters/runtime/strength.js";
import * as E from "../dist/js/filters/runtime/engine.js";
import { withFilterLevel, filterLevel, settingsFor } from "../dist/js/filters/runtime/layer.js";
import { filterControls } from "../dist/js/filters/runtime/controls.js";
import { TiledRender } from "../dist/js/filters/runtime/tiles.js";
import { preview } from "../dist/js/engines/teeth/preview.js";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import { srgbToLab, wrapDegrees, DEG } from "../dist/js/filters/colour/space.js";

const dir = dirname(fileURLToPath(import.meta.url));
const vectorFile = resolve(dir, "../../parity/filters-r21b-hue-lock.json");
const vectors = JSON.parse(readFileSync(vectorFile, "utf8"));
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

function maskOf(testCase) {
  return { width: testCase.width, height: testCase.height, channels: 1, data: Float32Array.from(testCase.mask) };
}

function hueTurn(a, b) {
  const lab0 = [0, 0, 0], lab1 = [0, 0, 0];
  srgbToLab(a[0] / 255, a[1] / 255, a[2] / 255, lab0);
  srgbToLab(b[0] / 255, b[1] / 255, b[2] / 255, lab1);
  const before = Math.atan2(lab0[2], lab0[1]) * DEG, after = Math.atan2(lab1[2], lab1[1]) * DEG;
  return Math.abs(wrapDegrees(after - before));
}

test("Python and TypeScript hue locks agree on numeric mask swatches", () => {
  for (const v of vectors.cases) {
    const b = Uint8Array.from(v.before), styled = Uint8Array.from(v.styled);
    const output = H.clampHue(b, styled, maskOf(v));
    assert.equal(output.length, v.expected.length);
    // The two independent sRGB / CIELAB implementations agree within byte rounding.
    const maximum = Math.max(...output.map((x, i) => Math.abs(x - v.expected[i])));
    assert.ok(maximum <= 2, `${v.id}: maximum channel distance ${maximum}`);
    assert.ok(same(b, Uint8Array.from(v.before)), `${v.id}: immutable source`);
    assert.ok(same(styled, Uint8Array.from(v.styled)), `${v.id}: immutable look`);
    for (let i = 0; i < v.mask.length; i++) if (v.mask[i] === 0) {
      assert.deepEqual(Array.from(output.slice(3 * i, 3 * i + 3)), Array.from(styled.slice(3 * i, 3 * i + 3)));
    }
  }
});

test("hue-only protection survives the optional guard being turned off", () => {
  const before = new Uint8Array(48 * 48 * 3), input = [187, 126, 95];
  for (let p = 0; p < 48 * 48; p++) before.set(input, p * 3);
  const mask = new Float32Array(48 * 48);
  for (let y = 9; y < 39; y++) for (let x = 10; x < 38; x++) mask[y * 48 + x] = 1;
  const m = { width: 48, height: 48, channels: 1, data: mask };
  const r = catalogue().get("C08");
  const custom = { ...r, id: "C97", stages: [{ op: "colour.hsl", params: { bands: { red: { hue: 45 }, orange: { hue: 45 }, yellow: { hue: 45 } } } }] };
  const masks = { source: "landmarks", skin: m, person: m, note: "" };
  const raw = E.render({ width: 48, height: 48, channels: 3, data: before }, custom, { strength: 100, guard: false }, masks);
  assert.ok(hueTurn(input, raw.look.data.slice(3 * 20 * 48 + 3 * 20, 3 * 20 * 48 + 3 * 23)) > 10);
  assert.ok(hueTurn(input, raw.image.data.slice(3 * 20 * 48 + 3 * 20, 3 * 20 * 48 + 3 * 23)) <= 7);
  const tiled = new TiledRender({ width: 48, height: 48, channels: 3, data: before }, custom, { strength: 100, guard: false }, masks, null, 16).runAll();
  assert.ok(same(raw.image.data, tiled.image.data));
  assert.ok(same(raw.look.data, tiled.look.data));
});

test("level mapping is strict and a filter layer previews at the chosen decimal", () => {
  assert.deepEqual(L.levelValues().slice(0, 4), [1, 1.1, 1.2, 1.3]);
  assert.equal(L.levelValues().at(-1), 5);
  for (const level of L.levelValues()) {
    assert.equal(L.checkedLevel(level), level);
    assert.equal(L.fromPercent(L.toPercent(level)), level);
  }
  assert.equal(L.toPercent(4.2), 84);
  assert.equal(L.fromPercent(30), 1.5);
  for (const input of [0, 5.1, 3.05, NaN, Infinity, -Infinity]) assert.throws(() => L.checkedLevel(input), RangeError);
  const layer = { parameters: { recipe: "C01", guard: false }, strength: 30 };
  const change = withFilterLevel(layer, 4.2);
  assert.equal(change.parameters.level, 4.2);
  assert.equal(change.parameters.identity_lock, true);
  assert.equal(change.strength, 84);
  assert.equal(filterLevel(change), 4.2);
  assert.equal(settingsFor(change).level, 4.2);
  assert.equal(E.plan(catalogue().get("C01"), settingsFor(change), true).strength, 84);
  assert.equal(E.plan(catalogue().get("C01"), {}, true).identityLock, true);
  assert.equal(layer.parameters.level, undefined, "the old layer remains unchanged");
  const controls = filterControls(change);
  assert.equal(controls.level, 4.2);
  assert.equal(controls.levels.length, 41);
  assert.equal(controls.identityLock, true);
  assert.match(controls.hint, /Identity Lock starts on/);
});

function photo() {
  const width = 32, height = 28, data = new Uint8ClampedArray(width * height * 3);
  const mask = new Float64Array(width * height);
  for (let p = 0; p < width * height; p++) data.set([75, 75, 75], p * 3);
  for (let y = 10; y < 18; y++) for (let x = 9; x < 23; x++) {
    const p = y * width + x;
    data.set(y >= 12 && y < 16 && x >= 12 && x < 20 ? [212, 197, 171] : [110, 80, 75], p * 3);
    mask[p] = 1;
  }
  return { image: { width, height, channels: 3, data }, mask };
}

test("closed or unknown mouth always returns original RGB bytes and zero alpha", () => {
  const { image, mask } = photo();
  const original = Uint8ClampedArray.from(image.data);
  for (const state of ["closed", "unknown"]) {
    const outcome = preview(image, mask, state, 3.2);
    assert.equal(outcome.status, "refused");
    assert.equal(outcome.refused, true);
    assert.equal(outcome.changed, 0);
    assert.ok(same(outcome.image, original));
    assert.ok(outcome.alpha.every((v) => v === 0));
    assert.notStrictEqual(outcome.image, image.data);
    assert.ok(same(image.data, original));
  }
  const invalid = Float64Array.from(mask); invalid[0] = NaN;
  for (const state of ["closed", "unknown"]) {
    const outcome = preview(image, invalid, state, 2.3);
    assert.equal(outcome.status, "refused");
    assert.ok(same(outcome.image, original));
  }
  assert.equal(preview(image, null, "open").refused, true);
  assert.equal(preview(image, new Float64Array(mask.length), "open").refused, true);
});

test("teeth preview requires verified open mouth and edits only local enamel", () => {
  const { image, mask } = photo();
  const result = preview(image, mask, "open", 4.2);
  assert.equal(result.status, "preview");
  assert.ok(result.changed > 0);
  assert.equal(result.level, 4.2);
  assert.match(result.caption, /not dental treatment/);
  for (let p = 0; p < mask.length; p++) if (result.alpha[p] === 0) {
    for (let c = 0; c < 3; c++) assert.equal(result.image[p * 3 + c], image.data[p * 3 + c]);
  }
  assert.throws(() => preview(image, mask, "open", 4.25), RangeError);
  const invalid = Float64Array.from(mask); invalid[0] = NaN;
  assert.throws(() => preview(image, invalid, "open"), RangeError);
});
