/** Save-proof orchestration tests: synthetic pixels, in-memory arrays only. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { crc32 } from "../dist/js/save/export.js";
import { auditSavedBatch, exportProofStatus, validateSaveAudit } from "../dist/js/save/proof-service.js";

function recipe() {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1",
    id: "look-fffefdfc",
    name: "Local Proof",
    created,
    versions: [{ version: 1, created, steps: [
      { tool: "enhance", strength: 20, settings: {}, provider: "local" },
    ] }],
  };
}

function bytes(...chunks) {
  const out = new Uint8Array(chunks.reduce((n, chunk) => n + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
  return out;
}

function dword(value) {
  return Uint8Array.from([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]);
}

function chunk(name, data = new Uint8Array()) {
  const body = bytes(new TextEncoder().encode(name), data);
  return bytes(dword(data.length), body, dword(crc32(body)));
}

function cleanImage() {
  return bytes(
    Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", bytes(dword(2), dword(2), Uint8Array.from([8, 6, 0, 0, 0]))),
    chunk("IDAT", Uint8Array.from([1, 2, 3, 4])),
    chunk("IEND"),
  );
}

function source(seed = 1) {
  const data = new Uint8Array(4 * 4 * 4);
  for (let index = 0; index < data.length; index++) data[index] = (index * 7 + seed) % 256;
  return { width: 4, height: 4, channels: 4, data };
}

const cleanEngine = { enhance: (frame) => ({ ...frame, data: new Uint8Array(frame.data) }) };

function input(seed = 1, encoded = cleanImage()) {
  return { pixels: source(seed), encoded };
}

test("complete two-image audit passes mechanical and export checks", async () => {
  const first = input(1);
  const second = input(2);
  const saved = [new Uint8Array(first.pixels.data), new Uint8Array(second.pixels.data)];
  const result = await auditSavedBatch(recipe(), [first, second], cleanEngine, 2);
  assert.equal(result.format, "beljour-save-audit/1");
  assert.equal(result.status, "PASS");
  assert.equal(result.processed, 2);
  assert.equal(result.replay.status, "PASS");
  assert.deepEqual(result.exports, { expected: 2, inspected: 2, passed: 2, failed: 0, missing: 0 });
  assert.equal(exportProofStatus(result), "PASS");
  assert.deepEqual(first.pixels.data, saved[0]);
  assert.deepEqual(second.pixels.data, saved[1]);
  assert.deepEqual(validateSaveAudit(result), result);
});

test("missing export produces UNPROVEN even when replay is deterministic", async () => {
  const result = await auditSavedBatch(recipe(), [{ pixels: source() }], cleanEngine, 1);
  assert.equal(result.replay.status, "PASS");
  assert.equal(result.exports.missing, 1);
  assert.equal(result.status, "UNPROVEN");
  assert.equal(exportProofStatus(result), "UNPROVEN");
});

test("an unknown renderer does not turn a clean export into a proof of editing", async () => {
  const result = await auditSavedBatch(recipe(), [input()], {}, 1);
  assert.equal(result.replay.status, "UNPROVEN");
  assert.equal(result.exports.passed, 1);
  assert.equal(result.status, "UNPROVEN");
});

test("EXIF-bearing or corrupt bytes fail export auditing", async () => {
  const corrupt = new Uint8Array([1, 2, 3]);
  const result = await auditSavedBatch(recipe(), [input(1, corrupt)], cleanEngine, 1);
  assert.equal(result.status, "FAIL");
  assert.equal(result.replay.status, "PASS");
  assert.equal(result.exports.failed, 1);
  assert.equal(exportProofStatus(result), "FAIL");
});

test("partially supplied batch remains unproven, not diluted by success", async () => {
  const result = await auditSavedBatch(recipe(), [input(1), input(2)], cleanEngine, 4);
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.exports.missing, 2);
  assert.equal(result.replay.report.counts.missing, 2);
  assert.equal(result.processed, 2);
});

test("pre-aborted run performs no replay and reports missing evidence", async () => {
  const controller = new AbortController();
  controller.abort();
  let called = false;
  const result = await auditSavedBatch(recipe(), [input(1), input(2)], {
    enhance(p) { called = true; return p; },
  }, 2, { abort: controller.signal });
  assert.equal(called, false);
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.processed, 0);
  assert.equal(result.replay.report.counts.missing, 2);
  assert.equal(result.exports.inspected, 0);
});

test("mid-batch cancellation keeps completed rows without inventing the rest", async () => {
  const controller = new AbortController();
  let called = 0;
  const engine = {
    enhance(p) {
      called++;
      if (called === 2) controller.abort();
      return { ...p, data: new Uint8Array(p.data) };
    },
  };
  const result = await auditSavedBatch(recipe(), [input(1), input(2), input(3)], engine, 3, {
    abort: controller.signal,
  });
  assert.equal(called, 2);
  assert.equal(result.processed, 1);
  assert.equal(result.replay.report.counts.missing, 2);
  assert.equal(result.status, "UNPROVEN");
});

test("bad photo cannot earn a PASS merely because the JPEG was clean", async () => {
  const broken = { pixels: { width: 0, height: 3, channels: 4, data: new Uint8Array() }, encoded: cleanImage() };
  const result = await auditSavedBatch(recipe(), [broken], cleanEngine, 1);
  assert.equal(result.status, "FAIL");
  assert.equal(result.replay.status, "FAIL");
  assert.equal(result.exports.passed, 1);
});

test("the receipt has no photo bytes, photo hashes or source names", async () => {
  const result = await auditSavedBatch(recipe(), [input()], cleanEngine, 1);
  const text = JSON.stringify(result);
  assert(text.length < 12000);
  for (const name of ["filename", "data", "imageHash", "pixelsRaw", "GPS", "landmark", "face_id"]) {
    assert(!text.includes(`"${name}"`), `forbidden field ${name}`);
  }
});

test("audit of a tampered status or extra photo field is rejected", async () => {
  const result = await auditSavedBatch(recipe(), [input()], cleanEngine, 1);
  assert.throws(() => validateSaveAudit({ ...result, status: "UNPROVEN" }), /unsupported/);
  assert.throws(() => validateSaveAudit({ ...result, photo: source() }), /unregistered/);
  assert.throws(() => validateSaveAudit({ ...result, exported: [1, 2, 3] }), /unregistered/);
});

test("audit rejects mismatched export counters", async () => {
  const result = await auditSavedBatch(recipe(), [input()], cleanEngine, 1);
  assert.throws(() => validateSaveAudit({ ...result, exports: { ...result.exports, passed: 2 } }), /mismatch/);
  assert.throws(() => validateSaveAudit({ ...result, exports: { ...result.exports, missing: 2 } }), /mismatch/);
  assert.throws(() => validateSaveAudit({ ...result, exports: { ...result.exports, inspected: -1 } }), /invalid/);
});

test("audit refuses changing its declared set size", async () => {
  const result = await auditSavedBatch(recipe(), [input()], cleanEngine, 1);
  assert.throws(() => validateSaveAudit({ ...result, processed: 0 }), /mismatch/);
  assert.throws(() => validateSaveAudit({ ...result, exports: { ...result.exports, expected: 2 } }), /mismatch/);
});

for (const count of [0, -1, 1001, Infinity, 1.5]) {
  test(`invalid audit count ${String(count)} is rejected`, async () => {
    await assert.rejects(auditSavedBatch(recipe(), [input()], cleanEngine, count), /1 to 1000/);
  });
}

test("the number of submitted photos can never exceed the declared plan", async () => {
  await assert.rejects(auditSavedBatch(recipe(), [input(), input()], cleanEngine, 1), /declared/);
});
