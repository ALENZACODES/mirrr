/** Original-first hairstyle consultation board; no photo persistence. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkedChoices, comparison, safeRecipe } from "../dist/js/engines/hair_women/style-compare.js";
import { renderStyleGuide, StyleGuideSession } from "../dist/js/engines/hair_women/style-preview.js";

const head = { crown: [.5, .06], left_temple: [.25, .32], right_temple: [.75, .32], chin: [.5, .91] };
const chosen = [
  { style: "crescent_pixie", level: 2, texture: "straight" },
  { style: "asymmetric_lob", level: 3.5, texture: "wavy" },
  { style: "curly_shag", level: 5, texture: "coily" },
];
function scene() {
  const data = new Uint8ClampedArray(64 * 64 * 4);
  const mask = new Float32Array(64 * 64);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const index = y * 64 + x;
      data[index * 4] = (38 + x + 2 * y) % 256;
      data[index * 4 + 1] = (78 + x + y) % 256;
      data[index * 4 + 2] = (58 + 3 * x + y) % 256;
      data[index * 4 + 3] = 170;
      mask[index] = y > 3 && y < 57 && x > 5 && x < 59 ? 1 : 0;
    }
  }
  return [{ width: 64, height: 64, channels: 4, data }, mask];
}
const noopGuard = { guard(_before, after) {
  return { image: new Uint8ClampedArray(after), similarity: 1, blendedBack: false };
} };
const options = { primaryBox: [0, 0, 1, 1], identityGuard: noopGuard };

test("original comparison panel is first and variants preserve the source bytes", () => {
  const [photo, mask] = scene();
  const original = new Uint8ClampedArray(photo.data);
  const board = comparison(photo, mask, head, chosen, options);
  assert.equal(board.panels.length, 4);
  assert.equal(board.panels[0].original, true);
  assert.equal(board.panels[0].name, "Original");
  assert.deepEqual(board.panels[0].data, photo.data);
  assert.deepEqual(photo.data, original);
  assert.equal(board.refused, 0);
  assert.equal(board.guardCalls, 3);
  assert.equal(board.processed, 3);
  assert.ok(board.simulationLabel.includes("simulation"));
});

test("every comparison variant equals an independent direct render", () => {
  const [photo, mask] = scene();
  const board = comparison(photo, mask, head, chosen, options);
  for (let index = 0; index < chosen.length; index++) {
    const choice = chosen[index];
    const direct = renderStyleGuide(photo, mask, head, choice.style, choice.level, {
      ...options, texture: choice.texture,
    });
    assert.deepEqual(board.panels[index + 1].data, direct.data);
  }
});

test("missing mesh refuses variants but leaves original first and intact", () => {
  const [photo, mask] = scene();
  const board = comparison(photo, mask, null, chosen, { primaryBox: null });
  assert.equal(board.refused, 3);
  assert.equal(board.processed, 0);
  assert.equal(board.guardCalls, 0);
  for (const panel of board.panels) assert.deepEqual(panel.data, photo.data);
});

test("only safe option identifiers and levels are serialized for sharing", () => {
  const [photo, mask] = scene();
  const board = comparison(photo, mask, head, chosen, options);
  const recipe = safeRecipe(board, chosen);
  assert.deepEqual(Object.keys(recipe).sort(), ["choices", "format", "simulation"]);
  assert.equal(recipe.simulation, true);
  assert.equal(recipe.choices.length, 3);
  const stringified = JSON.stringify(recipe);
  for (const privateField of ["photo", "face", "hash", "base64", "person", "landmarks"]) {
    assert.equal(stringified.includes(privateField), false);
  }
  assert.ok(stringified.length < 512);
});

test("duplicate styles, invalid strengths and oversized comparisons fail closed", () => {
  assert.throws(() => checkedChoices([]));
  assert.throws(() => checkedChoices([chosen[0], chosen[0]]));
  assert.throws(() => checkedChoices([...chosen,
    { style: "long_ribbons", level: 5, texture: "wavy" },
    { style: "twist_taper", level: 5, texture: "coily" }]));
  assert.throws(() => checkedChoices([{ style: "curtain_fringe", level: 2.25, texture: "coily" }]));
  assert.throws(() => checkedChoices([{ style: "curtain_fringe", level: 3.5, texture: "unknown" }]));
});

test("caching retains local geometry but new masks re-scope every variant", () => {
  const [photo, mask] = scene();
  const session = new StyleGuideSession();
  const first = comparison(photo, mask, head, chosen, { ...options, session });
  const count = session.computations;
  const corrected = new Float32Array(mask);
  for (let y = 0; y < 64; y++) corrected.fill(0, y * 64, y * 64 + 35);
  const second = comparison(photo, corrected, head, chosen, { ...options, session });
  assert.equal(session.computations, count);
  assert.deepEqual(first.panels[0].data, second.panels[0].data);
  for (const panel of second.panels) {
    for (let y = 0; y < 64; y++) for (let x = 0; x < 35; x++) {
      const i = (y * 64 + x) * 4;
      assert.deepEqual(panel.data.slice(i, i + 4), photo.data.slice(i, i + 4));
    }
  }
});
