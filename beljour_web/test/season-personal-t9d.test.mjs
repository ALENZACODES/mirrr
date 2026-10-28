/** Private look, shade and Lane F match contract tests. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateSeasonBook, visibleSeasonBook } from '../dist/js/layout/season-book/contracts.js';
import {
  personalEvidence, savedLookEvidence, validateSeasonMatches,
} from '../dist/js/layout/season-book/personal.js';
import { exampleLook, samplePersonalMatch, sampleSeason } from './helpers/season-book-fixtures.mjs';

const book = visibleSeasonBook(validateSeasonBook(sampleSeason()), '2026-10-26');
const profile = {
  profileId: 'profile-1234', undertone: 'neutral',
  source: 'user-confirmed', confirmed: true,
};
const history = [{ shadeId: 'BL12', observedOn: '2026-10-20', source: 'user-chosen' }];
const evidence = personalEvidence(book, [exampleLook()], history, profile);

test('saved looks contribute selected shade IDs but not free-form text', () => {
  const result = savedLookEvidence([exampleLook()]);
  assert.deepEqual(result, [{ id: 'look-1234abcd', kinds: ['filters'], shades: ['BL12'] }]);
  assert.doesNotMatch(JSON.stringify(result), /note|Fixture Saved Look/);
});

test('personal evidence uses a confirmed profile without computing undertone', () => {
  assert.equal(evidence.undertone.undertone, 'neutral');
  assert.equal(evidence.shadeHistory[0].shadeId, 'BL12');
  assert.equal(evidence.savedLooks[0].shades[0], 'BL12');
});

test('only a valid Lane F mapping supplies a one-line personal reason', () => {
  const matches = validateSeasonMatches(samplePersonalMatch(), book, evidence);
  assert.equal(matches.mappingProvider, 'lane-f');
  assert.equal(matches.matches.length, 1);
  assert.match(matches.matches[0].reason, /confirmed mapping/);
});

for (const [description, change] of [
  ['wrong provider', x => { x.mappingProvider = 'local-guess'; }],
  ['wrong season', x => { x.seasonId = 'spring-2027'; }],
  ['wrong profile', x => { x.matchedProfileId = 'somebody-else'; }],
  ['unreviewed look', x => { x.matches[0].lookId = 'unreviewed-look'; }],
  ['unlisted tone', x => { x.matches[0].toneId = 'BL99'; }],
  ['unverified probability field', x => { x.matches[0].probability = 0.96; }],
  ['script markup in reason', x => { x.matches[0].reason = '<script>unsafe</script>\n'; }],
  ['duplicate match', x => { x.matches.push({ ...x.matches[0] }); }],
]) {
  test(`rejects ${description}`, () => {
    const result = samplePersonalMatch();
    change(result);
    assert.throws(() => validateSeasonMatches(result, book, evidence));
  });
}

test('unconfirmed undertone does not authorize a matching result', () => {
  const notConfirmed = personalEvidence(book, [], history, { ...profile, confirmed: false });
  assert.throws(() => validateSeasonMatches(samplePersonalMatch(), book, notConfirmed));
});

test('malformed history is refused rather than inferred from photos', () => {
  const unknownShade = [{ shadeId: 'pink skin', observedOn: '2026-10-20', source: 'user-chosen' }];
  assert.throws(() => personalEvidence(book, [], unknownShade, profile));
  const invalidDay = [{ shadeId: 'BL12', observedOn: '2026-10-32', source: 'user-chosen' }];
  assert.throws(() => personalEvidence(book, [], invalidDay, profile));
});
