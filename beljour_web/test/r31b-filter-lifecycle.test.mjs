/** Filter thumbnail revisions and isolated incremental rendering on drawn data.
 * No photos or masks are saved or uploaded. Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { scaleSource } from "../dist/js/ui/shell/scale.js";
import { thumbKey, ThumbCache, thumbSourceStamp } from "../dist/js/filters/runtime/cache.js";
import { masksFor, renderFilterTile } from "../dist/js/filters/runtime/layer.js";
import { captureMasks, TiledRender } from "../dist/js/filters/runtime/tiles.js";
import { FilterJobs } from "../dist/js/filters/runtime/jobs.js";

function portrait() {
  const source = scaleSource(makeSample("portrait"), 64);
  assert.ok(source.face?.length >= 468);
  return { ...source, id: "synthetic-r31b", geometryRevision: 4,
    face: source.face.map(([x, y]) => [x, y]) };
}

function person() {
  const source = scaleSource(makeSample("body-front"), 64);
  assert.ok(source.person);
  return { ...source, id: "synthetic-mask-r31b", geometryRevision: 7,
    person: { ...source.person, data: Float32Array.from(source.person.data) } };
}

const tile = {
  recipe: "C08",
  strength: 30,
  params: { recipe: "C08", guard: true, protect: false, background: false,
    identity_lock: true },
};

function pixelsEqual(a, b) {
  assert.equal(a.length, b.length);
  assert.ok(a.every((x, i) => x === b[i]));
}

function syntheticRender() {
  const width = 34;
  const height = 29;
  const rgb = new Uint8Array(width * height * 3);
  const skin = new Float32Array(width * height);
  const oval = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x;
    const inside = x >= 5 && x <= 28 && y >= 4 && y <= 25;
    skin[p] = inside ? 0.6 + (x % 3) * 0.2 : 0;
    oval[p] = inside ? 1 : 0;
    rgb.set([inside ? 178 + x % 6 : 54 + x,
      inside ? 112 + y % 7 : 74 + y,
      inside ? 91 + x % 8 : 122], p * 3);
  }
  const mask = (data) => ({ width, height, channels: 1, data });
  return { image: { width, height, channels: 3, data: rgb },
    masks: { skin: mask(skin), person: mask(oval), source: "landmarks", note: "" } };
}

test("one unchanged preview uses the same thumbnail and stable local revision", () => {
  const source = portrait();
  const initial = thumbSourceStamp(source);
  assert.match(initial, /^[0-9a-f]{16}$/);
  assert.equal(initial, thumbSourceStamp(source));
  const cache = new ThumbCache(16 * 1024 * 1024);
  const first = renderFilterTile(source, tile, cache);
  const cached = renderFilterTile(source, tile, cache);
  assert.strictEqual(first, cached);
  assert.equal(cache.stats.hits, 1);
  assert.equal(cache.stats.misses, 1);
});

test("landmark edits invalidate thumbnails without a geometryRevision bump", () => {
  const source = portrait();
  const cache = new ThumbCache(16 * 1024 * 1024);
  const firstKey = thumbSourceStamp(source);
  const first = renderFilterTile(source, tile, cache);
  const firstMask = masksFor(source);
  source.face[16][0] += 0.125;
  assert.notEqual(thumbSourceStamp(source), firstKey);
  assert.notStrictEqual(masksFor(source), firstMask);
  const next = renderFilterTile(source, tile, cache);
  assert.notStrictEqual(next, first);
  assert.equal(cache.stats.misses, 2);
});

test("direct edits to the thumbnail photo invalidate cache without an ID change", () => {
  const source = portrait();
  const cache = new ThumbCache(16 * 1024 * 1024);
  const stamp = thumbSourceStamp(source);
  renderFilterTile(source, tile, cache);
  source.image.data[2] ^= 1;
  assert.notEqual(thumbSourceStamp(source), stamp);
  renderFilterTile(source, tile, cache);
  assert.equal(cache.stats.misses, 2);
});

test("in-place person-mask edits invalidate mask memo and thumbnails", () => {
  const source = person();
  const first = masksFor(source);
  assert.strictEqual(first.person, source.person);
  assert.strictEqual(masksFor(source), first);
  const stamp = thumbSourceStamp(source);
  source.person.data[17] = source.person.data[17] === 0 ? 0.8 : 0;
  assert.notEqual(thumbSourceStamp(source), stamp);
  const second = masksFor(source);
  assert.notStrictEqual(second, first);
  assert.strictEqual(second.person, source.person);
  assert.strictEqual(masksFor(source), second);
});

test("versioned thumbnail keys retain their source eviction semantics", () => {
  const cache = new ThumbCache(200);
  const fields = { source: "synthetic-preview", side: 8, recipe: "C08", strength: 60,
    revision: 4, params: { guard: true, identity_lock: false } };
  const one = thumbKey({ ...fields, snapshot: "aaaaaaaaaaaaaaaa" });
  const two = thumbKey({ ...fields, snapshot: "bbbbbbbbbbbbbbbb" });
  assert.notEqual(one, two);
  assert.match(one, /revision=4\|snapshot=/);
  const image = { width: 3, height: 3, channels: 3, data: new Uint8Array(27) };
  cache.set(one, image);
  cache.set(two, image);
  assert.equal(cache.dropSource("synthetic-preview"), 2);
});

test("oversized thumbnail replacement cannot leave stale bytes under the same key", () => {
  const cache = new ThumbCache(100);
  const old = { width: 4, height: 4, channels: 3, data: new Uint8Array(48) };
  cache.set("r", old);
  const oversized = { width: 7, height: 7, channels: 3, data: new Uint8Array(147) };
  cache.set("r", oversized);
  assert.equal(cache.get("r"), undefined);
  assert.equal(cache.stats.bytes, 0);
  assert.throws(() => cache.set("broken", { width: 2, height: 3, channels: 3,
    data: new Uint8Array(3) }), /dimensions/);
});

test("captured masks are independent of subsequent changes to caller buffers", () => {
  const { image, masks } = syntheticRender();
  const expected = new TiledRender(image, "C03", { strength: 85 }, masks, null, 16).runAll();
  const running = new TiledRender(image, "C03", { strength: 85 }, masks, null, 16);
  running.step();
  const oldSkin = masks.skin.data[5 * image.width + 7];
  masks.skin.data.fill(0);
  masks.person.data.fill(0);
  image.data.fill(0);
  assert.notEqual(oldSkin, masks.skin.data[5 * image.width + 7]);
  const actual = running.runAll();
  pixelsEqual(actual.image.data, expected.image.data);
  pixelsEqual(actual.look.data, expected.look.data);
  assert.equal(actual.plan.recipe, expected.plan.recipe);
});

test("partial-edge masks also remain isolated during a guard-off tiled render", () => {
  const { image, masks } = syntheticRender();
  const settings = { strength: 90, guard: false, backgroundOnly: true };
  const expected = new TiledRender(image, "C01", settings, masks, null, 16).runAll();
  const running = new TiledRender(image, "C01", settings, masks, null, 16);
  while (running.current === "look") running.step();
  masks.person.data.fill(0);
  masks.skin.data.fill(0);
  const result = running.runAll();
  pixelsEqual(result.image.data, expected.image.data);
  pixelsEqual(result.look.data, expected.look.data);
});

test("missing, nonfinite and inconsistent masks fail before rendering a tile", () => {
  const { image, masks } = syntheticRender();
  const mismatched = { ...masks, skin: { ...masks.skin, width: image.width + 1 } };
  assert.throws(() => new TiledRender(image, "C03", {}, mismatched), /dimensions/);
  const short = { ...masks, skin: { ...masks.skin, data: new Float32Array(5) } };
  assert.throws(() => captureMasks(short, image.width, image.height), /dimensions/);
  const nan = Float32Array.from(masks.skin.data);
  nan[0] = NaN;
  assert.throws(() => new TiledRender(image, "C03", {}, { ...masks,
    skin: { ...masks.skin, data: nan } }), /finite/);
  const infinity = Float32Array.from(masks.person.data);
  infinity[2] = Infinity;
  assert.throws(() => new TiledRender(image, "C03", {}, { ...masks,
    person: { ...masks.person, data: infinity } }), /finite/);
  const wrong = Float32Array.from(masks.skin.data);
  wrong[0] = -0.001;
  assert.throws(() => new TiledRender(image, "C03", {}, { ...masks,
    skin: { ...masks.skin, data: wrong } }), /finite/);
});

test("job IDs cannot overlap or clobber cancellation state", async () => {
  const photo = portrait();
  const queue = [];
  const jobs = new FilterJobs(() => new Promise((resolve) => queue.push(resolve)), 1);
  const request = { parameters: tile.params, strength: 60, tile: 16 };
  const first = jobs.run(27, photo, request);
  assert.equal(jobs.active, 1);
  assert.equal(queue.length, 1);
  const duplicate = await jobs.run(27, photo, request);
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.error, /already running/);
  assert.equal(jobs.active, 1);
  assert.equal(jobs.cancel(27), true);
  queue.shift()();
  const result = await first;
  assert.equal(result.ok, false);
  assert.equal(result.cancelled, true);
  assert.equal(jobs.active, 0);
  assert.equal(jobs.cancel(27), false);
  for (const id of [-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const bad = await jobs.run(id, photo, request);
    assert.equal(bad.ok, false);
    assert.match(bad.error, /Invalid filter job ID/);
  }
});

test("hue clamp can write into the export buffer without changing input bytes", async () => {
  const { image, masks } = syntheticRender();
  const { clampHue } = await import("../dist/js/filters/masks/hue-lock.js");
  const before = Uint8Array.from(image.data);
  const styled = Uint8Array.from(before);
  for (let p = 0; p < styled.length; p += 3) {
    styled[p] = Math.min(255, styled[p] + 16);
    styled[p + 1] = Math.max(0, styled[p + 1] - 15);
  }
  const raw = Uint8Array.from(styled);
  const expected = clampHue(before, styled, masks.skin);
  const reused = new Uint8Array(styled.length);
  assert.strictEqual(clampHue(before, styled, masks.skin, reused), reused);
  pixelsEqual(reused, expected);
  pixelsEqual(image.data, before);
  pixelsEqual(styled, raw);
  assert.throws(() => clampHue(before, styled, masks.skin, before), /disjoint/);
  assert.throws(() => clampHue(before, styled, masks.skin, styled), /disjoint/);
  assert.throws(() => clampHue(before, styled, masks.skin, new Uint8Array(4)), /equal-sized/);
  const empty = clampHue(before, styled, null, reused);
  assert.strictEqual(empty, reused);
  pixelsEqual(empty, styled);
});

test("global face-mask memo has bounded bytes and explicit reset and source eviction", async () => {
  const {
    clearFilterMaskCache, dropFilterMaskSource, maskMemoUsage,
    MASK_MEMO_MAX_BYTES,
  } = await import("../dist/js/filters/runtime/layer.js");
  clearFilterMaskCache();
  assert.deepEqual(maskMemoUsage(), { entries: 0, bytes: 0 });
  const fresh = portrait();
  masksFor(fresh);
  assert.ok(maskMemoUsage().bytes > 0);
  assert.equal(dropFilterMaskSource("synthetic-r31b"), 1);
  assert.deepEqual(maskMemoUsage(), { entries: 0, bytes: 0 });
  const sources = [];
  const width = 1024;
  const height = 1024;
  for (let i = 0; i < 3; i++) {
    sources.push({ id: `large-mask-${i}`, geometryRevision: 1,
      image: { width, height, channels: 3, data: new Uint8Array(width * height * 3) },
      kind: "sample", label: "Drawn", disposable: true,
      person: { width, height, channels: 1, data: new Float32Array(width * height) } });
  }
  const first = masksFor(sources[0]);
  for (const source of sources.slice(1)) masksFor(source);
  assert.ok(maskMemoUsage().bytes <= MASK_MEMO_MAX_BYTES);
  assert.ok(maskMemoUsage().entries <= 16);
  assert.notStrictEqual(masksFor(sources[0]), first, "large stale entry was evicted");
  clearFilterMaskCache();
  const oversizedHeight = 2048;
  const oversizedWidth = 1024;
  const oversized = { id: "oversized-mask", geometryRevision: 1,
    image: { width: oversizedWidth, height: oversizedHeight, channels: 3,
      data: new Uint8Array(oversizedWidth * oversizedHeight * 3) },
    kind: "sample", label: "Drawn", disposable: true,
    person: { width: oversizedWidth, height: oversizedHeight, channels: 1,
      data: new Float32Array(oversizedWidth * oversizedHeight) } };
  masksFor(oversized);
  assert.deepEqual(maskMemoUsage(), { entries: 0, bytes: 0 },
    "larger-than-budget masks are rendered but not copied into the memo");
  clearFilterMaskCache();
  assert.deepEqual(maskMemoUsage(), { entries: 0, bytes: 0 });
});

test("thumbnail keys do not collide across special preset labels or source IDs", () => {
  const common = { side: 64, recipe: "C08", strength: 40 };
  const grouped = thumbKey({ ...common, source: "user|photo", params: { preset: "a&b=2" } });
  const split = thumbKey({ ...common, source: "user|photo", params: { preset: "a", b: 2 } });
  assert.notEqual(grouped, split);
  assert.match(grouped, /%7C/);
  assert.match(grouped, /%26/);
  const cache = new ThumbCache(512);
  const image = { width: 4, height: 4, channels: 3, data: new Uint8Array(48) };
  cache.set(grouped, image);
  cache.set(split, image);
  assert.equal(cache.dropSource("user|photo"), 2);
  assert.throws(() => thumbKey({ ...common, source: "a", params: {}, revision: NaN }), /revision/);
  assert.throws(() => thumbKey({ ...common, source: "a", params: {}, snapshot: "bad" }), /snapshot/);
});

test("synchronous filter previews reject broken masks before the identity shortcut", async () => {
  const { render } = await import("../dist/js/filters/runtime/engine.js");
  const { image, masks } = syntheticRender();
  const settings = { strength: 0 };
  const broken = Float32Array.from(masks.skin.data);
  broken[0] = NaN;
  assert.throws(() => render(image, "C08", settings, { ...masks,
    skin: { ...masks.skin, data: broken } }), /finite/);
  assert.throws(() => render(image, "C08", settings, { ...masks,
    person: { ...masks.person, height: masks.person.height + 1 } }), /dimensions/);
  broken[0] = -0.2;
  assert.throws(() => render(image, "C08", {}, { ...masks,
    skin: { ...masks.skin, data: broken } }), /finite/);
  const valid = render(image, "C08", settings, masks);
  pixelsEqual(valid.image.data, image.data);
});

test("mask cache keys cannot let source IDs or shape edits collide", async () => {
  const { clearFilterMaskCache, dropFilterMaskSource } = await import("../dist/js/filters/runtime/layer.js");
  clearFilterMaskCache();
  const first = { ...person(), id: "upload:sample" };
  const second = { ...person(), id: "upload:sample|revision=7" };
  const mask = masksFor(first);
  masksFor(second);
  assert.equal(dropFilterMaskSource("upload:sample"), 1);
  assert.strictEqual(masksFor(second), masksFor(second));
  const refreshed = masksFor(first);
  assert.notStrictEqual(refreshed, mask);
  const prior = masksFor(first);
  first.person.width += 1;
  const updated = masksFor(first);
  assert.notStrictEqual(prior, updated);
  assert.throws(() => renderFilterTile(first, tile, new ThumbCache(10_000_000)), /dimensions/);
  clearFilterMaskCache();
});
