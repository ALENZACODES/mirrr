// Named portrait looks in the browser: same bytes as Python, guards, refusals and the studio wiring.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as C from "../dist/js/filters/portrait/compose.js";
import * as L from "../dist/js/filters/portrait/looks.js";
import * as Layer from "../dist/js/filters/portrait/layer.js";
import * as SP from "../dist/js/filters/portrait/sparkle.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import * as Th from "../dist/js/ui/shell/thumbnails.js";
import { readiness, tool } from "../dist/js/ui/shell/catalogue.js";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { effect } from "../dist/js/layout/effects.js";
import { registryProblems } from "../dist/js/save/capabilities.js";
import { TOOLS } from "../dist/js/save/recipe.js";
import { pixelsChanged } from "../dist/js/ui/shell/pipeline.js";

const V = JSON.parse(readFileSync(new URL("../../api/plumb_api/filters/portrait/vectors.json", import.meta.url), "utf8"));
const bytes = (value) => new Uint8Array(Buffer.from(value, "base64"));
const alpha = (x, y) => 64 + ((x * 3 + y * 2) % 192);

function photo(face, rgba) {
  const rgb = bytes(V.faces[face].image);
  if (!rgba) return { width: V.width, height: V.height, channels: 3, data: rgb };
  const data = new Uint8Array(V.width * V.height * 4);
  for (let y = 0; y < V.height; y++) for (let x = 0; x < V.width; x++) {
    const p = y * V.width + x;
    data.set(rgb.subarray(p * 3, p * 3 + 3), p * 4);
    data[p * 4 + 3] = alpha(x, y);
  }
  return { width: V.width, height: V.height, channels: 4, data };
}

test("every vector renders the same bytes, status, glints and guard numbers as Python", () => {
  assert.equal(V.format, "beljour-portrait-vectors/1");
  assert.ok(V.renders.length >= 20);
  for (const r of V.renders) {
    const out = C.renderPortrait(photo(r.face, r.rgba), V.faces[r.face].points, r.look, r.strength);
    const expected = bytes(r.out);
    assert.equal(out.image.data.length, expected.length);
    let gap = 0;
    for (let i = 0; i < expected.length; i++) gap = Math.max(gap, Math.abs(expected[i] - out.image.data[i]));
    assert.ok(gap <= V.tolerance.byte, `${r.look} at ${r.strength}: gap ${gap}`);
    assert.equal(out.status, r.status); assert.equal(out.code, r.code); assert.equal(out.glints, r.glints);
    if (r.identity) {
      assert.equal(out.identity.marksFound, r.identity.marksFound);
      assert.equal(out.identity.marksKept, r.identity.marksKept);
      assert.equal(out.identity.passed, r.identity.passed);
      assert.ok(Math.abs(out.identity.skinLift - r.identity.skinLift) <= V.tolerance.lift);
    } else assert.equal(out.identity, null);
  }
});

test("the thirteen own looks validate, sit in Beauty and are labelled simulations", () => {
  const looks = L.portraitLooks();
  assert.equal(looks.length, 13);
  assert.deepEqual(L.validate(looks), []);
  assert.equal(looks.filter((l) => l.sparkle).length, 1);
  for (const l of looks) {
    assert.match(l.id, /^PL\d\d$/);
    assert.equal(l.recipe.tab, "Beauty");
    assert.equal(l.recipe.limits.simulationLabel, true);
    assert.equal(l.recipe.defaults.strength, 30);
    assert.ok(!l.recipe.stages.some((s) => L.LIGHTENING_OPS.includes(s.op)));
  }
  const bad = { ...looks[0], polish: 0.9, recipe: { ...looks[0].recipe, stages: [{ op: "colour.exposure", params: { ev: 0.4 } }] } };
  const problems = L.validate([bad]).join("\n");
  assert.match(problems, /soften, not erase/); assert.match(problems, /lifts skin/);
  assert.match(C.LABEL, /simulation/); assert.match(C.LABEL, /not medical advice/);
});

test("strength 0 is a byte identity with alpha, and alpha is untouched when a look runs", () => {
  const rgba = photo(1, true);
  for (const look of L.portraitLooks()) {
    const out = C.renderPortrait(rgba, V.faces[1].points, look.id, 0);
    assert.equal(out.status, "identity");
    assert.deepEqual(Array.from(out.image.data), Array.from(rgba.data));
  }
  const ran = C.renderPortrait(rgba, V.faces[1].points, "PL13", 100);
  assert.equal(ran.status, "applied");
  for (let p = 0; p < V.width * V.height; p++) assert.equal(ran.image.data[p * 4 + 3], rgba.data[p * 4 + 3]);
});

test("refusals are coded, never a silent run on a guessed face", () => {
  const img = photo(0, false), pts = V.faces[0].points;
  const cases = [
    [() => C.renderPortrait({ width: 8, height: 8, channels: 3, data: new Uint8Array(192) }, pts, "PL01", 30), "bad_photo"],
    [() => C.renderPortrait(img, undefined, "PL01", 30), "no_face_points"],
    [() => C.renderPortrait(img, pts.slice(0, 468), "PL01", 30), "no_face_points"],
    [() => C.renderPortrait(img, pts, "PL99", 30), "unknown_look"],
    [() => C.renderPortrait(img, pts, "PL01", -1), "bad_strength"],
  ];
  for (const [call, code] of cases) {
    assert.throws(call, (e) => e instanceof C.PortraitRefused && e.code === code);
    assert.ok(C.REFUSALS.includes(code));
  }
});

test("irises, marks and skin lightness hold on every look and tone", () => {
  for (let face = 0; face < V.faces.length; face++) {
    const img = photo(face, false), pts = V.faces[face].points;
    const fm = C.faceMasks(img.data, V.width, V.height, pts);
    for (const look of L.portraitLooks()) {
      for (const strength of [30, 100]) {
        const out = C.renderPortrait(img, pts, look.id, strength);
        assert.equal(out.status, "applied", `${look.id} ${strength}`);
        assert.ok(out.identity.skinLift <= C.LIFT_LIMIT, `${look.id} lifts skin`);
        assert.equal(out.identity.marksKept, out.identity.marksFound);
        for (let p = 0; p < V.width * V.height; p++) {
          if (fm.features.irises.data[p] < 1) continue;
          for (let c = 0; c < 3; c++) assert.equal(out.image.data[p * 3 + c], img.data[p * 3 + c]);
        }
      }
    }
  }
});

test("sparkle is deterministic, sits only on lids and cheekbones and is gone at 0", () => {
  const img = photo(2, false), pts = V.faces[2].points;
  const fm = C.faceMasks(img.data, V.width, V.height, pts);
  const spec = L.portraitLook("PL13").sparkle;
  const a = SP.render(img.data, V.width, V.height, fm.sparkle, fm.iod, spec, 1);
  const b = SP.render(img.data, V.width, V.height, fm.sparkle, fm.iod, spec, 1);
  assert.deepEqual(Array.from(a.image), Array.from(b.image));
  assert.ok(a.glints.count > 0);
  let moved = 0;
  for (let p = 0; p < V.width * V.height; p++) {
    const diff = [0, 1, 2].some((c) => a.image[p * 3 + c] !== img.data[p * 3 + c]);
    if (!diff) continue;
    moved++;
    assert.ok(fm.sparkle[p] > 0, "only inside the sparkle region");
    assert.ok(fm.features.eyes.data[p] < 0.5 && fm.features.lips.data[p] < 0.5 && fm.features.irises.data[p] < 0.5);
  }
  assert.ok(moved > 0);
  assert.deepEqual(Array.from(SP.render(img.data, V.width, V.height, fm.sparkle, fm.iod, spec, 0).image), Array.from(img.data));
  assert.equal(SP.hash32(3, 5, 7), SP.hash32(3, 5, 7));
});

test("the Portrait looks studio: strip, one-tap layer, slider, labels and recipe contract", () => {
  const sample = makeSample("portrait");
  assert.equal(tool("portrait").category, "Local studio");
  assert.equal(readiness("portrait", sample).ready, true);
  assert.equal(readiness("portrait", { ...sample, face: undefined, kind: "uploaded" }).ready, false);
  assert.equal(effect("portrait").studio, "portrait"); assert.equal(effect("portrait").simulation, true);
  assert.equal(TOOLS.portrait.provider, "local");
  assert.deepEqual(registryProblems(), []);
  const page = Th.renderStripPage("portrait", sample, { page: 0, pageSize: 20 });
  assert.equal(page.tiles.length, 13);
  assert.ok(page.tiles.every((t) => t.status === "ready" && t.image && t.simulation), page.tiles.map((t) => t.reason).join(" "));
  assert.deepEqual(page.tiles.map((t) => t.option.params.look), Layer.portraitOptions().map((o) => o.look));

  const editor = new Editor("portrait");
  editor.selectStudio("portrait");
  const look = editor.add();
  assert.equal(look.kind, "portrait"); assert.equal(look.simulation, true); assert.equal(look.strength, 30);
  assert.deepEqual(look.parameters, { look: Layer.DEFAULT_LOOK });
  const preview = editor.preview();
  assert.equal(preview.effective, 1);
  assert.match(preview.labels[0], /Local simulation · Lourmarin/);
  assert.equal(preview.metrics[0].status, "applied");
  assert.ok(pixelsChanged(sample.image, preview.image).pixels > 0);
  const picked = editor.applyOption("portrait", { look: "PL13" }, "Vence");
  assert.equal(picked.id, look.id); assert.equal(editor.selected.parameters.look, "PL13");
  editor.undo();
  assert.equal(editor.selected.parameters.look, "PL01");
  editor.update(look.id, { strength: 0 });
  assert.equal(editor.preview().effective, 0);
});
