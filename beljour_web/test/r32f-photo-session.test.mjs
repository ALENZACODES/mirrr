// R32F checked photo entry in the browser on a drawn symmetric face: no real photos or models.
// The literal values are shared with api/tests/test_r32f_skin_photo.py, so the two
// languages agree on zone sizes, the background estimate, the recovered reference and
// the measured distances. The untouched face also reads as the existing shade session does.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { labToSrgb, toByte } from "../dist/js/engines/shade/colourspace.js";
import { zoneMasks } from "../dist/js/engines/shade/finder.js";
import { ShadeSession } from "../dist/js/engines/shade/session.js";
import { symmetricFace } from "../dist/js/engines/local/face-synthetic.js";
import {
  assessSkinPhoto, backgroundFromFace, publicSkinAssessment,
} from "../dist/js/engines/shade/skin-accuracy.js";

const WIDTH = 160, HEIGHT = 192;
const POINTS = symmetricFace(WIDTH, HEIGHT, 88, 126);
const ZONES = zoneMasks(POINTS, WIDTH, HEIGHT);
const SKIN = [63, 13.29, 17.64]; // LG-07N
const GLARE = [75, 13.29 * 0.7, 17.64 * 0.7];
const sum = (mask) => mask.reduce((a, b) => a + b, 0);

function drawn({ forehead = SKIN, left = SKIN } = {}) {
  const data = new Uint8Array(WIDTH * HEIGHT * 3).fill(128);
  for (const [name, lab] of [["cheek_right", SKIN], ["cheek_left", left], ["forehead", forehead]]) {
    const colour = labToSrgb(lab).map(toByte);
    ZONES[name].forEach((on, i) => { if (on) data.set(colour, i * 3); });
  }
  return { width: WIDTH, height: HEIGHT, channels: 3, data };
}

test("drawn zone sizes match the Python fixture", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(ZONES).map(([k, v]) => [k, sum(v)])),
    { cheek_right: 189, cheek_left: 189, forehead: 278 });
});

test("the default background is the shared grey-world estimate", () => {
  const estimate = backgroundFromFace(drawn(), POINTS);
  assert.deepEqual([estimate.reason, estimate.candidatePixels, estimate.usablePixels],
    ["grey_world_estimate", 7224, 7224]);
  assert.equal(sum(estimate.mask), 7224);
});

test("an untouched face reads as the existing shade session does", async () => {
  if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  const image = drawn();
  const found = assessSkinPhoto(image, POINTS);
  assert.equal(found.source, "baseline");
  assert.equal(found.referenceId, "LG-07N");
  assert.equal(found.background, "grey_world_estimate");
  const session = await new ShadeSession().prepare(image, POINTS,
    { backgroundMask: backgroundFromFace(image, POINTS).mask });
  assert.deepEqual(found.reading, session.reading);
});

test("the shade session reads through the consensus path", async () => {
  if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  const session = new ShadeSession();
  const glareImage = drawn({ forehead: GLARE });
  const glare = await session.prepare(glareImage, POINTS);
  assert.equal(glare.source, "cheek_consensus");
  assert.equal(glare.reading.refused, false);
  assert.equal(glare.reading.best.id, "LG-07N");
  assert.equal(glare.consensus.forehead_excluded, true);
  const applied = await session.apply(glareImage, glare, 3, { lockLevel: 1 });
  assert.equal(applied.providerCalls, 0);
  const plain = await session.prepare(drawn(), POINTS);
  assert.equal(plain.source, "baseline");
  assert.equal(plain.consensus, null);
  const otherImage = drawn({ left: [43, 13.29, 17.64] });
  const refused = await session.prepare(otherImage, POINTS);
  assert.equal(refused.source, "refused");
  await assert.rejects(session.apply(otherImage, refused, 3), RangeError);
});

test("a glared forehead with agreeing cheeks is recovered", () => {
  const found = assessSkinPhoto(drawn({ forehead: GLARE }), POINTS);
  assert.equal(found.baseline.refused, true);
  assert.equal(found.source, "cheek_consensus");
  assert.equal(found.referenceId, "LG-07N");
  assert.equal(found.consensus.foreheadExcluded, true);
  for (const d of found.consensus.foreheadDistances) assert.ok(Math.abs(d - 10.132) < 1e-3, String(d));
  assert.deepEqual(found.consensus.zoneSizes, { cheek_right: 148, cheek_left: 148, forehead: 218 });
});

test("disagreeing cheeks refuse on the photo", () => {
  const found = assessSkinPhoto(drawn({ left: [43, 13.29, 17.64] }), POINTS);
  assert.equal(found.source, "refused");
  assert.equal(found.referenceId, null);
  assert.equal(found.consensus.reason, "cheeks_disagree");
  assert.ok(Math.abs(found.consensus.cheekDistance - 19.3483) < 1e-3);
});

test("the public summary carries no pixels, masks or landmarks and the inputs are unchanged", () => {
  const image = drawn({ forehead: GLARE });
  const before = image.data.slice();
  const points = POINTS.map((p) => [...p]);
  const text = JSON.stringify(publicSkinAssessment(assessSkinPhoto(image, points)));
  assert.ok(!text.includes("points") && !text.includes("mask"));
  assert.ok(text.length < 4000);
  assert.deepEqual(image.data, before);
  assert.deepEqual(points, POINTS.map((p) => [...p]));
});

test("invalid meshes and photos are refused, not guessed", () => {
  assert.throws(() => assessSkinPhoto(drawn(), POINTS.slice(0, 10)), RangeError);
  assert.throws(() => assessSkinPhoto(drawn(), POINTS.map(() => [Number.NaN, Number.NaN])), RangeError);
  assert.throws(() => backgroundFromFace(drawn(), POINTS.map(([x, y]) => [x + 1000, y + 1000])), RangeError);
  assert.throws(() => assessSkinPhoto({ ...drawn(), channels: 2 }, POINTS), RangeError);
});
