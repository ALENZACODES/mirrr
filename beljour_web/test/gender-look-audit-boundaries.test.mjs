import assert from "node:assert/strict";
import { test } from "node:test";
import { GenderLevelEngine } from "../dist/js/engines/gender_look/levels.js";

function frame(seed) {
  const width = 48;
  const height = 36;
  const channels = 4;
  const data = new Uint8ClampedArray(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * channels;
      data[offset] = (seed + x * 3 + y) % 256;
      data[offset + 1] = (seed + x + y * 4) % 256;
      data[offset + 2] = (seed + x * 2 + y * 2) % 256;
      data[offset + 3] = (x + y * 5) % 256;
    }
  }
  return { width, height, channels, data };
}

function masks(photo) {
  const size = photo.width * photo.height;
  const area = new Float32Array(size).fill(1);
  return { brow: area, skin: area, stubble: area };
}

function guard() {
  return { guard(_before, after) {
    return { image: after.slice(), similarity: 1, blendedBack: false };
  } };
}

test("R25c default and low-resolution paths have matching neutral pixel evidence", () => {
  const source = frame(78);
  const engine = new GenderLevelEngine({ masks: (_hash, photo) => masks(photo) }, guard());
  const full = engine.render(source, "neutral-photo", "feminine", 1.0, {
    primaryBox: [0, 0, 1, 1],
  });
  assert.deepEqual(full.data, source.data);
  const preview = engine.render(source, "neutral-photo", "feminine", 1.0, {
    primaryBox: [0, 0, 1, 1], previewEdge: 24,
  });
  assert.equal(preview.data.length, 24 * 18 * 4);
  assert.deepEqual(preview.data.slice(0, 4), source.data.slice(0, 4));
  assert.deepEqual(preview.data.slice(-4), source.data.slice(-4));
  assert.equal(engine.maskComputations, 1);
});

test("R25c a missing primary mesh returns coded refusal with original pixels", () => {
  let called = 0;
  const source = frame(25);
  const engine = new GenderLevelEngine({ masks() { called++; return masks(source); } });
  const refused = engine.render(source, "no-mesh", "masculine", 5.0, {
    primaryBox: null,
  });
  assert.equal(refused.status, "no_mesh");
  assert.equal(refused.guardCalled, false);
  assert.deepEqual(refused.data, source.data);
  assert.equal(called, 0);
});

test("R25c cache invalidation re-runs only the named photo observations", () => {
  let called = 0;
  const source = frame(35);
  const engine = new GenderLevelEngine({ masks(_hash, photo) { called++; return masks(photo); } });
  for (const hash of ["A", "B", "A"]) {
    engine.render(source, hash, "feminine", 2, { primaryBox: [0, 0, 1, 1] });
  }
  assert.equal(called, 2);
  engine.invalidate("A");
  engine.render(source, "B", "feminine", 3.5, { primaryBox: [0, 0, 1, 1] });
  assert.equal(called, 2);
  engine.render(source, "A", "feminine", 5, { primaryBox: [0, 0, 1, 1] });
  assert.equal(called, 3);
  engine.invalidate();
  engine.render(source, "B", "feminine", 5, { primaryBox: [0, 0, 1, 1] });
  assert.equal(called, 4);
});

test("R25c bad primary boxes cannot silently select whole-frame processing", () => {
  const source = frame(39);
  const engine = new GenderLevelEngine({ masks: (_hash, photo) => masks(photo) });
  for (const box of [[0, 0, 0, 1], [0, 0, 1.1, 1], [-0.1, 0, 1, 1], [NaN, 0, 1, 1]]) {
    assert.throws(() => engine.render(source, "bad-box", "feminine", 5, {
      primaryBox: box,
    }), /invalid primary face box/);
  }
});

test("R25c low-resolution previews reject too-small edges", () => {
  const source = frame(41);
  const engine = new GenderLevelEngine({ masks: (_hash, photo) => masks(photo) });
  assert.throws(() => engine.render(source, "bad-edge", "masculine", 3.5, {
    primaryBox: [0, 0, 1, 1], previewEdge: 15,
  }), /preview edge/);
});

