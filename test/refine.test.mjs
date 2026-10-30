import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refineLooks, describeChanges, messageDeltas } from '../src/agent/refine.js';

const base = { intensity: 0.5, warmth: 0.6, boldness: 0.5, texture: 0.5 };

test('"bolder" compounds across turns', () => {
  const t1 = refineLooks({ vec: base, message: 'make it bolder' });
  const t2 = refineLooks({ vec: t1.vec, message: 'even bolder', previousLookIds: t1.looks.map(r => r.look.id) });
  assert.equal(t1.vec.intensity, 0.65); assert.equal(t2.vec.intensity, 0.8);
  assert.equal(t2.vec.boldness, 0.8);
  assert.ok(describeChanges(t2.changes, t2.looks).includes('Intensity 65 → 80'));
});

test('"wedding" surfaces bridal looks', () => {
  const r = refineLooks({ vec: base, message: 'what about for a wedding?' });
  assert.equal(r.changes.occasion, 'wedding');
  assert.ok(r.looks.some(x => /bridal|wedding|mehndi/i.test(`${x.look.id} ${x.look.name} ${(x.look.tags ?? []).join(' ')}`)));
  assert.ok(/bridal|wedding|mehndi/i.test(r.looks[0].look.id + r.looks[0].look.name + r.looks[0].look.tags.join(' ')));
});

test('a message with no direction says nothing changed', () => {
  const first = refineLooks({ vec: base, message: '' });
  const r = refineLooks({ vec: base, message: 'hmm ok', previousLookIds: first.looks.map(x => x.look.id) });
  assert.equal(r.changes.sameOrder, true);
  const text = describeChanges(r.changes, r.looks);
  assert.match(text, /did not change/); assert.match(text, /did not find a direction/);
  assert.doesNotMatch(text, /new recommendations/);
});

test('at the limit, it says it could not move', () => {
  const r = refineLooks({ vec: { ...base, intensity: 1, boldness: 1 }, message: 'bolder' });
  assert.match(describeChanges(r.changes, r.looks), /already at the limit/);
});

test('direction words', () => {
  assert.equal(messageDeltas('softer please').d.intensity, -0.15);
  assert.equal(messageDeltas('more matte').d.texture, -0.15);
  assert.equal(messageDeltas('warmer').d.warmth, 0.15);
});

test('the vector says which dimensions no tag touched, and the stylist marks what it set', async () => {
  const { buildAestheticVector } = await import('../src/aesthetic.js');
  const v = buildAestheticVector(['afrobeats', 'glam']);
  assert.equal(v.signals.boldness, 0); assert.ok(v.signals.intensity > 0);
  const r = refineLooks({ vec: v, message: 'bolder' });
  assert.deepEqual(r.vec.stylistSet.sort(), ['boldness', 'intensity']);
  assert.deepEqual(refineLooks({ vec: r.vec, message: 'glossier' }).vec.stylistSet.sort(), ['boldness', 'intensity', 'texture']);
});
