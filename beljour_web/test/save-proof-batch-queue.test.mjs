/** Cooperative batch replay / resume tests, drawn bytes and no external data. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { LocalProofBatchQueue } from "../dist/js/save/proof-batch-queue.js";

function recipe() {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1", id: "look-abcdabcd", name: "Local", created,
    versions: [{ version: 1, created, steps: [{ tool: "enhance", strength: 20, settings: {}, provider: "local" }] }],
  };
}

function frame(index = 0) {
  const data = new Uint8Array(5 * 5 * 4);
  for (let offset = 0; offset < data.length; offset++) data[offset] = (index + offset) % 256;
  return { width: 5, height: 5, channels: 4, data };
}

const engine = { enhance: (photo) => ({ ...photo, data: new Uint8Array(photo.data) }) };

function batch(total, available = total) {
  let version = 1;
  const reads = [];
  const source = {
    total, available, revision: () => version,
    read(index) { reads.push(index); return frame(index); },
  };
  return { source, reads, change() { version++; } };
}

function now() { return Promise.resolve(); }

test("single-worker local batch passes all mechanical checks without any photo in report", async () => {
  const set = batch(10);
  const queue = new LocalProofBatchQueue(set.source);
  const result = await queue.run(recipe(), engine, { yieldControl: now });
  assert.equal(result.exit, "complete");
  assert.equal(result.status, "PASS");
  assert.equal(result.proof.report.counts.passed, 10);
  assert.equal(queue.inspected(), 10);
  assert.equal(queue.attempts(), 1);
  assert(!JSON.stringify(result).includes('"data"'));
  assert(!JSON.stringify(result).includes('"face_id"'));
});

test("multiple cooperative workers claim disjoint slots exactly once", async () => {
  const set = batch(23);
  const queue = new LocalProofBatchQueue(set.source);
  const seen = [];
  const result = await queue.run(recipe(), engine, { workers: 4, yieldControl: now,
    onProgress: (row) => seen.push(row.counts.completed) });
  assert.equal(result.status, "PASS");
  assert.equal(new Set(set.reads).size, 23);
  assert.equal(set.reads.length, 23);
  assert.equal(seen.length, 23);
  assert.deepEqual(seen.sort((a, b) => a - b), Array.from({ length: 23 }, (_, index) => index + 1));
});

test("missing source records remain UNPROVEN, never padded with success", async () => {
  const set = batch(30, 20);
  const result = await new LocalProofBatchQueue(set.source).run(recipe(), engine, { yieldControl: now });
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.proof.report.counts.missing, 10);
  assert.equal(result.proof.report.counts.passed, 20);
});

test("a reader exception preserves missing denominator without leaking file names", async () => {
  const set = batch(3);
  set.source.read = (index) => { if (index === 1) throw Error("user-photo.png"); return frame(index); };
  const result = await new LocalProofBatchQueue(set.source).run(recipe(), engine, { yieldControl: now });
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.proof.report.counts.missing, 1);
  assert(!JSON.stringify(result).includes("user-photo.png"));
});

test("in-memory resume fills only previously missing slots", async () => {
  const set = batch(6);
  let fail = true;
  set.source.read = (index) => {
    set.reads.push(index);
    if (index === 2 && fail) throw Error("first read failed");
    return frame(index);
  };
  const queue = new LocalProofBatchQueue(set.source);
  const one = await queue.run(recipe(), engine, { yieldControl: now });
  assert.equal(one.proof.report.counts.missing, 1);
  fail = false;
  const two = await queue.run(recipe(), engine, { yieldControl: now });
  assert.equal(two.status, "PASS");
  assert.equal(queue.inspected(), 6);
  assert.equal(set.reads.filter((index) => index === 2).length, 2);
  for (const index of [0, 1, 3, 4, 5]) assert.equal(set.reads.filter((value) => value === index).length, 1);
});

test("abort between items leaves existing count-only progress for resume", async () => {
  const set = batch(5);
  const queue = new LocalProofBatchQueue(set.source);
  const controller = new AbortController();
  const first = await queue.run(recipe(), engine, { abort: controller.signal, workers: 1, yieldControl: now,
    onProgress(row) { if (row.counts.completed === 2) controller.abort(); } });
  assert.equal(first.exit, "aborted");
  assert.equal(first.status, "UNPROVEN");
  assert.equal(first.proof.report.counts.completed, 2);
  assert.equal(first.proof.report.counts.missing, 3);
  const resumed = await queue.run(recipe(), engine, { yieldControl: now });
  assert.equal(resumed.status, "PASS");
});

test("source replacement invalidates all remaining jobs and forbids resume", async () => {
  const set = batch(4);
  const queue = new LocalProofBatchQueue(set.source);
  const result = await queue.run(recipe(), engine, { yieldControl: now,
    onProgress(row) { if (row.counts.completed === 1) set.change(); } });
  assert.equal(result.exit, "source_changed");
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.proof, null);
  await assert.rejects(queue.run(recipe(), engine), /source changed/);
});

test("source changes on the last completed slot never expose a stale PASS bundle", async () => {
  const set = batch(1);
  const queue = new LocalProofBatchQueue(set.source);
  const result = await queue.run(recipe(), engine, { yieldControl: now,
    onProgress() { set.change(); } });
  assert.equal(result.exit, "source_changed");
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.proof, null);
});

test("explicit invalidate also prevents an old batch from being reused", async () => {
  const set = batch(2);
  const queue = new LocalProofBatchQueue(set.source);
  queue.invalidate();
  await assert.rejects(queue.run(recipe(), engine), /source changed/);
});

test("a missing local engine cannot be counted as a successful edit", async () => {
  const set = batch(3);
  const result = await new LocalProofBatchQueue(set.source).run(recipe(), {}, { yieldControl: now });
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.proof.report.counts.unproven, 3);
});

test("batch exposes only standard count-only ledger rows in progress", async () => {
  const set = batch(2);
  const rows = [];
  await new LocalProofBatchQueue(set.source).run(recipe(), engine, {
    yieldControl: now,
    onProgress: (row) => rows.push(row),
  });
  for (const row of rows) {
    assert.equal(Object.keys(row).length, 5);
    assert.equal(row.format, "beljour-save-proof-ledger/1");
    assert.equal(row.status, row.counts.missing ? "UNPROVEN" : "PASS");
    assert(!JSON.stringify(row).includes("filename"));
  }
});

for (const bad of [0, -1, 1001, NaN, 1.5]) {
  test(`invalid expected batch total ${String(bad)} fails on construction`, () => {
    const set = batch(bad);
    assert.throws(() => new LocalProofBatchQueue(set.source), /source/);
  });
}

for (const bad of [0, -1, 5, 1.5]) {
  test(`bad worker count ${String(bad)} rejected before reading`, async () => {
    const set = batch(1);
    const queue = new LocalProofBatchQueue(set.source);
    await assert.rejects(queue.run(recipe(), engine, { workers: bad }), /worker count/);
    assert.equal(set.reads.length, 0);
  });
}

test("stale source after complete run requires a fresh coordinator", async () => {
  const set = batch(2);
  const queue = new LocalProofBatchQueue(set.source);
  const first = await queue.run(recipe(), engine, { yieldControl: now });
  assert.equal(first.status, "PASS");
  set.change();
  await assert.rejects(queue.run(recipe(), engine), /source changed/);
  const fresh = new LocalProofBatchQueue(set.source);
  const second = await fresh.run(recipe(), engine, { yieldControl: now });
  assert.equal(second.status, "PASS");
});

test("explicit abort before any read leaves a pure missing denominator", async () => {
  const set = batch(3);
  const queue = new LocalProofBatchQueue(set.source);
  const controller = new AbortController();
  controller.abort();
  const result = await queue.run(recipe(), engine, { abort: controller.signal });
  assert.equal(result.exit, "aborted");
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.proof.report.counts.missing, 3);
  assert.equal(set.reads.length, 0);
});

test("double invocation during a yielding job rejects concurrent queue entry", async () => {
  const set = batch(3);
  const queue = new LocalProofBatchQueue(set.source);
  let release;
  const stopped = new Promise((resolve) => { release = resolve; });
  let waiting = false;
  const first = queue.run(recipe(), engine, { yieldControl: async () => { waiting = true; await stopped; } });
  while (!waiting) await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(queue.run(recipe(), engine), /already running/);
  release();
  const result = await first;
  assert.equal(result.status, "PASS");
});

test("different-epoch interruption does not create a successful proof from completed earlier slots", async () => {
  const set = batch(2);
  const queue = new LocalProofBatchQueue(set.source);
  const controller = new AbortController();
  const result = await queue.run(recipe(), engine, { yieldControl: now,
    abort: controller.signal,
    onProgress: (row) => { if (row.counts.completed === 1) { set.change(); controller.abort(); } },
  });
  assert.equal(result.exit, "source_changed");
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.proof, null);
  assert.equal(queue.inspected(), 1);
});
