/** R23G local export contracts: EXIF removal, simulation marking, fixed ZIP time.
 * All byte streams are fabricated format markers, not photographs.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { exportPlan } from "../../dist/js/screens/export.js";
import {
  album, canvasEncoder, crc32, exportPhoto, hasMetadata, labelText,
  storeZip, stripJpegMetadata,
} from "../../dist/js/save/export.js";

function segment(marker, bytes) {
  const size = bytes.length + 2;
  return Uint8Array.from([255, marker, size >> 8, size & 255, ...bytes]);
}

function syntheticJpegWithMetadata() {
  const parts = [
    Uint8Array.of(255, 216),
    segment(224, Uint8Array.of(1, 2)),
    segment(225, Uint8Array.of(69, 88, 73, 70, 13, 12)),
    segment(237, Uint8Array.of(73, 80, 84, 67)),
    segment(254, Uint8Array.of(72, 73, 68, 69)),
    segment(226, Uint8Array.of(67, 79, 76, 82)),
    segment(218, Uint8Array.of()),
    Uint8Array.of(0, 1, 2, 255, 217),
  ];
  const bytes = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}

function drawnPixels() {
  const width = 16;
  const height = 12;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = x * 7;
      data[i + 1] = y * 9;
      data[i + 2] = 90;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

function zipEntries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const out = [];
  let offset = 0;
  while (offset < bytes.length - 22) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const stored = view.getUint32(offset + 18, true);
    const encoded = view.getUint16(offset + 26, true);
    const extra = view.getUint16(offset + 28, true);
    const method = view.getUint16(offset + 8, true);
    const fileName = decoder.decode(bytes.subarray(offset + 30, offset + 30 + encoded));
    const start = offset + 30 + encoded + extra;
    const data = bytes.slice(start, start + stored);
    out.push({ name: fileName, method, data, crc: view.getUint32(offset + 14, true),
      date: view.getUint16(offset + 12, true), time: view.getUint16(offset + 10, true) });
    offset = start + stored;
  }
  return out;
}

test("metadata stripper removes EXIF, comments and IPTC without touching encoded scan", () => {
  const fixture = syntheticJpegWithMetadata();
  const original = Uint8Array.from(fixture);
  assert.equal(hasMetadata(fixture), true);
  const cleaned = stripJpegMetadata(fixture);
  assert.equal(hasMetadata(cleaned), false);
  assert.deepEqual(fixture, original, "source bytes must be immutable");
  assert.deepEqual([...cleaned.slice(-9)], [255, 218, 0, 2, 0, 1, 2, 255, 217],
    "scan bytes remain unchanged");
  assert.equal(cleaned[0], 255);
  assert.equal(cleaned[1], 216);
  assert.ok(cleaned.length < fixture.length);
  assert.ok(Buffer.from(cleaned).includes(Buffer.from("COLR")));
  assert.equal(Buffer.from(cleaned).includes(Buffer.from("EXIF")), false);
  assert.equal(Buffer.from(cleaned).includes(Buffer.from("IPTC")), false);
});

test("unmodified synthetic JPEG passes metadata normalization without extra labels", () => {
  const bytes = stripJpegMetadata(syntheticJpegWithMetadata());
  const duplicate = stripJpegMetadata(bytes);
  assert.deepEqual(duplicate, bytes);
  assert.equal(hasMetadata(duplicate), false);
  assert.notStrictEqual(bytes, duplicate);
});

test("declared simulation status controls the burned-in export label", () => {
  assert.equal(labelText({ simulationLabel: true, isSimulation: true }), "Simulation");
  assert.equal(labelText({ simulationLabel: false, isSimulation: true }), null);
  assert.equal(labelText({ simulationLabel: true, isSimulation: false }), null);
  assert.equal(labelText({ simulationLabel: false, isSimulation: false }), null);
});

test("export adapter forwards actual local pixels and strips metadata from encoded JPEG", async () => {
  const input = drawnPixels();
  const before = Buffer.from(input.data);
  const calls = [];
  const encoder = { async encode(pixels, options) {
    calls.push({ pixels, options });
    return syntheticJpegWithMetadata();
  } };
  const exported = await exportPhoto(input, encoder, {
    lookName: "Geometric Sample", index: 1, simulationLabel: true, isSimulation: true,
  });
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0].pixels, input);
  assert.deepEqual(calls[0].options, { type: "image/jpeg", quality: 0.92, label: "Simulation" });
  assert.equal(exported.name.toLowerCase().endsWith(".jpg"), true);
  assert.equal(exported.label, "Simulation");
  assert.equal(hasMetadata(exported.bytes), false);
  assert.deepEqual(Buffer.from(input.data), before);
});

test("enhance-only download does not invent a simulation status", async () => {
  let received = null;
  const encoder = { async encode(_pixels, options) {
    received = options;
    return stripJpegMetadata(syntheticJpegWithMetadata());
  } };
  const file = await exportPhoto(drawnPixels(), encoder, {
    lookName: "Plain", index: 1, simulationLabel: true, isSimulation: false,
  });
  assert.equal(received.label, null);
  assert.equal(file.label, null);
  assert.equal(hasMetadata(file.bytes), false);
});

for (const quality of [0, -1, 1.0001, NaN, Infinity]) {
  test(`invalid JPEG quality ${quality} is rejected before starting encoding`, async () => {
    let called = false;
    const encoder = {
      async encode() {
        called = true;
        throw new Error("Unexpected encode");
      },
    };
    await assert.rejects(exportPhoto(drawnPixels(), encoder, {
      lookName: "Shape", index: 1, simulationLabel: true, isSimulation: true, quality,
    }), RangeError);
    assert.equal(called, false);
  });
}

test("export screen lists only validated local files and plain provenance", () => {
  const card = exportPlan({ lookName: "Synthetic look", count: 3,
    simulationLabel: true, isSimulation: true });
  assert.equal(card.files.length, 3);
  assert.equal(new Set(card.files).size, 3);
  assert.ok(card.files.every((name) => name.toLowerCase().endsWith(".jpg")));
  assert.equal(card.label, "Simulation");
  assert.match(card.metadata, /location/i);
  assert.match(card.confirm, /3 photos/);
  assert.equal(JSON.stringify(card).includes("data:image"), false);
  assert.equal(JSON.stringify(card).includes("photo_id"), false);
});

for (const count of [0, -1, 51, 1.5, NaN, Infinity]) {
  test(`export plan refuses unsafe file count ${count}`, () => {
    assert.throws(() => exportPlan({ lookName: "Shape", count,
      simulationLabel: true, isSimulation: true }), RangeError);
  });
}

test("ZIP stores each byte for export exactly once and contains no unpredictable timestamp", () => {
  const inputs = [
    { name: "Shape 1.jpg", bytes: Uint8Array.of(255, 216, 11) },
    { name: "Shape 2.jpg", bytes: Uint8Array.of(255, 216, 22, 33) },
  ];
  const first = storeZip(inputs);
  const second = storeZip(inputs);
  assert.deepEqual(first, second);
  assert.equal(first[0], 0x50);
  assert.equal(first[1], 0x4b);
  const parsed = zipEntries(first);
  assert.deepEqual(parsed.map((row) => row.name), inputs.map((row) => row.name));
  for (let i = 0; i < parsed.length; i++) {
    assert.deepEqual(parsed[i].data, inputs[i].bytes);
    assert.equal(parsed[i].method, 0);
    assert.equal(parsed[i].crc, crc32(inputs[i].bytes));
    assert.equal(parsed[i].date, 0x21);
    assert.equal(parsed[i].time, 0);
  }
});

test("ZIP rejects unsupported filenames, duplicates and nested path escape", () => {
  const valid = Uint8Array.of(1, 2, 3);
  for (const name of ["x/../../privacy", "/absolute", "x\\y", "bad?.jpg", "", ".env/"]) {
    assert.throws(() => storeZip([{ name, bytes: valid }]), RangeError);
  }
  assert.throws(() => storeZip([
    { name: "same.jpg", bytes: valid }, { name: "same.jpg", bytes: valid },
  ]), RangeError);
});

test("album is a deterministic local archive, never a payment or API operation", () => {
  const files = [
    { name: "Synthetic1.jpg", bytes: Uint8Array.of(1, 2), label: "Simulation" },
    { name: "Synthetic2.jpg", bytes: Uint8Array.of(3, 4), label: "Simulation" },
  ];
  const result = album(files);
  assert.match(result.name, /\.zip$/i);
  assert.match(result.message, /2 photos/);
  assert.equal(zipEntries(result.bytes).length, 2);
  assert.deepEqual(album(files).bytes, result.bytes);
  assert.throws(() => album([]), RangeError);
});

test("missing browser canvas APIs fail locally, without attempting a remote encoder", async () => {
  const save = globalThis.OffscreenCanvas;
  const priorFetch = globalThis.fetch;
  let outbound = 0;
  globalThis.OffscreenCanvas = undefined;
  globalThis.fetch = () => {
    outbound++;
    throw Error("remote encoder forbidden");
  };
  try {
    const encoder = canvasEncoder();
    await assert.rejects(encoder.encode(drawnPixels(), {
      type: "image/jpeg", quality: 0.95, label: "Simulation",
    }), /cannot save photos locally/i);
    assert.equal(outbound, 0);
  } finally {
    globalThis.OffscreenCanvas = save;
    globalThis.fetch = priorFetch;
  }
});
