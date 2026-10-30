/** "Finish your look — your choice" (audit 2026-10-30, Fix 2): never a wig by default.
 * Run: node --test test/finishing.test.mjs */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { FINISH_OPTIONS, normaliseFinish, finishingSteps } from '../src/finishing.js';
import { buildPlan } from '../src/pipeline/plan.js';
import { buildTransform } from '../src/pipeline/transform.js';
import { LOOKS } from '../src/look_engine.js';

test('the options are the seven equals, in order', () => {
  assert.deepEqual(FINISH_OPTIONS.map(o => o.label), ['Wigs', 'Lashes', 'Brows', 'My Natural Hair', 'Locs & Braids', 'Nails', 'None — I’m done']);
  assert.deepEqual(normaliseFinish(['WIGS', 'bogus', 'wigs', 'none']), ['wigs']);
  assert.deepEqual(finishingSteps(['none']), []);
});

test('the planner never pairs a wig unless Wigs was picked', async () => {
  for (const occasion of ['wedding', 'night out', 'eid']) for (const communityId of ['west-african', 'south-asian', 'east-asian']) {
    const p = await buildPlan({ occasion, communityId });
    assert.equal(p.wig, null, `${occasion} ${communityId}`);
    assert.ok(!JSON.stringify(p.finishing).match(/wig:/i));
    assert.equal(p.finishing.steps[0].option, 'natural');
  }
  const w = await buildPlan({ occasion: 'wedding', communityId: 'west-african', finish: ['wigs'] });
  assert.ok(w.wig?.name && w.finishing.steps.some(s => s.option === 'wigs'));
});

test('the Transform hair stage styles her own hair unless she picked wigs; lashes only when picked', async () => {
  for (const l of LOOKS.slice(0, 20)) {
    const t = await buildTransform({ targetLookId: l.id });
    const steps = t.stages.flatMap(s => s.steps);
    assert.ok(!steps.some(s => s.wig || /^Hair: /.test(s.title)), l.id);
    assert.ok(!steps.some(s => /\bLashes: /.test(s.technique)), l.id);
    assert.doesNotMatch(t.stages[1].subtitle, /book the hair/);
  }
  const w = await buildTransform({ targetLookId: 'afrobeats_concert', finish: ['wigs'] });
  assert.ok(w.stages[1].steps.some(s => s.wig));
  const locs = await buildTransform({ targetLookId: 'afrobeats_concert', finish: ['locs'] });
  assert.ok(locs.stages[1].steps.some(s => s.title === 'Locs & braids'));
});

test('Taste and Shade results end with the options panel, not a wig button', () => {
  const app = fs.readFileSync('public/app.js', 'utf8');
  assert.doesNotMatch(app, /Match Wigs for These Looks|Now Match Your Wig|toLooksWigBtn|shadeToWigBtn/);
  assert.equal((app.match(/finishPanelHTML\('(taste|shade)'\)/g) ?? []).length, 2);
  assert.doesNotMatch(app, /aria-pressed="true"/); // nothing pre-selected
  assert.match(app, /finish: loadFinish\(\)/);
});
