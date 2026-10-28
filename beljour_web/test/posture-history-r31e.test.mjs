/** Settings-only posture edit history: bounds, undo/redo, branches, replay.
 * Synthetic settings only. Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_POSTURE_HISTORY_BYTES, PostureEditHistory, checkedPostureEdit, checkedPostureSettings,
} from "../dist/js/body/posture-history.js";

const photo = "e".repeat(64);
const other = "f".repeat(64);
const lean = level => ({ fix: "lean", view: "front", level, lockLevel: 5 });

function opened(...args) {
  const history = new PostureEditHistory(...args);
  history.open(photo);
  return history;
}

test("commits, undo and redo move one cursor over settings only", () => {
  const history = opened();
  assert.deepEqual(history.snapshot, {
    open: true, entries: 0, cursor: 0, selected: null, canUndo: false, canRedo: false,
  });
  history.commit(photo, lean(2));
  history.commit(photo, { fix: "uneven_shoulders", view: "front", level: 3.7, lockLevel: 4 });
  assert.equal(history.snapshot.cursor, 2);
  history.move(photo, "undo");
  assert.deepEqual(history.snapshot.selected, lean(2));
  history.move(photo, "undo");
  assert.equal(history.snapshot.selected, null);
  assert.throws(() => history.move(photo, "undo"), /Nothing to undo/);
  history.move(photo, "redo");
  assert.deepEqual(history.snapshot.selected, lean(2));
  for (const entry of history.exportSettings(photo).entries) {
    assert.deepEqual(Object.keys(entry).sort(), ["fix", "level", "lockLevel", "view"]);
  }
});

test("a new edit after undo drops the redo branch", () => {
  const history = opened();
  history.commit(photo, lean(2));
  history.commit(photo, lean(3));
  history.move(photo, "undo");
  history.commit(photo, lean(4.5));
  assert.equal(history.snapshot.entries, 2);
  assert.equal(history.snapshot.canRedo, false);
  assert.deepEqual(history.exportSettings(photo).entries.map(entry => entry.level), [2, 4.5]);
});

test("re-committing the selected setting keeps the redo branch", () => {
  const history = opened();
  history.commit(photo, lean(2));
  history.commit(photo, lean(3));
  history.move(photo, "undo");
  history.commit(photo, lean(2));
  assert.equal(history.snapshot.canRedo, true);
  assert.equal(history.snapshot.entries, 2);
});

test("entry count and byte size are bounded by dropping the oldest", () => {
  const history = opened(3);
  for (const level of [1.1, 1.2, 1.3, 1.4, 1.5]) history.commit(photo, lean(level));
  assert.deepEqual(history.exportSettings(photo).entries.map(entry => entry.level), [1.3, 1.4, 1.5]);
  const small = opened(64, 256);
  for (let tick = 10; tick <= 50; tick++) small.commit(photo, lean(tick / 10));
  assert.ok(JSON.stringify(small.exportSettings(photo).entries).length <= 256);
  assert.equal(small.snapshot.selected.level, 5);
  assert.ok(MAX_POSTURE_HISTORY_BYTES >= 256);
  assert.throws(() => new PostureEditHistory(0), /bounds/);
});

test("history is bound to one photo and cleared by replacement or annotation changes", () => {
  const history = opened();
  history.commit(photo, lean(2));
  assert.throws(() => history.commit(other, lean(3)), /different photo/);
  history.open(photo);
  assert.equal(history.snapshot.entries, 1);
  history.invalidate(photo);
  assert.equal(history.snapshot.entries, 0);
  history.commit(photo, lean(2));
  history.open(other);
  assert.equal(history.snapshot.entries, 0);
  history.close();
  assert.equal(history.snapshot.open, false);
  assert.throws(() => history.commit(photo, lean(2)), /No photo/);
});

test("replay renders first and moves only when the render succeeds", async () => {
  const history = opened();
  history.commit(photo, lean(2));
  history.commit(photo, lean(3));
  const rendered = [];
  const value = await history.replay(photo, "undo", async edit => { rendered.push(edit); return "image"; });
  assert.equal(value, "image");
  assert.deepEqual(rendered, [lean(2)]);
  assert.equal(history.snapshot.cursor, 1);
  await assert.rejects(history.replay(photo, "redo", async () => { throw new Error("render failed"); }),
    /render failed/);
  assert.equal(history.snapshot.cursor, 1);
  assert.equal(await history.replay(photo, "undo", async edit => edit), null);
  assert.equal(history.snapshot.cursor, 0);
  assert.equal(await history.replay(photo, "undo", async () => "unused"), null);
});

test("a replay overtaken by a newer edit or photo is discarded", async () => {
  const history = opened();
  history.commit(photo, lean(2));
  history.commit(photo, lean(3));
  let release;
  const pending = history.replay(photo, "undo", () => new Promise(done => { release = done; }));
  history.commit(photo, lean(4));
  release("late");
  assert.equal(await pending, null);
  assert.equal(history.snapshot.selected.level, 4);
  const again = history.replay(photo, "undo", () => new Promise(done => { release = done; }));
  history.open(other);
  release("late");
  assert.equal(await again, null);
  assert.equal(history.snapshot.entries, 0);
});

test("settings restore validates everything before changing state", () => {
  const history = opened();
  history.commit(photo, lean(2));
  const bad = [
    { entries: [lean(2.05)], cursor: 1 }, { entries: [{ ...lean(2), view: "side" }], cursor: 1 },
    { entries: [{ ...lean(2), fix: "toString" }], cursor: 1 }, { entries: [lean(2)], cursor: 2 },
    { entries: [lean(2)], cursor: -1 }, { entries: [{ ...lean(2), pixels: [] }], cursor: 1 },
  ];
  for (const settings of bad) assert.throws(() => history.restoreSettings(photo, settings));
  assert.deepEqual(history.exportSettings(photo), { entries: [lean(2)], cursor: 1 });
  history.restoreSettings(photo, { entries: [lean(3), lean(4)], cursor: 1 });
  assert.deepEqual(history.snapshot.selected, lean(3));
  assert.throws(() => checkedPostureSettings({ entries: [], cursor: 0, extra: 1 }), /settings/);
  assert.throws(() => checkedPostureEdit({ ...lean(2), lockLevel: 6 }), /level/);
  assert.ok(Object.isFrozen(checkedPostureEdit(lean(2))));
});
