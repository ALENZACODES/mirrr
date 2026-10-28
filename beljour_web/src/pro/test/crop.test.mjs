import assert from "node:assert/strict";
import test from "node:test";
import { checkCrop, defaultRecipe, insideCrop, inversePixel,
  makeCropGeometry, previewGeometry } from "../../../dist/js/pro/index.js";

const crop = (overrides = {}) => ({ ...defaultRecipe().crop, ...overrides });

test("geometry: percentage square crop stays centered", () => {
  const g = makeCropGeometry(1200, 800, crop({ aspect: "square" }));
  assert.equal(g.rect.x, 200);
  assert.equal(g.rect.y, 0);
  assert.deepEqual([g.rect.width, g.rect.height], [800, 800]);
  assert.deepEqual(inversePixel(g, 399.5, 399.5), [600, 400]);
});

test("geometry: subpixel crop precision and exact free angle", () => {
  const rect = crop({ x: 0.1255, y: 0.231, width: 0.503, height: 0.42, aspect: "free" });
  const g = makeCropGeometry(2000, 1300, rect);
  assert.ok(Math.abs(g.rect.x - 251) < 1e-9);
  assert.ok(Math.abs(g.rect.y - 300.3) < 1e-9);
  assert.ok(Math.abs(g.rect.width - 1006) < 1e-9);
  assert.ok(Math.abs(g.rect.height - 546) < 1e-9);
  assert.ok(g.width <= g.rect.width + 1);
});

test("geometry: quarter turn swaps dimensions and inverse stays centered", () => {
  const g = makeCropGeometry(800, 400, crop({ rotation: 90 }));
  assert.equal(g.width, 400);
  assert.equal(g.height, 800);
  assert.deepEqual(inversePixel(g, 199.5, 399.5).map(Math.round), [400, 200]);
  assert.equal(insideCrop(g, ...inversePixel(g, 0, 0)), true);
});

test("geometry: free angle expands bounds with transparent corners", () => {
  const g = makeCropGeometry(1000, 600, crop({ rotation: 45 }));
  assert.ok(g.width > 1000 && g.height > 600);
  assert.equal(insideCrop(g, ...inversePixel(g, 0, 0)), false);
  assert.equal(insideCrop(g, ...inversePixel(g, Math.floor(g.width / 2), Math.floor(g.height / 2))), true);
});

test("geometry: respect max export edge, never enlarge source", () => {
  const g = makeCropGeometry(3000, 4000, crop(), 1600);
  assert.deepEqual([g.width, g.height], [1200, 1600]);
  const small = makeCropGeometry(200, 100, crop(), 4800);
  assert.deepEqual([small.width, small.height], [200, 100]);
  const preview = previewGeometry(g, 640);
  assert.equal(preview.height, 640);
  assert.equal(preview.rect.x, g.rect.x);
});

test("geometry: invalid crop, unbounded source and bad preset reject", () => {
  assert.throws(() => checkCrop(crop({ width: 0 })));
  assert.throws(() => checkCrop(crop({ x: 0.8, width: 0.4 })));
  assert.throws(() => checkCrop(crop({ rotation: Infinity })));
  assert.throws(() => checkCrop(crop({ aspect: "missing" })));
  assert.throws(() => makeCropGeometry(4000, 4000, crop()));
  assert.throws(() => makeCropGeometry(3000, 4000, crop(), 0));
  assert.throws(() => previewGeometry(makeCropGeometry(200, 100, crop()), 32));
});

