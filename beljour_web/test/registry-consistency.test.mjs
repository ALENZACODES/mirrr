// Resolve the visible effect catalogue to actual renderers and requirements. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registryProblems, recipeAvailability, effectAvailability } from '../dist/js/save/capabilities.js';
import { CATALOGUE } from '../dist/js/ui/shell/catalogue.js';
import { RENDER_KINDS } from '../dist/js/ui/shell/types.js';
import { EFFECTS } from '../dist/js/layout/effects.js';
import { makeSample } from '../dist/js/ui/shell/demo.js';

test('every visible local studio has a renderer and a validated recipe contract', () => {
  assert.deepEqual(registryProblems(), []);
  for (const effect of EFFECTS) {
    const state = effectAvailability(effect, null); assert.equal(state.available, false); assert.ok(state.reason.length > 0);
  }
});
test('duplicate IDs and unknown provider/studio mappings fail consistency', () => {
  assert.match(registryProblems([...CATALOGUE, CATALOGUE[0]]).join('\n'), /duplicate/);
  assert.match(registryProblems(CATALOGUE, [...EFFECTS, EFFECTS[0]]).join('\n'), /duplicate/);
  assert.match(registryProblems(CATALOGUE, EFFECTS, [...RENDER_KINDS, RENDER_KINDS[0]]).join('\n'), /duplicate/);
  assert.match(registryProblems(CATALOGUE, [{ ...EFFECTS[0], built: true, studio: 'missing' }]).join('\n'), /unknown studio/);
  assert.match(registryProblems(CATALOGUE, [{ ...EFFECTS[0], built: true, studio: 'enhance', provider: 'youcam' }]).join('\n'), /provider differs/);
});
test('missing geometry disables only affected steps with no substitute mesh', () => {
  const photo = { ...makeSample('portrait'), face: undefined, hair: undefined, kind: 'uploaded' };
  const steps = ['enhance', 'beard', 'lighting', 'recolour', 'nose'].map(tool => ({ tool, strength: 30, settings: {}, provider: 'local' }));
  const result = recipeAvailability(steps, photo);
  assert.deepEqual(result.map(row => row.available), [true, false, true, false, false]);
  assert.match(result[1].reason, /face/i); assert.match(result[3].reason, /hair/i); assert.match(result[4].reason, /no editor renderer/);
});
test('a provider recipe never becomes an unconsented local or live request', () => {
  const state = recipeAvailability([{ tool: 'makeup', provider: 'youcam', strength: 10, settings: {} }], makeSample('portrait'))[0];
  assert.equal(state.available, false); assert.match(state.reason, /quote and consent/);
});
