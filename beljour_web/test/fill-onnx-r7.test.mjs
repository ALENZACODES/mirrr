// R7 E07 part 2: MI-GAN wrapper behind the registry gate. The real entry is pending, so it
// must never fetch and must fall back; an injected allowed registry, fetch and fake ONNX
// runtime drive the full path for both tensor layouts. Author: John Khan.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import { byteImage, floatImage } from "../dist/js/engines/core/buffer.js";
import { ellipse } from "../dist/js/engines/core/mask.js";
import { fill, fillAny, LEARNED_METHODS, METHODS } from "../dist/js/engines/fill/fill.js";
import { MIGAN_ID, MiganFill, cropBox, holeBox, buildFeeds, decodeOutput, compositeHole, defaultMigan, resizeBinary } from "../dist/js/engines/fill/onnx/migan.js";
import { SessionLoader, LearnedModelUnavailable, plainTensor } from "../dist/js/engines/fill/onnx/runtime.js";
import { BrowserModelRegistry, DEFAULT_MODELS, ModelGateError, pinnedRevision } from "../dist/js/vision/model-registry.js";
import { q1OutsideMask } from "../dist/js/quality/metrics.js";

const W = 160, H = 120;
function photo() {
  const img = byteImage(W, H, 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 3;
    img.data[p] = 40 + x; img.data[p + 1] = 60 + y; img.data[p + 2] = 120 + ((x >> 3) + (y >> 3)) % 2 * 30;
  }
  return img;
}
const hole = ellipse(W, H, 70, 50, 9, 7);
const bytes = new TextEncoder().encode("synthetic stand-in for an ONNX file; never a real model");
const sha = createHash("sha256").update(bytes).digest("hex");
const COMMIT = "0123456789abcdef0123456789abcdef01234567";
const URL_PINNED = `https://huggingface.co/owner/repo/resolve/${COMMIT}/model.onnx`;
function allowedRegistry(url = URL_PINNED) {
  return new BrowserModelRegistry({ format: "beljour-models/1", version: 1, models: [{ id: MIGAN_ID, task: "inpainting", filename: "model.onnx", url,
    sha256: sha, bytes: bytes.length, licenceName: "Fake fill weights", licence: "MIT", status: "allowed", runsOn: "browser", note: "test" }] },
  { "Fake fill weights": { licence: "MIT", status: "allowed", urls: ["https://huggingface.co/owner/repo/"] } });
}
/** A fake runtime whose "model" paints the hole a flat colour, in the layout's own tensor format. */
function fakeOrt(layout, calls, { bad = false } = {}) {
  return {
    async createSession(model) {
      calls.push(["create", model.length]);
      const inputNames = layout === "pipeline-uint8" ? ["image", "mask"] : ["input"];
      return { inputNames, outputNames: ["out"], async run(feeds) {
        calls.push(["run", Object.keys(feeds)]);
        if (layout === "pipeline-uint8") {
          const [, , h, w] = feeds.image.dims, data = new Uint8Array(3 * h * w).fill(200);
          return { out: bad ? { type: "uint8", data, dims: [1, 3, h + 1, w] } : plainTensor("uint8", data, [1, 3, h, w]) };
        }
        return { out: plainTensor("float32", new Float32Array(3 * 512 * 512).fill(0.5), [1, 3, 512, 512]) };
      } };
    },
    tensor: plainTensor,
  };
}
const fetchBytes = (calls) => async (url) => { calls.push(["fetch", url]); return new Response(bytes, { status: 200 }); };

test("the real MI-GAN entry is pending: status explains it and nothing is ever fetched", async () => {
  assert.equal(DEFAULT_MODELS.get(MIGAN_ID).status, "pending");
  assert.equal(DEFAULT_MODELS.get(MIGAN_ID).task, "inpainting");
  let fetches = 0;
  const loader = new SessionLoader({ modelId: MIGAN_ID, fetcher: async () => { fetches++; throw new Error("network"); }, ort: fakeOrt("pipeline-uint8", []) });
  assert.equal(loader.status().ready, false);
  assert.match(loader.status().reason, /pending/);
  await assert.rejects(loader.load(), LearnedModelUnavailable);
  const out = await fillAny(photo(), hole, "mi-gan", { learned: new MiganFill(loader) });
  assert.equal(out.requested, "mi-gan");
  assert.equal(out.method, "biharmonic");
  assert.match(out.fallbackReason, /pending/);
  assert.equal(out.details.fallback, 1);
  assert.equal(fetches, 0);
  const plain = fill(photo(), hole, "biharmonic");
  assert.deepEqual([...out.image.data], [...plain.image.data], "the fallback is exactly the R5 fill");
  assert.match(defaultMigan().status().reason, /pending/);
  assert.throws(() => new SessionLoader({ modelId: "not-a-model" }), /unknown model/);
});

test("fillAny keeps R5 methods unchanged and validates the fallback", async () => {
  assert.deepEqual([...LEARNED_METHODS], ["mi-gan"]);
  for (const m of METHODS) {
    const out = await fillAny(photo(), hole, m);
    assert.equal(out.method, m); assert.equal(out.fallbackReason, null);
  }
  const none = await fillAny(photo(), hole, "mi-gan", { fallback: "fast-marching" });
  assert.equal(none.method, "fast-marching");
  assert.match(none.fallbackReason, /no learned fill/);
  await assert.rejects(fillAny(photo(), hole, "mi-gan", { fallback: "mi-gan" }), /fallback/);
});

for (const layout of ["pipeline-uint8", "generator-512"]) {
  test(`approved model, ${layout}: verified download, one session, hole-only writes`, async () => {
    const calls = [], ort = fakeOrt(layout, calls);
    const loader = new SessionLoader({ modelId: MIGAN_ID, registry: allowedRegistry(), ort, fetcher: fetchBytes(calls) });
    assert.deepEqual(loader.status(), { ready: true, reason: "ready" });
    const learned = new MiganFill(loader, layout, () => ort);
    const img = photo();
    const out = await fillAny(img, hole, "mi-gan", { learned });
    assert.equal(out.method, "mi-gan");
    assert.equal(out.fallbackReason, null);
    assert.ok(q1OutsideMask(img, out.image, hole).passed);
    for (let i = 0; i < W * H; i++) {
      const inside = hole.data[i] >= 0.5;
      for (let c = 0; c < 3; c++) {
        if (!inside) assert.equal(out.image.data[i * 3 + c], img.data[i * 3 + c]);
        else if (layout === "pipeline-uint8") assert.equal(out.image.data[i * 3 + c], 200);
      }
    }
    await fillAny(img, hole, "mi-gan", { learned });
    assert.deepEqual(calls.filter((c) => c[0] !== "run").map((c) => c[0]), ["fetch", "create"], "download and session are cached");
    assert.equal(calls.filter((c) => c[0] === "run").length, 2);
    await loader.reset();
  });
}

test("a model with the wrong output shape or a failing download falls back with the reason", async () => {
  const calls = [], ort = fakeOrt("pipeline-uint8", calls, { bad: true });
  const learned = new MiganFill(new SessionLoader({ modelId: MIGAN_ID, registry: allowedRegistry(), ort, fetcher: fetchBytes(calls) }), "pipeline-uint8", () => ort);
  const out = await fillAny(photo(), hole, "mi-gan", { learned });
  assert.equal(out.method, "biharmonic");
  assert.match(out.fallbackReason, /learned fill failed: pipeline output must be uint8/);
  const badFetch = new MiganFill(new SessionLoader({ modelId: MIGAN_ID, registry: allowedRegistry(), ort: fakeOrt("pipeline-uint8", []),
    fetcher: async () => new Response(new Uint8Array(5), { status: 200 }) }));
  assert.match((await fillAny(photo(), hole, "mi-gan", { learned: badFetch })).fallbackReason, /size mismatch|sha256/);
  const noRuntime = new SessionLoader({ modelId: MIGAN_ID, registry: allowedRegistry() });
  assert.match(noRuntime.status().reason, /no ONNX runtime/);
});

test("Hugging Face URLs: path shape enforced, allowed entries must pin a commit", () => {
  assert.equal(pinnedRevision(URL_PINNED), true);
  assert.equal(pinnedRevision("https://huggingface.co/owner/repo/resolve/main/model.onnx"), false);
  assert.equal(pinnedRevision("https://storage.googleapis.com/x/y.task"), true);
  assert.throws(() => allowedRegistry("https://huggingface.co/owner/repo/resolve/main/model.onnx"), /pin a commit/);
  assert.throws(() => allowedRegistry("https://huggingface.co/owner/model.onnx"), /resolve/);
  assert.throws(() => allowedRegistry("https://example.com/owner/repo/resolve/x/model.onnx"), ModelGateError);
});

test("crop box, feeds, decoding and compositing rules", () => {
  assert.equal(holeBox(floatImage(20, 20, 1)), null);
  const box = cropBox(hole);
  assert.equal(box.width, 128); assert.equal(box.height, 120);
  const b = holeBox(hole);
  assert.ok(box.left <= b.left && box.left + box.width >= b.left + b.width && box.top <= b.top);
  const bigHole = ellipse(1000, 800, 900, 700, 120, 60), big = cropBox(bigHole), hb = holeBox(bigHole);
  assert.equal(big.width, Math.ceil(Math.max(hb.width, hb.height) * 2));
  assert.ok(big.left + big.width <= 1000 && big.top + big.height <= 800);
  const crop = byteImage(4, 2, 3); crop.data.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
  const bits = Uint8Array.from([0, 1, 0, 0, 0, 0, 1, 0]);
  const pipe = buildFeeds(crop, bits, "pipeline-uint8");
  assert.deepEqual(pipe.image.dims, [1, 3, 2, 4]);
  assert.deepEqual([...pipe.image.data.slice(0, 4)], [1, 4, 7, 10]);
  assert.deepEqual([...pipe.mask.data], [255, 0, 255, 255, 255, 255, 0, 255]);
  const gen = buildFeeds(crop, bits, "generator-512").input;
  assert.deepEqual(gen.dims, [1, 4, 512, 512]);
  assert.ok(gen.data.every((v) => v >= -1 && v <= 1));
  assert.throws(() => buildFeeds(crop, new Uint8Array(3), "pipeline-uint8"), /sizes differ/);
  assert.throws(() => buildFeeds(crop, bits, "other"), /layout/);
  assert.throws(() => decodeOutput(plainTensor("float32", new Float32Array(12), [1, 3, 2, 2]), "generator-512", 2, 2), /float32/);
  assert.throws(() => decodeOutput(plainTensor("float32", new Float32Array(3 * 512 * 512).fill(NaN), [1, 3, 512, 512]), "generator-512", 4, 2), /finite/);
  const back = decodeOutput(plainTensor("uint8", pipe.image.data, [1, 3, 2, 4]), "pipeline-uint8", 4, 2);
  assert.deepEqual([...back.data], [...crop.data]);
  assert.deepEqual([...resizeBinary(Uint8Array.from([1, 0, 0, 1]), 2, 2, 4, 4)], [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1]);
  const base = byteImage(6, 4, 3), filled = byteImage(4, 2, 3); filled.data.fill(9);
  const out = compositeHole(base, bits, { left: 1, top: 1, width: 4, height: 2 }, filled);
  assert.equal(out.data[(1 * 6 + 2) * 3], 9); assert.equal(out.data[(1 * 6 + 1) * 3], 0);
  assert.throws(() => plainTensor("uint8", new Float32Array(2), [2]), /type/);
  assert.throws(() => plainTensor("uint8", new Uint8Array(2), [3]), /dims/);
  assert.throws(() => new MiganFill(new SessionLoader({ modelId: MIGAN_ID }), "wide"), /layout/);
});
