/** R17B browser provenance tests. Author: John Khan. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const mod = await import(pathToFileURL(path.resolve('dist/js/ui/r17b/provenance.js')).href);
const groups = Object.freeze({ W19: 'hair_women', W1: 'makeup_w', W94: 'workflow_w', UPSCALE2: 'upscale', GENDER: 'gender_look', SHAVE: 'shave' });
const defs = 'a'.repeat(64);
const photo = 'b'.repeat(64);
const baseRecipe = { feature: 'W19', family: 'hair_women', style: 'soft', amount: 0.5 };

function session() {
  const value = new mod.LocalSession('unit', groups, defs);
  value.bindPhoto(photo);
  value.setRecipe(baseRecipe);
  return value;
}

test('canonical recipe sorts metadata keys', () => {
  const a = mod.canonicalRecipe({ ...baseRecipe, metadata: { z: 1, a: 'x' } }, groups);
  const b = mod.canonicalRecipe({ ...baseRecipe, metadata: { a: 'x', z: 1 } }, groups);
  assert.equal(a, b);
  assert.equal(mod.recipeFingerprint({ ...baseRecipe, metadata: { z: 1, a: 'x' } }, groups), mod.recipeFingerprint({ ...baseRecipe, metadata: { a: 'x', z: 1 } }, groups));
});

test('recipe validation rejects family mismatch', () => {
  assert.throws(() => mod.validateRecipe({ ...baseRecipe, family: 'makeup_w' }, groups), /mismatch/);
});

test('recipe validation rejects unsafe metadata', () => {
  assert.throws(() => mod.validateRecipe({ ...baseRecipe, metadata: { _raw: 1 } }, groups), /reserved/);
});

test('photo fingerprint binds dimensions', () => {
  const data = Uint8Array.from({ length: 24 }, (_, i) => i);
  const first = mod.photoFingerprint(data, 2, 3, 4);
  const second = mod.photoFingerprint(data, 3, 2, 4);
  assert.equal(first.length, 64);
  assert.notEqual(first, second);
});

test('photo fingerprint rejects wrong byte count', () => {
  assert.throws(() => mod.photoFingerprint(new Uint8Array(15), 2, 2, 4), /byte length/);
});

test('binding same photo is revision stable', () => {
  const value = new mod.LocalSession('unit', groups, defs);
  value.bindPhoto(photo);
  const revision = value.revision;
  value.bindPhoto(photo);
  assert.equal(value.revision, revision);
});

test('new photo clears recipe', () => {
  const value = session();
  value.bindPhoto('c'.repeat(64));
  assert.equal(value.recipe, null);
});

test('photo-backed recipe requires photo', () => {
  const value = new mod.LocalSession('unit', groups, defs);
  assert.throws(() => value.setRecipe(baseRecipe), /bound photo/);
});

test('workflow recipe works without photo', () => {
  const value = new mod.LocalSession('unit', groups, defs);
  value.setRecipe({ feature: 'W94', family: 'workflow_w', style: '', amount: 0.5 });
  assert.equal(value.ticket().photo_sha256, '0'.repeat(64));
});

test('equal recipe is revision stable', () => {
  const value = session();
  const revision = value.revision;
  value.setRecipe(baseRecipe);
  assert.equal(value.revision, revision);
});

test('recipe change makes old ticket stale', () => {
  const value = session();
  const ticket = value.ticket();
  value.setRecipe({ ...baseRecipe, amount: 0.6 });
  assert.equal(value.complete(ticket, new Uint8Array([1]), 1).state, 'stale');
});

test('observation makes prior ticket stale', () => {
  const value = session();
  const ticket = value.ticket();
  value.observe('humidity', 70);
  assert.equal(value.complete(ticket, new Uint8Array([1]), 1).state, 'stale');
});

test('current completion hashes output and records elapsed time', () => {
  const value = session();
  const receipt = value.complete(value.ticket(), new Uint8Array([1, 2, 3]), 8.5);
  assert.equal(receipt.state, 'completed');
  assert.equal(receipt.output_sha256.length, 64);
  assert.equal(receipt.elapsed_ms, 8.5);
});

test('cancel and fail never include output hash', () => {
  const value = session();
  assert.equal(value.cancel(value.ticket()).output_sha256, null);
  assert.equal(value.fail(value.ticket(), 'safe failure').output_sha256, null);
});

test('safe export excludes pixel and landmark payloads', () => {
  const value = session();
  value.observe('mask_quality', 'checked', 'checked');
  value.complete(value.ticket(), new Uint8Array([8, 9, 10]), 1);
  const text = value.safeExportText();
  assert.match(text, /metadata and hashes only/);
  const parsed = JSON.parse(text);
  assert.equal(Object.hasOwn(parsed, 'landmarks'), false);
  assert.equal(Object.hasOwn(parsed, 'pixels'), false);
});

test('audit hash changes when observation changes', () => {
  const value = session();
  const before = value.auditSha256();
  value.observe('note', 'changed');
  assert.notEqual(value.auditSha256(), before);
});

test('returned recipe is defensive copy', () => {
  const value = session();
  const copy = value.recipe;
  copy.amount = 0.9;
  assert.equal(value.recipe.amount, 0.5);
});

test('returned observations cannot mutate session records', () => {
  const value = session();
  value.observe('x', 1);
  const copy = value.observations;
  copy[0].key = 'mutated';
  assert.equal(value.observations[0].key, 'x');
});

test('constructor rejects invalid definition hash', () => {
  assert.throws(() => new mod.LocalSession('x', groups, 'bad'), /sha256/);
});

test('checked observation cannot be assumed', () => {
  const value = session();
  assert.throws(() => value.observe('checked', 1, 'checked', true), /cannot be marked assumed/);
});

test('feature families issue tickets with definition binding', () => {
  for (const [feature, family] of Object.entries(groups)) {
    const value = new mod.LocalSession(feature, groups, defs);
    if (family !== 'workflow_w') value.bindPhoto(photo);
    value.setRecipe({ feature, family, style: '', amount: 0.25 });
    const ticket = value.ticket();
    assert.equal(ticket.feature, feature);
    assert.equal(ticket.definitions_sha256, defs);
  }
});
