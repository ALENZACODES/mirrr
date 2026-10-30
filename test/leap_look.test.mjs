/** "Leap this look" (Phase 3): Taste and Style Match look cards open Taste Leap starting from that look.
 * Run: node --test test/leap_look.test.mjs */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildLeapPlan } from '../src/leap/studio.js';
import { LOOKS } from '../src/look_engine.js';

const noPipeline = async () => { throw new Error('a look leap must not run the taste pipeline'); };

test('a look leap starts from that look\'s own four weights, with no taste run', async () => {
  const look = LOOKS.find(l => l.id === 'mehndi_bridal');
  const p = await buildLeapPlan({ lookId: look.id, dest1: 'seoul', dest2: 'lagos', dest3: 'istanbul' }, { pipeline: noPipeline });
  assert.equal(p.choices.lookId, look.id);
  assert.equal(p.taste.source, 'look');
  assert.deepEqual(p.taste.inputs, [look.name]);
  for (const k of ['intensity', 'warmth', 'boldness', 'texture']) assert.equal(p.taste.vector[k], look.weights[k]);
  assert.equal(p.home.id, look.id);
  assert.equal(p.home.basis, 'the look you chose to leap');
  assert.match(p.taste.badge, /no taste run/);
  assert.equal(p.leaps.length, 3);
});

test('an unknown look id is ignored and the plan falls back to the chosen profile', async () => {
  const p = await buildLeapPlan({ lookId: 'not_a_look', profile: 'afrobeats' }, { pipeline: noPipeline });
  assert.equal(p.choices.lookId, undefined);
  assert.equal(p.taste.source, 'demo');
});

test('Taste and Style Match cards carry the button; Style Match ids leap from their plan look', () => {
  const app = fs.readFileSync('public/app.js', 'utf8');
  const card = app.slice(app.indexOf('function renderLookCard'), app.indexOf('function renderLookCard') + 4000);
  assert.match(card, /data-leap-look="\$\{look\.id\}"[^>]*>Leap this look: see it in three other cultures/);
  const sm = app.slice(app.indexOf('sm-photo'), app.indexOf('sm-photo') + 3000);
  assert.match(sm, /data-leap-look="\$\{look\.id\}"[^>]*>Leap this look: see it in three other cultures/);
  assert.equal((app.match(/class="leap-line"/g) ?? []).length, 4, 'Taste, Style Match, DNA result and Transform picker cards');
  assert.match(app, /const lookId = STYLE_MATCH_PLAN_LOOK\[id\] \?\? id;/);
  assert.match(app, /new CustomEvent\('mirrr:leap-look'/);
  const leap = fs.readFileSync('public/leap.js', 'utf8');
  assert.match(leap, /addEventListener\('mirrr:leap-look'/);
  assert.match(leap, /Use my taste instead/);
});
