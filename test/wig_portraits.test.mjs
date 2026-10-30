// Wig Match: twelve style portraits keyed by real wig ids, WebP of 60 KB or less, alt text names
// the style, labelled as generated, and no composite picture comes back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { WIG_CATALOGUE } from '../src/wig_matchmaker.js';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '../public');
const app = readFileSync(join(PUB, 'app.js'), 'utf8');
const ids = JSON.parse(app.match(/WIG_PORTRAITS = new Set\((\[[^\]]+\])\)/)[1].replace(/'/g, '"'));

test('twelve wig portraits, each a real catalogue style, WebP of 60 KB or less', () => {
  assert.equal(ids.length, 12);
  const known = new Set(WIG_CATALOGUE.map(w => w.id));
  for (const id of ids) {
    assert.ok(known.has(id), `${id} is a catalogue wig`);
    const f = join(PUB, 'wigs', `${id}.webp`);
    assert.equal(readFileSync(f).subarray(8, 12).toString(), 'WEBP', id);
    assert.ok(statSync(f).size <= 60 * 1024, id);
  }
});

test('wig list items show the portrait with honest labels; no composite image', () => {
  assert.match(app, /alt="\$\{esc\(wig\.name\)\} — hairstyle portrait"/);
  assert.match(app, /Generated photo, not a real person/);
  assert.doesNotMatch(app, /wig-composite|wigComposite/);
});
