/** Board session currency, stale-result rejection and six-tile composition.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compareLevels } from "../dist/js/commerce/level-board.js";
import { BoardSession, CAPTION_BAND, LABEL_BAND, TILE_GAP, boardLayout, composeBoard,
  tileCaption } from "../dist/js/commerce/board-view.js";
import { CHOICES, noPause, scene } from "./r29f-scene.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const board = () => compareLevels(scene(), CHOICES.palette, { pause: noPause });

test("a finished run becomes current and exportable", async () => {
  const session = new BoardSession();
  const { ticket } = session.start();
  assert.equal(session.exportable, false);
  assert.equal(session.finish(ticket, await board()), true);
  assert.equal(session.exportable, true);
  assert.match(session.status, /4 rendered, 1 unchanged, 0 refused/);
});

for (const reason of ["slider", "photo", "settings", "brush", "head"]) {
  test(`a ${reason} revision clears the board and aborts the running render`, async () => {
    const session = new BoardSession();
    const first = session.start();
    session.finish(first.ticket, await board());
    const running = session.start();
    session.invalidate(reason);
    assert.equal(running.signal.aborted, true);
    assert.equal(session.exportable, false);
    assert.equal(session.exportRequest(), null);
    assert.equal(session.finish(running.ticket, await board()), false);
    assert.match(session.status, new RegExp(reason));
  });
}

test("an older run's late result or error cannot overwrite a newer status", async () => {
  const session = new BoardSession();
  const old = session.start();
  const fresh = session.start();
  assert.equal(old.signal.aborted, true);
  assert.equal(session.fail(old.ticket, new Error("stale failure")), false);
  assert.equal(session.finish(old.ticket, await board()), false);
  assert.doesNotMatch(session.status, /stale/);
  assert.equal(session.finish(fresh.ticket, await board()), true);
  assert.equal(session.fail(fresh.ticket, new Error("after finish")), true);
  assert.equal(session.exportable, false);
});

test("a cancelled run is silent", () => {
  const session = new BoardSession();
  const run = session.start();
  const before = session.status;
  const abort = new Error("cancelled");
  abort.name = "AbortError";
  assert.equal(session.fail(run.ticket, abort), false);
  assert.equal(session.status, before);
});

test("the composed board places the original and five tiles in a 3 by 2 grid", async () => {
  const result = await board();
  const raster = composeBoard(result);
  const layout = boardLayout(96, 96);
  assert.equal(raster.width, 3 * 96 + 4 * TILE_GAP);
  assert.equal(raster.height, LABEL_BAND + 2 * (96 + CAPTION_BAND + TILE_GAP));
  const sources = [result.original, ...result.tiles.map((tile) => tile.pixels)];
  sources.forEach((pixels, index) => {
    const rect = layout.tiles[index];
    for (const [x, y] of [[0, 0], [40, 40], [95, 95]]) {
      const from = (y * 96 + x) * 4, to = ((rect.y + y) * raster.width + rect.x + x) * 4;
      assert.deepEqual([...raster.data.slice(to, to + 4)], [...pixels.slice(from, from + 4)]);
    }
  });
  assert.equal(raster.data[0], 255);
});

test("tile captions name unchanged and refused stops", () => {
  assert.equal(tileCaption(null), "Original photo");
  assert.equal(tileCaption({ level: 1, status: "unchanged", changed_pixels: 0 }), "Strength 1.0 · unchanged");
  assert.equal(tileCaption({ level: 4, status: "refused", refusal_code: "no_mesh" }),
    "Strength 4.0 · refused: no_mesh");
  assert.equal(tileCaption({ level: 3, status: "rendered", changed_pixels: 12 }), "Strength 3.0 · 12 pixels changed");
  assert.throws(() => boardLayout(0, 10), RangeError);
});

test("the workbench offers a user-triggered review and revises the board on every change", () => {
  const code = readFileSync(resolve(root, "web/src/commerce/hair-workbench.ts"), "utf8");
  assert.match(code, /Review all five strengths/);
  assert.match(code, /this\.review\.addEventListener\("click"/);
  for (const reason of ["slider", "photo", "settings", "head", "brush"]) assert.match(code, new RegExp(`"${reason}"`));
  const view = readFileSync(resolve(root, "web/src/commerce/board-view.ts"), "utf8");
  assert.match(view, /BOARD_LABEL/);
  assert.doesNotMatch(view + code, /\bfetch\s*\(|XMLHttpRequest|WebSocket/);
});
