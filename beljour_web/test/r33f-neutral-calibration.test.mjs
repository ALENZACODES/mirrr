// R33F neutral card and card-assisted reading in the browser, on drawn scenes only.
// Mirrors api/tests/test_r33f_neutral_calibration.py and test_r33f_calibrated_photo.py,
// with the same literal values. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectNeutralCard, neutralPhotoOptions, publicNeutral } from "../dist/js/engines/shade/neutral-calibration.js";
import { assessCalibratedPhoto, publicCalibrated } from "../dist/js/engines/shade/calibrated-photo.js";
import { COOL, POINTS, WARM, ZONES, card, scene } from "./helpers/r33f-scenes.mjs";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

test("a confirmed, evenly lit card gives the same neutral gains as Python", () => {
  for (const [cast, gains] of [[WARM, [0.889251, 1.015163, 1.28038]], [COOL, [1.150902, 0.984681, 0.811559]]]) {
    const found = inspectNeutralCard(scene({ cast }), card(), { confirmed: true });
    assert.equal(found.usable, true);
    assert.deepEqual([found.cardPixels, found.usablePixels], [256, 256]);
    near(found.upperLowerDistance, 0, 1e-9, "distance");
    found.white.gains.forEach((g, c) => near(g, gains[c], 1e-6, `gain ${c}`));
    assert.equal(neutralPhotoOptions(found).neutralMask.reduce((a, b) => a + b, 0), 256);
  }
});

test("unconfirmed, mixed, clipped, transparent and small cards are refused", () => {
  assert.equal(inspectNeutralCard(scene({ cast: WARM }), card(), { confirmed: false }).reason, "not_confirmed");
  assert.deepEqual(neutralPhotoOptions(inspectNeutralCard(scene(), card(), { confirmed: false })), {});
  const mixed = inspectNeutralCard(scene({ lowerRgb: 170 }), card(), { confirmed: true });
  assert.equal(mixed.reason, "mixed_lighting");
  near(mixed.upperLowerDistance, 13.7873, 1e-3, "mixed");
  const clipped = inspectNeutralCard(scene({ cardRgb: 255 }), card(), { confirmed: true });
  assert.deepEqual([clipped.reason, clipped.usablePixels], ["card_clipped", 0]);
  const rgb = scene();
  const rgba = { width: rgb.width, height: rgb.height, channels: 4, data: new Uint8Array(rgb.width * rgb.height * 4) };
  for (let i = 0; i < rgb.width * rgb.height; i++) {
    rgba.data.set(rgb.data.subarray(i * 3, i * 3 + 3), i * 4);
    rgba.data[i * 4 + 3] = card()[i] ? 0 : 255;
  }
  assert.equal(inspectNeutralCard(rgba, card(), { confirmed: true }).reason, "card_clipped");
  assert.equal(inspectNeutralCard(scene(), card(4), { confirmed: true }).reason, "card_too_small");
  assert.throws(() => inspectNeutralCard(scene(), new Uint8Array(4), { confirmed: true }), RangeError);
  assert.throws(() => inspectNeutralCard(scene(), card(), { confirmed: 1 }), RangeError);
});

test("the public neutral summary has no mask and is not clinical", () => {
  const out = publicNeutral(inspectNeutralCard(scene({ cast: WARM }), card(), { confirmed: true }));
  assert.equal("mask" in out, false);
  assert.equal(out.clinical, false);
  assert.equal(out.white.mode, "neutral");
});

test("a checked card reads the reference under coloured light", () => {
  for (const cast of [WARM, COOL]) {
    const found = assessCalibratedPhoto(scene({ cast }), POINTS, card(), { confirmed: true });
    assert.equal(found.usable, true);
    assert.equal(found.referenceId, "LG-07N");
    assert.equal(found.assessment.reading.white.mode, "neutral");
    assert.equal(found.assessment.background, "explicit_neutral");
  }
});

test("glare is recovered through the consensus path with the card", () => {
  const image = scene({ cast: WARM });
  ZONES.forehead.forEach((on, i) => {
    if (on) for (let c = 0; c < 3; c++) image.data[i * 3 + c] = Math.min(250, image.data[i * 3 + c] + 60);
  });
  const found = assessCalibratedPhoto(image, POINTS, card(), { confirmed: true });
  assert.equal(found.assessment.source, "cheek_consensus");
  assert.equal(found.referenceId, "LG-07N");
});

test("rejected cards and missing or invalid meshes never yield a shade", () => {
  for (const [options, reason] of [[{ confirmed: false }, "not_confirmed"], [{ lowerRgb: 170 }, "mixed_lighting"],
    [{ cardRgb: 255 }, "card_clipped"]]) {
    const { confirmed = true, ...draw } = options;
    const found = assessCalibratedPhoto(scene({ cast: WARM, ...draw }), POINTS, card(), { confirmed });
    assert.deepEqual([found.usable, found.reason, found.referenceId], [false, "card_rejected", null]);
    assert.equal(found.neutral.reason, reason);
    assert.equal(found.assessment, null);
  }
  assert.equal(assessCalibratedPhoto(scene(), null, card(), { confirmed: true }).reason, "no_mesh");
  assert.equal(assessCalibratedPhoto(scene(), POINTS.slice(0, 10), card(), { confirmed: true }).reason, "invalid_mesh");
  const out = publicCalibrated(assessCalibratedPhoto(scene({ cast: WARM }), POINTS, card(), { confirmed: true }));
  assert.equal(out.provider_calls, 0);
  assert.equal(out.format, "beljour-calibrated-photo/1");
});
