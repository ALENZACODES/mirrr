// R28F conservative hair-colour consultation in the browser, on a drawn hair patch.
// Mirrors api/tests/test_r28f_consultation.py with the same literal values. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { decode, encode, toByte } from "../dist/js/engines/shade/colourspace.js";
import { HairColourConsultation } from "../dist/js/engines/hair_palette/consultation.js";
import { HEAD } from "./helpers/r31f-fibre-scene.mjs";

if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
const WIDTH = 40, HEIGHT = 30, WARM = [1.15, 1, 0.8];

function photo(cast = WARM) {
  const data = new Uint8Array(WIDTH * HEIGHT * 3), hair = new Uint8Array(WIDTH * HEIGHT), card = new Uint8Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const i = y * WIDTH + x, isCard = x < 12, shift = ((x * 7 + y * 3) % 9) - 4;
    card[i] = isCard ? 1 : 0;
    hair[i] = isCard ? 0 : 1;
    const rgb = isCard ? [150, 150, 150] : [92 + shift, 66 + shift, 48 + shift];
    for (let c = 0; c < 3; c++) data[i * 3 + c] = toByte(encode(decode(rgb[c]) * cast[c]));
  }
  return { image: { width: WIDTH, height: HEIGHT, channels: 3, data }, hair, card };
}

test("a corrected reading gives no lighter suggestions", async () => {
  const { image, hair, card } = photo();
  const found = await new HairColourConsultation().suggest(image, hair, HEAD, { neutralMask: card });
  assert.equal(found.usable, true);
  assert.equal(found.reading.white_mode, "neutral");
  assert.equal(found.reading.pixels, 840);
  [30.5738, 8.6751, 15.3616].forEach((v, c) => assert.ok(Math.abs(found.reading.lab[c] - v) < 1e-3, `lab ${c}`));
  assert.equal(found.measured_level, 5);
  assert.deepEqual(found.suggestions.map((s) => s.shade.id), ["natural-05-w", "natural-05-n", "natural-05-c"]);
});

test("lighter swatches need an explicit choice", async () => {
  const { image, hair, card } = photo();
  const found = await new HairColourConsultation().suggest(image, hair, HEAD,
    { neutralMask: card, allowLightening: true, count: 5 });
  assert.deepEqual(found.suggestions.map((s) => [s.shade.id, s.shade.level]),
    [["natural-05-w", 5], ["natural-05-n", 5], ["natural-06-n", 6], ["natural-06-c", 6], ["natural-06-w", 6]]);
});

test("unreliable light, a missing mesh and bad masks never suggest", async () => {
  const { image, hair, card } = photo();
  const session = new HairColourConsultation();
  assert.equal((await session.suggest(image, hair, HEAD)).code, "unreliable_lighting");
  assert.equal((await session.suggest(image, hair, null, { neutralMask: card })).code, "no_mesh");
  assert.equal((await session.suggest(image, new Uint8Array(25), HEAD)).code, "invalid_mask");
  assert.equal((await session.suggest(image, hair, HEAD, { primaryBox: [0, 0, 12, 30] })).code, "too_few_pixels");
  assert.equal((await session.suggest(image, hair, HEAD, { primaryBox: [5, 5, 99, 9] })).code, "invalid_mask");
});

test("the cache holds derived readings and changes with photo or brush", async () => {
  const { image, hair, card } = photo();
  const session = new HairColourConsultation(2);
  const first = await session.suggest(image, hair, HEAD, { neutralMask: card });
  const again = await session.suggest(image, hair, HEAD, { neutralMask: card, allowLightening: true });
  assert.deepEqual([first.cached, again.cached, session.readingComputes], [false, true, 1]);
  const brushed = new Uint8Array(hair);
  brushed[20] = 0;
  assert.equal((await session.suggest(image, brushed, HEAD, { neutralMask: card })).cached, false);
  assert.equal((await session.suggest(photo([1, 1, 1]).image, hair, HEAD, { neutralMask: card })).cached, false);
  assert.deepEqual([session.size, session.readingComputes], [2, 3]);
  session.invalidate();
  assert.equal(session.size, 0);
  assert.throws(() => new HairColourConsultation(0), RangeError);
});
