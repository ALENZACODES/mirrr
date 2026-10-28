/** Local asynchronous Save audit: synthetic pixels and deliberate race fixtures. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { crc32 } from "../dist/js/save/export.js";
import {
  arrayBatchSource,
  auditScheduledBatch,
  validateSafeProgress,
} from "../dist/js/save/proof-scheduler.js";
import { validateSaveAudit } from "../dist/js/save/proof-service.js";

function recipe(steps = [{ tool: "enhance", strength: 25, settings: {}, provider: "local" }]) {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1",
    id: "look-1f2f3f4f",
    name: "Synthetic proof",
    created,
    versions: [{ version: 1, created, steps }],
  };
}

function frame(seed = 1, channels = 4) {
  const data = new Uint8Array(6 * 5 * channels);
  for (let index = 0; index < data.length; index++) data[index] = (seed + index * 13) % 256;
  return { width: 6, height: 5, channels, data };
}

const engine = {
  enhance(photo) {
    const data = new Uint8Array(photo.data);
    for (let index = 0; index < data.length; index += photo.channels) {
      data[index] = (data[index] + 1) % 256;
    }
    return { ...photo, data };
  },
};

function word(value) {
  return Uint8Array.from([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]);
}

function join(parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let cursor = 0;
  for (const part of parts) { out.set(part, cursor); cursor += part.length; }
  return out;
}

function chunk(type, data = new Uint8Array()) {
  const header = new TextEncoder().encode(type);
  const content = join([header, data]);
  return join([word(data.length), content, word(crc32(content))]);
}

function png() {
  return join([
    Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", join([word(6), word(5), Uint8Array.from([8, 6, 0, 0, 0])])),
    chunk("IDAT", Uint8Array.from([3, 8, 12])),
    chunk("IEND"),
  ]);
}

function inputs(count, encoded = true) {
  return Array.from({ length: count }, (_, index) => ({
    pixels: frame(index + 1),
    ...(encoded ? { encoded: png() } : {}),
  }));
}

function immediate() { return Promise.resolve(); }

function progressIsOnlyCounts(raw) {
  const data = JSON.stringify(raw);
  for (const forbidden of ['"data"', '"filename"', '"face_id"', '"landmarks"', '"id"', '"recipe"']) {
    assert.equal(data.includes(forbidden), false, forbidden);
  }
  assert.equal(Object.keys(raw).length, 8);
}

test("scheduled runner produces the same complete count-only audit as the serial reference", async () => {
  const rows = inputs(5);
  const before = rows.map((item) => new Uint8Array(item.pixels.data));
  const events = [];
  const result = await auditScheduledBatch(recipe(), arrayBatchSource(rows, 5), engine, {
    chunkSize: 2,
    yieldControl: immediate,
    onProgress: (progress) => events.push(progress),
  });
  assert.equal(result.exit, "complete");
  assert.equal(result.audit.status, "PASS");
  assert.equal(result.audit.processed, 5);
  assert.deepEqual(result.audit.exports, { expected: 5, inspected: 5, passed: 5, failed: 0, missing: 0 });
  assert.equal(result.audit.replay.report.counts.passed, 5);
  assert.deepEqual(validateSaveAudit(result.audit), result.audit);
  for (let index = 0; index < rows.length; index++) assert.deepEqual(rows[index].pixels.data, before[index]);
  assert.deepEqual(events.map((event) => event.completed), [0, 1, 2, 3, 4, 5, 5]);
  for (const event of events) {
    assert.deepEqual(validateSafeProgress(event), event);
    progressIsOnlyCounts(event);
  }
});

test("four unavailable photos remain missing even when three pass", async () => {
  const result = await auditScheduledBatch(recipe(), arrayBatchSource(inputs(3), 7), engine, {
    yieldControl: immediate,
  });
  assert.equal(result.exit, "complete");
  assert.equal(result.audit.status, "UNPROVEN");
  assert.equal(result.audit.replay.report.counts.missing, 4);
  assert.equal(result.audit.exports.missing, 4);
  assert.equal(result.progress.missing, 4);
});

test("a missing export is UNPROVEN and cannot be hidden by replay", async () => {
  const result = await auditScheduledBatch(recipe(), arrayBatchSource(inputs(2, false), 2), engine);
  assert.equal(result.audit.replay.status, "PASS");
  assert.equal(result.audit.status, "UNPROVEN");
  assert.equal(result.audit.exports.missing, 2);
});

test("bad export and good replay yields FAIL", async () => {
  const rows = inputs(2);
  rows[1].encoded = new Uint8Array([1, 2]);
  const result = await auditScheduledBatch(recipe(), arrayBatchSource(rows, 2), engine);
  assert.equal(result.audit.status, "FAIL");
  assert.equal(result.audit.replay.status, "PASS");
  assert.equal(result.audit.exports.failed, 1);
});

test("no renderer produces an UNPROVEN audit rather than a mechanical PASS", async () => {
  const result = await auditScheduledBatch(recipe(), arrayBatchSource(inputs(2), 2), {});
  assert.equal(result.audit.replay.status, "UNPROVEN");
  assert.equal(result.audit.status, "UNPROVEN");
});

test("failure of a renderer counts as FAIL without aborting the rest", async () => {
  const result = await auditScheduledBatch(recipe(), arrayBatchSource(inputs(2), 2), {
    enhance(photo) {
      const data = new Uint8Array(photo.data);
      data[3] = 0;
      return { ...photo, data };
    },
  });
  assert.equal(result.audit.status, "FAIL");
  assert.equal(result.audit.replay.report.counts.failed, 2);
  assert.equal(result.progress.failed, 2);
});

test("pre-aborted runner never reads even the first photo", async () => {
  const controller = new AbortController();
  controller.abort();
  let reads = 0;
  const source = { declared: 2, available: 2, read() { reads++; return inputs(1)[0]; } };
  const result = await auditScheduledBatch(recipe(), source, engine, { abort: controller.signal });
  assert.equal(reads, 0);
  assert.equal(result.exit, "aborted");
  assert.equal(result.audit.status, "UNPROVEN");
  assert.equal(result.audit.processed, 0);
});

test("abort during asynchronous pause prevents next photo read", async () => {
  const controller = new AbortController();
  let reads = 0;
  const source = { declared: 4, available: 4, read(index) { reads++; return inputs(4)[index]; } };
  const result = await auditScheduledBatch(recipe(), source, engine, {
    abort: controller.signal,
    chunkSize: 1,
    yieldControl() { controller.abort(); return immediate(); },
  });
  assert.equal(result.exit, "aborted");
  assert.equal(reads, 1);
  assert.equal(result.audit.processed, 1);
  assert.equal(result.progress.interrupted, true);
  assert.equal(result.audit.replay.report.counts.missing, 3);
});

test("photo revision changing during async read stops without accepting a stale row", async () => {
  let revision = 2;
  let reads = 0;
  const source = {
    declared: 2,
    available: 2,
    revision: () => revision,
    async read() { reads++; revision++; return inputs(1)[0]; },
  };
  const result = await auditScheduledBatch(recipe(), source, engine);
  assert.equal(result.exit, "source_changed");
  assert.equal(result.audit.processed, 0);
  assert.equal(result.audit.status, "UNPROVEN");
  assert.equal(reads, 1);
});

test("photo revision changing while engine works also rejects a stale row", async () => {
  let revision = 1;
  const source = { declared: 1, available: 1, revision: () => revision, read() { return inputs(1)[0]; } };
  const result = await auditScheduledBatch(recipe(), source, {
    enhance(photo) { revision++; return { ...photo, data: new Uint8Array(photo.data) }; },
  });
  assert.equal(result.exit, "source_changed");
  assert.equal(result.audit.processed, 0);
});

test("changing revision after a completed run revokes the assertion in the return", async () => {
  let revision = 10;
  const source = { declared: 1, available: 1, revision: () => revision, read() { return inputs(1)[0]; } };
  const controller = new AbortController();
  const result = await auditScheduledBatch(recipe(), source, engine, {
    abort: controller.signal,
    onProgress(progress) { if (progress.completed === 1) revision++; },
  });
  assert.equal(result.exit, "source_changed");
  assert.equal(result.audit.processed, 1);
  // The count remains observed, but the caller's source epoch is not accepted.
  assert.equal(result.progress.interrupted, true);
});

test("one input is materialized at a time; batch source is not prefetched", async () => {
  let concurrent = 0;
  let max = 0;
  let reads = 0;
  const source = {
    declared: 20,
    available: 20,
    async read(index) {
      concurrent++;
      max = Math.max(max, concurrent);
      await immediate();
      concurrent--;
      reads++;
      return { pixels: frame(index), encoded: png() };
    },
  };
  const result = await auditScheduledBatch(recipe(), source, engine, { chunkSize: 4 });
  assert.equal(result.audit.status, "PASS");
  assert.equal(max, 1);
  assert.equal(reads, 20);
});

for (const bad of [0, -1, 1001, 1.5, Infinity, NaN]) {
  test(`invalid source batch size ${String(bad)} fails before any read`, async () => {
    let called = false;
    const source = { declared: bad, available: 0, read() { called = true; return inputs(1)[0]; } };
    await assert.rejects(auditScheduledBatch(recipe(), source, engine), /source size/);
    assert.equal(called, false);
  });
}

for (const bad of [0, -1, 1001, 1.5, Infinity, NaN]) {
  test(`invalid cooperative chunk size ${String(bad)} is rejected`, async () => {
    await assert.rejects(auditScheduledBatch(recipe(), arrayBatchSource(inputs(1), 1), engine,
      { chunkSize: bad }), /chunk size/);
  });
}

for (const bad of [null, {}, { format: "beljour-save-proof-progress/1" },
  { format: "beljour-save-proof-progress/1", expected: 1, completed: 0, passed: 0,
    failed: 0, unproven: 0, missing: 0, interrupted: false },
  { format: "beljour-save-proof-progress/1", expected: 1, completed: 1, passed: 2,
    failed: 0, unproven: 0, missing: 0, interrupted: false }]) {
  test("invalid or forged progress cannot be imported", () => {
    assert.throws(() => validateSafeProgress(bad), TypeError);
  });
}

test("progress callback can never force a status using additional fields", async () => {
  const events = [];
  await auditScheduledBatch(recipe(), arrayBatchSource(inputs(1), 1), engine, {
    onProgress: (row) => events.push(row),
  });
  assert.throws(() => validateSafeProgress({ ...events[1], photo: frame() }), /fields/);
  assert.throws(() => validateSafeProgress({ ...events[1], passed: 3 }), /counts/);
});

test("array adapter refuses outside indices rather than reading the wrong photo", () => {
  const source = arrayBatchSource(inputs(2), 3);
  assert.throws(() => source.read(-1), /slot/);
  assert.throws(() => source.read(2), /slot/);
  assert.equal(source.available, 2);
  assert.equal(source.declared, 3);
});
