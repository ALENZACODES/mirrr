// Local teeth, beard and grey tools in the browser: the TypeScript engines against the
// Python bytes in api/tests/goldens/hair-beard-teeth.json, the editor layers that run them,
// and their rules (only the intended pixels change, alpha kept, strength 0 a copy, coded
// refusals). Drawn faces only; no model, network or photograph. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { whitenTeeth, isTeethRefusal, NATURAL_L_CAP, WARM_B } from "../dist/js/engines/teeth/natural.js";
import { srgbToLab } from "../dist/js/engines/shade/colourspace.js";
import { removeBeard, isShaveRefusal } from "../dist/js/engines/shave/remove.js";
import { greyPreview, isGreyRefusal, STAGES, LABELS } from "../dist/js/engines/haircolour/grey.js";
import { layer } from "../dist/js/ui/shell/layers.js";
import { renderLayers, copyRGB } from "../dist/js/ui/shell/pipeline.js";
import { readiness } from "../dist/js/ui/shell/catalogue.js";
import { registryProblems } from "../dist/js/save/capabilities.js";
import { effect } from "../dist/js/layout/effects.js";
import { validateLook, LOOK_FORMAT } from "../dist/js/layout/my-looks.js";
import { validateLayer } from "../dist/js/demo/schema.js";

const golden = JSON.parse(readFileSync(new URL("../../api/tests/goldens/hair-beard-teeth.json", import.meta.url)));
const bytes = (text) => Uint8Array.from(Buffer.from(text, "base64"));
const photo = (f) => ({ width: f.width, height: f.height, channels: f.channels, data: bytes(f.image) });
const source = (f) => ({ id: "drawn", kind: "uploaded", label: "Drawn face", disposable: true, image: photo(f), face: f.points });

/** Rebuild the Python output from the stored changed pixels. */
function expected(image, changed) {
  const out = Uint8Array.from(image.data), index = new Uint32Array(bytes(changed.index).buffer.slice(0)), values = bytes(changed.bytes);
  index.forEach((pixel, k) => { for (let c = 0; c < image.channels; c++) out[pixel * image.channels + c] = values[k * image.channels + c]; });
  return out;
}
function maxDifference(a, b) {
  let max = 0;
  for (let i = 0; i < a.length; i++) max = Math.max(max, Math.abs(a[i] - b[i]));
  return max;
}
const lab = (d, ch, i) => srgbToLab([d[i * ch], d[i * ch + 1], d[i * ch + 2]]);

for (const c of golden.teeth.cases) {
  test(`teeth whitening matches the Python bytes: fixture ${c.fixture} strength ${c.strength}`, () => {
    const f = golden.teeth.fixtures[c.fixture], image = photo(f);
    const result = whitenTeeth(image, f.points, c.strength);
    assert.ok(!isTeethRefusal(result));
    assert.ok(maxDifference(result.image, expected(image, c.changed)) <= golden.byte_tolerance);
  });
}

test("teeth: natural cap and warm floor hold, alpha is kept, strength 0 is a copy, refusals are coded", () => {
  const f = golden.teeth.fixtures[1], image = photo(f);
  assert.equal(image.channels, 4);
  const out = whitenTeeth(image, f.points, 100);
  assert.ok(!isTeethRefusal(out));
  let changed = 0;
  for (let i = 0; i < image.width * image.height; i++) {
    assert.equal(out.image[i * 4 + 3], image.data[i * 4 + 3]);
    if ([0, 1, 2].every((k) => out.image[i * 4 + k] === image.data[i * 4 + k])) continue;
    changed++;
    const [l0, , b0] = lab(image.data, 4, i), [l1, , b1] = lab(out.image, 4, i);
    assert.ok(out.weight[i] > 0, "only enamel changes");
    assert.ok(l1 <= Math.max(l0, NATURAL_L_CAP) + 1e-9 && b1 >= Math.min(b0, WARM_B) - 1e-9);
  }
  assert.ok(changed > 10);
  assert.deepEqual(whitenTeeth(image, f.points, 0).image, Uint8Array.from(image.data));
  assert.equal(whitenTeeth(image, f.points.slice(0, 400), 50).code, "wrong_shape");
  const closed = f.points.map(([x, y]) => [x, y]);
  const centre = (closed[13][1] + closed[14][1]) / 2;
  for (const i of [13, 14, 78, 308, 82, 87, 312, 317, 80, 88, 310, 318, 81, 178, 311, 402, 95, 191, 324, 415]) closed[i][1] = centre + 0.05 * (closed[i][1] - centre);
  assert.equal(whitenTeeth(image, closed, 50).code, "mouth_closed");
  assert.throws(() => whitenTeeth(image, f.points, 101), RangeError);
});

test("teeth layer: the editor runs the engine on the photo's face points and is registered everywhere", () => {
  const f = golden.teeth.fixtures[0], src = source(f);
  const preview = renderLayers(src, [{ ...layer("teeth-1", "teeth", "Teeth whitening", "photo"), strength: 100 }]);
  const direct = whitenTeeth(copyRGB(src.image), f.points, 100);
  assert.ok(maxDifference(preview.image.data, direct.image) <= 1);
  assert.equal(preview.metrics[0].status, "edited");
  assert.equal(readiness("teeth", { ...src, face: undefined }).ready, false);
  assert.deepEqual(registryProblems(), []);
  assert.equal(effect("teeth").built, true);
  assert.equal(effect("teeth").feature, 31);
  assert.ok(validateLook({ format: LOOK_FORMAT, id: "look-0000abcd", name: "Smile", created: new Date(0).toISOString(),
    steps: [{ kind: "teeth", strength: 30, params: {} }] }));
  assert.ok(validateLayer({ kind: "teeth", params: {}, strength: 30 }, "portrait", 0));
});

for (const c of golden.beard.cases) {
  test(`beard removal matches the Python bytes: fixture ${c.fixture} strength ${c.strength} keep ${c.keep.length}`, () => {
    const f = golden.beard.fixtures[c.fixture], image = photo(f);
    const result = removeBeard(image, f.points, c.strength, c.keep);
    assert.ok(!isShaveRefusal(result));
    assert.equal(result.metrics.scope, c.scope);
    assert.ok(maxDifference(result.image, expected(image, c.changed)) <= golden.byte_tolerance);
  });
}

test("beard removal: only the beard area changes, never above the cheek, alpha kept, strength 0 a copy, coded refusals", () => {
  const f = golden.beard.fixtures[1], image = photo(f);
  assert.equal(image.channels, 4);
  const out = removeBeard(image, f.points, 100);
  assert.ok(!isShaveRefusal(out));
  const cheek = out.metrics.cheek_l;
  let changed = 0;
  for (let i = 0; i < image.width * image.height; i++) {
    assert.equal(out.image[i * 4 + 3], image.data[i * 4 + 3]);
    if ([0, 1, 2].every((k) => out.image[i * 4 + k] === image.data[i * 4 + k])) continue;
    changed++;
    assert.ok(out.weight[i] > 0, "only the beard area changes");
    assert.ok(lab(out.image, 4, i)[0] <= Math.max(lab(image.data, 4, i)[0], cheek) + 1e-9, `pixel ${i} lifted past the cheek`);
  }
  assert.ok(changed > 100);
  assert.deepEqual(removeBeard(image, f.points, 0).image, Uint8Array.from(image.data));
  assert.equal(removeBeard(image, f.points.slice(0, 400), 50).code, "wrong_shape");
  const clean = golden.teeth.fixtures[0];
  assert.throws(() => removeBeard(image, f.points, 50, [[-1, 4]]), RangeError);
  assert.equal(removeBeard(photo(clean), clean.points, 50).code, "no_beard_found", "a clean-shaven drawn face has nothing to remove");
});

test("shave layer: the editor removes the drawn stubble through the compositor and says why when it refuses", () => {
  const f = golden.beard.fixtures[0], src = source(f);
  const preview = renderLayers(src, [{ ...layer("shave-1", "shave", "Beard removal", "photo"), strength: 100 }]);
  const direct = removeBeard(copyRGB(src.image), f.points, 100);
  assert.ok(maxDifference(preview.image.data, direct.image) <= 1);
  assert.equal(preview.metrics[0].status, "edited");
  const clean = source(golden.teeth.fixtures[0]);
  const refused = renderLayers(clean, [{ ...layer("shave-2", "shave", "Beard removal", "photo"), strength: 100 }]);
  assert.equal(refused.metrics[0].reason_code, "no_beard_found");
  assert.deepEqual(refused.image.data, copyRGB(clean.image).data);
  assert.equal(effect("shave").feature, 24);
  assert.equal(readiness("shave", { ...src, face: undefined }).ready, false);
  assert.deepEqual(registryProblems(), []);
  assert.ok(validateLayer({ kind: "shave", params: {}, strength: 30 }, "portrait", 0));
});

const greyMask = (f) => Float64Array.from(bytes(f.mask), (v) => v / 255);

for (const c of golden.grey.cases) {
  test(`grey preview matches the Python bytes: fixture ${c.fixture} ${c.stage} ${c.strength}${c.natural ? " given shade" : ""}`, () => {
    const f = golden.grey.fixtures[c.fixture], image = photo(f);
    const result = greyPreview(image, greyMask(f), { stage: c.stage, strength: c.strength, naturalLab: c.natural ?? undefined });
    assert.ok(!isGreyRefusal(result));
    assert.ok(maxDifference(result.image, expected(image, c.changed)) <= golden.byte_tolerance);
  });
}

test("grey: only the marked hair changes, alpha kept, strength 0 a copy, each stage labelled, coded refusals", () => {
  const f = golden.grey.fixtures[1], image = photo(f), mask = greyMask(f);
  assert.equal(image.channels, 4);
  for (const stage of STAGES) {
    const out = greyPreview(image, mask, { stage, strength: 100 });
    assert.ok(!isGreyRefusal(out), stage);
    assert.ok(out.label.includes(LABELS[stage]) && out.label.includes("not a salon result"));
    for (let i = 0; i < image.width * image.height; i++) {
      assert.equal(out.image[i * 4 + 3], image.data[i * 4 + 3]);
      if (mask[i] < 0.5) for (let k = 0; k < 3; k++) assert.equal(out.image[i * 4 + k], image.data[i * 4 + k], "outside the hair changed");
    }
  }
  assert.deepEqual(greyPreview(image, mask, { strength: 0 }).image, Uint8Array.from(image.data));
  assert.equal(greyPreview(image, new Float64Array(mask.length)).code, "no_hair_marked");
  assert.throws(() => greyPreview(image, mask, { stage: "dye" }), RangeError);
  assert.throws(() => greyPreview(image, mask, { naturalLab: [120, 0, 0] }), RangeError);
});

test("grey layer: the editor runs Grey Transition in the marked hair and needs that mark", () => {
  const f = golden.grey.fixtures[0], image = photo(f), mask = greyMask(f);
  const src = { id: "drawn", kind: "uploaded", label: "Drawn hair", disposable: true, image,
    hair: { width: image.width, height: image.height, channels: 1, data: Float32Array.from(mask) } };
  for (const stage of STAGES) {
    const preview = renderLayers(src, [{ ...layer("grey-1", "grey", "Grey Transition", "photo", { stage }), strength: 100 }]);
    const direct = greyPreview(copyRGB(image), mask, { stage, strength: 100 });
    assert.ok(maxDifference(preview.image.data, direct.image) <= 1, stage);
    assert.equal(preview.metrics[0].stage, stage);
  }
  assert.equal(readiness("grey", { ...src, hair: undefined }).ready, false);
  assert.equal(effect("grey").feature, 102);
  assert.equal(effect("grey-removal").feature, 20);
  assert.equal(effect("grey").provider, "local");
  assert.deepEqual(registryProblems(), []);
  assert.ok(validateLayer({ kind: "grey", params: { stage: "blend" }, strength: 30 }, "crown", 0));
  assert.throws(() => validateLayer({ kind: "grey", params: { stage: "dye" } }, "crown", 0));
});
