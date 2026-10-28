/** R30B public Pro-level parity and mandatory hue across tiled/whole renders.
 * All images are synthetic byte arrays. Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LEVEL_TICKS, DEFAULT_IDENTITY_POLICY, levelDose, levelFromTenths,
  parseLevel, ProLevelError,
} from "../dist/js/commands/index.js";
import * as B from "../dist/js/filters/runtime/strength.js";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import {
  DEFAULT_RECIPE, defaultFilterParams, filterLevel, filterOptions, settingsFor,
  withFilterLevel,
} from "../dist/js/filters/runtime/layer.js";
import { filterControls } from "../dist/js/filters/runtime/controls.js";
import { plan, render } from "../dist/js/filters/runtime/engine.js";
import { TiledRender } from "../dist/js/filters/runtime/tiles.js";
import {
  HUE_MAX, HUE_MARGIN, clampHue, faceMask,
} from "../dist/js/filters/masks/hue-lock.js";
import { DEG, srgbToLab, wrapDegrees } from "../dist/js/filters/colour/space.js";

const here = dirname(fileURLToPath(import.meta.url));
const parity = JSON.parse(readFileSync(resolve(here, "../../parity/filters-r21b-hue-lock.json"), "utf8"));

function equalBytes(left, right, message = "RGB byte parity") {
  assert.equal(left.length, right.length, `${message}: lengths differ`);
  assert.ok(left.every((v, i) => v === right[i]), message);
}

function difference(a, b) {
  assert.equal(a.length, b.length);
  return a.reduce((sum, value, index) => sum + Number(value !== b[index]), 0);
}

function pixel(image, x, y) {
  const offset = 3 * (y * image.width + x);
  return Array.from(image.data.slice(offset, offset + 3));
}

function hue(a, b) {
  const first = [0, 0, 0];
  const last = [0, 0, 0];
  srgbToLab(a[0] / 255, a[1] / 255, a[2] / 255, first);
  srgbToLab(b[0] / 255, b[1] / 255, b[2] / 255, last);
  return Math.abs(wrapDegrees(
    Math.atan2(last[2], last[1]) * DEG -
    Math.atan2(first[2], first[1]) * DEG,
  ));
}

function drawn(width = 51, height = 47) {
  const data = new Uint8Array(width * height * 3);
  const skin = new Float32Array(width * height);
  const face = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const inside = x >= 6 && x < width - 6 && y >= 4 && y < height - 4;
      const edge = x === 6 || y === 4 || x === width - 7 || y === height - 5;
      skin[p] = inside ? edge ? 0.25 : 1 : 0;
      face[p] = inside ? 1 : 0;
      data[p * 3] = inside ? 185 + (x * 3 + y * 7) % 8 : 35 + x % 20;
      data[p * 3 + 1] = inside ? 122 + (x + 3 * y) % 11 : 77 + y % 12;
      data[p * 3 + 2] = inside ? 92 + (2 * x + y) % 9 : 113 + x % 15;
    }
  }
  const mask = data => ({ width, height, channels: 1, data });
  return {
    image: { width, height, channels: 3, data },
    masks: { source: "landmarks", skin: mask(skin), person: mask(face), note: "" },
    skin: mask(skin), face: mask(face),
  };
}

function rotatedRecipe() {
  const r = catalogue().get("C08");
  return {
    ...r, id: "C97",
    stages: [{ op: "colour.hsl", params: {
      bands: {
        red: { hue: 52 }, orange: { hue: 48 }, yellow: { hue: 45 },
      },
    } }],
  };
}

test("Lane H public decimal mapping equals the filter mapping at every level", () => {
  assert.equal(LEVEL_TICKS.length, 41);
  assert.deepEqual(B.levelValues().map(value => value.toFixed(1)), LEVEL_TICKS);
  assert.equal(DEFAULT_IDENTITY_POLICY.enabled, true);
  for (const decimal of LEVEL_TICKS) {
    const level = Number(decimal);
    const parsed = parseLevel(decimal);
    assert.equal(levelFromTenths(Math.round(level * 10)), parsed);
    assert.equal(B.checkedLevel(level), level);
    assert.equal(B.fromPercent(B.toPercent(level)), level);
    assert.ok(Math.abs(B.toPercent(level) - levelDose(parsed) * 100) < 1e-9);
  }
  assert.equal(B.toPercent(1), 20);
  assert.equal(B.toPercent(3), 60);
  assert.equal(B.toPercent(5), 100);
  assert.equal(B.fromPercent(0), 1);
  assert.equal(B.fromPercent(30), 1.5);
  assert.throws(() => parseLevel(5.01), ProLevelError);
  for (const bad of [NaN, Infinity, -Infinity, -2, 0, 0.9, 3.05, 5.1, 100]) {
    assert.throws(() => B.checkedLevel(bad), RangeError);
  }
});

test("every new filter layer starts with requested identity lock enabled", () => {
  assert.equal(DEFAULT_RECIPE, "C08");
  for (const option of filterOptions()) {
    assert.equal(option.params.identity_lock, true, option.recipe);
    assert.equal(settingsFor({ parameters: option.params, strength: option.strength }).identityLock, true);
    assert.equal(plan(catalogue().get(option.recipe), {}, true).identityLock, true);
  }
  assert.equal(defaultFilterParams("C03").identity_lock, true);
});

test("explicit filter levels are validated, stored, and used in renderer plans", () => {
  for (const level of [1, 1.1, 1.8, 2.5, 3.7, 4.2, 5]) {
    const original = { strength: 30, parameters: { recipe: "C03", guard: false } };
    const updated = withFilterLevel(original, level);
    assert.equal(updated.parameters.identity_lock, true);
    assert.equal(updated.parameters.level, level);
    assert.equal(updated.strength, B.toPercent(level));
    assert.equal(original.parameters.level, undefined);
    assert.equal(filterLevel(updated), level);
    const settings = settingsFor(updated);
    assert.equal(settings.level, level);
    assert.equal(settings.guard, false);
    const compiled = plan(catalogue().get("C03"), settings, true);
    assert.equal(compiled.strength, B.toPercent(level));
    assert.equal(compiled.identityLock, true);
    const controls = filterControls(updated);
    assert.equal(controls.level, level);
    assert.equal(controls.identityLock, true);
    assert.equal(controls.levels.length, 41);
  }
});

test("mandatory lock is independent of the optional lightness and chroma guard", () => {
  const f = drawn();
  const r = rotatedRecipe();
  const input = pixel(f.image, 15, 20);
  for (const guard of [true, false]) {
    for (const protectSkin of [true, false]) {
      const result = render(f.image, r, {
        level: 5, guard, protectSkin, identityLock: true,
      }, f.masks);
      assert.equal(result.plan.strength, 100);
      assert.equal(result.plan.guard, guard);
      assert.equal(result.plan.identityLock, true);
      assert.ok(hue(input, pixel(result.look, 15, 20)) > 10);
      assert.ok(hue(input, pixel(result.image, 15, 20)) <= HUE_MAX + 1);
      assert.equal(result.image.data.length, f.image.data.length);
      assert.ok(difference(f.image.data, result.image.data) > 0);
    }
  }
});

test("Python hue vectors stay within defined TS parity tolerance without input mutation", () => {
  for (const item of parity.cases) {
    const before = Uint8Array.from(item.before);
    const styled = Uint8Array.from(item.styled);
    const source = Uint8Array.from(before);
    const effect = Uint8Array.from(styled);
    const mask = {
      width: item.width, height: item.height, channels: 1,
      data: Float32Array.from(item.mask),
    };
    const limited = clampHue(before, styled, mask);
    assert.equal(limited.length, item.expected.length);
    assert.ok(Math.max(...limited.map((value, i) => Math.abs(value - item.expected[i]))) <= 2);
    equalBytes(before, source, `input mutated in ${item.id}`);
    equalBytes(styled, effect, `look mutated in ${item.id}`);
  }
  assert.equal(HUE_MAX, 6);
  assert.equal(HUE_MARGIN, 1);
});

test("no reliable face mask is not treated as known skin", () => {
  const f = drawn();
  const onlyPerson = { source: "segmenter", person: f.face, skin: null, note: "" };
  assert.equal(faceMask(onlyPerson), null);
  const noMask = { source: "none", person: null, skin: null, note: "" };
  assert.equal(faceMask(noMask), null);
  assert.equal(faceMask(f.masks), f.masks.skin);
  const noSkin = render(f.image, rotatedRecipe(), {
    guard: false, strength: 100,
  }, onlyPerson);
  assert.equal(noSkin.plan.fallback, false);
  assert.ok(difference(f.image.data, noSkin.image.data) > 0);
  const withFallback = render(f.image, rotatedRecipe(), {
    guard: true, strength: 100,
  }, onlyPerson);
  assert.equal(withFallback.plan.fallback, true);
  assert.equal(withFallback.plan.strength, 30);
  assert.ok(withFallback.notes.some(note => note.includes("skin outline")));
});

test("whole and tiled pixels agree across skin guard and block sizes", () => {
  const fixture = drawn(47, 49);
  for (const id of ["C03", "C08", "M02"]) {
    for (const guard of [true, false]) {
      const settings = { strength: 70, guard, protectSkin: false };
      const rec = catalogue().get(id);
      const expected = render(fixture.image, rec, settings, fixture.masks);
      for (const block of [16, 23, 32, 64]) {
        const job = new TiledRender(
          fixture.image, rec, settings, fixture.masks, null, block,
        );
        assert.equal(job.done, false);
        const observed = job.runAll();
        assert.equal(job.done, true);
        assert.equal(job.current, "done");
        equalBytes(
          observed.image.data, expected.image.data,
          `${id} guard=${guard} block=${block} output mismatch`,
        );
        equalBytes(
          observed.look.data, expected.look.data,
          `${id} guard=${guard} block=${block} look mismatch`,
        );
      }
    }
  }
});

test("tiled render gives identical pixels with protected skin and explicit level", () => {
  const fixture = drawn(53, 45);
  const recipe = rotatedRecipe();
  for (const level of [1.0, 2.7, 4.8]) {
    for (const skinGuard of [false, true]) {
      const settings = { level, guard: skinGuard, protectSkin: true };
      const expected = render(fixture.image, recipe, settings, fixture.masks);
      const tiles = new TiledRender(
        fixture.image, recipe, settings, fixture.masks, null, 17,
      ).runAll();
      equalBytes(expected.image.data, tiles.image.data);
      equalBytes(expected.look.data, tiles.look.data);
      assert.equal(tiles.plan.strength, B.toPercent(level));
    }
  }
});

test("locked soft mask edges do not affect unrelated background pixels", () => {
  const source = drawn(37, 39);
  const r = rotatedRecipe();
  const before = Uint8Array.from(source.image.data);
  const raw = render(source.image, r, {
    level: 5, guard: false,
  }, source.masks);
  assert.ok(difference(raw.look.data, raw.image.data) > 0);
  for (let y = 0; y < 39; y++) {
    for (let x = 0; x < 37; x++) {
      const index = y * 37 + x;
      if (source.skin.data[index] !== 0) continue;
      for (let channel = 0; channel < 3; channel++) {
        assert.equal(raw.image.data[3 * index + channel], raw.look.data[3 * index + channel]);
      }
    }
  }
  equalBytes(before, source.image.data, "render mutated original photo");
});
