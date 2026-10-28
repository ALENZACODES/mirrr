/** BELJOUR original Studio Play Time Warp Scan. Synthetic bytes only.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import test from "node:test";
import { TimeWarpScan } from "../dist/js/filters/artistic/index.js";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const parity = JSON.parse(readFileSync(new URL("../../parity/filters-timewarp.json", import.meta.url)));

function synthetic(width, height, channels, capture) {
  const data = new Uint8Array(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < channels; c++) {
        data[(y * width + x) * channels + c] = (19 * x + 31 * y + 37 * c + 53 * capture) % 256;
      }
    }
  }
  return { width, height, channels, data };
}

for (const config of parity.cases) {
  test(`Python/TS frozen framebuffer parity ${config.axis} ${config.direction} ${config.step} ${config.channels}`, () => {
    const initial = synthetic(config.width, config.height, config.channels, 0);
    assert.equal(sha(initial.data), config.initialSha256);
    const originalBytes = Uint8Array.from(initial.data);
    const scan = new TimeWarpScan(initial, config);
    for (const expected of config.states) {
      const next = synthetic(config.width, config.height, config.channels, expected.capture);
      const result = scan.advance(next);
      assert.equal(sha(result.image), expected.imageSha256);
      assert.equal(result.state, expected.state);
      assert.equal(result.frozen, expected.frozen);
      assert.equal(result.nextLine, expected.nextLine);
      assert.equal(result.userReviewRequired, expected.userReviewRequired);
      assert.equal(result.realFacesEvaluated, expected.realFacesEvaluated);
      assert.equal(result.image.length, config.width * config.height * config.channels);
    }
    assert.equal(scan.state, "complete");
    assert.deepEqual(initial.data, originalBytes);
    assert.throws(() => scan.advance(initial), /finished/);
  });
}

test("framebuffer snapshots own their bytes and a marker is preview-only", () => {
  const original = synthetic(7, 6, 4, 0);
  const scan = new TimeWarpScan(original, { axis: "vertical", direction: "reverse", step: 2 });
  const plain = scan.snapshot();
  const marked = scan.snapshot(true);
  assert.notDeepEqual(plain.image, marked.image);
  assert.deepEqual(scan.snapshot().image, plain.image);
  const incoming = synthetic(7, 6, 4, 1);
  const first = scan.advance(incoming);
  incoming.data.fill(253);
  first.image.fill(0);
  assert.notDeepEqual(scan.snapshot().image, first.image);
  assert.deepEqual(original.data, synthetic(7, 6, 4, 0).data);
});

test("cancel discards frozen strips and restart restores the initial frame", () => {
  const original = synthetic(17, 11, 3, 0);
  const scan = new TimeWarpScan(original, { step: 4 });
  const budget = original.data.length * 2;
  assert.equal(scan.footprintBytes, budget);
  scan.advance(synthetic(17, 11, 3, 3));
  const cancelled = scan.cancel();
  assert.equal(cancelled.state, "cancelled");
  assert.deepEqual(cancelled.image, original.data);
  assert.throws(() => scan.advance(original), /finished/);
  assert.equal(scan.restart().state, "ready");
  assert.equal(scan.advance(synthetic(17, 11, 3, 8)).frozen, 4);
  scan.dispose();
  assert.equal(scan.footprintBytes, 0);
  assert.throws(() => scan.snapshot(), /disposed/);
  scan.dispose();
});

test("input validation refuses shape, channels, frame length and invalid scan options", () => {
  const frame = synthetic(11, 8, 3, 0);
  for (const options of [{ step: 0 }, { step: 100 }, { step: NaN }, { axis: "diagonal" },
    { direction: "sideways" }, { step: 1.25 }]) {
    assert.throws(() => new TimeWarpScan(frame, options), RangeError);
  }
  assert.throws(() => new TimeWarpScan({ ...frame, data: new Uint8Array(2) }), RangeError);
  assert.throws(() => new TimeWarpScan({ ...frame, channels: 2 }), RangeError);
  const scan = new TimeWarpScan(frame);
  assert.throws(() => scan.advance(synthetic(12, 8, 3, 1)), RangeError);
  assert.throws(() => scan.advance({ ...frame, data: new Uint8Array(2) }), RangeError);
  assert.equal(scan.frozen, 0);
  assert.equal(scan.state, "ready");
});

test("small synthetic timewarp benchmark reports measured samples, not budgets", () => {
  const frame = synthetic(80, 96, 3, 0);
  const timings = [];
  for (let i = 0; i < 7; i++) {
    const scan = new TimeWarpScan(frame, { step: 6 });
    const started = performance.now();
    while (scan.state !== "complete") scan.advance(synthetic(80, 96, 3, i + 1));
    const elapsed = performance.now() - started;
    assert.ok(Number.isFinite(elapsed) && elapsed > 0);
    timings.push(elapsed);
    scan.dispose();
  }
  const median = [...timings].sort((a, b) => a - b)[3];
  assert.ok(median > 0);
  assert.equal(timings.length, 7);
});

test("measured evidence is source-bound, complete and never claims release clearance", async () => {
  const { validate, benchmark } = await import("./r38b-time-warp-bench.mjs");
  const saved = JSON.parse(readFileSync(new URL("../../docs/artistic/studio_play/time_warp/BELJOUR_TIME_WARP_EVIDENCE.json", import.meta.url)));
  assert.equal(validate(saved), true);
  assert.equal(saved.scope, "synthetic_node_v8_only");
  assert.equal(saved.realFacesEvaluated, 0);
  assert.ok(saved.sourceFingerprintSha256.match(/^[a-f0-9]{64}$/));
  assert.equal(saved.variants.length, 3);
  assert.ok(saved.variants.every((v) => v.coverTestGrade === "UNVERIFIED_TEMPORAL"));
  const liveRun = benchmark();
  assert.equal(validate(liveRun), true);
  assert.deepEqual(liveRun.variants.map((r) => r.outputSha256), saved.variants.map((r) => r.outputSha256));
  assert.equal(liveRun.sourceFingerprintSha256, saved.sourceFingerprintSha256);
});

test("evidence validation rejects false p95 and premature approval", async () => {
  const { validate } = await import("./r38b-time-warp-bench.mjs");
  const file = new URL("../../docs/artistic/studio_play/time_warp/BELJOUR_TIME_WARP_EVIDENCE.json", import.meta.url);
  const report = JSON.parse(readFileSync(file));
  report.variants[0].warmP95Ms = 0;
  assert.throws(() => validate(report), /p95 not measured/);
  report.variants[0].warmP95Ms = 0.541367;
  report.variants[0].reviewStatus = "approved";
  assert.throws(() => validate(report), /unreviewed temporal look/);
  report.variants[0].reviewStatus = "draft";
  report.realFacesEvaluated = 100000;
  assert.throws(() => validate(report), /real-face gate not measured/);
});
