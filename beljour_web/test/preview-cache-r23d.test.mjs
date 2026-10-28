// Synthetic LRU cache covers source, effect, strength and tolerance without pixels in reports.
import assert from "node:assert/strict";
import { test } from "node:test";
import { JudgePreviewCache } from "../dist/js/ui/shell/preview-cache.js";

function fakeDOM() {
  const canvases = [];
  const doc = {
    createElement: () => {
      const canvas = {
        width: 0,
        height: 0,
        transfers: [],
        getContext: () => ({ drawImage: (image) => canvas.transfers.push(image) }),
      };
      canvases.push(canvas);
      return canvas;
    },
  };
  return { doc, canvases };
}

function request(overrides = {}) {
  return { photo: "image-1", edit: "face-warm", strength: 3.0, tuning: 1.0, ...overrides };
}

test("repeated identical preview uses actual cached raster and avoids a second draw", () => {
  const { doc } = fakeDOM();
  const cache = new JudgePreviewCache(70_000);
  const dest1 = doc.createElement("canvas");
  const dest2 = doc.createElement("canvas");
  let drawings = 0;
  const draw = (canvas) => { drawings++; canvas.width = 100; canvas.height = 100; };
  assert.equal(cache.render(doc, request(), dest1, draw), false);
  assert.equal(cache.render(doc, request(), dest2, draw), true);
  assert.equal(drawings, 1);
  assert.equal(dest1.width, 100);
  assert.equal(dest2.height, 100);
  assert.deepEqual([cache.stats.hits, cache.stats.misses], [1, 1]);
  assert.equal(cache.stats.bytes, 40000);
  cache.clear();
  assert.equal(cache.stats.bytes, 0);
  assert.equal(cache.stats.entries, 0);
});

test("source revisions, edits and strength levels cannot share a cache entry", () => {
  const { doc } = fakeDOM();
  const cache = new JudgePreviewCache(128_000);
  let calls = 0;
  const draw = (canvas) => { calls++; canvas.width = 100; canvas.height = 100; };
  for (const diff of [{}, { photo: "image-2" }, { edit: "hair" }, { strength: 3.1 }, { tuning: 1.1 }]) {
    const destination = doc.createElement("canvas");
    cache.render(doc, request(diff), destination, draw);
  }
  assert.equal(calls, 5);
  assert.equal(cache.stats.misses, 5);
  assert.equal(cache.stats.entries, 3, "memory bound evicts the two least-recent entries");
  cache.clear();
});

test("LRU eviction frees owned buffers, not destination canvases", () => {
  const { doc, canvases } = fakeDOM();
  const cache = new JudgePreviewCache(80_000);
  const draw = (c) => { c.width = 100; c.height = 100; };
  for (const strength of [1, 2, 3]) {
    cache.render(doc, request({ strength }), doc.createElement("canvas"), draw);
  }
  const sources = canvases.filter((c) => c.transfers.length === 0);
  assert.ok(sources.some((c) => c.width === 0 && c.height === 0));
  assert.equal(cache.stats.entries, 2);
  assert.equal(cache.stats.bytes, 80_000);
});

test("oversized previews are copied but not retained", () => {
  const { doc } = fakeDOM();
  const cache = new JudgePreviewCache(64_000);
  const destination = doc.createElement("canvas");
  let renders = 0;
  const draw = (canvas) => { renders++; canvas.width = 512; canvas.height = 640; };
  assert.equal(cache.render(doc, request(), destination, draw), false);
  assert.equal(cache.render(doc, request(), destination, draw), false);
  assert.equal(renders, 2);
  assert.equal(cache.stats.entries, 0);
  assert.equal(destination.width, 512);
});

test("bad requests and cache sizes fail without mutating another entry", () => {
  const { doc } = fakeDOM();
  const cache = new JudgePreviewCache();
  assert.throws(() => cache.render(doc, request({ strength: Infinity }), doc.createElement("canvas"), () => {}), RangeError);
  assert.equal(cache.stats.entries, 0);
  for (const limit of [0, 1, 200 * 1024 * 1024]) assert.throws(() => new JudgePreviewCache(limit), RangeError);
});
