/** Python/TypeScript provenance fingerprint parity. Author: John Khan. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { LocalSession, canonicalRecipe, photoFingerprint, recipeFingerprint } from '../dist/js/ui/r17b/provenance.js';

const root = new URL('../..', import.meta.url);
const run = spawnSync('python3', ['api/scripts/r17b_provenance_probe.py'], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, PYTHONPATH: 'api' },
});
assert.equal(run.status, 0, run.stderr);
const py = JSON.parse(run.stdout);
assert.equal(py.format, 'beljour.r17b.provenance-parity/1');
const groups = { W19: 'hair_women' };
const recipe = py.recipe;

function makeSession() {
  const session = new LocalSession('parity', groups, py.ticket.definitions_sha256);
  session.bindPhoto(py.photo_sha256);
  session.setRecipe(recipe);
  session.observe('humidity', 55.25, 'user', false);
  session.observe('hair_mask', 'checked', 'checked', false);
  return session;
}

test('photo fingerprint matches Python raw-byte SHA contract', () => {
  const pixels = Uint8Array.from(py.pixels);
  assert.equal(photoFingerprint(pixels, py.width, py.height, py.channels), py.photo_sha256);
});

test('canonical recipe text matches Python', () => {
  assert.equal(canonicalRecipe(recipe, groups), py.recipe_canonical);
});

test('recipe fingerprint matches Python', () => {
  assert.equal(recipeFingerprint(recipe, groups), py.recipe_sha256);
});

test('render ticket binds identical feature, revision, photo and recipe hashes', () => {
  const ticket = makeSession().ticket();
  assert.equal(ticket.id, py.ticket.id);
  assert.equal(ticket.revision, py.ticket.revision);
  assert.equal(ticket.feature, py.ticket.feature);
  assert.equal(ticket.photo_sha256, py.ticket.photo_sha256);
  assert.equal(ticket.recipe_sha256, py.ticket.recipe_sha256);
  assert.equal(ticket.definitions_sha256, py.ticket.definitions_sha256);
});

test('completed output hash matches Python raw bytes', () => {
  const session = makeSession();
  const ticket = session.ticket();
  const output = new TextEncoder().encode('r17b-output');
  const receipt = session.complete(ticket, output, 7.5);
  assert.equal(receipt.state, py.receipt_state);
  assert.equal(receipt.output_sha256, py.output_sha256);
});
