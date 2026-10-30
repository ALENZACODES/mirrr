/** Wig Match and Library search follow-ups (audit 2026-10-30, Fix 5): "Bold Colour" returned zero
 * wigs although a Bold Colour Wig exists, and results sat one click behind the controls.
 * Run: node --test test/stale_render.test.mjs */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { matchWigsForFilters, getWigTextures, getWigCatalogue } from '../src/wig_matchmaker.js';

const aesthetic = { intensity: 0.6, warmth: 0.6, boldness: 0.5, hair_vibe: 'natural-afro', archetypes: [] };

test('Bold Colour returns the colour wigs, the Bold Colour Wig first among them', () => {
  const r = matchWigsForFilters({ aesthetic, texturePref: 'colour', topN: 10 });
  const names = r.wigs.map(w => w.wig.name);
  assert.ok(names.includes('Bold Colour Wig'), names.join(', '));
  for (const { wig } of r.wigs) assert.ok(wig.tags.includes('colour'), wig.name);
});

test('every texture button returns at least one wig on its own', () => {
  for (const t of getWigTextures()) {
    const r = matchWigsForFilters({ aesthetic, texturePref: t.id, topN: 50 });
    assert.ok(r.wigs.length > 0, `${t.label} returns nothing`);
  }
  assert.equal(getWigCatalogue().length, 42);
});

const app = fs.readFileSync('public/app.js', 'utf8');
const lib = fs.readFileSync('public/library.js', 'utf8');

test('MATCH reads the length and texture from the buttons at click time and drops stale replies', () => {
  const fn = app.slice(app.indexOf('async function matchWigs()'), app.indexOf('// Wig Match results'));
  assert.match(fn, /state\.lengthPref = activeChipVal\('wigLengthButtons'\)/);
  assert.match(fn, /state\.texturePref = activeChipVal\('wigTextureButtons'\)/);
  assert.match(fn, /if \(seq !== wigMatchSeq\) return;/);
});

test('Library search renders only the newest query, and re-searches after a community change loads', () => {
  const fn = lib.slice(lib.indexOf('async function runSearch'), lib.indexOf('async function loadLibrary'));
  assert.match(fn, /const seq = \+\+lib\.searchSeq;/);
  assert.match(fn, /if \(seq !== lib\.searchSeq\) return;/);
  const chip = lib.slice(lib.indexOf('if (t.dataset.libCommunity) {'), lib.indexOf('if (t.dataset.libGuide)'));
  assert.match(chip, /loadLibrary\(t\.dataset\.libCommunity\)\.then\(\(\) => \{[\s\S]*runSearch\(q\)/);
  assert.doesNotMatch(chip.slice(0, chip.indexOf('.then(')), /runSearch/);
});
