/** Original in-house swatches and generator drift tests. Never real product names. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { catalogue, measuredLevel, requireShade, suggest } from "../dist/js/engines/hair_palette/index.js";
import { applyShade } from "../dist/js/engines/hair_palette/preview.js";
import { DEFAULT_ANCHORS } from "../dist/js/engines/menshair/render.js";
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const canonical = JSON.parse(readFileSync(resolve(root, "api/plumb_api/engines/hair_palette/catalogue.json"), "utf8"));

test("generated TypeScript palette is the authored Python JSON, with no vendor names", () => {
  const actual = catalogue();
  assert.ok(actual.length >= 60);
  assert.deepEqual(actual, canonical.shades);
  assert.equal(new Set(actual.map((s) => s.id)).size, actual.length);
  assert.ok(actual.every((s) => s.assumed === true));
  assert.deepEqual(new Set(actual.filter((s) => s.family === "natural").map((s) => s.level)),
    new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  const source = readFileSync(resolve(root, "web/src/engines/hair_palette/generated/data.ts"), "utf8");
  assert.ok(source.startsWith("/** GENERATED"));
  assert.ok(!source.includes("http://") && !source.includes("https://"));
});

test("the generator is a failing drift check, not an automatic repair in tests", () => {
  const proc = spawnSync("python3", ["-m", "plumb_api.engines.hair_palette.export", "--check"], {
    cwd: root, env: { ...process.env, PYTHONPATH: resolve(root, "api") }, encoding: "utf8",
  });
  assert.equal(proc.status, 0, proc.stdout + proc.stderr);
});

test("nearest CIEDE2000 references are stable and do not automatically lighten", () => {
  for (const row of catalogue().filter((_, i) => i % 12 === 0)) {
    assert.equal(suggest(row.lab, { allowLightening: true, count: 1 })[0].shade.id, row.id);
    const proposed = suggest(row.lab, { count: 12 });
    assert.ok(proposed.every((s) => s.shade.level <= s.measured_level && s.no_auto_lightening));
    assert.ok(measuredLevel(row.lab) >= 1 && measuredLevel(row.lab) <= 10);
  }
  assert.throws(() => requireShade("unlicensed-brand-swatch"));
  assert.throws(() => suggest([NaN, 1, 2]));
  assert.throws(() => suggest([20, 1, 2], { count: 0 }));
});

test("local swatch tint never edits outside supplied primary face", () => {
  const width = 96, height = 72;
  const pixels = new Uint8Array(width * height * 4);
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    pixels.set([64, 43, 36, 211], i * 4);
    const x = i % width, y = Math.floor(i / width);
    if ((x > 10 && x < 38 || x > 56 && x < 88) && y < 46) mask[i] = 255;
  }
  const result = applyShade(pixels, width, height, mask, DEFAULT_ANCHORS,
    "natural-03-n", 4.5, { primaryBox: [0, 0, 48, 72] });
  assert.equal(result.rendered, true, result.reason);
  assert.ok(result.changedPixels > 0);
  for (let i = 0; i < width * height; i++) {
    if (i % width >= 48) assert.deepEqual(result.pixels.slice(i * 4, i * 4 + 4), pixels.slice(i * 4, i * 4 + 4));
  }
  const noMesh = applyShade(pixels, width, height, mask, null, "natural-03-n", 4);
  assert.equal(noMesh.code, "no_mesh");
  assert.throws(() => applyShade(pixels, width, height, mask, DEFAULT_ANCHORS, "natural-03-n", 2.25));
});
