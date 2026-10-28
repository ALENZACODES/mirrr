/** Reproducible, synthetic-only latency for BELJOUR Studio Play Time Warp.
 * Timing is Node V8 CPU execution, not a phone preview budget or cover grade.
 * Author: John Khan.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { TimeWarpScan } from "../dist/js/filters/artistic/index.js";

const WIDTH = 80;
const HEIGHT = 96;
const CHANNELS = 3;
const SAMPLES = 7;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function pixelFrame(index) {
  const data = new Uint8Array(WIDTH * HEIGHT * CHANNELS);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      for (let c = 0; c < CHANNELS; c++) {
        const p = (y * WIDTH + x) * CHANNELS + c;
        data[p] = (23 * x + 31 * y + 47 * index + c * 17) % 256;
      }
    }
  }
  return { width: WIDTH, height: HEIGHT, channels: CHANNELS, data };
}

function percentile(values, position) {
  if (!values.length || !values.every((v) => Number.isFinite(v) && v > 0)) {
    throw new RangeError("latency samples must be positive finite milliseconds");
  }
  const ordered = [...values].sort((a, b) => a - b);
  const target = position * (ordered.length - 1);
  const lower = Math.floor(target);
  const f = target - lower;
  return ordered[lower] + (ordered[Math.min(lower + 1, ordered.length - 1)] - ordered[lower]) * f;
}

export function benchmark() {
  const first = pixelFrame(0);
  const frames = Array.from({ length: 96 }, (_, k) => pixelFrame(k + 1));
  const variants = [
    { id: "SP05a", name: "Time Sweep Down", axis: "horizontal", direction: "forward", step: 6 },
    { id: "SP05b", name: "Time Sweep Up", axis: "horizontal", direction: "reverse", step: 6 },
    { id: "SP05c", name: "Time Sweep Across", axis: "vertical", direction: "forward", step: 5 },
  ];
  const results = [];
  for (const variant of variants) {
    const samples = [];
    let expectedHash = "";
    let strips = 0;
    for (let sample = 0; sample < SAMPLES; sample++) {
      const started = performance.now();
      const session = new TimeWarpScan(first, variant);
      let frameIndex = 0;
      while (session.state !== "complete") {
        session.advance(frames[frameIndex]);
        frameIndex++;
      }
      const outcome = session.snapshot();
      const elapsed = Number((performance.now() - started).toFixed(6));
      const digest = sha(outcome.image);
      if (expectedHash && digest !== expectedHash) {
        throw new Error(`${variant.id}: same synthetic frames produced different bytes`);
      }
      expectedHash = digest;
      strips = frameIndex;
      samples.push(elapsed);
      session.dispose();
    }
    results.push({
      ...variant,
      capturedStrips: strips,
      outputSha256: expectedHash,
      warmSamplesMs: samples,
      warmP50Ms: Number(percentile(samples, 0.5).toFixed(6)),
      warmP95Ms: Number(percentile(samples, 0.95).toFixed(6)),
      coverTestGrade: "UNVERIFIED_TEMPORAL",
      reviewStatus: "draft",
      liveEnabled: false,
      realFacesEvaluated: 0,
    });
  }
  const pySource = readFileSync(new URL("../../api/plumb_api/filters/artistic/time_warp.py", import.meta.url));
  const tsSource = readFileSync(new URL("../src/filters/artistic/time-warp.ts", import.meta.url));
  return {
    format: "beljour-studio-play-timewarp-evidence/1",
    generatedAtUtc: new Date().toISOString(),
    scope: "synthetic_node_v8_only",
    product: "BELJOUR",
    userReviewRequired: true,
    consentRequired: true,
    realFacesEvaluated: 0,
    released: false,
    claim: "Engine parity and measured local CPU timing only; no Cover Test or release grade",
    sourceFingerprintSha256: sha(Buffer.concat([pySource, tsSource])),
    runtime: { node: process.version, os: os.platform(), arch: os.arch(),
      clock: "performance.now", samplesPerVariant: SAMPLES, parallelism: 1 },
    fixture: { kind: "synthetic generated RGB frames", width: WIDTH,
      height: HEIGHT, channels: CHANNELS, originalSha256: sha(first.data) },
    licenceNotes: [
      { component: "Progressive framebuffer scan", licence: "Original BELJOUR implementation", author: "John Khan" },
      { component: "Generated synthetic testing frames", licence: "Original BELJOUR test data", author: "John Khan" },
    ],
    variants: results,
  };
}

export function validate(report) {
  if (report.format !== "beljour-studio-play-timewarp-evidence/1") throw new Error("invalid evidence format");
  if (report.scope !== "synthetic_node_v8_only" || report.released !== false) throw new Error("invalid evidence scope");
  if (report.userReviewRequired !== true || report.consentRequired !== true) throw new Error("review lock missing");
  if (report.realFacesEvaluated !== 0) throw new Error("real-face gate not measured");
  if (!Array.isArray(report.variants) || report.variants.length !== 3) throw new Error("missing scan variants");
  for (const item of report.variants) {
    if (item.coverTestGrade !== "UNVERIFIED_TEMPORAL" || item.liveEnabled !== false || item.reviewStatus !== "draft") {
      throw new Error("an unreviewed temporal look cannot be promoted");
    }
    const samples = item.warmSamplesMs;
    if (!Array.isArray(samples) || samples.length !== 7) throw new Error("latency samples missing");
    if (Math.abs(percentile(samples, 0.5) - item.warmP50Ms) > 0.00001) throw new Error("p50 not measured");
    if (Math.abs(percentile(samples, 0.95) - item.warmP95Ms) > 0.00001) throw new Error("p95 not measured");
    if (!/^[a-f0-9]{64}$/.test(item.outputSha256)) throw new Error("output digest missing");
    if (!Number.isSafeInteger(item.capturedStrips) || item.capturedStrips < 1) throw new Error("capture count missing");
  }
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = process.argv.find((arg) => arg.startsWith("--out="));
  const data = benchmark();
  validate(data);
  const serialized = JSON.stringify(data, null, 2) + "\n";
  if (output) writeFileSync(output.slice(6), serialized, "utf8");
  else process.stdout.write(serialized);
}
