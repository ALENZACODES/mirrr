// FX1 acceptance in the browser on drawn portraits of six skin tones (A3, A4, FX1 §5.3):
// strength 0 is bit-identical, the effect grows with strength, two renders agree, the skin
// guard holds Still Her on every tone (very dark included), Protect skin holds ΔE2000 <= 2
// inside her skin, and mono looks stay black and white. Drawn faces only. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { scaleSource } from "../dist/js/ui/shell/scale.js";
import { masksFor, faceCentreFor } from "../dist/js/filters/runtime/layer.js";
import * as E from "../dist/js/filters/runtime/engine.js";
import * as H from "../dist/js/filters/qa/still-her.js";
import { srgbToLab } from "../dist/js/filters/colour/space.js";
import { ciede2000 } from "../dist/js/engines/core/colour.js";
import { catalogue } from "../dist/js/filters/recipe/registry.js";

// The arena's six hand-picked tones (api/plumb_api/arena/synthetic.py), very light to very dark.
const TONES = { very_light: [238, 208, 190], light: [224, 182, 156], medium: [190, 140, 105], tan: [160, 110, 78],
  dark: [112, 72, 50], very_dark: [68, 44, 32] };
// A 160 px copy keeps 61 looks x 6 tones x 7 strengths inside the suite's time; the full-size
// portrait is covered by the parity renders and filters-shell.test.mjs.
const base = scaleSource(makeSample("portrait"), 160);
const masks = masksFor(base);
const centre = faceCentreFor(masks);

/** The drawn portrait with its skin recoloured to one tone, texture and marks kept. */
function toned(rgb) {
  const img = base.image, out = Uint8Array.from(img.data), skin = masks.skin.data;
  const sum = [0, 0, 0]; let n = 0;
  for (let p = 0; p < skin.length; p++) if (skin[p] >= 0.5) { for (let c = 0; c < 3; c++) sum[c] += img.data[p * 3 + c]; n++; }
  const gain = rgb.map((v, c) => v / (sum[c] / n));
  for (let p = 0; p < skin.length; p++) {
    const a = skin[p];
    if (a <= 0) continue;
    for (let c = 0; c < 3; c++) {
      const v = img.data[p * 3 + c];
      out[p * 3 + c] = Math.max(0, Math.min(255, Math.round(v * (1 - a) + v * gain[c] * a)));
    }
  }
  return { ...img, data: out };
}
const faces = Object.entries(TONES).map(([tone, rgb]) => ({ tone, image: toned(rgb) }));

test("the six drawn tones span very light to very dark", () => {
  const skinL = faces.map((f) => H.measure("C08", f.image, masks, base.face, { strength: 0 }).skinL);
  for (let i = 1; i < skinL.length; i++) assert.ok(skinL[i] < skinL[i - 1]);
  assert.ok(skinL.at(-1) < 30, `very dark skin L* ${skinL.at(-1)}`);
});

test("every shipped filter keeps her on all six tones at its default, guard on", () => {
  const failures = [];
  for (const r of catalogue().recipes) {
    for (const f of faces) failures.push(...H.problems(r, H.measure(r, f.image, masks, base.face, {}, centre), `${f.tone} skin`));
  }
  assert.deepEqual(failures, []);
});

test("the check catches a look that lightens skin when the guard is off", () => {
  const r = { ...catalogue().get("C08"), id: "C98", stages: [{ op: "colour.exposure", params: { ev: 1 } }] };
  const off = H.measure(r, faces[2].image, masks, base.face, { strength: 100, guard: false });
  assert.ok(H.problems(r, off).some((p) => /rose/.test(p)));
  const on = H.measure(r, faces[2].image, masks, base.face, { strength: 100 });
  assert.deepEqual(H.problems(r, on).filter((p) => /rose/.test(p)), []);
  assert.throws(() => H.measure("C08", faces[0].image, { skin: null, person: null, source: "none", note: "" }, base.face), /skin mask/);
});

test("A3: strength 0 is the photo, the effect grows with strength, and two renders agree", () => {
  const img = faces[3].image;
  const s1 = [0, 0, 0], s2 = [0, 0, 0];
  const lightness = (out) => {
    let t = 0;
    for (let i = 0; i < out.length; i += 3) {
      t += Math.abs(srgbToLab(out[i] / 255, out[i + 1] / 255, out[i + 2] / 255, s1)[0]
        - srgbToLab(img.data[i] / 255, img.data[i + 1] / 255, img.data[i + 2] / 255, s2)[0]);
    }
    return t / (out.length / 3);
  };
  const rgbChange = (out) => { let t = 0; for (let i = 0; i < out.length; i++) t += Math.abs(out[i] - img.data[i]); return t / out.length; };
  for (const r of catalogue().recipes) {
    // Mono looks are black and white at any strength above 0 (a step mix): their slider sets tone, so
    // Q9 is measured on L* alone, as in api/plumb_api/filters/qa/distinct.py.
    const effect = r.limits.guardMode === "lightness" ? lightness : rgbChange;
    const zero = E.render(img, r, { strength: 0 }, masks, centre);
    assert.deepEqual(Array.from(zero.image.data), Array.from(img.data), `${r.id} at 0`);
    const curve = [0, 25, 50, 75, 100].map((s) => effect(E.render(img, r, { strength: s }, masks, centre).image.data));
    for (let i = 1; i < curve.length; i++) assert.ok(curve[i] > curve[i - 1] - 1e-9, `${r.id} ${curve.map((x) => x.toFixed(3))}`);
    const a = E.render(img, r, {}, masks, centre).image.data, b = E.render(img, r, {}, masks, centre).image.data;
    assert.deepEqual(Array.from(a), Array.from(b), `${r.id} determinism`);
  }
});

test("Protect skin holds ΔE2000 <= 2 inside her skin on every tone", () => {
  const s = [0, 0, 0], t = [0, 0, 0];
  for (const f of faces) {
    for (const rid of ["C19", "M04", "C13", "C30"]) {
      const out = E.render(f.image, rid, { strength: 100, protectSkin: true }, masks, centre).image.data;
      for (let p = 0; p < masks.skin.data.length; p++) {
        if (masks.skin.data[p] < 0.5) continue;
        const i = p * 3;
        srgbToLab(f.image.data[i] / 255, f.image.data[i + 1] / 255, f.image.data[i + 2] / 255, s);
        srgbToLab(out[i] / 255, out[i + 1] / 255, out[i + 2] / 255, t);
        assert.ok(ciede2000(s, t) <= 2, `${rid} on ${f.tone}`);
      }
    }
  }
});

test("neutral mono looks stay black and white (a*, b* within 0.5) at any strength", () => {
  const s = [0, 0, 0];
  for (const r of catalogue().inTab("Monochrome").filter((x) => x.limits.neutralMono)) {
    for (const strength of [10, 30, 100]) {
      const out = E.render(faces[1].image, r, { strength }, masks, centre).image.data;
      let worst = 0;
      for (let i = 0; i < out.length; i += 3) {
        srgbToLab(out[i] / 255, out[i + 1] / 255, out[i + 2] / 255, s);
        worst = Math.max(worst, Math.abs(s[1]), Math.abs(s[2]));
      }
      assert.ok(worst <= 0.5, `${r.id} at ${strength}: ${worst}`);
    }
  }
});
