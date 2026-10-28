import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryLookStorage } from '../dist/js/save/storage.js';
import { LookLibrary } from '../dist/js/save/looks.js';
import { SavedFaceSessions } from '../dist/js/save/saved-face.js';

const step = (strength = 43) => ({ tool: 'nose', strength, settings: { subtle: true }, provider: 'local' });
const state = (reference, version = 1) => ({
  mesh: [[0.123456789, 0.21, 0.22], [0.6, 0.4, 0.1], [0.9, 0.8, 0.4]],
  identity: { reference, model: 'local-mesh', dimensions: [1080, 1350] },
  strengths: { nose: 43, lighting: 11.75 },
  settings: { selectedTool: 'nose', keepTexture: true, intensity: 0.35876 },
  activeVersion: version,
});
function setup() {
  const storage = new MemoryLookStorage();
  const clock = () => new Date('2026-10-25T20:10:00.000Z');
  const looks = new LookLibrary(storage, clock);
  return { storage, looks, sessions: new SavedFaceSessions(looks, storage, clock) };
}

test('saved mesh, identity, recipe and slider state round-trip exactly', async () => {
  const { sessions } = setup();
  const written = await sessions.save('Portrait', [step()], state('person-one'));
  const result = await sessions.resume(written.look.id);
  assert.deepEqual(result, written);
  assert.equal(result.face.mesh[0][0], 0.123456789);
  result.face.mesh[0][0] = 999;
  const restored = await sessions.resume(written.look.id);
  assert.equal(restored.face.mesh[0][0], 0.123456789);
});

test('deletion removes face and recipe and produces local verification receipt', async () => {
  const { sessions, storage } = setup();
  const saved = await sessions.save('Portrait', [step()], state('person-one'));
  const receipt = await sessions.delete(saved.look.id);
  assert.equal(receipt.deleted, true);
  assert.equal(receipt.faceGone, true);
  assert.equal(receipt.recipeGone, true);
  assert.equal(receipt.localOnly, true);
  assert.equal(await sessions.resume(saved.look.id), null);
  assert.equal(await storage.getFace(saved.look.id), null);
  assert.equal(await storage.get(saved.look.id), null);
});

test('two faces cannot cross-load even with identical time and recipe', async () => {
  const { sessions } = setup();
  const first = await sessions.save('Portrait One', [step()], state('one'));
  const second = await sessions.save('Portrait Two', [step()], state('two'));
  assert.notEqual(first.look.id, second.look.id);
  assert.equal((await sessions.resume(first.look.id)).face.identity.reference, 'one');
  assert.equal((await sessions.resume(second.look.id)).face.identity.reference, 'two');
  await sessions.delete(first.look.id);
  assert.equal((await sessions.resume(second.look.id)).face.identity.reference, 'two');
});

test('versioned checkpoint restores selected historical recipe and updated state', async () => {
  const { sessions, looks } = setup();
  const saved = await sessions.save('Portrait', [step()], state('one'));
  await looks.updateLook(saved.look.id, [step(72)]);
  const next = state('one', 2);
  next.settings.selectedTool = 'lighting';
  await sessions.checkpoint(saved.look.id, next);
  const resumed = await sessions.resume(saved.look.id);
  assert.equal(resumed.steps[0].strength, 72);
  assert.deepEqual(resumed.face, next);
  next.mesh[0][0] = 100;
  assert.equal((await sessions.resume(saved.look.id)).face.mesh[0][0], 0.123456789);
});

test('missing face returns null; invalid mesh and invalid version never persist', async () => {
  const { sessions, looks, storage } = setup();
  const saved = await looks.saveLook('Portrait', [step()]);
  assert.equal(await sessions.resume(saved.id), null);
  await assert.rejects(sessions.save('Bad mesh', [step()], { ...state('one'), mesh: [[NaN, 0]] }), TypeError);
  await assert.rejects(sessions.checkpoint(saved.id, state('one')), RangeError);
  assert.equal(await storage.getFace(saved.id), null);
});

test('deleting a look directly also deletes its associated face', async () => {
  const { sessions, looks, storage } = setup();
  const saved = await sessions.save('Portrait', [step()], state('one'));
  assert.equal(await looks.remove(saved.look.id), true);
  assert.equal(await storage.getFace(saved.look.id), null);
});

test('clear erases all face payloads and look recipes', async () => {
  const { sessions, storage } = setup();
  const a = await sessions.save('One', [step()], state('one'));
  const b = await sessions.save('Two', [step()], state('two'));
  assert.equal(await storage.clear(), 2);
  assert.equal(await sessions.resume(a.look.id), null);
  assert.equal(await sessions.resume(b.look.id), null);
});

test('concurrent checkpoint then delete cannot resurrect a face record', async () => {
  const { sessions, storage } = setup();
  const saved = await sessions.save('Concurrent', [step()], state('concurrent'));
  const next = state('concurrent', 1);
  next.mesh[0][0] = 0.777777777;
  const checkpoint = sessions.checkpoint(saved.look.id, next);
  const deletion = sessions.delete(saved.look.id);
  await Promise.all([checkpoint, deletion]);
  assert.equal(await sessions.resume(saved.look.id), null);
  assert.equal(await storage.getFace(saved.look.id), null);
  assert.equal(await storage.get(saved.look.id), null);
});

test('checkpoint then resume returns detached nested recipe settings', async () => {
  const { sessions } = setup();
  const saved = await sessions.save('Nested', [step()], state('nested'));
  const resumed = await sessions.resume(saved.look.id);
  resumed.steps[0].settings.subtle = false;
  const again = await sessions.resume(saved.look.id);
  assert.equal(again.steps[0].settings.subtle, true);
});

test('invalid identity dimensions and non-finite strength are rejected before write', async () => {
  const { sessions, storage } = setup();
  const badDimensions = state('bad-dimensions');
  badDimensions.identity.dimensions = [0, 1350];
  await assert.rejects(sessions.save('Bad dimensions', [step()], badDimensions), TypeError);
  const badStrength = state('bad-strength');
  badStrength.strengths.nose = Number.POSITIVE_INFINITY;
  await assert.rejects(sessions.save('Bad strength', [step()], badStrength), TypeError);
  assert.equal((await storage.list()).length, 0);
});

test('missing recipe cannot receive a face attachment', async () => {
  const { storage } = setup();
  await assert.rejects(storage.putFace('missing-id', state('orphan')), RangeError);
  assert.equal(await storage.getFace('missing-id'), null);
});

test('parallel operations on separate faces remain isolated', async () => {
  const { sessions, storage } = setup();
  const [first, second] = await Promise.all([
    sessions.save('Parallel one', [step(21)], state('parallel-one')),
    sessions.save('Parallel two', [step(82)], state('parallel-two')),
  ]);
  const update = state('parallel-one');
  update.mesh[0][0] = 0.314159;
  await Promise.all([
    sessions.checkpoint(first.look.id, update),
    sessions.checkpoint(second.look.id, state('parallel-two')),
  ]);
  const [restoredFirst, restoredSecond] = await Promise.all([
    sessions.resume(first.look.id), sessions.resume(second.look.id),
  ]);
  assert.equal(restoredFirst.face.identity.reference, 'parallel-one');
  assert.equal(restoredFirst.face.mesh[0][0], 0.314159);
  assert.equal(restoredSecond.face.identity.reference, 'parallel-two');
  assert.equal(restoredSecond.face.mesh[0][0], 0.123456789);
  assert.equal((await storage.list()).length, 2);
});
