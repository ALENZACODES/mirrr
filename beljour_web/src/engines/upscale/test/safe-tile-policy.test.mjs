/** Shape-only memory admission for the guarded browser upscale. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import {
  AdmissionRefused, MAX_OUTPUT_PIXELS, OVERLAP, admit, admitForDevice, allocationTiles, tileScratchBytes,
} from "../../../../dist/js/engines/upscale/safe-tile-policy.js";

test("counts output, source, mask and one tile's scratch", () => {
  const plan = admit(400, 300, { scale: 2 });
  assert.equal(plan.sourceBytes, 400 * 300 * 4);
  assert.equal(plan.outputBytes, 800 * 600 * 4);
  assert.equal(plan.maskBytes, 800 * 600);
  assert.equal(plan.tileScratchBytes, tileScratchBytes(400, OVERLAP, 2, 4));
  assert.equal(plan.peakBytes, plan.sourceBytes + plan.outputBytes + plan.maskBytes + plan.tileScratchBytes);
  assert.equal(plan.tiles, 1);
  assert.ok(Object.isFrozen(plan));
});

test("scratch formula matches the Python mirror", () => {
  const read = 152, rendered = read * 2 * read * 2;
  assert.equal(tileScratchBytes(128, 12, 2, 3),
    read * read * 3 + 2 * rendered * 3 + 2 * rendered * 64 + 256 * 256 * 3);
  // Same value the Python test derives by hand for this geometry.
  assert.equal(tileScratchBytes(128, 12, 2, 3), 12_649_664);
});

test("tighter budgets pick smaller tiles deterministically", () => {
  const roomy = admit(2000, 1500, { budgetBytes: 2 * 1024 ** 3 });
  const tight = admit(2000, 1500, { budgetBytes: 96 * 1024 * 1024 });
  assert.ok(tight.tileSide < roomy.tileSide && tight.tiles > roomy.tiles);
  assert.deepEqual(tight, admit(2000, 1500, { budgetBytes: 96 * 1024 * 1024 }));
  assert.ok(tight.peakBytes <= tight.budgetBytes);
  let covered = 0;
  for (const tile of allocationTiles(tight)) covered += (tile.x1 - tile.x0) * (tile.y1 - tile.y0);
  assert.equal(covered, 2000 * 1500);
});

test("refuses before allocation when nothing fits or the output is too large", () => {
  assert.throws(() => admit(1500, 1500, { budgetBytes: 40 * 1024 * 1024 }), AdmissionRefused);
  assert.throws(() => admit(1000, 751, { scale: 4 }), /output exceeds/);
  assert.equal(admit(1000, 750, { scale: 4 }).outputBytes, MAX_OUTPUT_PIXELS * 4);
  assert.throws(() => admit(4000, 3500), /source exceeds/);
});

test("device allowances map to byte budgets", () => {
  const phone = admitForDevice(1200, 900, 48);
  const laptop = admitForDevice(1200, 900, 1024);
  assert.equal(phone.budgetBytes, 48 * 1024 * 1024);
  assert.ok(phone.tileSide < laptop.tileSide);
  for (const bad of [8, 0, Number.NaN, Infinity, "64"]) {
    assert.throws(() => admitForDevice(100, 100, bad), AdmissionRefused);
  }
});
