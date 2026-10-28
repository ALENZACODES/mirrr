/** Volatile whitelisted proof metrics: synthetic clock and no private data. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { LocalProofDiagnostics, validateDiagnostics } from "../dist/js/save/proof-diagnostics.js";

function diagnostics(limit = 32) {
  let tick = 100;
  return {
    metrics: new LocalProofDiagnostics({ now: () => tick }, limit),
    advance(ms) { tick += ms; },
    backwards(ms) { tick -= ms; },
  };
}

test("local operation counts are rounded, no photo data, and not called a speed gate", () => {
  const item = diagnostics();
  const token = item.metrics.begin();
  item.advance(13);
  assert.equal(item.metrics.finish(token, "check_completed"), true);
  const report = item.metrics.report();
  assert.equal(report.events, 2);
  assert.equal(report.counts.check_started, 1);
  assert.equal(report.counts.check_completed, 1);
  assert.equal(report.totalRoundedMs, 20);
  assert.equal(report.completedWithTiming, 1);
  assert.equal(report.assurance, "local-observations-only");
  assert.deepEqual(validateDiagnostics(report), report);
  assert(!JSON.stringify(report).includes("filename"));
});

test("duplicate completion token cannot double-count a successful edit", () => {
  const item = diagnostics();
  const token = item.metrics.begin();
  assert.equal(item.metrics.finish(token, "check_completed"), true);
  assert.equal(item.metrics.finish(token, "check_completed"), false);
  assert.equal(item.metrics.report().counts.check_completed, 1);
});

test("a backwards clock never yields a negative or successful timing", () => {
  const item = diagnostics();
  const token = item.metrics.begin();
  item.backwards(2);
  assert.equal(item.metrics.finish(token, "check_completed"), false);
  assert.equal(item.metrics.report().counts.check_incomplete, 1);
  assert.equal(item.metrics.report().completedWithTiming, 0);
});

test("photo replacement clears all old tokens and count history", () => {
  const item = diagnostics();
  const token = item.metrics.begin();
  item.metrics.note("photo_replaced");
  item.metrics.reset();
  assert.equal(item.metrics.finish(token, "check_completed"), false);
  assert.equal(item.metrics.report().events, 0);
});

test("fixed ring-buffer capacity prevents a tracking-like unbounded timeline", () => {
  const item = diagnostics(3);
  for (let index = 0; index < 100; index++) item.metrics.note("resource_limited");
  const report = item.metrics.report();
  assert.equal(report.events, 3);
  assert.equal(report.counts.resource_limited, 3);
  assert.equal(Object.keys(report.counts).length, 8);
});

test("unfinished token state is also bounded, not just the exported log", () => {
  const item = diagnostics(4);
  const oldest = item.metrics.begin();
  for (let index = 0; index < 20; index++) item.metrics.begin();
  assert.equal(item.metrics.finish(oldest, "check_completed"), false);
  assert(item.metrics.report().events <= 4);
  assert(item.metrics.report().counts.check_incomplete > 0);
});

test("only recognized error codes may be added", () => {
  const item = diagnostics();
  assert.throws(() => item.metrics.note("USER_PHOTO_PATH"), /unapproved/);
});

for (const limit of [0, 257, -1, 1.5, Infinity]) {
  test("invalid local diagnostic capacity fails before any log is created", () => {
    assert.throws(() => diagnostics(limit), /capacity/);
  });
}

for (const mutation of [
  { events: 99 }, { assurance: "device_approved" }, { completedWithTiming: 3 },
  { totalRoundedMs: 999999999 }, { personId: 1 }, { counts: {} },
]) {
  test("forged or identifying diagnostic fields cannot be imported", () => {
    const item = diagnostics();
    item.metrics.note("storage_denied");
    assert.throws(() => validateDiagnostics({ ...item.metrics.report(), ...mutation }), TypeError);
  });
}

test("invalid local clock is rejected rather than generating NaN durations", () => {
  const metrics = new LocalProofDiagnostics({ now: () => NaN });
  assert.throws(() => metrics.begin(), /clock/);
  assert.equal(metrics.report().events, 0);
});

test("unknown token does not emit any new event", () => {
  const item = diagnostics();
  assert.equal(item.metrics.finish(4242, "check_completed"), false);
  assert.equal(item.metrics.report().events, 0);
});
