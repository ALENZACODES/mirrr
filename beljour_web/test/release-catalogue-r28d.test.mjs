import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  RELEASE_CHECKS, RELEASE_CHECK_IDS, RELEASE_REFUSALS,
  isReleaseId, isReleaseRefusal, releaseCheck, releaseLink,
} from '../dist/js/layout/release/catalogue.js';
import { realDemoRoutes } from '../dist/js/layout/judge-live-routes.js';

const ids = () => RELEASE_CHECKS.map(row => row.id);

test('every release criterion is authored once in deterministic order', () => {
  assert.equal(RELEASE_CHECKS.length, 16);
  assert.equal(new Set(ids()).size, 16);
  assert.deepEqual(ids(), RELEASE_CHECK_IDS);
  assert.equal(Object.isFrozen(RELEASE_CHECKS), true);
  for (const row of RELEASE_CHECKS) {
    assert.equal(releaseCheck(row.id), row);
    assert.ok(row.title.length >= 12);
    assert.ok(row.expectation.length >= 25);
    assert.ok(row.proofNeeded.length >= 25);
    assert.ok(row.recovery.length >= 25);
    assert.equal(typeof row.route === 'string' || row.route === null, true);
    assert.ok(['operator', 'device', 'independent'].includes(row.classification));
  }
});

test('all destination links originate from an existing public route', () => {
  const destinations = new Map(realDemoRoutes().map(row => [row.id, row.href]));
  assert.equal(destinations.size, 7);
  for (const row of RELEASE_CHECKS) {
    if (row.route) {
      assert.equal(releaseLink(row.id), destinations.get(row.route));
    } else {
      assert.equal(releaseLink(row.id), null);
    }
  }
});

test('routes carry no photo, consent, ticket, host or query data', () => {
  for (const row of RELEASE_CHECKS) {
    const href = releaseLink(row.id);
    if (href === null) continue;
    assert.match(href, /^[a-z-]+\.html/);
    assert.doesNotMatch(href, /http:|https:|\.\.|\/\/|\?|%|@|file:/i);
    assert.doesNotMatch(href, /token|consent|photo_id|ticket|session/i);
  }
});

test('all independent release requirements are never operator checks', () => {
  const independent = RELEASE_CHECKS.filter(row => row.classification === 'independent');
  assert.deepEqual(independent.map(row => row.id), [
    'real-face', 'commercial-ip', 'submission',
  ]);
  assert.ok(independent.every(row => row.route === null));
});

test('real device requirements have no false browser destination', () => {
  assert.deepEqual(RELEASE_CHECKS.filter(row => row.classification === 'device').map(row => row.id),
    ['performance', 'accessibility']);
  assert.equal(RELEASE_CHECKS.filter(row => row.classification === 'operator').length, 11);
});

test('runtime guards reject unknown and capitalized check names', () => {
  for (const value of ['PHOTO', 'unknown', '../studio.html', '', 'Hair', 'makeup?photo=1']) {
    assert.equal(isReleaseId(value), false);
  }
  for (const id of RELEASE_CHECK_IDS) assert.equal(isReleaseId(id), true);
  assert.throws(() => releaseCheck('not-a-check'), /Unknown/);
});

test('refusal list is bounded to fixed values and cannot contain free text', () => {
  assert.equal(RELEASE_REFUSALS.length, 7);
  assert.equal(new Set(RELEASE_REFUSALS).size, RELEASE_REFUSALS.length);
  for (const reason of RELEASE_REFUSALS) assert.equal(isReleaseRefusal(reason), true);
  for (const reason of [null, undefined, 'Face from gallery', 'API key', '', 'OFFLINE']) {
    assert.equal(isReleaseRefusal(reason), false);
  }
});

test('provider routes always explain consent and units or an unavailable fallback', () => {
  for (const id of ['hair', 'makeup', 'skin-match']) {
    const row = releaseCheck(id);
    assert.equal(row.classification, 'operator');
    assert.ok(row.route);
    assert.match(row.expectation + row.proofNeeded + row.recovery, /consent|provider|Skin AI/);
  }
});

test('the frozen release gate is not a claimed operator pass', () => {
  const row = releaseCheck('real-face');
  assert.equal(row.classification, 'independent');
  assert.match(row.title + row.expectation, /100,000/);
  assert.match(row.recovery, /Do not publish/);
});

test('all planned release checks have distinct testable outcomes', () => {
  for (const row of RELEASE_CHECKS) {
    assert.notEqual(row.expectation, row.proofNeeded);
    assert.notEqual(row.proofNeeded, row.recovery);
    assert.doesNotMatch(row.title, /certified|passed|approved by judge/i);
  }
});
