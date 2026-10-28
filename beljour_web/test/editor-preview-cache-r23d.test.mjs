// Studio raster cache is bounded, source-scoped and keyed by the actual layer recipe.
import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorPreviewCache } from "../dist/js/ui/shell/editor-preview-cache.js";

const makePreview = (width = 16, height = 16, fill = 0) => ({
  image: {
    width,
    height,
    channels: 3,
    data: new Uint8Array(width * height * 3).fill(fill),
  },
  labels: [],
  metrics: [],
  effective: 1,
});

test("a repeated edit state reuses the exact preview object", () => {
  const cache = new EditorPreviewCache(2_048);
  cache.useSource("photo-one:revision-1:renderer-0");
  const saved = makePreview(16, 16, 22);
  assert.equal(cache.put("face:3.4", saved), true);
  assert.equal(cache.get("face:3.4"), saved);
  assert.deepEqual([cache.stats.hits, cache.stats.misses], [1, 0]);
  assert.equal(saved.image.data[0], 22);
});

test("returning to an earlier strength hits the cache after another render", () => {
  const cache = new EditorPreviewCache(3_000);
  cache.useSource("my-photo:1");
  const low = makePreview(16, 16, 1);
  const high = makePreview(16, 16, 2);
  cache.put("hair:1.1", low);
  cache.put("hair:3.8", high);
  assert.equal(cache.get("hair:1.1"), low);
  assert.equal(cache.get("hair:3.8"), high);
  assert.equal(cache.stats.entries, 2);
});

test("a different photo revision cannot use a prior photo's pixels", () => {
  const cache = new EditorPreviewCache();
  cache.useSource("photo-one:1");
  cache.put("hair:3.4", makePreview());
  cache.useSource("photo-two:1");
  assert.equal(cache.get("hair:3.4"), null);
  assert.equal(cache.stats.bytes, 0);
  assert.equal(cache.stats.entries, 0);
});

test("new geometry, masks or context generation invalidate old results", () => {
  const cache = new EditorPreviewCache();
  cache.useSource("photo:1:gpu-0");
  cache.put("posture:5.0", makePreview());
  cache.useSource("photo:2:gpu-0");
  assert.equal(cache.get("posture:5.0"), null);
  cache.put("posture:5.0", makePreview());
  cache.useSource("photo:2:gpu-1");
  assert.equal(cache.get("posture:5.0"), null);
});

test("the least recently visited state is evicted before the active state", () => {
  const cache = new EditorPreviewCache(2_048);
  cache.useSource("photo:1");
  const first = makePreview();
  const second = makePreview();
  const third = makePreview();
  cache.put("one", first);
  cache.put("two", second);
  cache.get("one");
  cache.put("three", third);
  assert.equal(cache.get("two"), null);
  assert.equal(cache.get("one"), first);
  assert.equal(cache.get("three"), third);
  assert.equal(cache.stats.evictions, 1);
});

test("oversized preview is delivered to caller without persisting in the LRU", () => {
  const cache = new EditorPreviewCache(1_024);
  cache.useSource("photo:1");
  const huge = makePreview(30, 30);
  assert.equal(cache.put("large", huge), false);
  assert.equal(cache.get("large"), null);
  assert.equal(cache.stats.bytes, 0);
});

test("clearing a cache drops all references and leaves source results intact", () => {
  const cache = new EditorPreviewCache(2_048);
  cache.useSource("photo:1");
  const preview = makePreview(16, 16, 98);
  cache.put("one", preview);
  cache.clear();
  assert.equal(cache.stats.entries, 0);
  assert.equal(cache.stats.bytes, 0);
  assert.equal(preview.image.data[0], 98);
  assert.throws(() => cache.get("one"), /Source revision/);
});

test("cache fails closed on malformed source, render and preview values", () => {
  assert.throws(() => new EditorPreviewCache(0), RangeError);
  assert.throws(() => new EditorPreviewCache(129 * 1024 * 1024), RangeError);
  const cache = new EditorPreviewCache();
  assert.throws(() => cache.useSource(""), RangeError);
  cache.useSource("photo:1");
  assert.throws(() => cache.put("", makePreview()), RangeError);
  assert.throws(() => cache.put("bad", { ...makePreview(), image: {
    width: 16,
    height: 16,
    channels: 3,
    data: new Uint8Array(2),
  } }), RangeError);
  assert.equal(cache.stats.entries, 0);
});

test("cache key retains complete layer order and visible strength", () => {
  const cache = new EditorPreviewCache();
  cache.useSource("photo:1");
  const first = [{ id: "a", kind: "posture", strength: 25, enabled: true }];
  const second = [{ id: "a", kind: "posture", strength: 28, enabled: true }];
  const firstKey = JSON.stringify(first) + ":renderer0";
  const secondKey = JSON.stringify(second) + ":renderer0";
  assert.notEqual(firstKey, secondKey);
  cache.put(firstKey, makePreview());
  assert.equal(cache.get(secondKey), null);
});

test("Studio itself reuses an older raster after strength goes down then back up", async () => {
  const { Editor } = await import("../dist/js/ui/shell/controller.js");
  const editor = new Editor("low-light");
  try {
    const layer = editor.add("enhance");
    const first = editor.rendered();
    editor.update(layer.id, { strength: 55 });
    const second = editor.rendered();
    assert.notEqual(second, first);
    editor.update(layer.id, { strength: layer.strength });
    const again = editor.rendered();
    assert.equal(again, first, "revisiting original layer strength reuses its actual raster");
    assert.deepEqual([...again.image.data], [...first.image.data]);
  } finally {
    editor.dispose();
  }
});

test("Studio photo replacement invalidates even matching recipe and dimensions", async () => {
  const { Editor } = await import("../dist/js/ui/shell/controller.js");
  const editor = new Editor("low-light");
  try {
    editor.add("enhance");
    const older = editor.rendered();
    editor.loadSample("low-light");
    editor.add("enhance");
    const newer = editor.rendered();
    assert.notEqual(newer, older, "a renewed photo cannot inherit the earlier rendered object");
    assert.equal(editor.rendered(), newer, "same current source revision can reuse its render");
  } finally {
    editor.dispose();
  }
});

test("Studio posture settings use the same cache owner without leaking to other photos", async () => {
  const { Editor } = await import("../dist/js/ui/shell/controller.js");
  const editor = new Editor("body-front");
  try {
    const first = editor.preview();
    editor.selectStudio("posture");
    const layer = editor.add("posture");
    const moved = editor.rendered();
    editor.update(layer.id, { strength: 20 });
    const less = editor.rendered();
    assert.notEqual(moved, less);
    editor.update(layer.id, { strength: layer.strength });
    assert.equal(editor.rendered(), moved);
    assert.notEqual(editor.rendered(), first);
  } finally {
    editor.dispose();
  }
});
