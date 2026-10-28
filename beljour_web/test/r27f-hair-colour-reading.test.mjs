/** Hair colour reading in the browser: neutral card, lighting and transparency refusals.
 * Drawn colour patches only. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readHairColour } from "../dist/js/engines/hair_palette/reading.js";
import { decode, encode, toByte } from "../dist/js/engines/shade/colourspace.js";
import { delta_e } from "../dist/js/engines/shade/distance.js";

/** The tests/r27f_fixtures.colour_patch layout. */
function patch(hair, { cast = [1, 1, 1], card = [150, 150, 150] } = {}) {
  const W = 60, H = 40, data = new Uint8Array(W * H * 4), hairMask = new Uint8Array(W * H), cardMask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, inCard = y >= 5 && y < 35 && x >= 2 && x < 20, inHair = y >= 5 && y < 35 && x >= 25 && x < 55;
    let rgb = [120, 120, 120];
    if (inCard) rgb = card;
    if (inHair) rgb = [hair[0], Math.min(255, hair[1] + (x - 25) % 3), hair[2]];
    data.set([...rgb.map((v, c) => toByte(encode(decode(v) * cast[c]))), 255], i * 4);
    if (inHair) hairMask[i] = 255;
    if (inCard) cardMask[i] = 255;
  }
  return { image: { width: W, height: H, channels: 4, data }, hairMask, cardMask };
}
const HAIR = [70, 50, 40];

test("a neutral card corrects a warm cast; suggestions never lighten", () => {
  const day = patch(HAIR), warm = patch(HAIR, { cast: [1.2, 1, 0.75] });
  const a = readHairColour(day.image, day.hairMask, { neutralMask: day.cardMask });
  const b = readHairColour(warm.image, warm.hairMask, { neutralMask: warm.cardMask });
  const raw = readHairColour(warm.image, warm.hairMask);
  assert.ok(b.corrected && !raw.corrected);
  assert.ok(delta_e(b.reading.lab, a.reading.lab) < 1 && delta_e(raw.reading.lab, a.reading.lab) > 1);
  assert.ok(b.suggestions.length >= 1 && b.suggestions.every((s) => s.shade.level <= b.level));
});

test("mixed lighting, inconsistent cards and transparency refuse with codes", () => {
  const mixed = patch(HAIR);
  for (let y = 5; y < 35; y++) for (let x = 42; x < 55; x++) mixed.image.data.set([150, 70, 40], (y * 60 + x) * 4);
  assert.equal(readHairColour(mixed.image, mixed.hairMask, { neutralMask: mixed.cardMask }).code, "mixed_lighting");
  const card = patch(HAIR);
  for (let y = 20; y < 35; y++) for (let x = 2; x < 20; x++) card.image.data.set([200, 150, 100], (y * 60 + x) * 4);
  assert.equal(readHairColour(card.image, card.hairMask, { neutralMask: card.cardMask }).code, "inconsistent_neutral");
  const clear = patch(HAIR);
  for (let y = 5; y < 35; y++) for (let x = 25; x < 40; x++) clear.image.data[(y * 60 + x) * 4 + 3] = 120;
  const partial = readHairColour(clear.image, clear.hairMask);
  assert.deepEqual([partial.refused, partial.excluded_transparent, partial.reading.pixels], [false, 450, 450]);
  for (let i = 3; i < clear.image.data.length; i += 4) clear.image.data[i] = 0;
  assert.equal(readHairColour(clear.image, clear.hairMask).code, "transparent_source");
  assert.equal(readHairColour(patch(HAIR).image, new Uint8Array(2400)).code, "no_hair");
});
