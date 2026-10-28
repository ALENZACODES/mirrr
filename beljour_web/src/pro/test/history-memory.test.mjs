import assert from "node:assert/strict";
import test from "node:test";
import { defaultRecipe, RecipeHistory, threePointCurve } from "../../../dist/js/pro/index.js";

function edit(value) {
  const source = defaultRecipe();
  return { ...source, curves: { ...source.curves, master: threePointCurve(value) } };
}

function heavy(id) {
  return { ...edit(0.5 + id / 200), masks: Array.from({ length: 12 }, (_, i) => ({
    kind: "brush", mode: "add", opacity: 1, radius: 0.03, hardness: 0.5,
    points: Array.from({ length: 8 }, (_, j) => ({ x: (i + j) / 30, y: j / 10 })),
  })) };
}

test("bounded history byte cap evicts oldest snapshots regardless of count", () => {
  const history = new RecipeHistory(defaultRecipe(), 100, 32 * 1024);
  for (let step = 1; step <= 25; step++) {
    history.commit(heavy(step));
    assert.ok(history.state.estimatedBytes <= history.state.byteCap);
    assert.ok(history.state.length <= 100);
  }
  assert.ok(history.state.length < 25);
  assert.ok(history.state.canUndo);
  assert.ok(history.current.masks.length > 0);
  let undos = 0;
  while (history.state.canUndo) {
    history.undo();
    undos++;
  }
  assert.equal(undos, history.state.length - 1);
  assert.ok(history.state.estimatedBytes <= 32 * 1024);
});

test("byte budget includes serialization and does not retain raster image data", () => {
  const history = new RecipeHistory(defaultRecipe(), 20, 8192);
  const a = edit(0.57);
  history.commit(a);
  assert.ok(history.state.estimatedBytes > 0);
  assert.ok(history.state.estimatedBytes <= 8192);
  const current = history.current;
  current.masks.push({ kind: "radial", mode: "add", opacity: 1,
    center: { x: 0.5, y: 0.5 }, radiusX: 0.3, radiusY: 0.3, feather: 0.5 });
  assert.equal(history.current.masks.length, 0);
});

test("invalid byte caps and oversized single commits preserve last valid revision", () => {
  assert.throws(() => new RecipeHistory(defaultRecipe(), 20, 1024), /byte cap/);
  const history = new RecipeHistory(defaultRecipe(), 20, 8192);
  history.commit(edit(0.6));
  const before = history.current;
  assert.throws(() => history.commit(heavy(1)), /memory cap/);
  assert.deepEqual(history.current, before);
  assert.ok(history.state.estimatedBytes <= history.state.byteCap);
});

test("undo branch truncates redo byte accounting and reset releases old entries", () => {
  const history = new RecipeHistory(defaultRecipe(), 20, 64 * 1024);
  history.commit(edit(0.6));
  history.commit(edit(0.7));
  history.undo();
  const previous = history.state.estimatedBytes;
  history.commit(edit(0.8));
  assert.equal(history.state.canRedo, false);
  assert.ok(history.state.estimatedBytes <= previous * 1.1);
  history.reset();
  assert.equal(history.state.length, 1);
  assert.equal(history.state.position, 0);
  assert.equal(history.state.canUndo, false);
});
