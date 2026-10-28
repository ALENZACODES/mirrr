/** Board boundaries: no mesh, no scalp, bad masks, primary box, size cap, cancellation.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { BoardCancelled, BoardRefusal, MAX_BOARD_PIXELS, compareLevels } from "../dist/js/commerce/level-board.js";
import { CHOICES, noPause, scene } from "./r29f-scene.mjs";

const codes = (board) => board.tiles.map((tile) => tile.evidence.refusal_code);

test("no mesh refuses all five stops, which stay in the denominator", async () => {
  const board = await compareLevels({ ...scene(), landmarks: null }, CHOICES.fibre, { pause: noPause });
  assert.deepEqual(codes(board), Array(5).fill("no_mesh"));
  const input = scene();
  assert.ok(board.tiles.every((tile) => tile.pixels.every((v, i) => v === input.pixels[i])));
});

test("fibre without scalp marks is refused", async () => {
  const { scalp, ...rest } = scene();
  assert.equal(scalp.length > 0, true);
  const board = await compareLevels(rest, CHOICES.fibre, { pause: noPause });
  assert.deepEqual(codes(board), Array(5).fill("no_scalp"));
});

test("lighter colours need explicit permission", async () => {
  const held = await compareLevels(scene(), { kind: "palette", shadeId: "natural-09-n", allowLightening: false },
    { pause: noPause });
  assert.deepEqual(codes(held), Array(5).fill("lightening_not_automatic"));
});

test("primary box clips every stop to the chosen head", async () => {
  const input = { ...scene(), primaryBox: [22, 12, 48, 62] };
  const board = await compareLevels(input, CHOICES.palette, { pause: noPause });
  for (const tile of board.tiles) {
    for (let y = 0; y < 96; y++) for (let x = 48; x < 96; x++) {
      const i = (y * 96 + x) * 4;
      assert.deepEqual(tile.pixels.slice(i, i + 4), input.pixels.slice(i, i + 4));
    }
  }
  assert.equal(board.tiles[4].evidence.region_pixels, 26 * 50);
  const bad = await compareLevels({ ...scene(), primaryBox: [50, 10, 20, 40] }, CHOICES["short-sides"],
    { pause: noPause });
  assert.deepEqual(codes(bad), Array(5).fill("invalid_primary_face"));
});

test("a guard that edits background or alpha is contained by the engine boundary", async () => {
  const leaky = { guard(before, after) {
    const data = new Uint8Array(after);
    data[0] = 0;
    for (let i = 3; i < data.length; i += 4) data[i] = 9;
    return { data, similarity: 1, blended: false };
  } };
  const input = scene();
  const board = await compareLevels(input, CHOICES.palette, { guard: leaky, pause: noPause });
  for (const tile of board.tiles) {
    assert.equal(tile.pixels[0], input.pixels[0]);
    assert.equal(tile.pixels[3], input.pixels[3]);
  }
});

test("the board is capped at 1,048,576 pixels before any allocation", async () => {
  const width = 1025, height = 1024;
  const huge = { pixels: new Uint8Array(4), width, height, hair: new Uint8Array(1), landmarks: null };
  assert.ok(width * height > MAX_BOARD_PIXELS);
  await assert.rejects(compareLevels(huge, CHOICES.palette), (error) => error instanceof BoardRefusal &&
    error.code === "too_large");
  await assert.rejects(compareLevels({ ...scene(), pixels: new Uint8Array(10) }, CHOICES.palette),
    (error) => error instanceof BoardRefusal && error.code === "invalid_image");
});

test("cancellation stops between stops and reports an abort", async () => {
  const controller = new AbortController();
  let paused = 0;
  const pause = async () => { paused++; if (paused === 2) controller.abort(); };
  await assert.rejects(compareLevels(scene(), CHOICES["short-sides"], { signal: controller.signal, pause }),
    (error) => error instanceof BoardCancelled && error.name === "AbortError");
  assert.equal(paused, 2);
  const early = new AbortController();
  early.abort();
  await assert.rejects(compareLevels(scene(), CHOICES.palette, { signal: early.signal }), BoardCancelled);
});

test("invalid choices are refused", async () => {
  await assert.rejects(compareLevels(scene(), { kind: "lipstick" }), RangeError);
  await assert.rejects(compareLevels(scene(), { ...CHOICES.fibre, zone: "beard" }), RangeError);
  await assert.rejects(compareLevels(scene(), { ...CHOICES.palette, allowLightening: "yes" }), RangeError);
});

test("RGB photos are supported", async () => {
  const board = await compareLevels(scene({ channels: 3 }), CHOICES.palette, { pause: noPause });
  assert.equal(board.channels, 3);
  assert.equal(board.tiles.filter((tile) => tile.evidence.status === "rendered").length, 4);
});
