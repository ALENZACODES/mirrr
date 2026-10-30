/** Wig Match (audit 2026-10-30, Fix 5): every listed wig respects every selected filter, scores
 * are explained, and no composite image contradicts its own labels. Run: node --test test/wig_match_filters.test.mjs */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { matchWigsForFilters, getWigLengths, getWigTextures, WIG_CHECK_POINTS, wigHasTexture } from '../src/wig_matchmaker.js';

const aesthetic = { intensity: 0.6, warmth: 0.6, boldness: 0.5, hair_vibe: 'natural-afro', archetypes: [] };

test('every wig returned fits every selected filter, for every length x texture pair', () => {
  for (const l of getWigLengths()) for (const t of getWigTextures()) {
    const r = matchWigsForFilters({ aesthetic, lengthPref: l.id, texturePref: t.id, topN: 10 });
    for (const { wig } of r.wigs) {
      if (l.id !== 'any') assert.equal(wig.length, l.id, `${l.id}/${t.id}: ${wig.name}`);
      if (t.id !== 'any') assert.ok(wigHasTexture(wig, t.id), `${l.id}/${t.id}: ${wig.name}`);
    }
    if (!r.wigs.length && l.id !== 'any' && t.id !== 'any') {
      for (const g of r.nearest) for (const { wig } of g.wigs) {
        if (g.kept === 'texture') assert.ok(wigHasTexture(wig, t.id)); else assert.equal(wig.length, l.id);
      }
    }
  }
});

test('Long + Kinky/Natural says nothing fits both instead of showing other styles', () => {
  const r = matchWigsForFilters({ aesthetic, lengthPref: 'long', texturePref: 'kinky' });
  assert.equal(r.wigs.length, 0);
  assert.ok(r.nearest.some(g => g.kept === 'texture'));
  assert.ok(!JSON.stringify(r).match(/Messy Bun|Soft Waves|Sleek Ponytail/));
});

test('the score explanation uses the real points, and the composite image is gone', () => {
  assert.deepEqual(WIG_CHECK_POINTS, { hairVibe: 4, community: 2, lookStyle: 1 });
  const app = fs.readFileSync('public/app.js', 'utf8');
  assert.match(app, /const WIG_POINTS = \{ hairVibe: 4, community: 2, lookStyle: 1 \}/);
  assert.doesNotMatch(fs.readFileSync('public/index.html', 'utf8'), /your-styles\.webp|Box Braids, Senegalese Twists, Goddess Locs/);
});
