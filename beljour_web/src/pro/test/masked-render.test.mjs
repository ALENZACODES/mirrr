import { encodedBlob } from "./encoded-fixtures.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { CanvasProSurface, defaultRecipe, exportPhotoPro, makeCropGeometry,
  makeCurveLuts, previewPhoto, threePointCurve } from "../../../dist/js/pro/index.js";

const gradient = { kind: "linear", mode: "add", opacity: 1, feather: 0,
  start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };

class Fake2d {
  received = null;
  saved = 0;
  restored = 0;

  save() { this.saved++; }
  restore() { this.restored++; }
  setTransform() {}
  clearRect() {}
  fillRect() {}
  translate() {}
  scale() {}
  rotate() {}
  drawImage() {}
  beginPath() {}
  rect() {}
  clip() {}
  measureText() { return { width: 50 }; }
  fillText() {}
  getImageData(x, y, width, height) {
    assert.equal(x, 0);
    assert.equal(y, 0);
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let offset = 0; offset < pixels.length; offset += 4) {
      pixels[offset] = 80;
      pixels[offset + 1] = 120;
      pixels[offset + 2] = 160;
      pixels[offset + 3] = 255;
    }
    return { data: pixels };
  }
  putImageData(data) { this.received = data.data; }
}

class FakeOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.context = new Fake2d();
  }
  getContext() { return this.context; }
  async convertToBlob(options) { return new Blob([new Uint8Array(10)], { type: options.type }); }
}

test("real canvas surface code applies source-anchored mask to curves, not alpha", () => {
  const original = globalThis.OffscreenCanvas;
  globalThis.OffscreenCanvas = FakeOffscreenCanvas;
  try {
    const recipe = { ...defaultRecipe(), masks: [gradient],
      curves: { ...defaultRecipe().curves, master: threePointCurve(0.8) } };
    const surface = new CanvasProSurface(4, 1);
    const geometry = makeCropGeometry(4, 1, recipe.crop);
    surface.draw({ image: {}, width: 4, height: 1 }, geometry,
      makeCurveLuts(recipe.curves), "Simulation", false, recipe.masks);
    const rgba = surface.canvas.context.received;
    assert.equal(rgba[0], 80);
    assert.equal(rgba[5], 120); // original green is unchanged where mask is zero
    assert.ok(rgba[12] > 80);
    assert.equal(rgba[15], 255);
    assert.equal(surface.canvas.context.saved, surface.canvas.context.restored);
  } finally {
    globalThis.OffscreenCanvas = original;
  }
});

test("preview/export receive exact same mask recipe and retain Simulation by default", async () => {
  const recipe = { ...defaultRecipe(), masks: [gradient] };
  const source = { image: {}, width: 120, height: 100 };
  const captured = [];
  const factory = (width, height) => ({
    canvas: null,
    draw(_source, geometry, tables, label, matte, masks) {
      captured.push({ geometry, tables, label, matte, masks });
    },
    async encode(mime) { return encodedBlob(mime); },
  });
  const preview = previewPhoto(source, recipe, factory);
  assert.equal(preview.width, 120);
  const output = await exportPhotoPro(source, recipe, "safe", factory);
  assert.equal(output.label, "Simulation");
  assert.equal(output.width, 120);
  assert.equal(captured.length, 2);
  assert.equal(captured[0].label, "Simulation");
  assert.equal(captured[1].label, "Simulation");
  assert.deepEqual(captured[0].masks, recipe.masks);
  assert.deepEqual(captured[1].masks, recipe.masks);
  assert.equal(captured[0].matte, false);
  assert.equal(captured[1].matte, true);
});

test("masking with an empty recipe produces the same legacy transform path", () => {
  const recipe = defaultRecipe();
  const saved = globalThis.OffscreenCanvas;
  globalThis.OffscreenCanvas = FakeOffscreenCanvas;
  try {
    const output = new CanvasProSurface(4, 1);
    const geom = makeCropGeometry(4, 1, recipe.crop);
    output.draw({ image: {}, width: 4, height: 1 }, geom,
      makeCurveLuts(recipe.curves), null, false, []);
    assert.equal(output.canvas.context.received, null);
  } finally {
    globalThis.OffscreenCanvas = saved;
  }
});
