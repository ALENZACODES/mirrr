/** Additional local filter looks and non-destructive preview contracts.
 * Synthetic signals only. No user images, third-party LUTs, assets or network.
 * Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import { clampHue } from "../dist/js/filters/masks/hue-lock.js";
import { defaultFilterParams, BUILT_ADDON_IDS, addonParamKey, settingsFor, filterOptions } from "../dist/js/filters/runtime/layer.js";
import { filterControls } from "../dist/js/filters/runtime/controls.js";
import { render, plan } from "../dist/js/filters/runtime/engine.js";
import { TiledRender, captureMasks } from "../dist/js/filters/runtime/tiles.js";

const ADDS = ["vignette", "centre-light", "glow"];
const CHOSEN = ["C01", "C03", "C08", "C09", "C102", "C103", "C105", "C106", "C107", "C14"];

function synthetic(width = 66, height = 75) {
  const data = new Uint8Array(width * height * 3);
  const skin = new Float32Array(width * height);
  const person = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x, i = p * 3;
    data[i] = Math.min(255, 18 + (x * 5 + y * 2) % 190);
    data[i + 1] = Math.min(255, 25 + (x * 3 + y * 4) % 190);
    data[i + 2] = Math.min(255, 22 + (x * 2 + y * 5) % 190);
    if (x < 12 && y < 12) data.fill(253, i, i + 3);
    const oval = ((x - width * 0.5) / (width * 0.35)) ** 2 + ((y - height * 0.52) / (height * 0.38)) ** 2;
    skin[p] = oval < 0.65 ? 0.9 : oval < 0.8 ? 0.25 : 0;
    person[p] = oval <= 1 ? 1 : 0;
  }
  const wrap = (data) => ({ width, height, channels: 1, data });
  return { image: { width, height, channels: 3, data }, masks: {
    skin: wrap(skin), person: wrap(person), source: "landmarks", note: "" } };
}

function equalBytes(left, right) {
  assert.equal(left.length, right.length);
  assert.deepEqual(Buffer.from(left), Buffer.from(right));
}

function differentPixels(left, right) {
  assert.equal(left.length, right.length);
  let changed = 0;
  for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) changed++;
  return changed;
}

function settingsForAddon(addon, amount, guard = true) {
  return { strength: 0, guard, addons: { [addon]: amount } };
}

test("top thirty looks have stable unique ranks and own recipes", () => {
  const names = catalogue().recipes.slice(0, 30);
  assert.equal(names.length, 30);
  assert.equal(new Set(names.map((r) => r.id)).size, 30);
  assert.ok(names.every((r) => r.status === "Build" && r.version >= 1));
  assert.ok(names.every((r) => r.limits.geometry === "none"));
  assert.ok(names.every((r) => !r.limits.simulationLabel));
});

test("three additional add-ons are built and remain local to the renderer", () => {
  const expected = { vignette: "light.vignette", "centre-light": "light.centre", glow: "spatial.glow" };
  for (const [id, op] of Object.entries(expected)) {
    const a = catalogue().addons.get(id);
    assert.ok(a.built);
    assert.equal(a.stage.op, op);
    assert.equal(a.round, "FX2");
  }
  assert.equal(catalogue().addons.get("grain").built, true);
  assert.equal(catalogue().addons.get("grain").manualOnly, true);
  assert.equal(catalogue().addons.get("structure").built, true);
  assert.equal(catalogue().addons.get("structure").manualOnly, true);
  assert.equal(catalogue().addons.get("halation").built, true);
  assert.equal(catalogue().addons.get("border").built, true);
  assert.deepEqual(BUILT_ADDON_IDS, ["fade", ...ADDS, "halation", "border", "grain", "structure"]);
});

test("new inspector control values are explicit, typed and self-consistent", () => {
  const c = filterControls({ parameters: defaultFilterParams("C09") });
  assert.deepEqual(c.addons.map((a) => a.id), BUILT_ADDON_IDS);
  assert.deepEqual(c.addons.map((a) => a.key), [
    "addon_fade", "addon_vignette", "addon_centre_light", "addon_glow",
    "addon_halation", "addon_border", "addon_grain", "addon_structure",
  ]);
  assert.ok(c.addons.every((a) => a.maximum === 100 && a.amount === 0));
  for (const a of c.addons) {
    assert.ok(a.label.length > 0);
    assert.equal(addonParamKey(a.id), a.key);
  }
  assert.equal(c.identityLock, true);
  assert.equal(c.levels.length, 41);
});

test("legacy layers with Fade only do not invent new add-on settings", () => {
  const old = settingsFor({ strength: 45, parameters: {
    recipe: "C03", preset: "", guard: true, protect: false, background: false,
    addon_fade: 65, identity_lock: false,
  } });
  assert.deepEqual(old.addons, { fade: 65 });
  assert.equal(old.identityLock, false);
  assert.equal(old.strength, 45);
  const fresh = settingsFor({ strength: 45, parameters: defaultFilterParams("C03") });
  assert.deepEqual(fresh.addons, { fade: 0, vignette: 0, "centre-light": 0, glow: 0, halation: 0, border: 0 });
  assert.equal(fresh.identityLock, true);
});

test("invalid add-on parameter values fail closed before preview", () => {
  for (const name of BUILT_ADDON_IDS) {
    for (const bad of [NaN, Infinity, -Infinity, -1, true, "4", null]) {
      const params = { ...defaultFilterParams("C03"), [addonParamKey(name)]: bad };
      assert.throws(() => settingsFor({ parameters: params, strength: 60 }), /finite non-negative amount/);
    }
  }
});

test("legacy Fade clamp from 140% to 100% remains compatible", () => {
  const layers = { parameters: { recipe: "C39", addon_fade: 140,
    addon_vignette: 135, addon_centre_light: 102, addon_glow: 1000 }, strength: 55 };
  const s = settingsFor(layers);
  assert.deepEqual(s.addons, { fade: 100, vignette: 100, "centre-light": 100, glow: 100 });
});

for (const addon of ADDS) {
  test(`${addon}: full render and tiled export are exact across sizes`, () => {
    const { image, masks } = synthetic(67, 72);
    const settings = settingsForAddon(addon, 74, true);
    const full = render(image, "C08", settings, masks, [34, 38]);
    assert.equal(full.plan.identity, false);
    for (const size of [16, 23, 64]) {
      const tiled = new TiledRender(image, "C08", settings, masks, [34, 38], size).runAll();
      equalBytes(tiled.image.data, full.image.data);
      equalBytes(tiled.look.data, full.look.data);
      assert.deepEqual(tiled.plan.stages, full.plan.stages);
      assert.deepEqual(tiled.notes, full.notes);
    }
  });

  test(`${addon}: an explicitly disabled guard does not break tile parity`, () => {
    const { image, masks } = synthetic(51, 43);
    const settings = { strength: 100, guard: false, addons: { [addon]: 100 } };
    const whole = render(image, "C09", settings, masks, [26, 22]);
    const part = new TiledRender(image, "C09", settings, masks, [26, 22], 16).runAll();
    equalBytes(part.image.data, whole.image.data);
    assert.equal(part.plan.guard, false);
    assert.ok(differentPixels(part.look.data, image.data) > 0);
  });

  test(`${addon}: effect at strength zero stays reversible`, () => {
    const { image, masks } = synthetic(40, 48);
    const original = Uint8Array.from(image.data);
    const none = render(image, "C08", settingsForAddon(addon, 0), masks);
    const enabled = render(image, "C08", settingsForAddon(addon, 100), masks);
    assert.equal(none.plan.identity, true);
    assert.equal(enabled.plan.identity, false);
    equalBytes(none.image.data, original);
    assert.ok(differentPixels(enabled.image.data, original) > 0);
    equalBytes(image.data, original);
  });

  test(`${addon}: all pixel buffers are private to the render`, () => {
    const { image, masks } = synthetic(41, 53);
    const before = Uint8Array.from(image.data);
    const skin = Float32Array.from(masks.skin.data);
    const first = render(image, "C03", settingsForAddon(addon, 60, false), masks);
    const second = render(image, "C03", settingsForAddon(addon, 60, false), masks);
    equalBytes(first.image.data, second.image.data);
    equalBytes(image.data, before);
    equalBytes(masks.skin.data, skin);
    assert.notEqual(first.image.data.buffer, image.data.buffer);
  });

  test(`${addon}: keep person and keep skin make hard-alpha pixels exact`, () => {
    const { image, masks } = synthetic(48, 56);
    for (const [flag, mask] of [["protectSkin", masks.skin], ["backgroundOnly", masks.person]]) {
      const a = render(image, "C03", { strength: 90, addons: { [addon]: 80 }, guard: false,
        [flag]: true }, masks);
      for (let p = 0; p < mask.data.length; p++) {
        if (mask.data[p] < 0.5) continue;
        for (let k = 0; k < 3; k++) assert.equal(a.image.data[p * 3 + k], image.data[p * 3 + k]);
      }
    }
  });
}

for (const rid of CHOSEN) {
  test(`${rid}: explicit zero add-ons never move the original look bytes`, () => {
    const { image, masks } = synthetic(33, 40);
    const a = render(image, rid, {}, masks);
    const b = render(image, rid, { addons: {
      vignette: 0, "centre-light": 0, glow: 0 } }, masks);
    equalBytes(a.image.data, b.image.data);
    equalBytes(a.look.data, b.look.data);
    assert.deepEqual(a.plan.stages, b.plan.stages);
  });
}

test("new add-ons have no effect on fixed recipe and thumbnail ordering", () => {
  const before = catalogue().recipes.map((r) => `${r.rank}/${r.id}`);
  const after = filterOptions().map((r) => `${r.rank}/${r.recipe}`);
  assert.deepEqual(after, before);
  assert.equal(catalogue().recipes[0].id, "C01");
  assert.equal(catalogue().recipes.length, new Set(after).size);
});

test("a masked hue clamp is mandatory with guard disabled on a colour look", () => {
  const { image, masks } = synthetic(27, 36);
  const data = Uint8Array.from(image.data);
  const styled = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 3) {
    styled[i] = data[i + 1];
    styled[i + 1] = data[i + 2];
    styled[i + 2] = data[i];
  }
  const adjusted = clampHue(data, styled, masks.skin);
  assert.ok(differentPixels(adjusted, styled) > 0);
  equalBytes(data, image.data);
  const result = render(image, "C03", { level: 5, guard: false,
    addons: { vignette: 80, "centre-light": 80, glow: 80 } }, masks);
  assert.equal(result.plan.guard, false);
  assert.equal(result.plan.identityLock, true);
  assert.equal(result.plan.strength, 100);
});

test("a captured filter mask never aliases source alpha buffers", () => {
  const { image, masks } = synthetic();
  const frozen = captureMasks(masks, image.width, image.height);
  const before = Float32Array.from(frozen.skin.data);
  masks.skin.data.fill(0);
  masks.person.data.fill(0);
  equalBytes(new Uint8Array(frozen.skin.data.buffer), new Uint8Array(before.buffer));
});
