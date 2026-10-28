import { encodedBlob } from "./encoded-fixtures.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultRecipe,
  measureProOnDevice,
  median,
  runSyntheticProProbe,
  syntheticProSource,
} from "../../../dist/js/pro/index.js";

function fixture(width = 3000, height = 4000) {
  return { image: { local: true }, width, height };
}

function fakeEncoder(observations) {
  return (width, height) => ({
    canvas: null,
    draw(_source, geometry, curves, label, matte, masks) {
      observations.push({ kind: "draw", width, height, geometry,
        neutral: curves.neutral, label, matte, masks: masks.length });
    },
    async encode(mime) {
      observations.push({ kind: "encode", mime });
      return encodedBlob(mime);
    },
  });
}

test("performance: median is robust for ordered or disordered samples", () => {
  assert.equal(median([2]), 2);
  assert.equal(median([4, 2, 8]), 4);
  assert.equal(median([50, 5, 100, 10]), 30);
  assert.deepEqual([4, 2, 8], [4, 2, 8]);
  for (const input of [[], [-1], [NaN], [Infinity], [1, Infinity, 2]]) {
    assert.throws(() => median(input), /finite/);
  }
});

test("performance: measured dimensions and default label are accurate", async () => {
  const seen = [];
  let step = 0;
  const report = await measureProOnDevice(fixture(), defaultRecipe(), {
    samples: 3,
    factory: fakeEncoder(seen),
    clock() { return [0, 30, 0, 120, 0, 50, 0, 170, 0, 40, 0, 130][step++]; },
  });
  assert.equal(report.encoding, "injected");
  assert.equal(report.pixels, 12_000_000);
  assert.ok(report.previewPixels > 0 && report.previewPixels <= 640 * 640);
  assert.equal(report.previewMs, 40);
  assert.equal(report.exportMs, 130);
  assert.equal(report.previewTargetMet, true);
  assert.equal(report.exportTargetMet, true);
  assert.equal(report.simulationLabel, true);
  assert.equal(report.bytes, 10);
  assert.deepEqual(report.previewSamples, [30, 50, 40]);
  assert.deepEqual(report.durationSamples, [120, 170, 130]);
  assert.equal(seen.filter((row) => row.kind === "encode").length, 3);
  assert.equal(seen.filter((row) => row.label === "Simulation").length, 6);
});

test("performance: signal slow preview and export without claiming budget success", async () => {
  const observations = [];
  let clock = 0;
  const report = await measureProOnDevice(fixture(512, 512), defaultRecipe(), {
    samples: 1,
    factory: fakeEncoder(observations),
    clock() { const value = clock; clock += 2_500; return value; },
  });
  assert.equal(report.previewTargetMet, false);
  assert.equal(report.exportTargetMet, false);
  assert.equal(report.previewMs, 2_500);
  assert.equal(report.exportMs, 2_500);
  assert.equal(report.encoding, "injected");
});

test("performance: user-opted-out label is not called labelled by measurement", async () => {
  const observations = [];
  const recipe = { ...defaultRecipe(), simulationLabel: false };
  const report = await measureProOnDevice(fixture(128, 128), recipe, {
    samples: 1,
    factory: fakeEncoder(observations),
    clock() { return 0; },
  });
  assert.equal(report.simulationLabel, false);
  assert.ok(observations.every((row) => row.label === undefined || row.label === null));
});

test("performance: validates counts and file size before surface creation", async () => {
  const observation = [];
  const factory = fakeEncoder(observation);
  for (const count of [-1, 0, 1.5, Infinity, 6]) {
    await assert.rejects(measureProOnDevice(fixture(), defaultRecipe(), {
      samples: count, factory,
    }), /1 to 5/);
  }
  await assert.rejects(measureProOnDevice(fixture(5000, 5000), defaultRecipe(), {
    samples: 1, factory,
  }), /12 megapixels/);
  assert.equal(observation.length, 0);
});

test("performance: encoder rejection is surfaced rather than counted as pass", async () => {
  const factory = () => ({
    canvas: null,
    draw() {},
    async encode() { throw new Error("encoder unavailable"); },
  });
  await assert.rejects(measureProOnDevice(fixture(128, 128), defaultRecipe(), {
    samples: 1,
    factory,
  }), /encoder unavailable/);
});

test("performance: optional synthetic source has original pixels, no network", () => {
  const previous = globalThis.OffscreenCanvas;
  const operations = [];
  class LocalCanvas {
    constructor(width, height) { this.width = width; this.height = height; }
    getContext(kind) {
      if (kind !== "2d") return null;
      return {
        set fillStyle(value) { operations.push(value); },
        fillRect(...args) { operations.push(args); },
      };
    }
  }
  globalThis.OffscreenCanvas = LocalCanvas;
  try {
    const sample = syntheticProSource(64, 48);
    assert.equal(sample.width * sample.height, 3072);
    assert.equal(sample.image.width, 64);
    assert.equal(operations.filter(Array.isArray).length, 3);
    assert.ok(operations.includes("#8994a9"));
    assert.ok(operations.includes("#b37862"));
    assert.throws(() => syntheticProSource(0, 100), /positive/);
  } finally {
    if (previous === undefined) delete globalThis.OffscreenCanvas;
    else globalThis.OffscreenCanvas = previous;
  }
});

test("performance: explicit synthetic runner exercises a masked curve with mock", async () => {
  const old = globalThis.OffscreenCanvas;
  const samples = [];
  class LocalCanvas {
    constructor(width, height) { this.width = width; this.height = height; }
    getContext() { return { fillStyle: "", fillRect() {} }; }
  }
  globalThis.OffscreenCanvas = LocalCanvas;
  try {
    const report = await runSyntheticProProbe(40, 30, {
      samples: 1,
      factory: fakeEncoder(samples),
      clock() { return 0; },
    });
    assert.equal(report.pixels, 1200);
    assert.equal(report.encoding, "injected");
    assert.equal(report.simulationLabel, true);
    assert.ok(samples.some((row) => row.kind === "draw" && !row.neutral && row.masks === 1));
  } finally {
    if (old === undefined) delete globalThis.OffscreenCanvas;
    else globalThis.OffscreenCanvas = old;
  }
});
