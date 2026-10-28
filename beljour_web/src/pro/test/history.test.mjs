import assert from "node:assert/strict";
import test from "node:test";
import { defaultRecipe, RecipeHistory, threePointCurve } from "../../../dist/js/pro/index.js";

function version(value) {
  const recipe = defaultRecipe();
  return { ...recipe, curves: { ...recipe.curves, master: threePointCurve(value) } };
}

test("history: initial state has no undo or redo", () => {
  const history = new RecipeHistory();
  assert.equal(history.state.length, 1);
  assert.equal(history.state.position, 0);
  assert.equal(history.state.canUndo, false);
  assert.equal(history.state.canRedo, false);
  assert.deepEqual(history.current, defaultRecipe());
});

test("history: commit, undo, redo and branch edit are deterministic", () => {
  const history = new RecipeHistory();
  assert.equal(history.commit(version(0.7)), true);
  assert.equal(history.commit(version(0.7)), false);
  assert.equal(history.commit(version(0.8)), true);
  assert.equal(history.state.length, 3);
  assert.equal(history.undo().curves.master[1].y, 0.7);
  assert.deepEqual(history.undo(), defaultRecipe());
  assert.deepEqual(history.undo(), defaultRecipe());
  assert.equal(history.redo().curves.master[1].y, 0.7);
  history.commit(version(0.6));
  assert.equal(history.state.canRedo, false);
  assert.equal(history.state.length, 3);
  assert.equal(history.redo().curves.master[1].y, 0.6);
});

test("history: bounded retention never keeps more than max recipes", () => {
  const history = new RecipeHistory(defaultRecipe(), 4);
  for (let index = 1; index <= 20; index++) history.commit(version(index / 25));
  assert.equal(history.state.length, 4);
  assert.equal(history.state.position, 3);
  for (let index = 0; index < 10; index++) history.undo();
  assert.equal(history.state.position, 0);
  assert.equal(history.current.curves.master[1].y, 17 / 25);
});

test("history: snapshots cannot be mutated by callers", () => {
  const history = new RecipeHistory();
  const outside = history.current;
  outside.curves.master[0].y = 0.8;
  assert.deepEqual(history.current, defaultRecipe());
  const edited = version(0.7);
  history.commit(edited);
  edited.curves.master[1].y = 0.2;
  assert.equal(history.current.curves.master[1].y, 0.7);
});

test("history: reset clears state; invalid limits rejected", () => {
  const history = new RecipeHistory();
  history.commit(version(0.8));
  history.reset(version(0.6));
  assert.equal(history.state.length, 1);
  assert.equal(history.state.canUndo, false);
  assert.equal(history.current.curves.master[1].y, 0.6);
  assert.throws(() => new RecipeHistory(defaultRecipe(), 1));
  assert.throws(() => new RecipeHistory(defaultRecipe(), 1000));
});
