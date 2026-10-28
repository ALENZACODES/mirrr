/** R25c independent byte audits and privacy-safe aggregates. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  auditStyle, assertEvidenceSchema, countGroups, monotoneCoverage,
} from "../dist/js/engines/hair_women/style-audit.js";
import { renderStyleGuide } from "../dist/js/engines/hair_women/style-preview.js";
import { STYLE_KEYS } from "../dist/js/engines/hair_women/style-guides.js";

const geometry = {
  crown: [.5, .06], left_temple: [.25, .32], right_temple: [.75, .32], chin: [.5, .91],
};
function drawScene() {
  const data = new Uint8ClampedArray(64 * 64 * 4);
  const hair = new Float32Array(64 * 64);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const index = y * 64 + x;
      data[index * 4] = (54 + 2 * x + 3 * y) % 256;
      data[index * 4 + 1] = (54 + x + y) % 256;
      data[index * 4 + 2] = (54 + 2 * y) % 256;
      data[index * 4 + 3] = (x + 2 * y + 101) % 256;
      hair[index] = y >= 5 && y < 58 && x >= 5 && x < 59 ? 1 : 0;
    }
  }
  return [{ width: 64, height: 64, channels: 4, data }, hair];
}
const passThrough = { guard(_before, after) {
  return { image: new Uint8ClampedArray(after), similarity: 1, blendedBack: false };
} };
function result(style = "curly_shag", level = 5) {
  const [photo, hair] = drawScene();
  const preview = renderStyleGuide(photo, hair, geometry, style, level, {
    identityGuard: passThrough, primaryBox: [0, 0, 1, 1],
  });
  assert.equal(preview.status, "rendered");
  return [photo, hair, preview];
}

test("every new women's style has independent unproven evidence, never an inferred PASS", () => {
  for (const style of STYLE_KEYS) {
    const [photo, hair, preview] = result(style);
    const measured = auditStyle(photo, preview, hair);
    assert.equal(measured.styleId, style);
    assert.equal(measured.status, "UNPROVEN");
    assert.ok(measured.changedPixelCount > 0);
    assert.ok(measured.selectedPixelCount > 0);
    assert.equal(measured.outsidePixelCount, 0);
    assert.equal(measured.alphaPixelCount, 0);
    assert.equal(measured.protectedPixelCount, 0);
    assert.ok(measured.meanSelectedDelta >= 0);
  }
});

test("neutral preview has zero changed bytes and a documented guard invocation", () => {
  const [photo, hair, preview] = result("long_ribbons", 1);
  assert.deepEqual(preview.data, photo.data);
  const measured = auditStyle(photo, preview, hair);
  assert.equal(measured.changedPixelCount, 0);
  assert.equal(measured.guardCalled, true);
  assert.equal(measured.status, "UNPROVEN");
});

test("one out-of-region RGB edit produces a deliberate FAIL", () => {
  const [photo, hair, preview] = result();
  preview.data[0] = 255 - preview.data[0];
  const measured = auditStyle(photo, preview, hair);
  assert.equal(measured.status, "FAIL");
  assert.equal(measured.outsidePixelCount, 1);
});

test("one changed alpha byte produces a deliberate FAIL", () => {
  const [photo, hair, preview] = result();
  preview.data[3] = 255 - preview.data[3];
  const measured = auditStyle(photo, preview, hair);
  assert.equal(measured.status, "FAIL");
  assert.equal(measured.alphaPixelCount, 1);
});

test("protected regions inside selected hair cannot be silently bypassed", () => {
  const [photo, hair, preview] = result("graduated_bob");
  const protectedMask = new Float32Array(hair.length);
  for (let y = 20; y < 43; y++) {
    for (let x = 20; x < 43; x++) protectedMask[y * 64 + x] = .25;
  }
  const measured = auditStyle(photo, preview, hair, protectedMask);
  assert.ok(measured.protectedPixelCount > 0);
  assert.equal(measured.status, "FAIL");
});

test("guard refusal cannot be spoofed as a safe rendered edit", () => {
  const [photo, hair, preview] = result();
  const incomplete = { ...preview, guardCalled: false };
  assert.equal(auditStyle(photo, incomplete, hair).status, "FAIL");
  assert.throws(() => auditStyle(photo, { ...preview, status: "no_mesh" }, hair));
});

test("read-only evidence rejects malformed images and segmentation masks", () => {
  const [photo, hair, preview] = result();
  assert.throws(() => auditStyle(photo, { ...preview, data: new Uint8ClampedArray(12) }, hair));
  assert.throws(() => auditStyle(photo, preview, new Float32Array(7)));
  const invalid = new Float32Array(hair);
  invalid[19] = Number.NaN;
  assert.throws(() => auditStyle(photo, preview, invalid));
});

test("coverage monotonicity is based on absolute pixels and rejects invalid series", () => {
  const [photo, hair] = drawScene();
  const series = [1, 1.8, 2.5, 3.5, 5].map(level =>
    renderStyleGuide(photo, hair, geometry, "curly_shag", level,
      { primaryBox: [0, 0, 1, 1], identityGuard: passThrough }));
  assert.equal(monotoneCoverage(series), true);
  assert.throws(() => monotoneCoverage([series[0], series[0]]));
  assert.throws(() => monotoneCoverage([]));
  const other = renderStyleGuide(photo, hair, geometry, "long_ribbons", 5,
    { primaryBox: [0, 0, 1, 1], identityGuard: passThrough });
  assert.throws(() => monotoneCoverage([series[0], other]));
  const descending = [{ ...series[2], coverage: series[2].coverage },
    { ...series[4], coverage: new Float32Array(hair.length) }];
  assert.equal(monotoneCoverage(descending), false);
});

test("group counts carry no photo hashes or filenames", () => {
  const [photo, hair, preview] = result();
  const evidence = auditStyle(photo, preview, hair);
  const groups = countGroups([["texture", "coily", evidence], ["monk", "5", evidence]]);
  assert.equal(groups.length, 2);
  assert.equal(groups.reduce((sum, row) => sum + row.observed, 0), 2);
  assert.equal(assertEvidenceSchema(groups), 2);
  assert.equal(groups.some(row => "faceHash" in row), false);
  assert.throws(() => assertEvidenceSchema([{ ...groups[0], faceHash: "sensitive" }]));
  assert.throws(() => assertEvidenceSchema([{ ...groups[0], unproven: 0 }]));
});

test("unsafe group labels are refused instead of echoed into public reports", () => {
  const [photo, hair, preview] = result();
  const evidence = auditStyle(photo, preview, hair);
  for (const name of ["person@example.com", "/private/face.png", "", "x".repeat(50)]) {
    assert.throws(() => countGroups([["texture", name, evidence]]));
  }
  assert.throws(() => countGroups([["individual_identity", "name", evidence]]));
});
