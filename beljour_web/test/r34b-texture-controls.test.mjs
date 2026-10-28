/** BELJOUR finishing controls: migration, opt-in behavior and safe preview.
 * Pixel references are drawn locally, with legacy hashes from r33b-cp2.
 * Created by John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import { checkCatalogue } from "../dist/js/filters/recipe/schema.js";
import { render, plan } from "../dist/js/filters/runtime/engine.js";
import {
  defaultFilterParams, BUILT_ADDON_IDS, addonParamKey, settingsFor, withFilterLevel,
} from "../dist/js/filters/runtime/layer.js";
import { filterControls } from "../dist/js/filters/runtime/controls.js";

const oldHashes = {
  C93: ["44dbbfae44ad362e83870503f9b9ba59c78e92f44782480a23e3349799bf2d0a",
    "1d63b97e8d406b328e9e9f1950da3f13df76abad1de4edc8164d7439e5e431d8", ["grain FX2"]],
  C15: ["29dee95f615faa913fd8cfaa954209431b6a53244fa281fbcc43c0217fbf12dc",
    "3c384d915f9379b64d3d827b75a59035bb5c66f01407aeb80fdc3af10de7fb2f", ["structure FX2"]],
  C24: ["0d93b82a6e2859d3b2cdb1631a33cc73b796d14a216f92d83d5ee8748c18fea5",
    "6a371b4425dfa11967139bff31131abe1c41d9555fb81deda6dd4337fc699cec", ["structure FX2"]],
  C23: ["12f0e6852a451c7abc9b51e88696fbfe20b525a5698b79787473fc6424e1cc91",
    "8a7661145bc45ce3e1123342806bccb05fb7ff0d3282a2a403a571283ed7b52f", ["structure FX2"]],
  M05: ["bf092dcfb914bffd9899ccc37eba0729d069d910ec0155ecc224aa57fd918721",
    "8d002288bd3f5d3b42198bffc0fc7b0fc5446a118094c603f7ccdbd47c824351", ["structure FX2", "grain FX2"]],
};

function photo(width = 47, height = 53) {
  const n = width * height;
  const pixels = new Uint8Array(n * 3);
  const skin = new Float32Array(n), person = new Float32Array(n);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x, i = p * 3;
    pixels[i] = (x * 31 + y * 7 + 51) % 256;
    pixels[i + 1] = (x * 13 + y * 23 + 77) % 256;
    pixels[i + 2] = (x * 19 + y * 11 + 29) % 256;
    const oval = ((x - width / 2) / (width * 0.32)) ** 2 +
      ((y - height / 2) / (height * 0.40)) ** 2;
    skin[p] = oval < 0.65 ? 1 : 0;
    person[p] = oval < 1 ? 1 : 0;
  }
  const plane = (data) => ({ width, height, channels: 1, data });
  return { image: { width, height, channels: 3, data: pixels },
    masks: { skin: plane(skin), person: plane(person), source: "landmarks", note: "" } };
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const source = photo();
const cat = catalogue();
const defaultLayer = (id) => ({ strength: cat.get(id).defaults.strength, parameters: defaultFilterParams(id) });
const modifiedBytes = (a, b) => a.reduce((n, v, i) => n + Number(v !== b[i]), 0);

test("all 61 source recipes still validate after manual activation metadata", () => {
  assert.equal(cat.recipes.length, 61);
  assert.deepEqual(checkCatalogue(cat.data), []);
  for (const item of cat.recipes) {
    assert.ok(item.editorial.family);
    assert.ok(item.editorial.light);
    assert.ok(item.provenance.writtenFrom.includes("filters-plan.md"));
  }
});

test("old built add-ons still exist and new two are explicitly opt-in", () => {
  assert.deepEqual(BUILT_ADDON_IDS, ["fade", "vignette", "centre-light", "glow", "halation",
    "border", "grain", "structure"]);
  for (const id of ["grain", "structure"]) {
    const meta = cat.addons.get(id);
    assert.equal(meta.built, true);
    assert.equal(meta.manualOnly, true);
    assert.equal(meta.stage.op, `spatial.${id}`);
    assert.equal(meta.round, "FX2");
  }
  for (const id of BUILT_ADDON_IDS.slice(0, 6)) {
    assert.notEqual(cat.addons.get(id).built, false);
    assert.equal(cat.addons.get(id).manualOnly, undefined);
  }
});

test("catalogue refuses inconsistent manualOnly state, including string flags", () => {
  const wrong = structuredClone(cat.data);
  const grain = wrong.addons.find((item) => item.id === "grain");
  grain.manualOnly = "true";
  assert.ok(checkCatalogue(wrong).some((e) => e.includes("manualOnly must be a boolean")));
  grain.manualOnly = true;
  grain.built = false;
  assert.ok(checkCatalogue(wrong).some((e) => e.includes("manualOnly needs a built stage")));
});

test("old manual effect default renders match r33b-cp2 bytes and pending notes", () => {
  for (const [id, [before, look, pending]] of Object.entries(oldHashes)) {
    const out = render(source.image, id, {}, source.masks);
    assert.equal(hash(out.image.data), before, `${id} finished image`);
    assert.equal(hash(out.look.data), look, `${id} original look`);
    assert.deepEqual(out.plan.pending, pending);
  }
});

test("new filter layers start Grain and Structure at zero even for old intent", () => {
  for (const id of ["C93", "C15", "C24", "C23", "M05", "C08"]) {
    const p = defaultFilterParams(id);
    assert.equal(p.addon_grain, 0, id);
    assert.equal(p.addon_structure, 0, id);
    assert.equal(p.identity_lock, true, id);
    const result = settingsFor(defaultLayer(id));
    assert.ok(!Object.hasOwn(result.addons, "grain"));
    assert.ok(!Object.hasOwn(result.addons, "structure"));
  }
});

test("default chosen filter layer stays byte-identical to historical direct recipe", () => {
  for (const id of Object.keys(oldHashes)) {
    const legacy = render(source.image, id, {}, source.masks);
    const settings = settingsFor(defaultLayer(id));
    const current = render(source.image, id, settings, source.masks);
    assert.deepEqual(current.image.data, legacy.image.data);
    assert.deepEqual(current.look.data, legacy.look.data);
  }
});

test("visible controls include honest review guidance, not an unbuilt claim", () => {
  for (const id of ["C93", "M05"]) {
    const controls = filterControls(defaultLayer(id));
    assert.ok(controls.hint.includes("Pending visual review"));
    assert.ok(controls.addons.some((a) => a.id === "grain"));
    assert.ok(controls.addons.some((a) => a.id === "structure"));
    assert.ok(controls.addons.every((a) => a.maximum === 100));
    assert.equal(controls.identityLock, true);
  }
  const clean = filterControls(defaultLayer("C08"));
  assert.ok(!clean.hint.includes("Pending visual review"));
});

test("user moving each slider above zero produces a real spatial stage", () => {
  for (const id of ["grain", "structure"]) {
    const settings = settingsFor({ strength: 0, parameters: {
      ...defaultFilterParams("C08"), [addonParamKey(id)]: 66,
    } });
    const out = render(source.image, "C08", settings, source.masks);
    assert.equal(settings.addons[id], 66);
    assert.ok(out.plan.stages.some((s) => s.op === `spatial.${id}`));
    assert.ok(modifiedBytes(out.image.data, source.image.data) > 20);
  }
});

test("zero added strength plus explicit texture still produces a valid look", () => {
  for (const id of ["grain", "structure"]) {
    const settings = { strength: 0, guard: false, addons: { [id]: 75 } };
    const out = render(source.image, "C08", settings, source.masks);
    assert.equal(out.plan.identity, false);
    assert.equal(out.plan.stages.filter((s) => s.op === `spatial.${id}`).length, 1);
  }
});

test("zero amount does not allocate a nonneutral stage", () => {
  const base = plan(cat.get("C08"), { strength: 0 }, true);
  assert.equal(base.identity, true);
  for (const id of ["grain", "structure"]) {
    const setting = { strength: 0, addons: { [id]: 0 } };
    const p = plan(cat.get("C08"), setting, true);
    assert.equal(p.identity, true);
    assert.ok(!p.stages.some((s) => s.op === `spatial.${id}`));
  }
});

test("the two manual shaders always compose in structure-then-grain order", () => {
  for (const addons of [{ grain: 51, structure: 47 }, { structure: 47, grain: 51 }]) {
    const p = plan(cat.get("C08"), { strength: 30, addons }, true);
    const names = p.stages.map((s) => s.op);
    assert.ok(names.indexOf("spatial.structure") < names.indexOf("spatial.grain"));
  }
});

test("for every filter, no legacy default silently starts manual shaders", () => {
  for (const item of cat.recipes) {
    const p = plan(item, {}, true);
    assert.ok(!p.stages.some((s) => s.op === "spatial.grain" || s.op === "spatial.structure"), item.id);
  }
});

test("a colour-preserving shade filter keeps identity lock across control changes", () => {
  const base = { strength: 29, parameters: { ...defaultFilterParams("C08"), identity_lock: false } };
  const updated = withFilterLevel(base, 3.6);
  assert.equal(updated.parameters.identity_lock, false);
  assert.equal(updated.parameters.level, 3.6);
  assert.equal(settingsFor(updated).identityLock, false);
  assert.equal(settingsFor(defaultLayer("C08")).identityLock, true);
});

test("40 decimal transitions do not silently enable optional texture", () => {
  let l = defaultLayer("C93");
  for (let i = 10; i <= 50; i++) {
    l = withFilterLevel(l, i / 10);
    const setting = settingsFor(l);
    assert.equal(setting.addons.grain, undefined);
    assert.equal(setting.addons.structure, undefined);
    assert.equal(setting.identityLock, true);
  }
});

test("filter inspector preserves explicit manual slider values", () => {
  const params = { ...defaultFilterParams("M05"), addon_grain: 72, addon_structure: 64 };
  const controls = filterControls({ parameters: params, strength: 25 });
  assert.equal(controls.addons.find((a) => a.id === "grain").amount, 72);
  assert.equal(controls.addons.find((a) => a.id === "structure").amount, 64);
  assert.equal(settingsFor({ parameters: params, strength: 25 }).addons.grain, 72);
  assert.equal(settingsFor({ parameters: params, strength: 25 }).addons.structure, 64);
});

test("all input add-on amounts are strictly validated before any preview", () => {
  for (const id of ["grain", "structure"]) {
    for (const bad of [NaN, Infinity, -Infinity, -1, true, "22", null]) {
      const params = { ...defaultFilterParams("C08"), [addonParamKey(id)]: bad };
      assert.throws(() => settingsFor({ strength: 40, parameters: params }), /finite non-negative/);
    }
  }
});

test("legacy percent values over 100 are clamped consistently", () => {
  const settings = settingsFor({ parameters: { recipe: "C08", addon_grain: 101,
    addon_structure: 999, addon_fade: 150 }, strength: 20 });
  assert.equal(settings.addons.grain, 100);
  assert.equal(settings.addons.structure, 100);
  assert.equal(settings.addons.fade, 100);
});

test("a manual effect never makes the guard toggle bypass input validation", () => {
  const badMask = { ...source.masks, skin: { ...source.masks.skin,
    data: Float32Array.from(source.masks.skin.data) } };
  badMask.skin.data[3] = NaN;
  assert.throws(() => render(source.image, "C08", {
    strength: 30, guard: false, addons: { grain: 50 },
  }, badMask), /mask/);
});

test("unknown manual add-on is rejected rather than ignored", () => {
  assert.throws(() => render(source.image, "C08", {
    strength: 0, addons: { softSkinForever: 50 },
  }, source.masks), /unknown add-on/);
});
