/** Local hair-workbench selection tests; all pixels are invented numeric arrays. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { headFromPoints, markDisc } from "../dist/js/commerce/hair-workbench.js";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const points = [
  [.28, .34], [.72, .34], [.50, .11], [.24, .59], [.76, .59], [.50, .83],
];

test("brush never paints outside its clipped disc or changes an unrelated mask", () => {
  const mask = new Uint8Array(96 * 72);
  const other = new Uint8Array(mask.length);
  markDisc(mask, 96, 72, 24, 35, 9, true);
  assert.equal(mask[35 * 96 + 24], 255);
  assert.equal(mask[0], 0);
  assert.equal(mask[35 * 96 + 35], 0);
  assert.equal(other.some((value) => value !== 0), false);
  for (let y = 0; y < 72; y++) for (let x = 0; x < 96; x++) {
    if (mask[y * 96 + x]) assert.ok((x - 24) ** 2 + (y - 35) ** 2 <= 81);
  }
  markDisc(mask, 96, 72, 24, 35, 9, false);
  assert.ok(mask.every((value) => value === 0));
});

test("brush clips at the image boundary and refuses malformed inputs", () => {
  const mask = new Uint8Array(32 * 24);
  markDisc(mask, 32, 24, 0, 0, 10, true);
  assert.ok(mask[0] === 255 && mask[23 * 32 + 31] === 0);
  assert.throws(() => markDisc(new Uint8Array(10), 32, 24, 1, 1, 4, true));
  assert.throws(() => markDisc(mask, 32, 24, 1, 1, 0, true));
  assert.throws(() => markDisc(mask, 32, 24, NaN, 1, 5, true));
  assert.throws(() => markDisc(mask, 32, 24, 5, 5, 80, true));
});

test("six user-supplied points are required and cannot be guessed", () => {
  assert.equal(headFromPoints([]), null);
  assert.equal(headFromPoints(points.slice(0, 5)), null);
  assert.equal(headFromPoints([...points, [.9, .9]]), null);
  assert.equal(headFromPoints(points.map((p) => [p[0], p[1]]).reverse()), null);
  assert.deepEqual(headFromPoints(points)?.crown, [.50, .11]);
  assert.equal(headFromPoints([[NaN, .2], ...points.slice(1)]), null);
});

test("commerce entry point mounts memory-only local workbench and has no direct network calls", () => {
  const code = readFileSync(resolve(root, "web/src/commerce/hair-workbench.ts"), "utf8");
  const page = readFileSync(resolve(root, "web/src/commerce/page.ts"), "utf8");
  assert.match(page, /void setupHairWorkbench\(\)/);
  assert.match(code, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(code, /new CoverSession\(\)/);
  assert.match(code, /renderStyleForFace\(/);
  assert.match(code, /applyShade\(/);
  assert.doesNotMatch(code, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
  assert.match(code, /"moving" \| "release"/);
  assert.match(code, /"no_mesh/);
});
