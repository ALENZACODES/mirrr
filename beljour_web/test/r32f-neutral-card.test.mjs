// R32F explicit neutral card in the browser, on a drawn face under coloured light.
// Mirrors api/tests/test_r32f_neutral_reference.py: a supplied neutral card wins over
// any background and over the grey-world estimate, restores the untinted reference
// under a unit-luminance cast, and a card too small to measure is not used.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decode, encode, labToSrgb, toByte } from "../dist/js/engines/shade/colourspace.js";
import { zoneMasks } from "../dist/js/engines/shade/finder.js";
import { symmetricFace } from "../dist/js/engines/local/face-synthetic.js";
import { CASTS } from "../dist/js/engines/shade/reference-study.js";
import { assessSkinPhoto } from "../dist/js/engines/shade/skin-accuracy.js";

const WIDTH = 160, HEIGHT = 192;
const POINTS = symmetricFace(WIDTH, HEIGHT, 88, 126);
const SKIN = [63, 13.29, 17.64]; // LG-07N
const inCard = (i, size = 16) => {
  const x = i % WIDTH, y = Math.floor(i / WIDTH);
  return x >= 4 && x < 4 + size && y >= 4 && y < 4 + size;
};
const card = (size = 16) => Uint8Array.from({ length: WIDTH * HEIGHT }, (_, i) => inCard(i, size) ? 1 : 0);

function lit(cast, background = [128, 128, 128]) {
  const data = new Uint8Array(WIDTH * HEIGHT * 3);
  for (let i = 0; i < WIDTH * HEIGHT; i++) data.set(inCard(i) ? [128, 128, 128] : background, i * 3);
  const skin = labToSrgb(SKIN).map(toByte);
  for (const mask of Object.values(zoneMasks(POINTS, WIDTH, HEIGHT))) {
    mask.forEach((on, i) => { if (on) data.set(skin, i * 3); });
  }
  for (let i = 0; i < data.length; i++) data[i] = toByte(encode(decode(data[i]) * cast[i % 3]));
  return { width: WIDTH, height: HEIGHT, channels: 3, data };
}

test("a neutral card restores the reference under warm and cool light", () => {
  for (const cast of Object.values(CASTS)) {
    const found = assessSkinPhoto(lit(cast), POINTS, { neutralMask: card() });
    assert.equal(found.background, "explicit_neutral");
    assert.equal(found.reading.white.mode, "neutral");
    found.reading.white.gains.forEach((g, c) => assert.ok(Math.abs(g * cast[c] - 1) < 0.02, String(g)));
    assert.equal(found.referenceId, "LG-07N");
  }
});

test("the neutral card wins over a tinted background mask", () => {
  const image = lit(CASTS.warm_light_checked_neutral, [170, 110, 90]);
  const background = Uint8Array.from({ length: WIDTH * HEIGHT }, (_, i) => inCard(i) ? 0 : 1);
  const withCard = assessSkinPhoto(image, POINTS, { neutralMask: card(), backgroundMask: background });
  const without = assessSkinPhoto(image, POINTS, { backgroundMask: background });
  assert.equal(withCard.reading.white.mode, "neutral");
  assert.equal(withCard.referenceId, "LG-07N");
  assert.equal(without.reading.white.mode, "grey_world");
  assert.notEqual(without.referenceId, "LG-07N");
});

test("a card too small to measure is not reported as a correction", () => {
  const found = assessSkinPhoto(lit(CASTS.cool_light_checked_neutral), POINTS, { neutralMask: card(3) });
  assert.equal(found.background, "explicit_neutral");
  assert.equal(found.reading.white.mode, "none");
});

test("without a card the default estimate is labelled", () => {
  const found = assessSkinPhoto(lit(CASTS.warm_light_checked_neutral), POINTS);
  assert.equal(found.background, "grey_world_estimate");
  assert.equal(found.reading.white.mode, "grey_world");
});
