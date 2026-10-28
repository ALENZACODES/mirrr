/** Browser-gallery contracts using only painted pixels, not user photographs.
 * Exercises the real published 346-concept file and the shipped TS renderer.
 * Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { browseHairstyles, syntheticIllustrationMask, BROWSE_CATEGORIES } from "../dist/js/commerce/hair-demo.js";
import { renderStyle, DEFAULT_ANCHORS, validatePresets } from "../dist/js/engines/menshair/render.js";

const styles = JSON.parse(readFileSync(new URL("../dist/menshair-presets.json", import.meta.url), "utf8"));
const html = readFileSync(new URL("../commerce.html", import.meta.url), "utf8");

function drawing(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p += 1) {
    const offset = 4 * p;
    const x = p % width, y = Math.floor(p / width);
    const hair = y < height / 3 && x >= width / 8 && x < width * 7 / 8;
    const c = hair ? [85, 64, 56] : [152, 102, 81];
    data.set([...c, 255], offset);
  }
  return data;
}

test("author-validated distinct local concepts are available in the shipped browser asset", () => {
  validatePresets(styles);
  assert.ok(styles.styles.length >= 346);
  assert.equal(new Set(styles.styles.map((s) => s.id)).size, styles.styles.length);
  assert.equal(styles.author, "John Khan");
  assert.ok(styles.styles.some((s) => s.family === "fade" && s.fade === "high"));
  assert.ok(styles.styles.some((s) => s.family === "pixie"));
  assert.ok(styles.styles.some((s) => s.family === "coils"));
  assert.ok(styles.styles.some((s) => s.family === "locs"));
  assert.ok(styles.styles.some((s) => s.family === "undercut"));
});

test("style-browse categories partition the exact catalogue without inferring gender", () => {
  const all = browseHairstyles(styles.styles, "all");
  assert.equal(all.length, styles.styles.length);
  const counts = BROWSE_CATEGORIES.filter((c) => c !== "all").map((category) =>
    browseHairstyles(styles.styles, category).length);
  assert.equal(counts.reduce((x, y) => x + y, 0), all.length);
  assert.ok(counts[0] > 10 && counts[1] > 10);
  const allIds = new Set(all.map((s) => s.id));
  for (const category of BROWSE_CATEGORIES) {
    const options = browseHairstyles(styles.styles, category);
    assert.equal(new Set(options.map((s) => s.id)).size, options.length);
    assert.ok(options.every((s) => allIds.has(s.id)));
  }
});

test("search matches plain original hairstyle names or family and rejects unsafe filters", () => {
  const fades = browseHairstyles(styles.styles, "all", "fade");
  assert.ok(fades.length >= 6);
  assert.ok(fades.every((s) => s.name.toLowerCase().includes("fade") || s.family.includes("fade")));
  const bobs = browseHairstyles(styles.styles, "feminine", "BOB");
  assert.ok(bobs.length > 0 && bobs.every((s) => s.presentation === "feminine"));
  assert.deepEqual(browseHairstyles(styles.styles, "all", "unlikelystringnosuchstyle"), []);
  assert.throws(() => browseHairstyles(styles.styles, "invalid", ""), /filter/);
  assert.throws(() => browseHairstyles(styles.styles, "all", "x".repeat(121)), /filter/);
});

test("illustration mask changes only precisely known painted pixels", () => {
  const width = 16, height = 16;
  const data = drawing(width, height);
  const m = syntheticIllustrationMask(data, width, height);
  for (let p = 0; p < width * height; p += 1) {
    const x = p % width, y = Math.floor(p / width);
    const eligible = y < height / 3 && x >= width / 8 && x < width * 7 / 8;
    assert.equal(m[p], eligible ? 255 : 0);
  }
  data.set([85, 64, 56, 128], 0);
  assert.equal(syntheticIllustrationMask(data, width, height)[0], 0, "Transparent paint is not eligible");
  data.set([90, 64, 56, 255], 4 * (width + 1));
  assert.equal(syntheticIllustrationMask(data, width, height)[width + 1], 0, "Unknown colour is never edited");
  assert.throws(() => syntheticIllustrationMask(new Uint8ClampedArray(19), 16, 16), /unsupported/);
});

test("the gallery mask is sufficient for local rendering but protects every other pixel", () => {
  const width = 32, height = 40;
  const source = drawing(width, height);
  const mask = syntheticIllustrationMask(source, width, height);
  let totalEdited = 0;
  const distinct = browseHairstyles(styles.styles, "all").filter((s) =>
    ["fade", "bob", "pixie", "locs", "undercut", "mohawk"].includes(s.family));
  for (const style of distinct) {
    const result = renderStyle(source, width, height, mask, DEFAULT_ANCHORS, style);
    assert.equal(result.evidence.provider_calls, 0);
    assert.ok(result.evidence.label.includes("simulation"));
    for (let p = 0; p < mask.length; p += 1) {
      if (mask[p] === 0) assert.deepEqual(Array.from(result.pixels.slice(p * 4, p * 4 + 4)),
        Array.from(source.slice(p * 4, p * 4 + 4)), `Outside-mask damage in ${style.id}`);
      if (result.pixels[p * 4] !== source[p * 4]) totalEdited += 1;
      assert.equal(result.pixels[p * 4 + 3], 255, "Alpha cannot change");
    }
  }
  assert.ok(totalEdited > 0, "The drawn hair concepts must produce actual pixel changes");
});

test("gallery uses source illustration only and all actions have accessible real controls", () => {
  for (const id of ["hair-gallery", "hair-category", "hair-search", "hair-style", "hair-render",
    "hair-status", "hair-original", "hair-result"]) {
    assert.ok(html.includes(`id="${id}"`), `Missing ${id}`);
  }
  assert.ok(html.includes('id="hair-status" role="status" aria-live="polite"'));
  assert.ok(html.includes("not automatic hairstyle generation"));
  assert.ok(html.includes("No visitor photo or YouCam API"));
});
