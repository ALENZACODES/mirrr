/** Brow consultation recipes and original-first preview isolation.
 * All inputs are synthetic arrays. Author: John Khan.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { BrowTrialSession } from "../dist/js/engines/brows/brow-trial.js";
import {
  compareBrowStyles,
  parseBrowRecipe,
  safeBrowRecipe,
} from "../dist/js/engines/brows/brow-board.js";

function scene() {
  const width = 48;
  const height = 32;
  const data = new Uint8ClampedArray(width * height * 4);
  const right_brow = new Float64Array(width * height);
  const left_brow = new Float64Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const offset = p * 4;
      for (let c = 0; c < 3; c++) data[offset + c] = 178 + (x % 9) * 2;
      data[offset + 3] = 255;
      if (y >= 10 && y < 15 && x >= 7 && x < 17) right_brow[p] = 1;
      if (y >= 10 && y < 15 && x >= 31 && x < 41) left_brow[p] = 1;
    }
  }
  return { photo: { width, height, channels: 4, data },
    masks: { right_brow, left_brow },
    states: { right_brow: "visible", left_brow: "visible" },
    source: "manual_or_measured" };
}

const CHOICES = [
  { mode: "tint", shade: "deep", level: 5 },
  { mode: "powder", shade: "ash", level: 3.5 },
  { mode: "lamination", shade: "neutral", level: 2 },
  { mode: "tint", shade: "warm", level: 4 },
];

function isUnchanged(a, b) {
  return Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
}

test("four panels use the original photo, never a previous panel", () => {
  const input = scene();
  let called = 0;
  const session = new BrowTrialSession({ observe: () => { called++; return input; } });
  const before = new Uint8ClampedArray(input.photo.data);
  const board = compareBrowStyles(session, input.photo, [0, 0, 1, 1], CHOICES);
  assert.equal(board.status, "ready");
  assert.equal(board.panels.length, 4);
  assert.equal(called, 1);
  assert.ok(isUnchanged(before, input.photo.data));
  assert.ok(isUnchanged(before, board.original));
  for (const panel of board.panels) {
    const standalone = new BrowTrialSession({ observe: () => input }).render(
      input.photo, [0, 0, 1, 1], panel.choice,
    );
    assert.ok(isUnchanged(standalone.image, panel.result.image));
  }
});

test("board refusals are atomic and not exported as panels", () => {
  const input = scene();
  const session = new BrowTrialSession({ observe: () => input });
  const board = compareBrowStyles(session, input.photo, null, CHOICES);
  assert.equal(board.status, "refused");
  assert.equal(board.panels.length, 0);
  assert.throws(() => safeBrowRecipe(board), /cannot be exported/);
});

test("recipe round trip keeps choices, not photo pixels or masks", () => {
  const input = scene();
  const board = compareBrowStyles(new BrowTrialSession({ observe: () => input }),
    input.photo, [0, 0, 1, 1], CHOICES);
  const recipe = safeBrowRecipe(board);
  assert.deepEqual(parseBrowRecipe(recipe), CHOICES);
  assert.deepEqual(Object.keys(recipe).sort(), ["format", "options", "simulation"]);
  assert.ok(!JSON.stringify(recipe).includes("Uint8ClampedArray"));
  assert.ok(!JSON.stringify(recipe).includes("right_brow"));
});

test("duplicate options and a fifth panel are rejected before rendering", () => {
  const input = scene();
  let called = 0;
  const source = { observe: () => { called++; return input; } };
  const session = new BrowTrialSession(source);
  assert.throws(() => compareBrowStyles(session, input.photo, [0, 0, 1, 1],
    [CHOICES[0], CHOICES[0]]), /repeat/);
  assert.throws(() => compareBrowStyles(session, input.photo, [0, 0, 1, 1],
    [...CHOICES, CHOICES[0]]), /one to four/);
  assert.equal(called, 0);
});

test("recipe input rejects fake products, stale schema and off-grid values", () => {
  const ordinary = { format: "beljour-brow-consultation/1", simulation: true,
    options: [{ mode: "tint", shade: "deep", level: 2 }] };
  assert.deepEqual(parseBrowRecipe(ordinary), ordinary.options);
  for (const bad of [
    { ...ordinary, photo: "x" },
    { ...ordinary, simulation: false },
    { ...ordinary, options: [{ mode: "tint", shade: "deep", level: 2.25 }] },
    { ...ordinary, options: [{ mode: "tint", shade: "deep", level: 2, mask: [] }] },
  ]) {
    assert.throws(() => parseBrowRecipe(bad));
  }
});
