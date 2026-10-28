// Deletion reaches every settings store only when the person asks. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteFaceData } from '../dist/js/layout/trust.js';
import { MemoryStore } from '../dist/js/session.js';
import { MemoryLookStorage } from '../dist/js/save/storage.js';
import { LookLibrary } from '../dist/js/save/looks.js';
import { RecipeRecovery, recoveryDraft, RECOVERY_KEY } from '../dist/js/save/recovery.js';

async function setup(alsoLooks) {
  const session = new MemoryStore(), versions = new MemoryLookStorage();
  const steps = [{ tool: 'lighting', strength: 30, settings: { mode: 'office' }, provider: 'local' }];
  const library = new LookLibrary(versions); const look = await library.saveLook('Office', steps);
  await library.updateLook(look.id, [{ ...steps[0], strength: 50 }]);
  new RecipeRecovery(session).save(recoveryDraft(steps, [{ enabled: true, opacity: 1 }]));
  let oldCount = 1;
  const deps = { consent: { hasVisit: true, withdraw() { this.hasVisit = false; } }, session, sessionKeys: [RECOVERY_KEY],
    clearHistory: async () => {}, photoIds: [], deletePhoto: null, looks: { clear() { const n = oldCount; oldCount = 0; return n; } },
    versionedLooks: versions, alsoLooks, clock: () => new Date('2026-10-23T12:00:00Z') };
  return { deps, session, versions, get oldCount() { return oldCount; } };
}
test('Delete face data clears recovery but keeps both saved-look stores unless selected', async () => {
  const data = await setup(false); const receipt = await deleteFaceData(data.deps);
  assert.equal(data.session.getItem(RECOVERY_KEY), null); assert.equal(data.oldCount, 1); assert.equal((await data.versions.list()).length, 1);
  assert.ok(receipt.lines.some(row => row.what === 'My Looks' && row.result === 'kept'));
});
test('also delete my saved looks removes legacy looks and all versioned recipes', async () => {
  const data = await setup(true); const receipt = await deleteFaceData(data.deps);
  assert.equal(data.oldCount, 0); assert.deepEqual(await data.versions.list(), []); assert.equal(data.session.getItem(RECOVERY_KEY), null);
  assert.ok(receipt.lines.some(row => row.what === 'Saved look versions' && row.result === 'deleted'));
});
test('a failed store deletion is reported and never prevents other stores from clearing', async () => {
  const data = await setup(true); data.deps.looks = { clear() { throw new Error('private details should not be echoed'); } };
  const receipt = await deleteFaceData(data.deps); assert.deepEqual(await data.versions.list(), []);
  assert.ok(receipt.lines.some(row => row.what === 'My Looks' && row.result === 'failed'));
  assert.doesNotMatch(JSON.stringify(receipt), /private details/);
});
