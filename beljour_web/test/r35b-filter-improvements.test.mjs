/** BELJOUR 61-filter improvement gate: page caching, editorial metadata,
 * accessibility values and reduced-motion behavior. No imported photographs.
 * Created by John Khan.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import {
  EDITORIAL_FAMILIES, EDITORIAL_LIGHTS, checkCatalogue,
} from "../dist/js/filters/recipe/schema.js";
import { filterControls } from "../dist/js/filters/runtime/controls.js";
import {
  defaultFilterParams, filterOptions, renderFilterBatch,
  renderFilterTile, withFilterLevel,
} from "../dist/js/filters/runtime/layer.js";
import { ThumbCache, thumbSourceStamp } from "../dist/js/filters/runtime/cache.js";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { scaleSource } from "../dist/js/ui/shell/scale.js";

const cat = catalogue();
const source = scaleSource(makeSample("portrait"), 48);
const options = filterOptions();
const makeLayer = (id) => ({ strength: cat.get(id).defaults.strength, parameters: defaultFilterParams(id) });

function bytesSame(a, b) {
  assert.equal(a.width, b.width);
  assert.equal(a.height, b.height);
  assert.equal(a.channels, b.channels);
  assert.deepEqual(a.data, b.data);
}

test("complete catalogue has no missing editorial families or lights", () => {
  assert.equal(cat.recipes.length, 61);
  assert.deepEqual(checkCatalogue(cat.data), []);
  const familySet = new Set(), lightSet = new Set();
  for (const item of cat.recipes) {
    assert.ok(EDITORIAL_FAMILIES.includes(item.editorial.family), item.id);
    assert.ok(EDITORIAL_LIGHTS.includes(item.editorial.light), item.id);
    familySet.add(item.editorial.family);
    lightSet.add(item.editorial.light);
  }
  assert.deepEqual([...familySet].sort(), [...EDITORIAL_FAMILIES].sort());
  assert.deepEqual([...lightSet].sort(), [...EDITORIAL_LIGHTS].sort());
});

test("schema blocks a missing family rather than choosing a default", () => {
  const mutated = structuredClone(cat.data);
  delete mutated.recipes[0].editorial.family;
  assert.ok(checkCatalogue(mutated).some((message) => message.includes("editorial.family")));
});

test("schema blocks a missing light rather than choosing Window", () => {
  const mutated = structuredClone(cat.data);
  delete mutated.recipes[0].editorial.light;
  assert.ok(checkCatalogue(mutated).some((message) => message.includes("editorial.light")));
});

test("schema blocks unrecognized family and light", () => {
  const mutated = structuredClone(cat.data);
  mutated.recipes[0].editorial.family = "Unknown";
  mutated.recipes[0].editorial.light = "Moon";
  const errors = checkCatalogue(mutated);
  assert.ok(errors.some((message) => message.includes("editorial.family")));
  assert.ok(errors.some((message) => message.includes("editorial.light")));
});

test("filter selection exposes distinct spoken label for each editorial look", () => {
  for (const recipe of cat.recipes) {
    const controls = filterControls(makeLayer(recipe.id), { reducedMotion: true });
    const spoken = controls.accessibility.recipeLabel;
    assert.ok(spoken.includes(recipe.name));
    assert.ok(spoken.includes(recipe.editorial.family));
    assert.ok(spoken.includes(recipe.editorial.light));
    assert.ok(spoken.startsWith("BELJOUR filter:"));
    assert.equal(controls.family, recipe.editorial.family);
    assert.equal(controls.light, recipe.editorial.light);
  }
});

test("strength slider has stable screen-reader name and decimal value", () => {
  const layer = withFilterLevel(makeLayer("C08"), 3.7);
  const controls = filterControls(layer, { reducedMotion: true });
  assert.equal(controls.level, 3.7);
  assert.equal(controls.accessibility.strengthValueText, "3.7 of 5.0");
  assert.match(controls.accessibility.strengthLabel, /filter strength/);
  assert.equal(controls.accessibility.liveRegion, "polite");
  assert.match(controls.accessibility.previewAnnouncement, /3\.7 of 5\.0/);
});

test("identity lock remains ON by default and announced", () => {
  const controls = filterControls(makeLayer("C08"), { reducedMotion: false });
  assert.equal(controls.identityLock, true);
  assert.match(controls.accessibility.previewAnnouncement, /Identity lock on/);
});

test("explicit identity lock OFF is still reflected, not silently overridden", () => {
  const layer = makeLayer("C08");
  layer.parameters.identity_lock = false;
  const controls = filterControls(layer, { reducedMotion: false });
  assert.equal(controls.identityLock, false);
  assert.match(controls.accessibility.previewAnnouncement, /Identity lock off/);
});

test("all toggles receive descriptive accessible names", () => {
  const controls = filterControls(makeLayer("C08"));
  assert.ok(controls.accessibility.toggles.guard.includes("skin tone"));
  assert.ok(controls.accessibility.toggles.protect.includes("skin"));
  assert.ok(controls.accessibility.toggles.background.includes("Background"));
  assert.ok(controls.accessibility.identityLockLabel.includes("identity"));
});

test("reduced-motion mode disables every declared preview transition", () => {
  for (const id of ["C01", "C08", "C40", "M02"]) {
    const access = filterControls(makeLayer(id), { reducedMotion: true }).accessibility;
    assert.equal(access.reducedMotion, true);
    assert.equal(access.transitionMs, 0);
    assert.equal(access.animatePreview, false);
    assert.equal(access.animateBeforeAfter, false);
  }
});

test("normal motion leaves optional short preview transitions available", () => {
  const access = filterControls(makeLayer("C08"), { reducedMotion: false }).accessibility;
  assert.equal(access.reducedMotion, false);
  assert.equal(access.transitionMs, 120);
  assert.equal(access.animatePreview, true);
  assert.equal(access.animateBeforeAfter, true);
});

test("system prefers-reduced-motion is honored without explicit caller override", () => {
  const previous = globalThis.matchMedia;
  try {
    globalThis.matchMedia = (query) => {
      assert.equal(query, "(prefers-reduced-motion: reduce)");
      return { matches: true };
    };
    const access = filterControls(makeLayer("C08")).accessibility;
    assert.equal(access.transitionMs, 0);
    assert.equal(access.reducedMotion, true);
  } finally {
    if (previous === undefined) delete globalThis.matchMedia;
    else globalThis.matchMedia = previous;
  }
});

test("explicit editor preference takes priority over operating system motion", () => {
  const previous = globalThis.matchMedia;
  try {
    globalThis.matchMedia = () => ({ matches: true });
    const access = filterControls(makeLayer("C08"), { reducedMotion: false }).accessibility;
    assert.equal(access.transitionMs, 120);
    assert.equal(access.reducedMotion, false);
  } finally {
    if (previous === undefined) delete globalThis.matchMedia;
    else globalThis.matchMedia = previous;
  }
});

test("lazy first filter page renders only requested recipes", () => {
  const cache = new ThumbCache();
  const first = renderFilterBatch(source, options, 0, 3, cache);
  assert.equal(first.length, 3);
  assert.equal(cache.stats.size, 3);
  assert.equal(cache.stats.hits, 0);
  assert.equal(cache.stats.misses, 3);
});

test("a second request for the same page hits all cached tiles", () => {
  const cache = new ThumbCache();
  const first = renderFilterBatch(source, options, 0, 3, cache);
  const second = renderFilterBatch(source, options, 0, 3, cache);
  assert.equal(cache.stats.size, 3);
  assert.equal(cache.stats.hits, 3);
  for (let index = 0; index < 3; index++) bytesSame(first[index], second[index]);
});

test("later pages are lazy and return the correct ordered recipes", () => {
  const cache = new ThumbCache();
  const first = renderFilterBatch(source, options, 0, 2, cache);
  assert.equal(cache.stats.size, 2);
  const later = renderFilterBatch(source, options, 1, 2, cache);
  assert.equal(later.length, 2);
  assert.equal(cache.stats.size, 4);
  const separate = new ThumbCache();
  for (let i = 0; i < 2; i++) bytesSame(later[i], renderFilterTile(source, options[i + 2], separate));
  assert.ok(first[0].data.length > 0);
});

test("batch and legacy single-tile APIs return identical bytes", () => {
  const cache = new ThumbCache();
  const inBatch = renderFilterBatch(source, options, 0, 3, cache);
  const separate = new ThumbCache();
  for (let i = 0; i < 3; i++) bytesSame(inBatch[i], renderFilterTile(source, options[i], separate));
});

test("last page has a partial count, no eager extra tiles", () => {
  const cache = new ThumbCache();
  const final = renderFilterBatch(source, options, 5, 12, cache);
  assert.equal(final.length, 1);
  assert.equal(cache.stats.size, 1);
});

test("empty selection allocates no thumbnails", () => {
  const cache = new ThumbCache();
  assert.deepEqual(renderFilterBatch(source, [], 0, 12, cache), []);
  assert.equal(cache.stats.bytes, 0);
});

test("invalid page arguments fail before hashing photo bytes", () => {
  const cache = new ThumbCache();
  for (const [page, size] of [[-1, 12], [2.4, 12], [0, 0], [0, 62], [6, 12]]) {
    assert.throws(() => renderFilterBatch(source, options, page, size, cache), RangeError);
  }
  assert.equal(cache.stats.size, 0);
});

test("in-place changed photo pixels invalidate batch thumbnails", () => {
  const cache = new ThumbCache();
  const mutable = { ...source, image: { ...source.image, data: Uint8Array.from(source.image.data) } };
  const before = thumbSourceStamp(mutable);
  renderFilterBatch(mutable, options, 0, 2, cache);
  const hits = cache.stats.hits;
  mutable.image.data[3] ^= 127;
  assert.notEqual(before, thumbSourceStamp(mutable));
  renderFilterBatch(mutable, options, 0, 2, cache);
  assert.equal(cache.stats.hits, hits);
  assert.equal(cache.stats.size, 4);
});

test("batch renderer respects byte budgets and cache eviction", () => {
  const cache = new ThumbCache(25000);
  renderFilterBatch(source, options, 0, 5, cache);
  assert.ok(cache.stats.bytes <= 25000);
  assert.ok(cache.stats.size <= 5);
});

test("batch output mutation cannot corrupt cached photo thumbnails", () => {
  const cache = new ThumbCache();
  const first = renderFilterBatch(source, options, 0, 1, cache)[0];
  const original = Uint8Array.from(first.data);
  first.data.fill(0);
  const reused = renderFilterBatch(source, options, 0, 1, cache)[0];
  assert.deepEqual(reused.data, original);
  assert.notStrictEqual(first.data, reused.data);
});

test("later cached output mutation cannot poison the next cached read", () => {
  const cache = new ThumbCache();
  renderFilterBatch(source, options, 0, 1, cache);
  const second = renderFilterBatch(source, options, 0, 1, cache)[0];
  const original = Uint8Array.from(second.data);
  second.data[0] ^= 255;
  const third = renderFilterBatch(source, options, 0, 1, cache)[0];
  assert.deepEqual(third.data, original);
  assert.equal(cache.stats.hits, 2);
});

test("copy-on-set thumbnail cache never retains a mutable caller buffer", () => {
  const cache = new ThumbCache();
  const original = { width: 2, height: 2, channels: 3, data: new Uint8Array(12).fill(42) };
  cache.setCopy("safe", original);
  original.data.fill(10);
  const fetched = cache.getCopy("safe");
  assert.deepEqual(fetched.data, new Uint8Array(12).fill(42));
});

test("copy-on-read cache gives independent output buffers", () => {
  const cache = new ThumbCache();
  cache.setCopy("a", { width: 2, height: 2, channels: 3, data: new Uint8Array(12).fill(18) });
  const a = cache.getCopy("a");
  const b = cache.getCopy("a");
  assert.notStrictEqual(a, b);
  assert.notStrictEqual(a.data, b.data);
  a.data.fill(0);
  assert.ok(b.data.every((x) => x === 18));
});

test("the legacy single-tile caller still uses its historical cache identity", () => {
  const cache = new ThumbCache();
  const one = renderFilterTile(source, options[0], cache);
  const two = renderFilterTile(source, options[0], cache);
  assert.strictEqual(one, two);
});
