import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localTourTryon, checkedTourOutcome } from '../dist/js/layout/continuous/ports.js';
import { publicProCommands, PRO_COMMANDS, commandCoverage } from '../dist/js/layout/continuous/pro-commands.js';
import { ContinuousEvidence } from '../dist/js/layout/continuous/evidence.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';
import { checkedSeasonalCards, SeasonalCatalogueController } from '../dist/js/layout/continuous/seasonal.js';
import { ContinuousTimings, percentile } from '../dist/js/layout/continuous/performance.js';

const request = {
  sourceRevision: 1, selectedId: 'drawn-main', localConsent: true,
  mockConsent: true, identityLock: true,
};

test('mock never invokes a network API or claims actual provider evidence', () => {
  const adapter = localTourTryon('mock');
  const answer = adapter.preview(request);
  assert.equal(answer.result, 'mock-applied');
  assert.equal(answer.providerCalls, 0);
  assert.equal(answer.unitsSpent, 0);
  assert.equal(answer.imageSent, false);
  assert.equal(checkedTourOutcome(answer), answer);
  assert.match(answer.copy, /No YouCam request/i);
});

test('provider off still permits an explicit graceful demonstration', () => {
  const adapter = localTourTryon('off');
  assert.equal(adapter.mode, 'off');
  const answer = adapter.preview(request);
  assert.equal(answer.result, 'provider-disabled');
  assert.equal(answer.providerCalls, 0);
  assert.equal(answer.unitsSpent, 0);
  assert.equal(answer.imageSent, false);
});

test('mock rejects missing subject, consent and identity lock', () => {
  const adapter = localTourTryon();
  for (const override of [
    { selectedId: '' }, { localConsent: false },
    { mockConsent: false }, { identityLock: false },
  ]) {
    const result = adapter.preview({ ...request, ...override });
    assert.equal(result.result, 'consent-required');
    assert.equal(result.providerCalls, 0);
  }
});

test('a compromised adapter claiming provider traffic is rejected', () => {
  const valid = localTourTryon().preview(request);
  assert.throws(() => checkedTourOutcome({ ...valid, providerCalls: 1 }), /Live provider/);
  assert.throws(() => checkedTourOutcome({ ...valid, unitsSpent: 1 }), /mock tour/);
  assert.throws(() => checkedTourOutcome({ ...valid, imageSent: true }), /mock tour/);
  assert.throws(() => checkedTourOutcome({ ...valid, result: 'real-success' }), /status/);
  assert.throws(() => checkedTourOutcome({ ...valid, copy: 'x'.repeat(241) }), /status text/);
});

test('all five exact Pro Commands are exposed, not invented aliases', () => {
  assert.deepEqual(PRO_COMMANDS, [
    '/IDENTITYLOCK', '/CLEANUP', '/UPSCALE', '/STUDIOQUALITY', '/POSEONLY',
  ]);
  const absent = publicProCommands(null);
  assert.equal(absent.length, 5);
  assert.ok(absent.every(row => row.available === 'unknown'));
  assert.equal(commandCoverage(absent).full, false);
  assert.equal(commandCoverage(absent).known, 0);
});

test('command availability is derived solely from a public owner port', () => {
  const port = { kind: 'pro-command-catalogue', listCommands: () =>
    PRO_COMMANDS.map(name => ({ name, available: name !== '/POSEONLY' })) };
  const rows = publicProCommands(port);
  assert.equal(commandCoverage(rows).known, 5);
  assert.equal(commandCoverage(rows).available, 4);
  assert.equal(commandCoverage(rows).full, false);
  assert.equal(rows.at(-1).available, 'unavailable');
});

test('malformed and duplicate public command catalogues fail closed', () => {
  assert.throws(() => publicProCommands({ kind: 'wrong', listCommands: () => [] }), /port/);
  assert.throws(() => publicProCommands({ kind: 'pro-command-catalogue',
    listCommands: () => [{ name: '/CLEANUP', available: true }, { name: '/CLEANUP', available: true }] }), /Duplicate/);
  assert.throws(() => publicProCommands({ kind: 'pro-command-catalogue',
    listCommands: () => [{ name: '/CLEANUP', available: 'yes' }] }), /Invalid/);
});

test('Halloween comes first when it is actually published by the public seasonal catalogue', () => {
  const cards = checkedSeasonalCards([
    { id: 'spring_pack', title: 'Spring', season: 'Spring', available: true },
    { id: 'october_pack', title: 'Night', season: 'Halloween', available: true },
    { id: 'winter_pack', title: 'Winter', season: 'Winter', available: false },
  ]);
  assert.equal(cards[0].id, 'october_pack');
  assert.equal(cards[0].halloween, true);
  assert.equal(cards.length, 3);
});

test('no seasonal interface means no fabricated Halloween pack', async () => {
  const controller = new SeasonalCatalogueController(null);
  assert.equal(controller.snapshot.cards.length, 0);
  assert.equal((await controller.load()).status, 'unavailable');
  assert.match(controller.snapshot.explanation, /no pack data is invented/i);
  controller.dispose();
});

test('seasonal port validates every row and invalidates unsafe data', async () => {
  const catalogue = new SeasonalCatalogueController({
    kind: 'seasonal-catalogue', listPacks: async () => [
      { id: 'ok', title: 'Valid', season: 'Spring', available: true },
      { id: 'ok', title: 'Duplicate', season: 'Halloween', available: true },
    ],
  });
  assert.equal((await catalogue.load()).status, 'invalid');
  assert.equal(catalogue.snapshot.cards.length, 0);
  assert.throws(() => checkedSeasonalCards([{ id: '../bad', title: 'X', season: 'Halloween', available: true }]));
  catalogue.dispose();
});

test('late seasonal response does not override a newer response', async () => {
  const pending = [];
  const catalogue = new SeasonalCatalogueController({
    kind: 'seasonal-catalogue', listPacks: () => new Promise(resolve => pending.push(resolve)),
  });
  const old = catalogue.load();
  const fresh = catalogue.load();
  pending[1]([{ id: 'new', title: 'New', season: 'Summer', available: true }]);
  assert.equal((await fresh).cards[0].id, 'new');
  pending[0]([{ id: 'old', title: 'Old', season: 'Winter', available: true }]);
  assert.equal((await old).status, 'stale');
  assert.equal(catalogue.snapshot.cards[0].id, 'new');
  catalogue.dispose();
});

test('summary never promotes mock or local steps into provider evidence', () => {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(1, 2, 'drawn-main');
  state.recordTryon('mock-applied');
  const ledger = new ContinuousEvidence();
  ledger.record('mock', 'tryon', 60);
  const summary = ledger.summary(state.snapshot);
  assert.equal(summary.mockOnly, true);
  assert.equal(summary.providerEvidence, false);
  assert.equal(summary.realFaceEvidence, false);
  const report = ledger.report(state.snapshot);
  assert.match(report, /Live YouCam evidence: none/);
  assert.doesNotMatch(report, /drawn-main|data:image|filename/);
  ledger.dispose();
});

test('timing calculations are deterministic and do not set CI performance gates', () => {
  const timing = new ContinuousTimings();
  for (const ms of [1, 2, 3, 4, 10]) timing.record('preview', ms);
  assert.equal(timing.summary('preview').medianMs, 3);
  assert.equal(timing.summary('preview').p95Ms, 8.8);
  assert.equal(timing.summary('preview').count, 5);
  assert.equal(timing.summary('export').measured, false);
  assert.equal(timing.summary('export').budgetExceeded, null);
  assert.equal(percentile([], .95), null);
  assert.throws(() => percentile([1], 2), RangeError);
  timing.dispose();
});
