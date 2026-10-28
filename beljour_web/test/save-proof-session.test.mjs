/** Save session races and cancellation. No real faces or network. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ProofSession, validateSessionState } from "../dist/js/save/proof-session.js";
import { arrayBatchSource } from "../dist/js/save/proof-scheduler.js";

function recipe() {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1", id: "look-99999999", name: "Drawn", created,
    versions: [{ version: 1, created, steps: [{ tool: "enhance", strength: 30, settings: {}, provider: "local" }] }],
  };
}

function source(seed = 1) {
  const data = new Uint8Array(8 * 7 * 4);
  for (let index = 0; index < data.length; index++) data[index] = (index + seed) % 256;
  return { pixels: { width: 8, height: 7, channels: 4, data } };
}

const engine = { enhance: (photo) => ({ ...photo, data: new Uint8Array(photo.data) }) };

function deferred() {
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  return { promise, release };
}

test("new session exposes no prior photograph data or receipt", () => {
  const session = new ProofSession();
  const state = session.state();
  assert.equal(state.phase, "idle");
  assert.equal(state.audit, null);
  assert.equal(state.progress, null);
  assert.deepEqual(validateSessionState(state), state);
});

test("a real replay with no local export stays UNPROVEN", async () => {
  const session = new ProofSession();
  const states = [];
  const unsubscribe = session.subscribe((next) => states.push(next));
  const result = await session.run(recipe(), arrayBatchSource([source()], 1), engine);
  assert.equal(result.phase, "unproven");
  assert.equal(result.reason, "incomplete");
  assert.equal(result.audit.replay.status, "PASS");
  assert.equal(result.audit.exports.missing, 1);
  assert(states.some((state) => state.phase === "checking"));
  for (const item of states) assert.deepEqual(validateSessionState(item), item);
  unsubscribe();
  session.dispose();
});

test("missing renderer returns UNPROVEN rather than an exception", async () => {
  const session = new ProofSession();
  const result = await session.run(recipe(), arrayBatchSource([source()], 1), {});
  assert.equal(result.phase, "unproven");
  assert.equal(result.audit.replay.report.counts.unproven, 1);
});

test("a corrupt input becomes a controlled error state without leaking exceptions", async () => {
  const session = new ProofSession();
  const bad = { declared: 1, available: 1, read() { throw new Error("SECRET_PHOTO_NAME.jpg"); } };
  const result = await session.run(recipe(), bad, engine);
  assert.equal(result.phase, "error");
  assert.equal(result.reason, "invalid_input");
  assert.equal(result.audit, null);
  assert.equal(JSON.stringify(result).includes("SECRET_PHOTO_NAME.jpg"), false);
});

test("changing photo invalidates even an earlier completed result", async () => {
  const session = new ProofSession();
  await session.run(recipe(), arrayBatchSource([source()], 1), engine);
  assert.equal(session.state().phase, "unproven");
  session.changeSource();
  assert.equal(session.state().phase, "idle");
  assert.equal(session.state().audit, null);
});

test("explicit user cancellation prevents a waiting old replay from publishing", async () => {
  const gate = deferred();
  const started = deferred();
  const session = new ProofSession();
  let reads = 0;
  const batch = { declared: 2, available: 2, async read() { reads++; started.release(); await gate.promise; return source(); } };
  const oldRun = session.run(recipe(), batch, engine);
  await started.promise;
  session.cancel();
  const cancelled = session.state();
  assert.equal(cancelled.phase, "cancelled");
  assert.equal(cancelled.reason, "cancelled");
  gate.release();
  await oldRun;
  assert.equal(reads, 1);
  assert.equal(session.state().phase, "cancelled");
  assert.equal(session.state().audit, null);
});

test("fast new run supersedes old run and cannot inherit its result", async () => {
  const gate = deferred();
  const session = new ProofSession();
  const oldSource = { declared: 1, available: 1, async read() { await gate.promise; return source(1); } };
  const oldPromise = session.run(recipe(), oldSource, engine);
  const newer = await session.run(recipe(), arrayBatchSource([source(2)], 1), {});
  assert.equal(newer.phase, "unproven");
  assert.equal(newer.audit.replay.report.counts.unproven, 1);
  gate.release();
  await oldPromise;
  assert.deepEqual(session.state(), newer);
});

test("source replacement during asynchronous read clears old result and status", async () => {
  const gate = deferred();
  const session = new ProofSession();
  const oldSource = { declared: 1, available: 1, async read() { await gate.promise; return source(1); } };
  const oldPromise = session.run(recipe(), oldSource, engine);
  session.changeSource();
  gate.release();
  await oldPromise;
  assert.equal(session.state().phase, "idle");
});

test("abort signal from caller stops work and listener is released", async () => {
  const controller = new AbortController();
  const session = new ProofSession();
  controller.abort();
  const result = await session.run(recipe(), arrayBatchSource([source()], 1), engine, { abort: controller.signal });
  assert.equal(result.phase, "cancelled");
  assert.equal(result.audit, null);
});

test("session disposal prevents further runs and empties observer subscriptions", async () => {
  const session = new ProofSession();
  let observed = 0;
  session.subscribe(() => { observed++; });
  session.dispose();
  assert.equal(session.state().phase, "idle");
  await assert.rejects(session.run(recipe(), arrayBatchSource([source()], 1), engine), /disposed/);
  assert.throws(() => session.subscribe(() => {}), /disposed/);
  assert.equal(observed, 1);
});

test("observers may unsubscribe without affecting other observers", async () => {
  const session = new ProofSession();
  let first = 0;
  let second = 0;
  const unsubscribe = session.subscribe(() => { first++; });
  session.subscribe(() => { second++; });
  unsubscribe();
  await session.run(recipe(), arrayBatchSource([source()], 1), engine);
  assert.equal(first, 1);
  assert(second >= 2);
  session.dispose();
});

test("state snapshots cannot mutate session's real stored counts", async () => {
  const session = new ProofSession();
  const state = await session.run(recipe(), arrayBatchSource([source()], 1), engine);
  state.progress.completed = 500;
  const actual = session.state();
  assert.equal(actual.progress.completed, 1);
});

for (const evil of [
  { format: "beljour-save-proof-session/1", phase: "pass", reason: "none", progress: null, audit: null },
  { format: "beljour-save-proof-session/1", phase: "error", reason: "none", progress: null, audit: null },
  { format: "beljour-save-proof-session/1", phase: "idle", reason: "none", progress: null, audit: null },
  { format: "beljour-save-proof-session/1", phase: "idle", reason: "not_checked", progress: null, audit: null,
    photo: source() },
]) {
  test("forged or sensitive session state fails closed", () => {
    assert.throws(() => validateSessionState(evil), TypeError);
  });
}
