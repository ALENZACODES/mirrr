/** Season Book editions: four a year, and the source is asked again only when one opens.
 * Author: John Khan.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editionOn, refreshDates, refreshDue } from '../dist/js/layout/season-book/schedule.js';
import { SeasonBookController } from '../dist/js/layout/season-book/controller.js';
import { exampleLook, mockPort } from './helpers/season-book-fixtures.mjs';

test('four editions a year, opening 1 March, 1 June, 1 September and 1 December', () => {
  assert.deepEqual(refreshDates(2027), ['2027-03-01', '2027-06-01', '2027-09-01', '2027-12-01']);
  assert.deepEqual(editionOn('2026-10-28'),
    { id: '2026-autumn', name: 'Autumn 2026', opens: '2026-09-01', closes: '2026-11-30', next: '2026-12-01' });
  assert.deepEqual(editionOn('2027-02-28'),
    { id: '2026-winter', name: 'Winter 2026–27', opens: '2026-12-01', closes: '2027-02-28', next: '2027-03-01' });
  assert.equal(editionOn('2028-02-29').closes, '2028-02-29', 'leap years close on the 29th');
  assert.equal(editionOn('2026-12-01').id, '2026-winter');
  assert.equal(editionOn('2026-11-30').id, '2026-autumn');
  assert.equal(editionOn('2027-03-01').id, '2027-spring');
  const seen = new Set();
  for (let d = new Date('2026-01-01T12:00:00Z'); d.getUTCFullYear() < 2028; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10), e = editionOn(day);
    assert.ok(e.opens <= day && day <= e.closes, day);
    seen.add(e.id);
  }
  assert.equal(seen.size, 9, 'winter 2025-26 through winter 2027-28');
  assert.throws(() => editionOn('2026-13-01'));
});

test('refresh is due on the first look, when an edition opens, or when the book has run out', () => {
  assert.equal(refreshDue(null, '2026-10-28', null), true);
  assert.equal(refreshDue('2026-10-01', '2026-11-30', null), false, 'same edition, nothing to ask');
  assert.equal(refreshDue('2026-11-30', '2026-12-01', null), true, 'winter opened');
  assert.equal(refreshDue('2026-10-01', '2026-11-10', { validUntil: '2026-11-05' }), true, 'the book ran out early');
  assert.equal(refreshDue('2026-10-01', '2026-11-05', { validUntil: '2026-11-05' }), false);
});

test('the controller asks the source again only on an edition change, and shows the next date', async () => {
  let today = '2026-10-26';
  const controller = new SeasonBookController(() => [exampleLook()], { today: () => today });
  assert.equal(await controller.refreshIfDue(), false, 'nothing connected, nothing asked');
  const port = mockPort();
  await controller.connect(port);
  assert.deepEqual(port.calls, ['load']);
  assert.equal(controller.snapshot().edition.next, '2026-12-01');
  today = '2026-11-20';
  assert.equal(await controller.refreshIfDue(), false);
  assert.deepEqual(port.calls, ['load'], 'same autumn edition and the book is still valid');
  today = '2026-12-01';
  assert.equal(await controller.refreshIfDue(), true);
  assert.deepEqual(port.calls, ['load', 'load']);
  assert.equal(controller.snapshot().status, 'unverified', 'the autumn book is out of date; nothing old is shown');
  assert.equal(controller.snapshot().book, null);
  assert.equal(controller.snapshot().edition.id, '2026-winter');
  assert.equal(await controller.refreshIfDue(), false, 'asked once for winter, not again until it changes');
  controller.disconnect();
  assert.equal(await controller.refreshIfDue(), false);
  controller.dispose();
});
