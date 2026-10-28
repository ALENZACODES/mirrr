/** Strict reporting and source-provenance checks. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateSeasonBook, visibleSeasonBook,
} from '../dist/js/layout/season-book/contracts.js';
import { sampleSeason } from './helpers/season-book-fixtures.mjs';

const today = '2026-10-26';

test('reviewed source records are preserved and draft records hidden', () => {
  const checked = validateSeasonBook(sampleSeason());
  const book = visibleSeasonBook(checked, today);
  assert.equal(book.houses.length, 1);
  assert.equal(book.looks.length, 1);
  assert.equal(book.houses[0].id, 'contrast-house');
  assert.equal(book.houses[0].sources[0].url, 'https://example.org/fixture');
  assert.equal(book.looks[0].toneIds[0], 'BL12');
});

test('no facts are created from an absent catalogue', () => {
  assert.throws(() => validateSeasonBook(null), /object/);
  assert.throws(() => visibleSeasonBook(validateSeasonBook(sampleSeason()), '2026-12-01'), /active/);
  assert.throws(() => visibleSeasonBook(validateSeasonBook(sampleSeason()), '2026-09-30'), /active/);
});

const mutate = (change) => {
  const book = sampleSeason();
  change(book);
  return book;
};

for (const [description, change] of [
  ['unsupported format', x => { x.format = 'unknown'; }],
  ['duplicate house ID', x => { x.houses[1].id = x.houses[0].id; }],
  ['unbound translated look', x => { x.looks[0].houseId = 'missing'; }],
  ['reviewed trend without citations', x => { x.houses[0].sources = []; }],
  ['unsafe script URL', x => { x.houses[0].sources[0].url = 'javascript:alert(1)'; }],
  ['HTTP URL', x => { x.houses[0].sources[0].url = 'http://example.org/fixture'; }],
  ['credentials in HTTPS URL', x => { x.houses[0].sources[0].url = 'https://user:pass@example.org/fixture'; }],
  ['unexpected field', x => { x.houses[0].successPercent = 96; }],
  ['fabricated future review', x => { x.houses[0].reportedOn = '2026-10-26'; }],
  ['postdated citation', x => { x.houses[0].sources[0].published = '2026-10-24'; }],
  ['unknown tone identity', x => { x.looks[0].toneIds = ['<b>']; }],
  ['reviewed look on draft house', x => { x.looks[1].release = 'reviewed'; }],
  ['repeated season tone', x => { x.looks[0].toneIds.push('BL12'); }],
]) {
  test(`rejects ${description}`, () => {
    assert.throws(() => validateSeasonBook(mutate(change)));
  });
}

test('publication day is validated as a genuine calendar day', () => {
  assert.throws(() => validateSeasonBook(mutate(x => {
    x.houses[0].sources[0].published = '2026-02-30';
  })));
});

test('no reviewed trend means no public release surface', () => {
  const book = validateSeasonBook(mutate(x => {
    x.houses[0].release = 'draft';
    x.looks[0].release = 'draft';
  }));
  assert.throws(() => visibleSeasonBook(book, today), /reviewed/);
});
