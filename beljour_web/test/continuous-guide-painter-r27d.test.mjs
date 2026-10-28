/** Bounded guide drawings on drawn figures, with byte-identical bystanders. Author: John Khan. */
import assert from "node:assert/strict";
import test from "node:test";

import { defaultLevels, emptyApplied } from "../dist/js/layout/continuous/contract.js";
import {
  GUIDE_EFFECTS, eligibleGuides, guideOpacity, paintGuidesOnCanvas, paintTourGuides,
} from "../dist/js/layout/continuous/guide-painter.js";
import { DRAWN_PAIR } from "../dist/js/layout/subjects/contract.js";
import { pixelFootprint } from "../dist/js/layout/subjects/pixel-guard.js";

const W = 200, H = 120;
const drawn = () => ({ width: W, height: H,
  rgba: new Uint8ClampedArray(W * H * 4).map((_, i) => (i % 4 === 3 ? 255 : 90 + (i % 7) * 20)) });
const snapshot = (boxes = DRAWN_PAIR, selectedId = "drawn-main", revision = 3) => ({
  revision, source: "drawn", boxes, selectedId, reason: "drawn sample",
});

function tour(effects, overrides = {}) {
  const applied = emptyApplied();
  const levels = defaultLevels();
  for (const effect of effects) {
    applied[effect] = true;
    levels[effect] = 4;
  }
  return {
    step: "posture", sourceLoaded: true, faceCount: 2, selectedId: "drawn-main", sourceRevision: 3,
    permissions: { local: true, hair: true, face: true, mock: false }, identityLock: true,
    levels, applied, appearanceCue: "masc", mockMode: "mock", mockResult: "not-requested",
    comparePercent: 50, requestedDownload: false, completed: [], skipped: [], proCommandsReviewed: [],
    seasonalId: null, ...overrides,
  };
}

function changedOutside(before, after, box) {
  const area = pixelFootprint(box, W, H);
  let outside = 0, inside = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const at = (y * W + x) * 4;
      const differs = [0, 1, 2, 3].some(c => before.rgba[at + c] !== after.rgba[at + c]);
      if (!differs) continue;
      if (x >= area.left && x < area.right && y >= area.top && y < area.bottom) inside++;
      else outside++;
    }
  }
  return { inside, outside };
}

test("strength 1.0 is neutral and 5.0 is the bounded maximum", () => {
  assert.equal(guideOpacity(1), 0);
  assert.equal(guideOpacity(5), 0.6);
  assert.equal(guideOpacity(3), 0.3);
  assert.throws(() => guideOpacity(5.05), /1\.0–5\.0/);
  const state = tour(["ratio"]);
  assert.deepEqual(eligibleGuides({ ...state, levels: { ...state.levels, ratio: 1 } }), []);
});

test("every guide changes only the selected figure", () => {
  for (const effect of GUIDE_EFFECTS) {
    const before = drawn();
    const result = paintTourGuides(before, tour([effect]), snapshot());
    assert.equal(result.visual, "guides", effect);
    assert.deepEqual(result.painted, [effect]);
    const counts = changedOutside(before, result.frame, DRAWN_PAIR[0]);
    assert.ok(counts.inside > 0, `${effect} draws something`);
    assert.equal(counts.outside, 0, `${effect} stays inside the selected box`);
    assert.equal(result.metrics.changedAlphaPixels, 0);
  }
});

test("guides follow pipeline order and the appearance cue choice", () => {
  const all = paintTourGuides(drawn(), tour([...GUIDE_EFFECTS]), snapshot());
  assert.deepEqual(all.painted, ["concealer", "appearance", "ratio", "turn", "posture"]);
  const none = tour(["appearance"], { appearanceCue: "none" });
  assert.equal(paintTourGuides(drawn(), none, snapshot()).visual, "original");
  const masc = paintTourGuides(drawn(), tour(["appearance"]), snapshot()).frame.rgba;
  const fem = paintTourGuides(drawn(), tour(["appearance"], { appearanceCue: "fem" }), snapshot()).frame.rgba;
  assert.notDeepEqual(masc, fem);
});

test("overlapping bystander pixels stay byte-identical", () => {
  const boxes = [
    { id: "front", x: 0.1, y: 0.1, width: 0.6, height: 0.8, origin: "drawn", primary: true },
    { id: "behind", x: 0.4, y: 0.2, width: 0.5, height: 0.6, origin: "drawn" },
  ];
  const before = drawn();
  const result = paintTourGuides(before, tour(["ratio", "posture"], { selectedId: "front" }),
    snapshot(boxes, "front"));
  assert.equal(result.visual, "guides");
  const guest = pixelFootprint(boxes[1], W, H);
  for (let y = guest.top; y < guest.bottom; y++) {
    for (let x = guest.left; x < guest.right; x++) {
      const at = (y * W + x) * 4;
      assert.deepEqual(result.frame.rgba.subarray(at, at + 4), before.rgba.subarray(at, at + 4));
    }
  }
  assert.ok(result.metrics.rejectedChanges > 0, "the overlap really received guide strokes that were refused");
});

test("missing permission, lock or source leaves the drawing unchanged", () => {
  const cases = [
    tour(["ratio"], { identityLock: false }),
    tour(["ratio"], { permissions: { local: true, hair: true, face: false, mock: false } }),
    tour(["ratio"], { permissions: { local: false, hair: true, face: true, mock: false } }),
    tour(["ratio"], { sourceLoaded: false }),
    tour([]),
  ];
  for (const state of cases) {
    const before = drawn();
    const result = paintTourGuides(before, state, snapshot());
    assert.equal(result.visual, "original");
    assert.deepEqual(result.frame.rgba, before.rgba);
    assert.notEqual(result.frame.rgba, before.rgba, "the result is a copy");
  }
});

test("a stale revision, another selection or untrusted boxes are refused", () => {
  const state = tour(["ratio"]);
  assert.match(paintTourGuides(drawn(), { ...state, sourceRevision: 2 }, snapshot()).note, /changed/);
  assert.match(paintTourGuides(drawn(), state, snapshot(DRAWN_PAIR, "drawn-guest")).note, /changed/);
  assert.equal(paintTourGuides(drawn(), state, snapshot(DRAWN_PAIR, null)).visual, "original");
  assert.equal(paintTourGuides(drawn(), state, { ...snapshot(), source: "awaiting-detector" }).visual, "original");
  const bad = [{ ...DRAWN_PAIR[0], width: 2 }];
  assert.equal(paintTourGuides(drawn(), state, snapshot(bad)).visual, "original");
});

test("a malformed frame falls back to the unchanged original", () => {
  const frame = { width: W, height: H, rgba: new Uint8ClampedArray(12) };
  const result = paintTourGuides(frame, tour(["posture"]), snapshot());
  assert.equal(result.visual, "original");
  assert.match(result.note, /unavailable/);
});

test("the Canvas adapter writes guides back only when they were drawn", () => {
  const image = drawn();
  let puts = 0;
  const context = {
    getImageData: () => ({ data: new Uint8ClampedArray(image.rgba) }),
    putImageData: (value) => { puts++; image.rgba.set(value.data); },
  };
  const canvas = { width: W, height: H, getContext: () => context };
  const before = new Uint8ClampedArray(image.rgba);
  assert.equal(paintGuidesOnCanvas(canvas, tour(["turn"]), snapshot()).visual, "guides");
  assert.equal(puts, 1);
  assert.notDeepEqual(image.rgba, before);
  assert.equal(paintGuidesOnCanvas(canvas, tour(["turn"], { identityLock: false }), snapshot()).visual, "original");
  assert.equal(puts, 1);
});
