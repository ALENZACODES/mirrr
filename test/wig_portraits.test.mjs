// Wig Match: a style portrait for all 42 catalogue styles (inventory lines 237-275 + the 3 the UI hides) keyed by real wig ids, WebP of 60 KB or less, alt text names
// the style, labelled as generated, and no composite picture comes back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { WIG_CATALOGUE } from '../src/wig_matchmaker.js';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '../public');
const app = readFileSync(join(PUB, 'app.js'), 'utf8');
const ids = [...app.match(/WIG_PORTRAITS = new Set\(\[([^\]]+)\]\)/)[1].matchAll(/'([a-z_]+)'/g)].map(m => m[1]);

test('every catalogue wig has a portrait, WebP of 60 KB or less', () => {
  const known = new Set(WIG_CATALOGUE.map(w => w.id));
  assert.equal(ids.length, WIG_CATALOGUE.length);
  assert.deepEqual([...known].filter(id => !ids.includes(id)), []);
  for (const id of ids) {
    assert.ok(known.has(id), `${id} is a catalogue wig`);
    const f = join(PUB, 'wigs', `${id}.webp`);
    assert.equal(readFileSync(f).subarray(8, 12).toString(), 'WEBP', id);
    assert.ok(statSync(f).size <= 60 * 1024, id);
  }
});

test('wig list items show the portrait with honest labels; no composite image', () => {
  assert.match(app, /alt="\$\{esc\(wig\.name\)\} — hairstyle portrait"/);
  assert.doesNotMatch(app, /not a real person/);
  assert.doesNotMatch(app, /wig-composite|wigComposite/);
});

test('a missing wig portrait falls back to the text-only card', () => {
  assert.match(app, /data-wig-portrait="\$\{esc\(wig\.id\)\}" onerror="this\.parentElement\.remove\(\)"/);
});
