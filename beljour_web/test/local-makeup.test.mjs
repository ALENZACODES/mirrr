// Local eye makeup (#35) and the Foundation step (#101 match): the TypeScript engines against
// the Python bytes in api/tests/goldens/local-makeup.json, plus region, alpha, strength-0,
// never-lighter and coded-refusal behaviour. Drawn specimens and faces only; no model,
// network or photograph. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderEyeMakeup, isMakeupRefusal, LOOKS } from "../dist/js/engines/eyes/makeup.js";
import { frames, eyeProtection } from "../dist/js/engines/eyes/geometry.js";
import { applyFoundation, foundationFromMatch, isFoundationRefusal } from "../dist/js/engines/shade/foundation.js";
import { skinMask } from "../dist/js/engines/skin/common.js";
import { srgbToLab } from "../dist/js/engines/shade/colourspace.js";
import { featureById } from "../dist/js/ui/eyes-brows/catalogue.js";
import { PreviewSession } from "../dist/js/ui/eyes-brows/session.js";
import { renderJob } from "../dist/js/ui/eyes-brows/render.js";

const golden = JSON.parse(readFileSync(new URL("../../api/tests/goldens/local-makeup.json", import.meta.url)));
const bytes = (text) => Uint8Array.from(Buffer.from(text, "base64"));
const fixtures = golden.eye_makeup.fixtures.map((f) => ({ photo: { width: f.width, height: f.height, channels: f.channels,
  data: bytes(f.image) }, landmarks: f.landmarks, traces: f.traces }));
const faces = Object.fromEntries(Object.entries(golden.foundation.faces).map(([tone, f]) => [tone, { ...f,
  photo: { width: f.width, height: f.height, channels: 3, data: bytes(f.image) } }]));

/** Rebuild the Python output from the stored changed pixels. */
function expected(photo, changed) {
  const out = Uint8Array.from(photo.data), index = new Uint32Array(bytes(changed.index).buffer.slice(0)), values = bytes(changed.bytes);
  index.forEach((pixel, k) => { for (let c = 0; c < photo.channels; c++) out[pixel * photo.channels + c] = values[k * photo.channels + c]; });
  return out;
}
function maxDifference(a, b) {
  let max = 0;
  for (let i = 0; i < a.length; i++) max = Math.max(max, Math.abs(a[i] - b[i]));
  return max;
}
const options = (p, traces) => ({ strength: p.strength, look: p.look, anatomy: p.anatomy, shadow: p.shadow, liner: p.liner,
  colours: p.colours, lashes: p.traced ? traces : [] });

for (const [n, c] of golden.eye_makeup.cases.entries()) {
  test(`eye makeup matches the Python bytes: case ${n} ${c.params.look} ${c.params.strength}`, () => {
    const { photo, landmarks, traces } = fixtures[c.fixture];
    const result = renderEyeMakeup(photo, landmarks, options(c.params, traces));
    assert.ok(!isMakeupRefusal(result));
    assert.ok(maxDifference(result.image, expected(photo, c.changed)) <= golden.byte_tolerance);
    assert.deepEqual(result.report.skipped, c.skipped);
    assert.deepEqual(Object.keys(result.report.elements).sort(), c.elements);
  });
}

for (const c of golden.foundation.cases) {
  test(`foundation matches the Python bytes: ${c.tone} ${c.strength} ${c.choice}`, () => {
    const face = faces[c.tone];
    const result = foundationFromMatch(face.photo, face.points, { refused: false, measured_lab: face.measured_lab,
      best: face.best, alternative: face.alternative }, c.strength, c.choice);
    assert.ok(!isFoundationRefusal(result));
    assert.ok(maxDifference(result.image, expected(face.photo, c.changed)) <= golden.byte_tolerance);
  });
}

test("eye makeup changes only the eye area, never the eyeball, and keeps alpha", () => {
  const { photo, landmarks, traces } = fixtures[1];
  assert.equal(photo.channels, 4);
  const result = renderEyeMakeup(photo, landmarks, { strength: 100, look: "locronan", lashes: traces });
  assert.ok(!isMakeupRefusal(result));
  const eyeFrames = frames(landmarks, photo.width, photo.height);
  const eyeball = eyeProtection(photo.height, photo.width, eyeFrames);
  let changed = 0;
  for (let i = 0; i < photo.width * photo.height; i++) {
    const x = i % photo.width + 0.5, y = Math.floor(i / photo.width) + 0.5;
    assert.equal(result.image[i * 4 + 3], photo.data[i * 4 + 3], "alpha is copied");
    if (![0, 1, 2].some((c) => result.image[i * 4 + c] !== photo.data[i * 4 + c])) continue;
    changed++;
    assert.equal(eyeball[i], 0, "the iris and sclera are never painted");
    const near = eyeFrames.some((f) => { const [u, v] = f.local(x, y); return u > -0.3 && u < 1.6 && v > -0.35 && v < f.brow_space + 0.05; });
    assert.ok(near, `pixel ${i} changed outside both eye areas`);
  }
  assert.ok(changed > 50);
});

test("strength 0 and all elements off are exact copies; refusals are coded", () => {
  const { photo, landmarks, traces } = fixtures[0];
  for (const opts of [{ strength: 0 }, { strength: 80, shadow: 0, liner: 0, mascara: 0 }]) {
    const result = renderEyeMakeup(photo, landmarks, { ...opts, lashes: traces });
    assert.ok(!isMakeupRefusal(result));
    assert.deepEqual(result.image, Uint8ClampedArray.from(photo.data));
  }
  const onlyMascara = renderEyeMakeup(photo, landmarks, { strength: 80, shadow: 0, liner: 0 });
  assert.ok(isMakeupRefusal(onlyMascara));
  assert.equal(onlyMascara.code, "needs_lash_trace");
  const flat = renderEyeMakeup(photo, landmarks.map(() => [0.5, 0.5]), { strength: 80 });
  assert.ok(isMakeupRefusal(flat));
  assert.equal(flat.code, "duplicate_points");
  assert.throws(() => renderEyeMakeup(photo, landmarks, { strength: 101 }), RangeError);
  assert.throws(() => renderEyeMakeup(photo, landmarks, { look: "unknown" }), RangeError);
  assert.deepEqual(Object.keys(LOOKS), ["vezelay", "locronan", "rocamadour"]);
});

test("foundation never raises any pixel's lightness, changes only skin and keeps alpha", () => {
  for (const face of Object.values(faces)) {
    const rgba = { ...face.photo, channels: 4, data: new Uint8Array(face.photo.width * face.photo.height * 4) };
    for (let i = 0; i < face.photo.width * face.photo.height; i++) {
      rgba.data.set(face.photo.data.subarray(i * 3, i * 3 + 3), i * 4);
      rgba.data[i * 4 + 3] = (i * 7) % 256;
    }
    const result = applyFoundation(rgba, face.points, face.best.lab, face.measured_lab, 100);
    assert.ok(!isFoundationRefusal(result));
    const skin = skinMask(face.points, rgba.width, rgba.height);
    for (let i = 0; i < rgba.width * rgba.height; i++) {
      assert.equal(result.image[i * 4 + 3], rgba.data[i * 4 + 3]);
      const before = srgbToLab([rgba.data[i * 4], rgba.data[i * 4 + 1], rgba.data[i * 4 + 2]])[0];
      const after = srgbToLab([result.image[i * 4], result.image[i * 4 + 1], result.image[i * 4 + 2]])[0];
      assert.ok(after <= before + 1e-9, `pixel ${i} got lighter`);
      if ([0, 1, 2].some((c) => result.image[i * 4 + c] !== rgba.data[i * 4 + c])) assert.ok(skin[i] > 0, `pixel ${i} is outside the skin`);
    }
  }
});

test("foundation refusals are coded and strength 0 is an exact copy", () => {
  const face = faces.medium;
  const zero = applyFoundation(face.photo, face.points, face.best.lab, face.measured_lab, 0);
  assert.ok(!isFoundationRefusal(zero));
  assert.deepEqual(zero.image, Uint8Array.from(face.photo.data));
  const lighter = [face.measured_lab[0] + 3, face.measured_lab[1], face.measured_lab[2]];
  assert.equal(applyFoundation(face.photo, face.points, lighter, face.measured_lab, 50).code, "shade_lighter_than_skin");
  const far = [face.measured_lab[0] - 20, face.measured_lab[1], face.measured_lab[2]];
  assert.equal(applyFoundation(face.photo, face.points, far, face.measured_lab, 50).code, "shade_too_far");
  assert.equal(foundationFromMatch(face.photo, face.points, null, 50).code, "no_shade_match");
  assert.equal(foundationFromMatch(face.photo, face.points, { refused: true, best: null, alternative: null, measured_lab: null }, 50).code, "no_shade_match");
  assert.equal(applyFoundation(face.photo, face.points.slice(0, 400), face.best.lab, face.measured_lab, 50).code, "wrong_shape");
  assert.throws(() => applyFoundation(face.photo, face.points, [Number.NaN, 0, 0], face.measured_lab, 50), RangeError);
});

test("the Eyes and lashes studio runs the eye makeup look with her traces, anatomy and per-element amounts", () => {
  const { photo, landmarks, traces } = fixtures[1];
  const studio = new PreviewSession();
  studio.load({ width: photo.width, height: photo.height, channels: 4, data: Uint8ClampedArray.from(photo.data) }, true);
  studio.setMesh(landmarks);
  studio.select("eye-makeup");
  assert.deepEqual(featureById("eye-makeup").choices.map((c) => c.label), ["Vézelay", "Locronan", "Rocamadour"]);
  studio.setStyle("rocamadour");
  studio.setAnatomy("right", "hooded");
  studio.observations.setTraces(traces);
  studio.setAmount(0.7);
  studio.setControl("liner", 0.5);
  const job = studio.job();
  const shown = renderJob(job);
  const direct = renderEyeMakeup(photo, landmarks, { strength: 70, look: "rocamadour", liner: 0.5, anatomy: { right: "hooded", left: "open" }, lashes: traces });
  assert.ok(!isMakeupRefusal(direct));
  assert.deepEqual(shown.pixels, direct.image);
  assert.match(shown.label, /simulation/i);
  assert.equal(studio.complete(job.id, shown), true);
  studio.select("eye-makeup");
  studio.observations.setTraces([]);
  studio.setControl("shadow", 0); studio.setControl("liner", 0);
  assert.throws(() => renderJob(studio.job()), /Trace your visible lashes/);
});
