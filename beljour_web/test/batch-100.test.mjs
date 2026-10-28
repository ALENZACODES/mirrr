// Batch edit 100 photos: every photo rendered at its own size, memory bounded, finished photos
// handed over in numbered album parts so a long batch never stops. Drawn images only.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BatchReview, MAX_FILES, MAX_ENCODED, LARGE_THUMB_EDGE } from "../dist/js/save/batch-review.js";
import { batchReviewScreen } from "../dist/js/screens/batch-review.js";
import { ConsentGate } from "../dist/js/ui/shell/consent.js";
import { renderLayers } from "../dist/js/ui/shell/pipeline.js";
import { installDOM } from "./helpers/dom.mjs";

const light = { id: "l", kind: "lighting", name: "Office light", strength: 100, opacity: 1, enabled: true,
  provenance: "local", origin: "photo", simulation: true, parameters: { preset: "office" } };
const image = (id) => ({ width: 400 + (id % 7), height: 300, channels: 3,
  data: Uint8Array.from({ length: (400 + (id % 7)) * 300 * 3 }, (_, i) => 40 + (i * 3 + id * 11) % 170) });
const input = (id) => ({ name: `drawn-${id}.jpg`, size: 1, read: async () => Uint8Array.of(id) });
const BIG = 1.5 * 1024 * 1024;     // 100 of these pass the 100 MB in-memory limit
const fileOf = (n) => { const b = new Uint8Array(BIG); b.set([255, 216, 255, 218, 0, 2, n & 255, 255, 217]); return b; };
const zipNames = (bytes) => [...new Set([...new TextDecoder("latin1").decode(bytes).matchAll(/GoodLookin_Wedding_(\d+)\.jpg/g)].map((m) => Number(m[1])))];  // a zip names each file twice

test("100 photos run through in album parts, each photo once, memory never past the limit", async () => {
  const parts = [];
  let peak = 0, encoded = 0;
  const model = new BatchReview("Wedding", [light], {
    decode: async (bytes) => image(bytes[0] + 1),
    findFaces: async () => ({ kind: "found", count: 1 }),
    render: async (source, layers) => renderLayers(source, layers),
    encoder: { async encode(pixels, options) {
      assert.equal(options.label, "Simulation");
      assert.ok(pixels.height === 300 && pixels.width >= 400 && pixels.width <= 406, "each photo at its own size");
      return fileOf(++encoded); } },
    savePart: (part) => parts.push(part),
    yield: async () => {
      const held = model.grid().reduce((s, r) => s + (r.output?.bytes.length ?? 0), 0);
      peak = Math.max(peak, held);
    },
  });
  await model.add(Array.from({ length: MAX_FILES }, (_, i) => input(i)));
  assert.equal(model.grid().length, 100);
  assert.ok(model.grid().every((r) => Math.max(r.before.width, r.before.height) <= LARGE_THUMB_EDGE), "small thumbnails past 50");
  await model.run();
  assert.ok(peak <= MAX_ENCODED, `held ${peak} bytes`);
  assert.ok(parts.length >= 1);
  assert.deepEqual(parts.map((p) => p.name), parts.map((_, i) => `Good Lookin part ${i + 1}.zip`));
  const last = model.exportAll();
  assert.equal(last.name, `Good Lookin part ${parts.length + 1}.zip`);
  const all = [...parts, last].flatMap((p) => zipNames(p.bytes));
  assert.deepEqual([...all].sort((a, b) => a - b), Array.from({ length: 100 }, (_, i) => i + 1), "every photo exactly once");
  assert.equal(model.grid().filter((r) => r.status === "saved").length + model.grid().filter((r) => r.status === "done").length, 100);
  assert.ok(model.grid().filter((r) => r.status === "saved").every((r) => r.output === null && /Saved in Good Lookin part/.test(r.note)));
  assert.match(model.summary(), /already saved in \d+ album part/);
  model.dispose();
});

test("101 photos are refused plainly; without a way to hand parts over, the old limit stands", async () => {
  const model = new BatchReview("Wedding", [light], { decode: async (b) => image(b[0]), findFaces: async () => ({ kind: "found", count: 1 }), yield: async () => {} });
  await assert.rejects(model.add(Array.from({ length: 101 }, (_, i) => input(i))), /Choose 1 to 100 photos/);
  let n = 0;
  const strict = new BatchReview("Wedding", [light], { decode: async (b) => image(b[0]), findFaces: async () => ({ kind: "found", count: 1 }),
    render: async (s, l) => renderLayers(s, l), encoder: { async encode() { return fileOf(++n); } }, yield: async () => {} });
  await strict.add(Array.from({ length: 70 }, (_, i) => input(i)));
  await strict.run();
  assert.ok(strict.grid().some((r) => r.status === "failed" && /100 MB output limit/.test(r.note)));
});

test("the batch screen downloads each album part as it fills and says the batch keeps going", async () => {
  const dom = installDOM();
  try {
    const downloads = [];
    let n = 0;
    const gate = new ConsentGate(); gate.acceptVisit({ adult: true, understood: true });
    const screen = batchReviewScreen("Wedding", [light], { consent: gate, decode: async (b) => image(b[0]), findFaces: async () => ({ kind: "found", count: 1 }),
      render: async (s, l) => renderLayers(s, l), encoder: { async encode() { return fileOf(++n); } }, yield: async () => {},
      download: (name, type) => downloads.push([name, type]), paint: () => {} });
    await screen.model.add(Array.from({ length: 80 }, (_, i) => input(i)));
    await screen.model.run();
    assert.deepEqual(downloads[0], ["Good Lookin part 1.zip", "application/zip"]);
    assert.match(screen.element.textContent, /Up to 100 photos/);
    screen.dispose();
  } finally { dom.restore(); }
});
