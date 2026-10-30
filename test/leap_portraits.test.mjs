// Taste Leap city portraits: every city has one, it is a real WebP under the portrait size limit,
// its alt text says what the photo shows, and the plan hands it to the view.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { DESTINATIONS, buildLeapPlan, leapOptions } from '../src/leap/studio.js';
import { LEAP_PORTRAITS, PORTRAIT_NOTE } from '../src/leap/portraits.js';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '../public');
const noQloo = () => { throw new Error('pipeline must not be called'); };

test('every Leap city has a WebP portrait of 120 KB or less', () => {
  for (const d of DESTINATIONS) {
    const p = LEAP_PORTRAITS[d.id];
    assert.ok(p, `${d.id} has a portrait`);
    assert.equal(p.src, `/leap/${d.id}.webp`);
    const f = join(PUB, p.src);
    const b = readFileSync(f);
    assert.equal(b.subarray(0, 4).toString(), 'RIFF'); assert.equal(b.subarray(8, 12).toString(), 'WEBP');
    assert.ok(statSync(f).size <= 120 * 1024, `${d.id} is ${statSync(f).size} bytes`);
    assert.ok(p.shows.length > 10, `${d.id} says what it shows`);
  }
  assert.equal(Object.keys(LEAP_PORTRAITS).length, DESTINATIONS.length);
  assert.match(PORTRAIT_NOTE, /generated sample photos of women, not real people/);
});

test('the plan carries each city portrait; options list them too', async () => {
  const p = await buildLeapPlan({ dest1: 'marrakech', dest2: 'istanbul', dest3: 'addis_ababa' }, { pipeline: noQloo });
  assert.deepEqual(p.leaps.map(L => L.destination.portrait.src), ['/leap/marrakech.webp', '/leap/istanbul.webp', '/leap/addis_ababa.webp']);
  assert.ok(leapOptions().destinations.every(d => d.portrait?.src));
});

test('the four new cities rank their own culture\'s looks', async () => {
  const want = { marrakech: /amazigh|moroccan/, istanbul: /turkish/, bangkok: /thai|southeast/, addis_ababa: /ethiopian/ };
  for (const [id, re] of Object.entries(want)) {
    const p = await buildLeapPlan({ dest1: id }, { pipeline: noQloo });
    assert.match(p.leaps[0].look.id, re, id);
  }
});

test('the Leap view shows the portrait with its label and keeps the model face in your tone', () => {
  const js = readFileSync(join(PUB, 'leap.js'), 'utf8');
  assert.match(js, /data-lp-portrait=/);
  assert.match(js, /Generated photo, not a real person/);
  assert.match(js, /— portrait"/);
  assert.match(js, /data-lp-face=/); // the tone-matched model face is still painted
});
