/** Packaging (audit 2026-10-30): the README's numbers match the code, the lockfile is committed and
 * there are no runtime dependencies. Run: node --test test/readme_numbers.test.mjs */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { SHADE_SPECTRUM } from '../src/shade_finder.js';
import { getWigCatalogue } from '../src/wig_matchmaker.js';
import { LOOKS } from '../src/look_engine.js';
import { QUIZ_QUESTIONS } from '../src/cultural_dna.js';
import { REGIONAL_ANCHORS } from '../src/trending_artists.js';

const readme = fs.readFileSync('README.md', 'utf8');

test('README counts match the code', () => {
  assert.equal(SHADE_SPECTRUM.length, 60); assert.match(readme, /60-shade foundation spectrum/);
  assert.doesNotMatch(readme, /\b30-shade\b|\b30 shades\b/);
  assert.equal(getWigCatalogue().length, 42); assert.match(readme, /42 wig styles/);
  assert.equal(LOOKS.length, 63); assert.match(readme, /63 multicultural looks across 9 archetypes/);
  assert.equal(new Set(LOOKS.map(l => l.archetype)).size, 9);
  assert.equal(QUIZ_QUESTIONS.length, 5); assert.match(readme, /A 5-question quiz/);
  assert.equal(Object.keys(REGIONAL_ANCHORS).length, 9); assert.match(readme, /across 9 cultural regions/);
  const deep = SHADE_SPECTRUM.filter(s => s.tier === 'deep' || s.tier === 'rich-deep').length;
  assert.match(readme, new RegExp(`with ${deep} shades in the deep and rich-deep tiers`));
});

test('README wig examples are real catalogue names', () => {
  const names = new Set(getWigCatalogue().map(w => w.name));
  for (const n of ['Senegalese Twists', 'Goddess Braids', 'Kinky Coily Afro']) assert.ok(names.has(n), n);
});

test('README carries no unsourced market statistics', () => {
  assert.doesNotMatch(readme, /McKinsey|2\.4×|4\+ billion|250M\+/);
});

test('lockfile is committed and there are no runtime dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.equal(pkg.type, 'module');
  assert.ok(execSync('git ls-files package-lock.json').toString().trim() === 'package-lock.json');
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  assert.deepEqual(lock.packages[''].dependencies ?? {}, {});
});
