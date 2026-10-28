/** Five actual strength stops on-device through the production engines; drawn blocks only.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { BOARD_LABEL, FIVE_LEVELS, compareLevels, frameEvidence, levelTotals, publicReport,
  refusedEvidence } from "../dist/js/commerce/level-board.js";
import { CHOICES, noPause, scene } from "./r29f-scene.mjs";

for (const kind of ["fibre", "palette", "short-sides"]) {
  test(`${kind}: five stops in order, level one unchanged, every stop guarded`, async () => {
    let calls = 0;
    const guard = {
      guard(before, after) { calls++; return { data: new Uint8Array(after), similarity: 1, blended: false }; },
    };
    const board = await compareLevels(scene(), CHOICES[kind], { guard, pause: noPause });
    assert.deepEqual(board.tiles.map((tile) => tile.level), [...FIVE_LEVELS]);
    assert.deepEqual(board.tiles.map((tile) => tile.evidence.status),
      ["unchanged", "rendered", "rendered", "rendered", "rendered"]);
    assert.equal(calls, 5);
    assert.ok(board.tiles.every((tile) => tile.evidence.guard_applied));
    assert.deepEqual(levelTotals(board.tiles.map((tile) => tile.evidence)),
      { rendered: 4, unchanged: 1, refused: 0, cases: 5 });
  });
}

test("evidence equals the changed pixels and alpha is untouched", async () => {
  const input = scene();
  const board = await compareLevels(input, CHOICES.palette, { pause: noPause });
  for (const tile of board.tiles) {
    let moved = 0;
    for (let i = 0; i < input.hair.length; i++) {
      const changed = [0, 1, 2].some((c) => tile.pixels[i * 4 + c] !== input.pixels[i * 4 + c]);
      if (changed) { moved++; assert.ok(input.hair[i] >= 128); }
      assert.equal(tile.pixels[i * 4 + 3], input.pixels[i * 4 + 3]);
    }
    assert.equal(moved, tile.evidence.changed_pixels);
  }
});

test("short-sides change grows with strength", async () => {
  const board = await compareLevels(scene(), CHOICES["short-sides"], { pause: noPause });
  const changed = board.tiles.map((tile) => tile.evidence.changed_pixels);
  assert.deepEqual(changed, [...changed].sort((a, b) => a - b));
  assert.ok(changed[4] > 0);
});

test("browser numbers equal the Python engines on the same drawn scene", async () => {
  const board = await compareLevels(scene(), CHOICES.palette, { pause: noPause });
  const fibre = await compareLevels(scene(), CHOICES.fibre, { pause: noPause });
  assert.deepEqual(board.tiles.map((t) => t.evidence.changed_pixels), [0, 2600, 2600, 2600, 2600]);
  assert.deepEqual(fibre.tiles.map((t) => t.evidence.identity_similarity), [1, 0.994, 0.9882, 0.985, 0.985]);
});

test("the input photo is copied, never modified", async () => {
  const input = scene();
  const kept = new Uint8Array(input.pixels);
  const board = await compareLevels(input, CHOICES.fibre, { pause: noPause });
  assert.deepEqual(input.pixels, kept);
  board.original[0] = 0;
  assert.equal(input.pixels[0], kept[0]);
});

test("public report is photo-free and labelled", async () => {
  const report = publicReport(await compareLevels(scene(), CHOICES.fibre, { pause: noPause }));
  assert.equal(report.label, BOARD_LABEL);
  assert.equal(report.real_face_status, "not_tested");
  assert.equal(report.provider_calls, 0);
  const walk = (value) => {
    assert.ok(!(value instanceof Uint8Array));
    if (value && typeof value === "object") {
      for (const key of ["pixels", "original", "photoHash", "photo_hash", "hair", "scalp", "landmarks"]) {
        assert.ok(!(key in value), key);
      }
      Object.values(value).forEach(walk);
    }
  };
  walk(report);
});

test("frame evidence refuses alpha edits and edits outside the region", () => {
  const before = new Uint8Array(4 * 4 * 4).fill(100), region = new Uint8Array(16);
  region[5] = 1;
  const inside = new Uint8Array(before);
  inside[5 * 4] = 120;
  assert.equal(frameEvidence(before, inside, region, 4, 3, 0.99, false, true).changed_pixels, 1);
  const outside = new Uint8Array(before);
  outside[0] = 1;
  assert.throws(() => frameEvidence(before, outside, region, 4, 3, 0.99, false, true), /outside/);
  const alpha = new Uint8Array(before);
  alpha[3] = 0;
  assert.throws(() => frameEvidence(before, alpha, region, 4, 3, 0.99, false, true), /transparency/);
  assert.equal(refusedEvidence(2, "no_mesh").status, "refused");
});
