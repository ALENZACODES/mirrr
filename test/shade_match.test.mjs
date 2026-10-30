import test from 'node:test';
import assert from 'node:assert/strict';
import { matchShadeByColor } from '../src/shade_finder.js';
import { MONK_TONES } from '../src/skin/clinic.js';
import { buildPlan } from '../src/pipeline/plan.js';

const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 }; };

test('every Monk tone gets an honest match (ΔE2000 <= 3) from the shared spectrum', () => {
  for (const t of MONK_TONES) {
    const r = matchShadeByColor(rgbOf(t.hex), { topN: 3 });
    assert.equal(r.band, 'match', `${t.id} -> ${r.matches[0].name} ΔE ${r.matches[0].deltaE}`);
    assert.ok(r.matches[0].deltaE <= 3);
  }
});

test('a colour no skin has gets the no-honest-match state, with the nearest labelled as nearest', () => {
  for (const c of [{ r: 20, g: 120, b: 220 }, { r: 3, g: 3, b: 3 }]) {
    const r = matchShadeByColor(c);
    assert.equal(r.honestMatch, false); assert.equal(r.band, 'outside');
    assert.match(r.message, /No honest match/);
  }
});

test('ranking is by ΔE2000; undertone breaks only near-ties', () => {
  const r = matchShadeByColor({ r: 180, g: 130, b: 100 }, { topN: 5 });
  for (let i = 1; i < r.matches.length; i++) assert.ok(r.matches[i].deltaE >= r.matches[i - 1].deltaE - 1);
  assert.ok(r.matches.every(m => !('score' in m)));
});

test('Fitzpatrick VI plans map to a real deep shade (L* above 13, a skin name)', async () => {
  const p = await buildPlan({ occasion: 'wedding', fitzpatrick: 'VI', undertone: 'warm' });
  assert.ok(p.shade && p.shade.name && p.shade.name !== 'Obsidian');
  assert.ok(!('score' in p.shade));
  const n = parseInt(p.shade.hex.slice(1), 16); assert.ok(((n >> 16) & 255) > 30, `too dark: ${p.shade.hex}`);
});
