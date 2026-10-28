import assert from "node:assert/strict";
import test from "node:test";

import { exportReelFrame, prepareEditedReelFrame } from "../../../dist/js/reel/index.js";
import { encodedBytes } from "../../pro/test/encoded-fixtures.mjs";

const frame = () => ({ width: 1, height: 1,
  data: new Uint8ClampedArray([100, 120, 140, 255]) });

test("twenty successive frame exports do not share encoder pixel buffers", async () => {
  let retained = null;
  let exports = 0;
  const encoder = {
    async encode(input, options) {
      assert.equal(options.label, "Simulation");
      if (retained) assert.equal(retained.data[0], 100);
      retained = input;
      exports++;
      return encodedBytes(options.type);
    },
  };
  for (let i = 0; i < 20; i++) {
    const result = await exportReelFrame(frame(), {}, encoder);
    assert.equal(result.label, "Simulation");
    assert.ok(result.blob.size > 0);
    assert.equal(result.blob.type, "image/jpeg");
  }
  assert.equal(exports, 20);
});

test("reel label can only be disabled with an explicit boolean false", async () => {
  const seen = [];
  const encoder = { async encode(input, options) {
    seen.push(options.label);
    return encodedBytes(options.type);
  } };
  await exportReelFrame(frame(), {}, encoder);
  await exportReelFrame(frame(), { simulationLabel: false }, encoder);
  assert.deepEqual(seen, ["Simulation", null]);
  await assert.rejects(exportReelFrame(frame(), { simulationLabel: 0 }, encoder));
});

test("edited face frame does not permit a missing or invalid similarity result", async () => {
  const source = frame();
  const changed = { ...frame(), data: new Uint8ClampedArray([210, 210, 210, 255]) };
  const coverage = Uint8Array.of(255);
  await assert.rejects(prepareEditedReelFrame(source, changed, coverage));
  await assert.rejects(prepareEditedReelFrame(source, changed, coverage, {
    guard: (_source, edited, _level) => ({ pixels: edited, similarity: Infinity }),
  }));
  const guarded = await prepareEditedReelFrame(source, changed, coverage, {
    guard: (_source, edited, level) => ({ pixels: edited, similarity: 0.1 }),
  });
  assert.ok(guarded.data[0] > source.data[0]);
  assert.ok(guarded.data[0] < changed.data[0]);
});
