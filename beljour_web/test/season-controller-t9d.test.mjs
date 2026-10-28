/** Async lifecycle, consent and alert tests. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SeasonBookController } from '../dist/js/layout/season-book/controller.js';
import { exampleLook, mockPort, samplePersonalMatch, sampleSeason } from './helpers/season-book-fixtures.mjs';

const clock = { today: () => '2026-10-26' };
const newController = () => new SeasonBookController(() => [exampleLook()], clock);

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('remains unverified until a reviewed seasonal source is injected', () => {
  const controller = newController();
  assert.equal(controller.snapshot().status, 'not-wired');
  assert.equal(controller.snapshot().book, null);
  assert.equal(controller.snapshot().alertOptedIn, false);
  controller.dispose();
});

test('loading a reviewed catalogue reads no personal state', async () => {
  const controller = newController();
  const port = mockPort();
  await controller.connect(port);
  assert.deepEqual(port.calls, ['load']);
  assert.equal(controller.snapshot().status, 'ready');
  assert.equal(controller.snapshot().book.houses.length, 1);
  assert.equal(controller.snapshot().matches, null);
  controller.dispose();
});

test('personal reading occurs only after user action', async () => {
  const controller = newController();
  const port = mockPort();
  await controller.connect(port);
  await controller.personalizeFromUserAction();
  assert.equal(controller.snapshot().personalized, true);
  assert.equal(controller.snapshot().matches.matches[0].toneId, 'BL12');
  assert.deepEqual(port.calls.slice(0, 3), ['load', 'history', 'profile']);
  assert.equal(port.calls[3][0], 'match');
  assert.equal(port.calls[3][1].savedLooks[0].shades[0], 'BL12');
  assert.equal(controller.snapshot().alertMessage, '');
  controller.dispose();
});

test('opt-in is necessary for the one in-page alert', async () => {
  const controller = newController();
  const port = mockPort();
  await controller.connect(port);
  controller.setInPageAlertsFromUserAction(true);
  assert.equal(controller.snapshot().alertOptedIn, true);
  await controller.personalizeFromUserAction();
  assert.equal(controller.snapshot().alertMessage, 'Your season match is in');
  controller.setInPageAlertsFromUserAction(false);
  assert.equal(controller.snapshot().alertOptedIn, false);
  assert.equal(controller.snapshot().alertMessage, '');
  controller.dispose();
});

test('unreviewed catalogues fail closed without an invented trend', async () => {
  const controller = newController();
  const catalogue = sampleSeason();
  catalogue.houses[0].release = 'draft';
  catalogue.looks[0].release = 'draft';
  await controller.connect(mockPort({ catalogue }));
  assert.equal(controller.snapshot().status, 'unverified');
  assert.equal(controller.snapshot().book, null);
  controller.dispose();
});

test('a profile without confirmation does not create a personal result', async () => {
  const controller = newController();
  await controller.connect(mockPort({ profile: {
    profileId: 'profile-1234', undertone: 'warm',
    source: 'user-confirmed', confirmed: false,
  } }));
  await controller.personalizeFromUserAction();
  assert.equal(controller.snapshot().personalized, false);
  assert.equal(controller.snapshot().matches, null);
  controller.dispose();
});

test('disconnect prevents late catalogue completion from becoming published', async () => {
  const work = deferred();
  const controller = newController();
  const loading = controller.connect({
    ...mockPort(),
    loadReviewedSeason: () => work.promise,
  });
  assert.equal(controller.snapshot().status, 'loading');
  controller.disconnect();
  work.resolve(sampleSeason());
  await loading;
  assert.equal(controller.snapshot().status, 'not-wired');
  assert.equal(controller.snapshot().book, null);
  controller.dispose();
});

test('reset prevents late personal mapping from leaking stale matches', async () => {
  const work = deferred();
  const controller = newController();
  const port = mockPort();
  port.matchUsingLaneF = () => work.promise;
  await controller.connect(port);
  const matching = controller.personalizeFromUserAction();
  await Promise.resolve();
  await Promise.resolve();
  controller.resetPersonal();
  work.resolve({
    format: 'beljour-season-match/1',
    seasonId: 'autumn-2026', mappingProvider: 'lane-f',
    mappingVersion: 'season-map-1', matchedProfileId: 'profile-1234',
    matches: [{ lookId: 'sample-look', toneId: 'BL12', fit: 'recommended',
      reason: 'This reason should not be shown after consent reset.' }],
  });
  await matching;
  assert.equal(controller.snapshot().matches, null);
  assert.equal(controller.snapshot().personalized, false);
  controller.dispose();
});

test('source replacement expires previous match and previous status', async () => {
  const controller = newController();
  await controller.connect(mockPort());
  await controller.personalizeFromUserAction();
  assert.equal(controller.snapshot().personalized, true);
  await controller.connect(mockPort());
  assert.equal(controller.snapshot().matches, null);
  assert.equal(controller.snapshot().personalized, false);
  controller.dispose();
});

test('missing match API displays an explicit unconnected status', async () => {
  const controller = newController();
  const port = mockPort();
  port.matchUsingLaneF = null;
  await controller.connect(port);
  await controller.personalizeFromUserAction();
  assert.match(controller.snapshot().statusMessage, /not been connected/);
  assert.equal(controller.snapshot().matches, null);
  controller.dispose();
});

test('saved look edits during matching cannot display stale personal advice', async () => {
  let looks = [exampleLook()];
  const controller = new SeasonBookController(() => looks, clock);
  const port = mockPort();
  port.matchUsingLaneF = async () => {
    looks = [];
    return samplePersonalMatch();
  };
  await controller.connect(port);
  await controller.personalizeFromUserAction();
  assert.equal(controller.snapshot().personalized, false);
  assert.equal(controller.snapshot().matches, null);
  assert.match(controller.snapshot().statusMessage, /No verified personal mapping/);
  controller.dispose();
});
