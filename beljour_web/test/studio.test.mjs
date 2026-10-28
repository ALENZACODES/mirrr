// Photo studio (background blur, remove and replace, procedural backdrops, relight, headshot
// studio, authenticity mode) and the illustration looks: the TypeScript engines against the
// Python bytes in api/tests/goldens/studio.json, plus the studio's own rules. Drawn scene
// only; no model, network or photograph. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderStudio, TOOLS } from "../dist/js/engines/studio/studio.js";
import { BACKDROPS, renderBackdrop } from "../dist/js/engines/studio/backdrops.js";
import { StudioRefusal } from "../dist/js/engines/studio/common.js";
import { illustrate, LOOKS } from "../dist/js/engines/studio/illustration.js";
import { installDOM, buttonNamed } from "./helpers/dom.mjs";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { ShellGpuRenderer } from "../dist/js/ui/shell/gpu-renderer.js";
import { photoStudioScreen, illustrationScreen, chooseStudioTool } from "../dist/js/screens/photo-studio.js";
import { readiness } from "../dist/js/ui/shell/catalogue.js";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { optionsFor } from "../dist/js/ui/shell/thumbnails.js";

const golden = JSON.parse(readFileSync(new URL("../../api/tests/goldens/studio.json", import.meta.url)));
const bytes = (text) => Uint8Array.from(Buffer.from(text, "base64"));
const photo = { width: golden.width, height: golden.height, channels: 3, data: bytes(golden.image) };
const person = Float64Array.from(bytes(golden.person));
const maxDiff = (a, b) => { let m = 0; for (let i = 0; i < b.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };

for (const c of golden.tools) {
  test(`studio ${c.tool} ${JSON.stringify(c.options)} matches the Python bytes`, () => {
    const r = renderStudio(c.tool, photo, person, golden.points, c.options);
    assert.equal(r.channels, c.channels);
    const expected = bytes(c.out);
    assert.equal(r.image.length, expected.length);
    assert.ok(maxDiff(r.image, expected) <= golden.byte_tolerance, `max channel difference ${maxDiff(r.image, expected)}`);
    assert.deepEqual(r.crops.map((x) => [...x]), c.crops);
  });
}

for (const c of golden.backdrops) {
  test(`backdrop ${c.id} matches the Python bytes`, () => {
    const out = renderBackdrop(c.id, c.width, c.height);
    assert.ok(maxDiff(out.map((v) => Math.round(v)), bytes(c.out)) <= golden.byte_tolerance);
  });
}

for (const c of golden.looks) {
  test(`illustration ${c.look} matches the Python bytes`, () => {
    const r = illustrate(c.look, photo);
    assert.ok(maxDiff(r.image, bytes(c.out)) <= golden.byte_tolerance, `max channel difference ${maxDiff(r.image, bytes(c.out))}`);
    assert.equal(r.metrics.geometry_displacement, 0);
  });
}

test("thirty named backdrops, every tool and look is listed", () => {
  assert.equal(Object.keys(BACKDROPS).length, 30);
  assert.deepEqual([...TOOLS], ["blur", "replace", "remove", "relight", "headshot", "authentic"]);
  assert.equal(Object.keys(LOOKS).length, 4);
});

test("background tools leave her own pixels alone and refuse without her person area", () => {
  for (const tool of ["blur", "replace"]) {
    const r = renderStudio(tool, photo, person, golden.points, {});
    assert.equal(r.metrics.person_changed_share, 0);
    assert.throws(() => renderStudio(tool, photo, null, golden.points, {}), (e) => e instanceof StudioRefusal && e.code === "no_person_mask");
  }
  const empty = new Float64Array(person.length);
  assert.throws(() => renderStudio("blur", photo, empty, null, {}), (e) => e.code === "person_mask_unusable");
  const none = renderStudio("blur", photo, person, null, { strength: 0 });
  assert.deepEqual([...none.image], [...photo.data]);
});

test("relight, headshot and authenticity need her face points", () => {
  for (const tool of ["relight", "headshot", "authentic"]) {
    assert.throws(() => renderStudio(tool, photo, person, null, {}), (e) => e instanceof StudioRefusal && e.code === "no_face_points");
  }
  const a = renderStudio("authentic", photo, person, golden.points, { strength: 100 });
  assert.equal(a.metrics.still_her, true);
  assert.ok(a.metrics.lightness_change <= 1);
});

test("remove gives a transparent background with her opaque", () => {
  const r = renderStudio("remove", photo, person, null, {});
  let inside = 0, outside = 0;
  for (let i = 0; i < person.length; i++) {
    if (person[i] && r.image[i * 4 + 3] === 255) inside++;
    if (!person[i] && r.image[i * 4 + 3] === 0) outside++;
  }
  assert.ok(inside > 0.9 * person.reduce((a, b) => a + b, 0));
  assert.ok(outside > 0.9 * (person.length - person.reduce((a, b) => a + b, 0)));
});

test("the editor runs every studio tool and illustration look on the drawn portrait", async () => {
  const dom = installDOM(), editor = new Editor("portrait", new ShellGpuRenderer(null));
  try {
    editor.selectStudio("studio");
    const before = editor.source.image.data.slice();
    const screen = photoStudioScreen(editor, () => {});
    for (const name of ["Background blur", "Backdrop", "Relight", "Headshot studio", "Authenticity mode"]) {
      await buttonNamed(screen, name).click();
      assert.equal(editor.selected.kind, "studio", name);
      assert.notDeepEqual(editor.rendered().image.data, before, name);
    }
    assert.equal(editor.document.layers.filter((l) => l.kind === "studio").length, 1, "one studio layer is reused");
    editor.selectStudio("illustration");
    const art = illustrationScreen(editor, () => {});
    for (const row of Object.values(LOOKS)) {
      await buttonNamed(art, row.name).click();
      assert.equal(editor.selected.kind, "illustration");
      assert.notDeepEqual(editor.rendered().image.data, before, row.name);
    }
  } finally { dom.restore?.(); }
});

test("studio readiness needs her person area and face tools need her face points", () => {
  const portrait = makeSample("portrait");
  assert.equal(readiness("studio", portrait).ready, true);
  assert.equal(readiness("studio", makeSample("low-light")).ready, false);
  assert.equal(readiness("illustration", makeSample("low-light")).ready, true);
  const editor = new Editor("portrait", new ShellGpuRenderer(null));
  assert.throws(() => chooseStudioTool(editor, "sculpt"), /unknown studio tool/);
  assert.throws(() => chooseStudioTool(editor, "replace", { backdrop: "moon" }), /unknown backdrop/);
  assert.equal(optionsFor("studio", portrait).length, 4);
  assert.deepEqual(optionsFor("illustration", portrait).map((o) => o.label), Object.values(LOOKS).map((r) => r.name));
});
