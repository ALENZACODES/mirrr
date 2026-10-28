/** Live Python/TypeScript parity and isolation tests on synthetic colour scenes.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  DEFAULT_LEVEL,
  HairColourSession,
  LocalChangeGuard,
  byteRound,
  checkedLevel,
  choice,
  levelWeight,
  parseRecipe,
  safeRecipe,
} from "../dist/js/engines/haircolour/consultation.js";
import {
  auditPixels,
  mergeGroupCounts,
} from "../dist/js/engines/haircolour/consultation-audit.js";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const python = process.env.PYTHON || "python3";
const vectors = JSON.parse(execFileSync(python, ["api/tests/r27c_haircolour_vectors.py"], {
  cwd: repo,
  env: { ...process.env, PYTHONPATH: resolve(repo, "api") },
  encoding: "utf8",
}));

function maxGap(one, two) {
  assert.equal(one.length, two.length);
  let maximum = 0;
  for (let i = 0; i < one.length; i++) {
    maximum = Math.max(maximum, Math.abs(one[i] - two[i]));
  }
  return maximum;
}

function fromVector(c) {
  const image = {
    width: c.width,
    height: c.height,
    channels: c.channels,
    data: Uint8ClampedArray.from(c.original),
  };
  return {
    image,
    mask: Float64Array.from(c.hair_mask),
    strokes: Float64Array.from(c.strokes),
  };
}

test("Python/TypeScript previews agree across the two modes and three/four channels", () => {
  assert.equal(vectors.length, 7);
  for (const c of vectors) {
    const { image, mask, strokes } = fromVector(c);
    const session = new HairColourSession(image, mask);
    const result = session.render(choice(c.mode, {
      level: c.level,
      shade: c.shade,
      baseLevel: 4,
      targetLevel: 7,
      softness: 1,
    }), { strokes: c.mode === "W28" ? strokes : undefined });
    assert.ok(maxGap(result.image, c.rendered) <= 1, `${c.mode} ${c.shade} ${c.level}`);
    assert.ok(Math.abs(result.changedShare - c.changed_share) < 0.003);
    assert.ok(Math.abs(result.meanDelta - c.mean_delta) < 0.4);
    assert.ok(Math.abs(result.similarityProxy - c.similarity_proxy) < 1e-7);
    assert.equal(result.lockLimited, c.limited);
    assert.equal(result.realfaceStatus, "unproven");
    assert.match(result.label, /simulation/i);
  }
});

test("Python/TypeScript count-only audits agree with masked real rendered bytes", () => {
  for (const c of vectors) {
    const { image, mask } = fromVector(c);
    const after = { ...image, data: Uint8ClampedArray.from(c.rendered) };
    const result = auditPixels(image, after, mask, {
      guardInvoked: true,
      simulationDisclosed: true,
    });
    assert.equal(result.observedPixels, c.audit.observed_pixels);
    assert.equal(result.changedPixels, c.audit.changed_pixels);
    assert.equal(result.outsideChangedPixels, c.audit.outside_changed_pixels);
    assert.equal(result.alphaChangedPixels, c.audit.alpha_changed_pixels);
    assert.equal(result.maxOutsideDelta, c.audit.max_outside_delta);
    assert.equal(result.structureSamples, c.audit.structure_samples);
    if (c.audit.structure_correlation === null) {
      assert.equal(result.structureCorrelation, null);
    } else {
      assert.ok(Math.abs(result.structureCorrelation - c.audit.structure_correlation) <= 0.00001);
    }
    assert.equal(result.realfaceStatus, "not_tested");
  }
});

test("strict decimal levels reject implicit coercion and non-tenths", () => {
  for (const accepted of [1, 1.1, 2, 2.5, 3.5, 4.9, 5]) {
    assert.equal(checkedLevel(accepted), accepted);
    assert.ok(levelWeight(accepted) >= 0);
    assert.ok(levelWeight(accepted) <= 1);
  }
  for (const rejected of [0.95, 2.25, 5.1, NaN, Infinity, "2", true, undefined, null]) {
    assert.throws(() => checkedLevel(rejected), RangeError);
  }
});

test("half-even rounding matches the NumPy byte contract", () => {
  for (const [before, next] of [
    [20.5, 20], [21.5, 22], [2.5, 2], [3.5, 4], [99.5, 100],
    [-1, 0], [256, 255], [17.499, 17], [17.501, 18],
  ]) {
    assert.equal(byteRound(before), next);
  }
});

test("a neutral W28 and W39 preview never changes any pixel", () => {
  const c = vectors[0];
  const { image, mask, strokes } = fromVector(c);
  for (const mode of ["W28", "W39"]) {
    const session = new HairColourSession(image, mask);
    let calls = 0;
    const neutral = session.render(choice(mode, { level: 1, baseLevel: 4, targetLevel: 7 }), {
      strokes,
      guard: {
        guard(before, candidate) {
          calls++;
          assert.deepEqual(candidate, before);
          return { image: candidate, similarity: 1, limited: false };
        },
      },
    });
    assert.deepEqual(neutral.image, image.data);
    assert.equal(neutral.changedShare, 0);
    assert.equal(calls, 1);
    assert.equal(session.operationCounts.effectComputations, 0);
  }
});

test("five slider levels reuse one expensive recolour effect", () => {
  const { image, mask } = fromVector(vectors[1]);
  const session = new HairColourSession(image, mask);
  for (const level of [1, 2, 2.5, 3.5, 5]) {
    session.render(choice("W39", { level, shade: "copper" }));
  }
  assert.equal(session.operationCounts.maskComputations, 1);
  assert.equal(session.operationCounts.effectComputations, 1);
  assert.equal(session.operationCounts.guardCalls, 5);
  assert.equal(session.lastLevel("W39"), 5);
});

test("a corrected mask invalidates the affected effect cache", () => {
  const { image, mask } = fromVector(vectors[2]);
  const session = new HairColourSession(image, mask);
  const option = choice("W39", { level: 5, shade: "ash" });
  session.render(option);
  const next = Float64Array.from(mask);
  for (let i = 0; i < next.length; i++) if (i % 17 === 0) next[i] = 0;
  session.replaceObservedMask(next);
  session.render(option);
  assert.equal(session.operationCounts.maskComputations, 2);
  assert.equal(session.operationCounts.effectComputations, 2);
});

test("a changed balayage stroke map cannot reuse the previous placement", () => {
  const { image, mask, strokes } = fromVector(vectors[4]);
  const session = new HairColourSession(image, mask);
  const option = choice("W28", { level: 4, baseLevel: 4, targetLevel: 7 });
  session.render(option, { strokes });
  const revised = Float64Array.from(strokes);
  revised[12 * image.width + 20] = 0.5;
  session.render(option, { strokes: revised });
  assert.equal(session.operationCounts.effectComputations, 2);
});

test("the user may deliberately lower the pixel lock, never disable default invocation", () => {
  const { image, mask } = fromVector(vectors[1]);
  const session = new HairColourSession(image, mask);
  const option = choice("W39", { level: 5, shade: "deep" });
  const strict = session.render(option);
  const lower = session.render(option, { lockLevel: 0 });
  assert.equal(strict.lockApplied, true);
  assert.equal(lower.lockApplied, true);
  assert.ok(lower.meanDelta >= strict.meanDelta);
  assert.equal(session.operationCounts.guardCalls, 2);
  assert.ok(new LocalChangeGuard(4).guard(image.data, image.data, 1).similarity === 1);
});

test("an injected faulty guard cannot edit RGB outside the hair or alpha anywhere", () => {
  const { image, mask } = fromVector(vectors[2]);
  const original = Uint8ClampedArray.from(image.data);
  const session = new HairColourSession(image, mask);
  const preview = session.render(choice("W39", { level: 4, shade: "gold" }), {
    guard: {
      guard(before, candidate) {
        candidate.fill(255);
        return { image: candidate, similarity: 0.4, limited: false };
      },
    },
  });
  for (let i = 0; i < mask.length; i++) {
    for (let c = 0; c < image.channels; c++) {
      if (mask[i] < 0.5 || c === 3) {
        assert.equal(preview.image[i * image.channels + c], original[i * image.channels + c]);
      }
    }
  }
  assert.deepEqual(image.data, original);
});

test("recipes contain controls but never photo, mask or personal input data", () => {
  const selected = choice("W39", { level: 3.7, shade: "chestnut" });
  const stored = safeRecipe(selected);
  assert.deepEqual(parseRecipe(stored), selected);
  const serialized = JSON.stringify(stored);
  for (const forbidden of ["image", "photo", "mask", "landmark", "byte", "filename"]) {
    assert.ok(!serialized.includes(forbidden));
  }
  assert.equal(stored.simulation, "true");
  for (const bad of ["photo", "landmark", "provider_id", "rgb"]) {
    assert.throws(() => parseRecipe({ ...stored, [bad]: "unexpected" }), RangeError);
  }
});

test("mask edits never leave the approved primary region", () => {
  const { image, mask } = fromVector(vectors[1]);
  const primary = new Float64Array(mask.length);
  for (let y = 4; y < 20; y++) {
    for (let x = 5; x < 18; x++) primary[y * image.width + x] = 1;
  }
  const session = new HairColourSession(image, mask, { primaryMask: primary });
  session.replaceObservedMask(new Float64Array(mask.length).fill(1));
  const result = session.render(choice("W39", { level: 5, shade: "copper" }), {
    guard: {
      guard(before, candidate) {
        candidate.fill(255);
        return { image: candidate, similarity: 0.5, limited: false };
      },
    },
  });
  for (let i = 0; i < mask.length; i++) {
    if (primary[i] >= 0.5) continue;
    for (let c = 0; c < image.channels; c++) {
      assert.equal(result.image[i * image.channels + c], image.data[i * image.channels + c]);
    }
  }
});

test("preview dimensions are bounded and the full effect remains reusable", () => {
  const { image, mask } = fromVector(vectors[2]);
  const session = new HairColourSession(image, mask);
  const option = choice("W39", { level: 3.5, shade: "gold" });
  const reduced = session.render(option, { previewEdge: 32 });
  const full = session.render(option);
  assert.equal(reduced.width, 32);
  assert.equal(reduced.preview, true);
  assert.equal(full.preview, false);
  assert.equal(session.operationCounts.effectComputations, 1);
});

test("aggregate evidence remains not tested and rejects record-like group labels", () => {
  const groups = mergeGroupCounts([
    { group: "hair_texture", label: "coily", observed: 5, evaluated: 3,
      refusals: 1, leakageFailures: 0, unmeasured: 1 },
    { group: "hair_texture", label: "coily", observed: 4, evaluated: 4,
      refusals: 0, leakageFailures: 1, unmeasured: 0 },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].observed, 9);
  assert.equal(groups[0].qualityStatus, "not_tested");
  assert.throws(() => mergeGroupCounts([
    { group: "hair_texture", label: "path/unsafe", observed: 1,
      evaluated: 1, refusals: 0, leakageFailures: 0, unmeasured: 0 },
  ]), RangeError);
});

test("original-first boards retain unique choice identities", async () => {
  const board = await import("../dist/js/engines/haircolour/consultation-board.js");
  const { image, mask, strokes } = fromVector(vectors[4]);
  const session = new HairColourSession(image, mask);
  const choices = [
    { key: "copper", choice: choice("W39", { level: 3.5, shade: "copper" }) },
    { key: "ash", choice: choice("W39", { level: 4.0, shade: "ash" }) },
    { key: "paint", choice: choice("W28", { level: 5.0, baseLevel: 4, targetLevel: 7 }), strokes },
  ];
  const result = board.buildBoard(session, choices);
  assert.deepEqual(result.original, image.data);
  assert.equal(result.tiles.length, 3);
  assert.equal(result.countsOnly().guardedTiles, 3);
  assert.ok(maxGap(result.tiles[0].image, result.tiles[1].image) > 0);
  assert.equal(result.realfaceStatus, "unproven");
  const safe = board.safeBoardRecipe(choices);
  const json = JSON.stringify(safe);
  for (const sensitive of ["image", "photo", "mask", "landmarks", "strokes"]) {
    assert.ok(!json.includes(sensitive));
  }
  const restored = board.parseBoardRecipe(safe);
  assert.equal(restored.length, 3);
  assert.ok(restored.every((row) => row.strokes === undefined));
  assert.throws(() => board.buildBoard(session, restored), /placement/);
  assert.throws(() => board.safeBoardRecipe([choices[0], choices[0]]), /duplicate/);
});
