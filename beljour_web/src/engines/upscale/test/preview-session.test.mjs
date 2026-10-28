/** Preview and release tickets refuse stale, superseded and cancelled jobs.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { PREVIEW_MAX_EDGE, UpscalePreviewSession, previewSize } from
  "../../../../dist/js/engines/upscale/preview-session.js";

const PHOTO = "a".repeat(64), OTHER = "b".repeat(64);

function session(width = 2000, height = 1500) {
  const value = new UpscalePreviewSession();
  value.open(PHOTO, width, height);
  return value;
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test("previews are bounded and releases are full size", () => {
  const current = session();
  const preview = current.preview({ detailLevel: 2 });
  const release = current.release({ detailLevel: 2 });
  assert.deepEqual([preview.width, preview.height, preview.fullResolution], [512, 384, false]);
  assert.deepEqual([release.width, release.height, release.fullResolution], [2000, 1500, true]);
  assert.deepEqual(previewSize(300, 200), { width: 300, height: 200 });
  assert.equal(Math.max(...Object.values(previewSize(4000, 30))), PREVIEW_MAX_EDGE);
});

test("an earlier slow job cannot overwrite a newer one", async () => {
  const current = session();
  const first = current.preview({ detailLevel: 2 });
  const slow = deferred();
  let firstSignal;
  const pending = current.run(first, signal => { firstSignal = signal; return slow.promise; });
  const second = current.preview({ detailLevel: 2.1 });
  assert.equal(firstSignal.aborted, true);
  assert.equal(await current.run(second, async () => "second"), "second");
  slow.resolve("first");
  assert.equal(await pending, null);
  assert.equal(current.accepts(first), false);
});

test("cancelled and replaced-photo jobs deliver nothing", async () => {
  const current = session();
  const ticket = current.release();
  const gate = deferred();
  const pending = current.run(ticket, () => gate.promise);
  current.cancel(ticket);
  gate.resolve("late");
  assert.equal(await pending, null);
  const next = current.release();
  const revision = current.revision;
  current.open(OTHER, 640, 480);
  assert.equal(current.revision, revision + 1);
  assert.equal(current.accepts(next), false);
  assert.equal(await current.run(next, async () => "stale"), null);
  current.close();
  assert.throws(() => current.preview(), /No photo/);
});

test("previews are never exportable; current releases are", () => {
  const current = session();
  const preview = current.preview();
  assert.equal(current.accepts(preview), true);
  assert.equal(current.exportable(preview), false);
  assert.equal(current.exportable(current.release()), true);
});

test("invalid photos and settings are refused", () => {
  assert.throws(() => new UpscalePreviewSession().open("A".repeat(64), 100, 100), /digest/);
  assert.throws(() => new UpscalePreviewSession().open(PHOTO, 4, 100), /dimensions/);
  const current = session();
  assert.throws(() => current.release({ scale: 3 }), /Scale/);
  assert.throws(() => current.release({ detailLevel: 0.5 }), /strength/);
  assert.throws(() => current.preview({ lockLevel: 3.05 }), /strength/);
});
