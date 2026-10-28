/** Encrypted local editing recipes on drawn source IDs. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { newSessionKey } from "../../../dist/js/engines/upscale/protected-artifact.js";
import { protectRecipe, restoreProtectedRecipe } from
  "../../../dist/js/pro/protected-recipe.js";
import { defaultRecipe } from "../../../dist/js/pro/types.js";

const source = "4".repeat(64);
const id = "OperatorKey98";
const salt = crypto.getRandomValues(new Uint8Array(24));

test("private edit controls never become readable stored JSON", async () => {
  const key = await newSessionKey();
  const recipe = { ...defaultRecipe(), crop: {
    ...defaultRecipe().crop, x: 0.21, width: 0.78,
  } };
  const bundle = await protectRecipe(recipe, source, salt, id, key);
  assert.equal(JSON.stringify(bundle).includes('"x":0.21'), false);
  assert.notEqual(bundle.binding, source);
  const restored = await restoreProtectedRecipe(bundle, source, salt, id, key);
  assert.deepEqual(restored, recipe);
});

test("recipe is bound to original source and key", async () => {
  const key = await newSessionKey();
  const data = await protectRecipe(defaultRecipe(), source, salt, id, key);
  await assert.rejects(restoreProtectedRecipe(data, "5".repeat(64), salt, id, key), /context/);
  await assert.rejects(restoreProtectedRecipe(data, source, salt, id, await newSessionKey()), /authentication/);
});

test("recipe integrity rejects encrypted mutation", async () => {
  const key = await newSessionKey();
  const data = await protectRecipe(defaultRecipe(), source, salt, id, key);
  const corrupted = { ...data, ciphertext: data.ciphertext.slice() };
  corrupted.ciphertext[corrupted.ciphertext.length - 2] ^= 7;
  await assert.rejects(restoreProtectedRecipe(corrupted, source, salt, id, key), /authentication/);
});
