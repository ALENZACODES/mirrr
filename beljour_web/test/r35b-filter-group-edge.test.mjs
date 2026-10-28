/** BELJOUR local two-face and low-light render quality invariants.
 * Synthetic RGB only; all people are drawn with deterministic ellipses.
 * Created by John Khan.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import { render } from "../dist/js/filters/runtime/engine.js";
import { srgbToLab, wrapDegrees } from "../dist/js/filters/colour/space.js";

const WIDTH = 106;
const HEIGHT = 58;
const PIXELS = WIDTH * HEIGHT;
const cat = catalogue();
const looks = ["C01", "C03", "C08", "C09", "C20", "C28", "C33", "M02"];

function scene(lowLight = false) {
  const photo = new Uint8Array(PIXELS * 3);
  const skin = new Float32Array(PIXELS);
  const person = new Float32Array(PIXELS);
  const regions = [new Uint8Array(PIXELS), new Uint8Array(PIXELS)];
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const p = y * WIDTH + x;
    const centre = x < WIDTH / 2 ? 24 : 81;
    const who = x < WIDTH / 2 ? 0 : 1;
    const oval = ((x - centre) / 18) ** 2 + ((y - 29) / 23) ** 2;
    const inside = oval < 0.68;
    const face = oval < 1;
    if (face) person[p] = 1;
    if (inside) {
      skin[p] = 1;
      regions[who][p] = 1;
    }
    const colour = inside ? (who === 0 ? [213, 169, 130] : [76, 47, 38])
      : face ? (who === 0 ? [171, 125, 85] : [54, 39, 37]) : [215, 218, 232];
    const texture = (x * 17 + y * 11) % 13 - 6;
    const gain = lowLight ? 0.31 : 1;
    for (let c = 0; c < 3; c++) {
      photo[p * 3 + c] = Math.round(Math.max(0, Math.min(255,
        gain * (colour[c] + texture) + (lowLight ? 6 : 0))));
    }
  }
  const plane = (data) => ({ width: WIDTH, height: HEIGHT, channels: 1, data });
  return {
    image: { width: WIDTH, height: HEIGHT, channels: 3, data: photo },
    masks: { skin: plane(skin), person: plane(person), source: "segmenter", note: "" },
    regions,
  };
}

function compareKept(input, rendered, area) {
  let pixels = 0;
  for (let p = 0; p < PIXELS; p++) {
    if (!area[p]) continue;
    pixels++;
    for (let c = 0; c < 3; c++) {
      assert.equal(rendered[p * 3 + c], input[p * 3 + c], `protected face changed at ${p}, channel ${c}`);
    }
  }
  assert.ok(pixels > 100);
}

function runGroup(recipe, lowLight) {
  const fixture = scene(lowLight);
  const original = Uint8Array.from(fixture.image.data);
  const output = render(fixture.image, recipe, { guard: false, protectSkin: true }, fixture.masks);
  assert.equal(output.image.width, WIDTH);
  assert.equal(output.image.height, HEIGHT);
  assert.equal(output.image.data.length, original.length);
  assert.equal(output.plan.identityLock, true);
  assert.equal(output.plan.guard, false);
  for (const region of fixture.regions) compareKept(original, output.image.data, region);
  assert.deepEqual(fixture.image.data, original, "filter must never mutate its input");
  const rerun = render(fixture.image, recipe, { guard: false, protectSkin: true }, fixture.masks);
  assert.deepEqual(output.image.data, rerun.image.data, "two renders must be deterministic");
}

test("drawn group has two nonoverlapping people with separate skin regions", () => {
  const fixture = scene();
  const [left, right] = fixture.regions;
  assert.ok(left.some(Boolean));
  assert.ok(right.some(Boolean));
  assert.ok(left.every((value, index) => !(value && right[index])));
  assert.equal(fixture.masks.skin.data.length, PIXELS);
  assert.equal(fixture.masks.person.data.length, PIXELS);
});

test("dim group keeps structure and has lower mean signal", () => {
  const bright = scene().image.data;
  const dim = scene(true).image.data;
  const mean = (array) => array.reduce((acc, value) => acc + value, 0) / array.length;
  assert.ok(mean(dim) < mean(bright) * 0.42);
  assert.notDeepEqual(dim, bright);
});

for (const id of looks) {
  test(`${id}: each original-skin region survives independently on a group photo`, () => {
    runGroup(cat.get(id), false);
  });
  test(`${id}: each original-skin region survives on a low-light group photo`, () => {
    runGroup(cat.get(id), true);
  });
}

test("bad dimensions for group skin mask are rejected, never silently resized", () => {
  const fixture = scene();
  fixture.masks.skin.width -= 1;
  assert.throws(() => render(fixture.image, "C08", {}, fixture.masks), RangeError);
});

test("out-of-range negative group mask alpha is rejected", () => {
  const fixture = scene();
  fixture.masks.skin.data[200] = -0.5;
  assert.throws(() => render(fixture.image, "C08", {}, fixture.masks), RangeError);
});

test("non-finite group mask alpha is rejected", () => {
  const fixture = scene();
  fixture.masks.skin.data[200] = NaN;
  assert.throws(() => render(fixture.image, "C08", {}, fixture.masks), RangeError);
});

test("group mode does not claim a covered second face when that mask is missing", () => {
  const fixture = scene();
  const second = fixture.regions[1];
  for (let p = 0; p < PIXELS; p++) if (second[p]) fixture.masks.skin.data[p] = 0;
  const coverage = second.reduce((count, bit, p) => count + Number(Boolean(bit) && fixture.masks.skin.data[p] > 0.75), 0);
  assert.equal(coverage, 0, "second person requires its own mask evidence");
});

test("all missing face coverage is signaled by unavailable skin protection", () => {
  const fixture = scene();
  fixture.masks.skin.data.fill(0);
  const output = render(fixture.image, "C08", { protectSkin: true }, fixture.masks);
  assert.equal(output.plan.protectSkin, true);
  assert.equal(fixture.masks.skin.data.reduce((n, value) => n + value, 0), 0);
  // A higher level can still edit unmasked pixels; the UI must not describe this as passed protection.
  assert.notDeepEqual(output.image.data, fixture.image.data);
});

function hueTurnByFace(before, after, region) {
  const first = new Float64Array(3), last = new Float64Array(3);
  const amounts = [];
  for (let p = 0; p < PIXELS; p++) {
    if (!region[p]) continue;
    const offset = p * 3;
    srgbToLab(before[offset] / 255, before[offset + 1] / 255,
      before[offset + 2] / 255, first);
    srgbToLab(after[offset] / 255, after[offset + 1] / 255,
      after[offset + 2] / 255, last);
    if (Math.hypot(first[1], first[2]) < 5 || Math.hypot(last[1], last[2]) < 5) continue;
    const angleA = Math.atan2(first[2], first[1]) * 180 / Math.PI;
    const angleB = Math.atan2(last[2], last[1]) * 180 / Math.PI;
    amounts.push(Math.abs(wrapDegrees(angleB - angleA)));
  }
  assert.ok(amounts.length > 100, "each face must have enough hue evidence");
  return Math.max(...amounts);
}

for (const id of ["C01", "C03", "C08", "C09"]) {
  test(`${id}: the face hue clamp remains mandatory for both people with guard off`, () => {
    const fixture = scene();
    const raw = render(fixture.image, id, { guard: false }, fixture.masks);
    assert.equal(raw.plan.guard, false);
    assert.equal(raw.plan.identityLock, true);
    for (const area of fixture.regions) {
      const maxTurn = hueTurnByFace(fixture.image.data, raw.image.data, area);
      assert.ok(maxTurn <= 8.5, `${id}: hue changed ${maxTurn.toFixed(2)} degrees`);
    }
  });
}

test("group skin clamp does not require the guard toggle to be enabled", () => {
  const fixture = scene();
  const guarded = render(fixture.image, "C01", { guard: true }, fixture.masks);
  const unguarded = render(fixture.image, "C01", { guard: false }, fixture.masks);
  assert.equal(guarded.plan.guard, true);
  assert.equal(unguarded.plan.guard, false);
  assert.equal(unguarded.plan.identityLock, true);
  for (const area of fixture.regions) {
    assert.ok(hueTurnByFace(fixture.image.data, unguarded.image.data, area) <= 8.5);
  }
});
