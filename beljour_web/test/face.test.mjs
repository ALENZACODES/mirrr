import assert from "node:assert/strict";
import { test } from "node:test";

import { fitLine, MIDLINE, offsetToScore, reflect, REGIONS, symmetry } from "../dist/js/face/symmetry.js";
import { faceWidthRatio, lighting, rollDegrees, runChecks } from "../dist/js/face/quality.js";
import { trend } from "../dist/js/store.js";

/** A perfectly mirrored synthetic face mesh around x = 0.5. */
function mirroredFace(shift = 0) {
  const pts = Array.from({ length: 478 }, (_, i) => ({ x: 0.5, y: 0.2 + (i % 50) / 80 }));
  for (const pairs of Object.values(REGIONS)) {
    pairs.forEach(([right, left], k) => {
      const y = 0.3 + ((right * 7) % 40) / 100;
      const dx = 0.05 + k * 0.03 + (right % 5) * 0.01;
      pts[right] = { x: 0.5 - dx, y };
      pts[left] = { x: 0.5 + dx + shift, y };
    });
  }
  MIDLINE.forEach((i, k) => (pts[i] = { x: 0.5, y: 0.1 + k * 0.035 }));
  pts[33] = { x: 0.35, y: 0.42 }; pts[263] = { x: 0.65, y: 0.42 };
  pts[234] = { x: 0.2, y: 0.5 }; pts[454] = { x: 0.8, y: 0.5 }; pts[1] = { x: 0.5, y: 0.55 };
  return pts;
}

test("fitLine finds a vertical line", () => {
  const line = fitLine([[10, 0], [10, 5], [10, 20]]);
  assert.ok(Math.abs(line.dx) < 1e-9);
  assert.equal(line.dy, 1);
});

test("reflect mirrors across a vertical line", () => {
  const [x, y] = reflect([3, 7], { cx: 5, cy: 0, dx: 0, dy: 1 });
  assert.ok(Math.abs(x - 7) < 1e-9 && Math.abs(y - 7) < 1e-9);
});

test("a mirrored face scores 100 and a shifted one scores lower", () => {
  const perfect = symmetry(mirroredFace(), 800, 1000);
  assert.equal(perfect.score, 100);
  assert.equal(perfect.tiltDegrees, 0);
  const shifted = symmetry(mirroredFace(0.02), 800, 1000);
  assert.ok(shifted.score < 100 && shifted.score > 0, `score ${shifted.score}`);
});

test("offsetToScore is clamped", () => {
  assert.equal(offsetToScore(0), 100);
  assert.equal(offsetToScore(1), 0);
});

test("photo checks mirror YouCam's 60 percent face width rule", () => {
  const face = mirroredFace();
  assert.ok(Math.abs(faceWidthRatio(face) - 0.6) < 0.25);
  assert.ok(Math.abs(rollDegrees(face, 800, 1000)) < 1e-9);
  const small = face.map((p) => ({ x: 0.5 + (p.x - 0.5) * 0.5, y: p.y }));
  const checks = runChecks(small, 800, 1000, { mean: 140, clipped: 0 });
  assert.equal(checks.find((c) => c.id === "size").ok, false);
  assert.equal(runChecks(null, 800, 1000, null)[0].ok, false);
});

test("lighting reads mean luma and clipping", () => {
  const px = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
  const l = lighting(px);
  assert.ok(Math.abs(l.mean - 127.5) < 0.01);
  assert.equal(l.clipped, 0.5);
});

test("trend ignores sample entries", () => {
  const e = (s, sample = false) => ({ at: "", overall: null, scores: { moisture: s }, sample });
  assert.equal(trend([e(50), e(99, true)], "moisture"), null);
  assert.deepEqual(trend([e(50), e(55.5)], "moisture"), { first: 50, last: 55.5, change: 5.5 });
});
