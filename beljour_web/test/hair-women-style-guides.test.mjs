/** R25c women hairstyle guide parity and rendering invariants. Author: John Khan. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  DEFINITIONS, SIMULATION_LABEL, STYLE_KEYS, TEXTURES, definition,
  guideFields, validateGuideGeometry,
} from "../dist/js/engines/hair_women/style-guides.js";
import {
  StyleGuideSession, renderStyleGuide,
} from "../dist/js/engines/hair_women/style-preview.js";

const vectors = JSON.parse(readFileSync(
  new URL("../../parity/women-style-guide-r25c.json", import.meta.url), "utf8",
));
const geometry = {
  crown: [.5, .06], left_temple: [.25, .32], right_temple: [.75, .32], chin: [.5, .91],
};
function scene(tone = 54) {
  const data = new Uint8ClampedArray(64 * 64 * 4);
  const mask = new Float32Array(64 * 64);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const pixel = y * 64 + x;
      const offset = pixel * 4;
      data[offset] = (tone + 2 * x + 3 * y) % 256;
      data[offset + 1] = (tone + x + y) % 256;
      data[offset + 2] = (tone + 2 * y) % 256;
      data[offset + 3] = (x + 2 * y + 101) % 256;
      mask[pixel] = y >= 5 && y < 58 && x >= 5 && x < 59 ? 1 : 0;
    }
  }
  return [{ width: 64, height: 64, channels: 4, data }, mask];
}
const passThrough = {
  guard(_before, after) {
    return { image: new Uint8ClampedArray(after), similarity: 1, blendedBack: false };
  },
};
const options = {
  primaryBox: [0, 0, 1, 1], identityGuard: passThrough,
};
function exactPlane(a, b, tolerance = 0) {
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    assert.ok(Math.abs(a[i] - b[i]) <= tolerance, `pixel ${i}: ${a[i]} vs ${b[i]}`);
  }
}

test("twelve authored consultation guides are unique and descriptive", () => {
  assert.equal(STYLE_KEYS.length, 12);
  assert.equal(new Set(STYLE_KEYS).size, STYLE_KEYS.length);
  assert.deepEqual(DEFINITIONS.map(row => row.styleId), STYLE_KEYS);
  assert.deepEqual(new Set(DEFINITIONS.map(row => row.section)), new Set(["short", "mid", "long"]));
  assert.ok(SIMULATION_LABEL.includes("simulation"));
  assert.ok(SIMULATION_LABEL.includes("No new hair"));
  for (const style of STYLE_KEYS) {
    const item = definition(style);
    assert.ok(item.title.length > 0);
    assert.ok(item.note.length > 0);
    assert.ok(item.shadow > 0 && item.highlight > 0);
  }
});

test("original Python and TypeScript image parity across 60 style, texture and level cases", () => {
  assert.equal(vectors.format, "women-style-guide-parity/1");
  assert.equal(vectors.cases.length, 60);
  assert.equal(vectors.width, 64);
  for (const reference of vectors.cases) {
    const [photo, mask] = scene();
    const rendered = renderStyleGuide(photo, mask, geometry, reference.style, reference.level, {
      ...options, texture: reference.texture,
    });
    assert.equal(rendered.status, "rendered");
    assert.equal(rendered.guardCalled, true);
    assert.ok(Math.abs(rendered.changedPixelShare - reference.share) < .007,
      `${reference.style} ${reference.texture} ${reference.level} coverage share`);
    for (let sample = 0; sample < vectors.samples.length; sample++) {
      const [y, x] = vectors.samples[sample];
      const expected = reference.pixels[sample];
      const offset = (y * 64 + x) * 4;
      for (let channel = 0; channel < 4; channel++) {
        const actual = rendered.data[offset + channel];
        const error = Math.abs(actual - expected[channel]);
        assert.ok(error <= (channel === 3 ? 0 : 1),
          `${reference.style}/${reference.texture}/${reference.level}: ${x},${y},${channel}: ${error}`);
      }
    }
    const field = guideFields(reference.style, geometry, 64, 64);
    for (let sample = 0; sample < vectors.samples.length; sample++) {
      const [y, x] = vectors.samples[sample];
      const index = y * 64 + x;
      const expected = reference.guide[sample];
      assert.ok(Math.abs(field.zone[index] - expected[0]) < .000002);
      assert.ok(Math.abs(field.grade[index] - expected[1]) < .000002);
      assert.ok(Math.abs(field.tone[index] - expected[2]) < .000002);
    }
  }
});

test("one full guide equals contiguous independent row tiles", () => {
  for (const style of STYLE_KEYS) {
    const full = guideFields(style, geometry, 64, 64);
    for (const tileRows of [16, 23, 37]) {
      const pieces = [];
      for (let start = 0; start < 64; start += tileRows) {
        pieces.push(guideFields(style, geometry, 64, 64, start, Math.min(64, start + tileRows)));
      }
      for (const field of ["zone", "grade", "tone"]) {
        const joined = new Float32Array(64 * 64);
        let offset = 0;
        for (const item of pieces) { joined.set(item[field], offset); offset += item[field].length; }
        exactPlane(full[field], joined);
      }
    }
  }
});

test("neutral level does not alter bytes; progressive levels never reduce the covered region", () => {
  const [photo, mask] = scene();
  for (const style of STYLE_KEYS) {
    let previousCount = -1;
    for (const level of [1, 1.6, 2, 3.5, 5]) {
      const render = renderStyleGuide(photo, mask, geometry, style, level, options);
      let count = 0;
      for (const value of render.coverage) if (value > 0) count++;
      assert.ok(count >= previousCount, `${style} ${level}`);
      previousCount = count;
      if (level === 1) assert.deepEqual(render.data, photo.data);
      if (level === 5) assert.ok(render.changedPixelShare > 0);
      assert.equal(render.guardCalled, true);
    }
  }
});

test("protected marks, selected face and hair masks are hard compositor boundaries", () => {
  const [photo, mask] = scene();
  const protectedMask = new Float32Array(64 * 64);
  for (let y = 12; y < 22; y++) {
    for (let x = 22; x < 30; x++) protectedMask[y * 64 + x] = .1;
  }
  const hostileGuard = {
    guard(before, after) {
      before.fill(0);
      after.fill(255);
      return { image: after, similarity: .8, blendedBack: false };
    },
  };
  const original = new Uint8ClampedArray(photo.data);
  const result = renderStyleGuide(photo, mask, geometry, "curly_shag", 5, {
    primaryBox: [0, 0, .5, 1], protectedMask, identityGuard: hostileGuard,
  });
  assert.deepEqual(photo.data, original);
  for (let pixel = 0; pixel < mask.length; pixel++) {
    const x = pixel % 64;
    const off = pixel * 4;
    if (x >= 32 || !mask[pixel] || protectedMask[pixel]) {
      assert.deepEqual(result.data.slice(off, off + 4), original.slice(off, off + 4));
    }
    assert.equal(result.data[off + 3], original[off + 3]);
  }
});

test("mask-only user corrections take effect without invalidating reusable geometry", () => {
  const [photo, mask] = scene();
  const session = new StyleGuideSession();
  const opts = { ...options, tileHeight: 32 };
  for (const level of [1, 1.7, 2, 3.5, 5]) {
    const cached = session.render(photo, mask, geometry, "long_ribbons", level, opts);
    const normal = renderStyleGuide(photo, mask, geometry, "long_ribbons", level, opts);
    assert.deepEqual(cached.data, normal.data);
  }
  assert.equal(session.computations, 2);
  const corrected = new Float32Array(mask);
  corrected.fill(0, 0, 64 * 32);
  const updated = session.render(photo, corrected, geometry, "long_ribbons", 5, opts);
  assert.equal(session.computations, 2);
  for (let pixel = 0; pixel < 64 * 32; pixel++) {
    assert.deepEqual(updated.data.slice(pixel * 4, pixel * 4 + 4),
      photo.data.slice(pixel * 4, pixel * 4 + 4));
  }
  assert.ok(session.retainedBytes > 0);
  session.clear();
  assert.equal(session.retainedBytes, 0);
});

test("different frames and changed geometry are not reused as the same cache entry", () => {
  const session = new StyleGuideSession();
  const [first, mask] = scene(54);
  const [second] = scene(82);
  session.render(first, mask, geometry, "curly_shag", 5, options);
  session.render(second, mask, geometry, "curly_shag", 5, options);
  assert.equal(session.computations, 2);
  session.render(first, mask, { ...geometry, crown: [.51, .06] }, "curly_shag", 5, options);
  assert.equal(session.computations, 3);
  session.invalidate();
  assert.equal(session.retainedBytes, 0);
  session.render(first, mask, geometry, "curly_shag", 5, options);
  assert.equal(session.computations, 4);
});

test("invalid levels, zero masks and absent mesh do not silently edit pixels", () => {
  const [photo, mask] = scene();
  for (const level of [.95, 2.25, 5.1, Number.NaN, Infinity]) {
    assert.throws(() => renderStyleGuide(photo, mask, geometry, "curtain_fringe", level, options));
  }
  const empty = new Float32Array(mask.length);
  const noSelection = renderStyleGuide(photo, empty, geometry, "curly_shag", 5, options);
  assert.equal(noSelection.status, "empty_selection");
  assert.deepEqual(noSelection.data, photo.data);
  const noMesh = renderStyleGuide(photo, mask, null, "curly_shag", 5, options);
  assert.equal(noMesh.status, "no_mesh");
  assert.deepEqual(noMesh.data, photo.data);
});

test("invalid geometry, mask fractions, row ranges and cache budgets fail closed", () => {
  const [photo, mask] = scene();
  assert.throws(() => validateGuideGeometry({ ...geometry, chin: [.5, .08] }));
  const bad = new Float32Array(mask);
  bad[83] = Number.NaN;
  assert.throws(() => renderStyleGuide(photo, bad, geometry, "curly_shag", 5, options));
  assert.throws(() => guideFields("curly_shag", geometry, 64, 64, 13, 11));
  assert.throws(() => new StyleGuideSession(1024));
  assert.throws(() => renderStyleGuide(photo, mask, geometry, "curly_shag", 5,
    { ...options, tileHeight: 2 }));
});
