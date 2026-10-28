// R32F two-cheek consensus in the browser: drawn sRGB patches only, no photos or models.
// Mirrors api/tests/test_r32f_skin_consensus.py: the forehead is left out only when both
// cheeks have enough pixels, agree within the zone bound and the forehead disagrees with
// both; the existing W6 limits still apply; an accepted reading is never replaced.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { labToSrgb, toByte } from "../dist/js/engines/shade/colourspace.js";
import { NO_WHITE } from "../dist/js/engines/shade/finder.js";
import { assessSkinZones, publicConsensus, recoverConsensus } from "../dist/js/engines/shade/skin-accuracy.js";

const SKIN = [63, 13.29, 17.64]; // LG-07N
const GLARE = [75, 9.3, 12.35];
const BOUND = 3.0;
const rgb = (lab) => labToSrgb(lab).map(toByte);
const patch = (lab, count = 300) => Array.from({ length: count }, () => rgb(lab));
const zones = ({ forehead = SKIN, left = SKIN, cheeks = 300, top = 300 } = {}) =>
  ({ cheek_right: patch(SKIN, cheeks), cheek_left: patch(left, cheeks), forehead: patch(forehead, top) });

test("a forehead disagreeing with both cheeks is left out", () => {
  const found = recoverConsensus(zones({ forehead: GLARE }), NO_WHITE);
  assert.equal(found.usable, true);
  assert.equal(found.foreheadExcluded, true);
  assert.deepEqual(found.zonesUsed, ["cheek_right", "cheek_left"]);
  assert.equal(found.reading.best.id, "LG-07N");
  assert.ok(Math.abs(found.cheekDistance) < 1e-9);
  assert.ok(Math.min(...found.foreheadDistances) > BOUND);
});

test("an agreeing forehead, or one close to a single cheek, is kept", () => {
  assert.deepEqual(recoverConsensus(zones(), NO_WHITE).zonesUsed, ["cheek_right", "cheek_left", "forehead"]);
  const near = recoverConsensus(zones({ forehead: [64.5, 13.29, 17.64], left: [62, 13.29, 17.64] }), NO_WHITE);
  assert.ok(Math.min(...near.foreheadDistances) <= BOUND);
  assert.equal(near.foreheadExcluded, false);
  assert.ok(near.zonesUsed.includes("forehead"));
});

test("disagreeing cheeks refuse before any reading", () => {
  const found = recoverConsensus(zones({ left: [58, 13.29, 17.64] }), NO_WHITE);
  assert.equal(found.reason, "cheeks_disagree");
  assert.equal(found.reading, null);
  assert.ok(found.cheekDistance > BOUND);
});

test("too few cheek pixels refuse", () => {
  for (const count of [0, 1, 11]) {
    const found = recoverConsensus(zones({ cheeks: count }), NO_WHITE);
    assert.equal(found.reason, "insufficient_cheek_samples");
    assert.equal(found.zoneSizes.cheek_right, count);
    assert.equal(publicConsensus(found).reference_id, null);
  }
});

test("a small forehead is neither measured nor called excluded", () => {
  const found = recoverConsensus(zones({ forehead: [90, 0, 0], top: 5 }), NO_WHITE);
  assert.equal(found.usable, true);
  assert.equal(found.foreheadDistances, null);
  assert.equal(found.foreheadExcluded, false);
});

test("the recovered reading still obeys the never-lighter and distance limits", () => {
  const deep = [12, 6, 8];
  const found = recoverConsensus({ cheek_right: patch(deep), cheek_left: patch(deep), forehead: patch([40, 6, 8]) },
    NO_WHITE);
  assert.equal(found.foreheadExcluded, true);
  assert.equal(found.reason, "reading_refused");
  assert.equal(found.reading.refused, true);
  assert.equal(found.reading.best, null);
});

test("public summary keys and size match the Python summary", () => {
  const out = publicConsensus(recoverConsensus(zones({ forehead: GLARE }), NO_WHITE));
  assert.deepEqual(Object.keys(out).sort(), ["cheek_distance", "forehead_distances", "forehead_excluded",
    "note", "reason", "reference_id", "usable", "zone_sizes", "zones_used"]);
  assert.equal(out.reference_id, "LG-07N");
  assert.ok(JSON.stringify(out).length < 600);
});

function strip(rows, labs) {
  const width = 3 * rows;
  const data = new Uint8Array(rows * width * 3).fill(96);
  const masks = {};
  Object.entries(labs).forEach(([name, lab], index) => {
    const mask = new Uint8Array(rows * width);
    const colour = rgb(lab);
    for (let y = 0; y < rows; y++) for (let x = index * rows; x < (index + 1) * rows; x++) {
      mask[y * width + x] = 1;
      data.set(colour, (y * width + x) * 3);
    }
    masks[name] = mask;
  });
  return { image: { width, height: rows, channels: 3, data }, masks };
}

test("an accepted historical reading is never replaced", () => {
  const { image, masks } = strip(20, { cheek_right: SKIN, cheek_left: SKIN, forehead: SKIN });
  const found = assessSkinZones(image, masks);
  assert.equal(found.source, "baseline");
  assert.equal(found.consensus, null);
  assert.equal(found.reading, found.baseline);
});

test("consensus only runs after a historical refusal", () => {
  const { image, masks } = strip(20, { cheek_right: SKIN, cheek_left: SKIN, forehead: GLARE });
  const found = assessSkinZones(image, masks);
  assert.equal(found.baseline.refused, true);
  assert.equal(found.source, "cheek_consensus");
  assert.equal(found.referenceId, "LG-07N");
});
