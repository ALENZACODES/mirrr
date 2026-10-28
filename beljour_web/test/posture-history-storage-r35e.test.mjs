/** Versioned, source-bound posture settings recovery on synthetic settings.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { PostureEditHistory } from "../dist/js/body/posture-history.js";
import {
  POSTURE_HISTORY_FORMAT, POSTURE_HISTORY_KEY, browserPostureSettingsStore, clearPostureHistory,
  postureHistoryBinding, restorePostureHistory, savePostureHistory,
} from "../dist/js/body/posture-history-storage.js";

const photo = "c".repeat(64);
const other = "d".repeat(64);

function memory() {
  const values = new Map();
  return {
    values,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

function edited() {
  const history = new PostureEditHistory();
  history.open(photo);
  history.commit(photo, { fix: "lean", view: "front", level: 2.4, lockLevel: 5 });
  history.commit(photo, { fix: "uneven_shoulders", view: "front", level: 4.1, lockLevel: 3 });
  history.move(photo, "undo");
  return history;
}

test("settings and undo cursor round-trip for the same photo", async () => {
  const store = memory();
  const history = edited();
  await savePostureHistory(store, photo, history);
  const restored = new PostureEditHistory();
  restored.open(photo);
  assert.equal(await restorePostureHistory(store, photo, restored), true);
  assert.deepEqual(restored.exportSettings(photo), history.exportSettings(photo));
  assert.equal(restored.snapshot.canRedo, true);
  assert.deepEqual(restored.snapshot.selected, { fix: "lean", view: "front", level: 2.4, lockLevel: 5 });
});

test("the record holds only settings, a one-way binding and a digest", async () => {
  const store = memory();
  await savePostureHistory(store, photo, edited());
  const raw = store.getItem(POSTURE_HISTORY_KEY);
  const record = JSON.parse(raw);
  assert.deepEqual(Object.keys(record).sort(), ["binding", "check", "cursor", "entries", "format"]);
  assert.equal(record.format, POSTURE_HISTORY_FORMAT);
  assert.equal(raw.includes(photo), false);
  assert.equal(record.binding, await postureHistoryBinding(photo));
  for (const entry of record.entries) {
    assert.deepEqual(Object.keys(entry).sort(), ["fix", "level", "lockLevel", "view"]);
  }
});

test("another photo cannot restore the history and nothing changes", async () => {
  const store = memory();
  await savePostureHistory(store, photo, edited());
  const target = new PostureEditHistory();
  target.open(other);
  target.commit(other, { fix: "slouch", view: "side", level: 3, lockLevel: 5 });
  await assert.rejects(restorePostureHistory(store, other, target), /different photo/);
  assert.equal(target.snapshot.entries, 1);
});

test("corrupted, unversioned or tampered records are refused", async () => {
  const store = memory();
  await savePostureHistory(store, photo, edited());
  const original = JSON.parse(store.getItem(POSTURE_HISTORY_KEY));
  const target = new PostureEditHistory();
  target.open(photo);
  const cases = [
    [{ ...original, cursor: 2 }, /integrity/],
    [{ ...original, entries: [{ ...original.entries[0], level: 9 }] }, /level/],
    [{ ...original, entries: [{ ...original.entries[0], view: "side" }] }, /entry/],
    [{ ...original, format: "beljour-posture-history/0" }, /version/],
    [{ ...original, pixels: [1, 2, 3] }, /record/],
  ];
  for (const [value, pattern] of cases) {
    store.setItem(POSTURE_HISTORY_KEY, JSON.stringify(value));
    await assert.rejects(restorePostureHistory(store, photo, target), pattern);
  }
  store.setItem(POSTURE_HISTORY_KEY, "{not json");
  await assert.rejects(restorePostureHistory(store, photo, target), /record/);
  store.setItem(POSTURE_HISTORY_KEY, "x".repeat(20000));
  await assert.rejects(restorePostureHistory(store, photo, target), /oversized/);
  assert.equal(target.snapshot.entries, 0);
});

test("empty storage restores nothing and clearing removes the record", async () => {
  const store = memory();
  const history = new PostureEditHistory();
  history.open(photo);
  assert.equal(await restorePostureHistory(store, photo, history), false);
  await savePostureHistory(store, photo, edited());
  clearPostureHistory(store);
  assert.equal(store.values.size, 0);
});

test("storage keys are validated", async () => {
  const store = memory();
  await assert.rejects(savePostureHistory(store, photo, edited(), "Bad Key!"), /key/);
  assert.throws(() => clearPostureHistory(store, "x".repeat(65)), /key/);
});

test("browser store falls back to null without sessionStorage", () => {
  assert.equal(browserPostureSettingsStore(), globalThis.sessionStorage ?? null);
});
