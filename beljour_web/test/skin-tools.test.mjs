// Skin tools (Freckles, Tan, Matte, Glow, Even tone): the TypeScript engines against the
// Python bytes in api/tests/goldens/skin-tools.json, coded refusals, and the editor wiring.
// Drawn faces only; no model, network or photograph. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installDOM, buttonNamed } from "./helpers/dom.mjs";
import { renderSkinTool, isRefusal, meshProblems, TOOLS } from "../dist/js/engines/skin/studio.js";
import { skinMask } from "../dist/js/engines/skin/common.js";
import { srgbToLab } from "../dist/js/engines/shade/colourspace.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { ShellGpuRenderer } from "../dist/js/ui/shell/gpu-renderer.js";
import { skinToolsScreen, chooseSkinTool } from "../dist/js/screens/skin-tools.js";
import { optionsFor } from "../dist/js/ui/shell/thumbnails.js";
import { CATALOGUE } from "../dist/js/ui/shell/catalogue.js";
import { registryProblems } from "../dist/js/save/capabilities.js";
import * as E from "../dist/js/layout/effects.js";
import { validateLayer } from "../dist/js/demo/schema.js";

const golden = JSON.parse(readFileSync(new URL("../../api/tests/goldens/skin-tools.json", import.meta.url)));
const bytes = (text) => Uint8Array.from(Buffer.from(text, "base64"));
const photo = { width: golden.width, height: golden.height, channels: 3, data: bytes(golden.image) };
const params = (p) => ({ density: p.density, seed: p.seed, direction: p.direction, undertone: p.undertone,
  allowLightening: p.allow_lightening, style: p.style, redness: p.redness });
const lightness = (data, ch, i) => srgbToLab([data[i * ch], data[i * ch + 1], data[i * ch + 2]])[0];

for (const c of golden.cases) {
  test(`TypeScript matches the Python bytes: ${c.tool} ${c.strength} ${JSON.stringify(c.params)}`, () => {
    const result = renderSkinTool(c.tool, photo, golden.points, c.strength, params(c.params));
    assert.ok(!isRefusal(result));
    const expected = bytes(c.out);
    let max = 0;
    for (let i = 0; i < expected.length; i++) max = Math.max(max, Math.abs(result.image[i] - expected[i]));
    assert.ok(max <= golden.byte_tolerance, `max channel difference ${max}`);
    const skin = skinMask(golden.points, photo.width, photo.height);
    let changed = 0;
    for (let i = 0; i < skin.length; i++) for (let k = 0; k < 3; k++) {
      if (result.image[i * 3 + k] !== photo.data[i * 3 + k]) { changed++; assert.ok(skin[i] > 0, `changed outside the skin at ${i}`); }
    }
    assert.ok(changed > 0, "the case changes the photo");
  });
}

test("only tan removal raises lightness, and strength 0 is an exact no-op", () => {
  for (const tool of TOOLS) {
    const zero = renderSkinTool(tool, photo, golden.points, 0, {});
    assert.deepEqual(zero.image, photo.data, tool);
  }
  for (const c of golden.cases) {
    const result = renderSkinTool(c.tool, photo, golden.points, c.strength, params(c.params));
    if (c.tool === "glow" || c.params.direction === "remove") continue;
    for (let i = 0; i < photo.width * photo.height; i++) {
      assert.ok(lightness(result.image, 3, i) <= lightness(photo.data, 3, i) + 1e-9, `${c.tool} lightened pixel ${i}`);
    }
  }
});

test("alpha is copied untouched and the colour result is the same as RGB", () => {
  const n = photo.width * photo.height, rgba = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { rgba.set(photo.data.subarray(i * 3, i * 3 + 3), i * 4); rgba[i * 4 + 3] = (i * 37) % 256; }
  for (const tool of TOOLS) {
    const extra = tool === "tan" ? { direction: "remove", allowLightening: true } : {};
    const four = renderSkinTool(tool, { ...photo, channels: 4, data: rgba }, golden.points, 80, extra);
    const three = renderSkinTool(tool, photo, golden.points, 80, extra);
    for (let i = 0; i < n; i++) {
      assert.equal(four.image[i * 4 + 3], (i * 37) % 256, `${tool} alpha at ${i}`);
      for (let k = 0; k < 3; k++) assert.equal(four.image[i * 4 + k], three.image[i * 3 + k]);
    }
  }
});

test("refusals carry reason codes; bad arguments throw", () => {
  const refused = renderSkinTool("tan", photo, golden.points, 50, { direction: "remove" });
  assert.ok(isRefusal(refused));
  assert.equal(refused.code, "lightening_needs_opt_in");
  assert.equal(refused.module, "skin.tan");
  assert.deepEqual(meshProblems(golden.points.slice(0, 400), photo.width, photo.height), ["wrong_shape"]);
  const duplicate = golden.points.map((p) => [...p]); duplicate[5] = [...duplicate[6]];
  assert.equal(renderSkinTool("glow", photo, duplicate).code, "duplicate_points");
  const away = golden.points.map(([x, y]) => [x + 1000, y + 1000]);
  assert.equal(renderSkinTool("tone", photo, away).code, "outside_frame");
  assert.equal(renderSkinTool("matte", photo, null).code, "wrong_shape");
  assert.throws(() => renderSkinTool("blush", photo, golden.points), /tool must be/);
  assert.throws(() => renderSkinTool("glow", photo, golden.points, 101), /strength/);
  assert.throws(() => renderSkinTool("glow", photo, golden.points, 30, { style: "unknown" }), /glow must be/);
});

test("the Skin studio: each tool is one tap, the original stays, removal waits for her tick", async () => {
  const dom = installDOM(), editor = new Editor("portrait", new ShellGpuRenderer(null));
  try {
    editor.selectStudio("skin");
    const before = editor.source.image.data.slice();
    let renders = 0;
    const screen = skinToolsScreen(editor, () => renders++);
    assert.deepEqual(screen.querySelectorAll("button").map((b) => b.textContent), ["Freckles", "Tan", "Matte", "Glow", "Even tone", "Remove tan"]);
    assert.match(screen.textContent, /not medical advice/);
    assert.equal(buttonNamed(screen, "Remove tan").disabled, true, "removal starts disabled");
    for (const name of ["Freckles", "Tan", "Matte", "Glow", "Even tone"]) {
      const count = editor.document.layers.length;
      await buttonNamed(screen, name).click();
      assert.equal(editor.document.layers.length, count + 1, name);
      assert.notDeepEqual(editor.rendered().image.data, before, name);
    }
    assert.equal(renders, 5);
    await buttonNamed(screen, "Glow").click();
    assert.equal(editor.document.layers.length, 5, "a second tap edits the same tool's layer");
    assert.deepEqual(editor.source.image.data, before, "original unchanged");
    const layers = editor.document.layers.length;
    assert.throws(() => chooseSkinTool(editor, "tan", { direction: "remove" }), /tick the box/);
    assert.throws(() => chooseSkinTool(editor, "blush"), /unknown skin tool/);
    assert.equal(editor.document.layers.length, layers);
    const tan = chooseSkinTool(editor, "tan", { allow_lightening: true, direction: "remove" });
    assert.equal(tan.parameters.direction, "remove");
    assert.equal(tan.parameters.allow_lightening, true);
    const back = chooseSkinTool(editor, "tan", { direction: "add", allow_lightening: false });
    assert.equal(back.parameters.direction, "add");
    assert.equal(back.parameters.allow_lightening, false);
  } finally { editor.dispose(); dom.restore(); }
});

test("tan is opt-in, removal is never a default, a tile or a demo step", () => {
  assert.deepEqual(registryProblems(), []);
  assert.ok(CATALOGUE.some((tool) => tool.id === "skin" && tool.source === "local"));
  for (const id of ["tone", "freckles", "tan", "matte", "glow"]) {
    const fx = E.effect(id);
    assert.equal(fx.studio, "skin"); assert.equal(fx.built, true); assert.equal(fx.category, "Skin");
  }
  assert.equal(E.effect("tan").optIn, true);
  assert.equal(E.control(E.effect("tan")).value, 0);
  assert.deepEqual([104, 105, 106].map((id) => E.EFFECTS.find((fx) => fx.feature === id)?.id), ["freckles", "matte", "glow"]);
  const editor = new Editor("portrait", new ShellGpuRenderer(null));
  try {
    const tiles = optionsFor("skin", editor.source);
    assert.deepEqual(tiles.map((t) => t.params.tool), ["tone", "matte", "glow", "glow", "freckles", "tan"]);
    for (const tile of tiles) { assert.notEqual(tile.params.direction, "remove"); assert.equal(tile.params.allow_lightening, false); }
    const added = editor.add("skin");
    assert.equal(added.parameters.allow_lightening, false);
    assert.equal(added.parameters.direction, "add");
  } finally { editor.dispose(); }
  assert.ok(validateLayer({ kind: "skin", params: { tool: "glow", style: "collioure" }, strength: 30 }, "portrait", 0));
  assert.throws(() => validateLayer({ kind: "skin", params: { tool: "tan", direction: "remove" } }, "portrait", 0));
  assert.throws(() => validateLayer({ kind: "skin", params: { tool: "tan", allow_lightening: true } }, "portrait", 0));
});
