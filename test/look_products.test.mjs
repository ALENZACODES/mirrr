import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLookProducts, namedGuideFor } from '../src/product_engine.js';
import { LOOKS } from '../src/look_engine.js';

test('product dialog is titled with the clicked look, with the borrowed formula named', () => {
  const p = getLookProducts('afrobeats_concert', 'deep');
  assert.equal(p.label, 'Afrobeats Concert');
  assert.equal(p.basis, 'archetype');
  assert.equal(p.formulaFrom, 'Afro-Glam Editorial');
  assert.deepEqual(p.namedGuide, { id: 'west_african_glow', name: 'West African Glow' });
  for (const l of LOOKS) { const q = getLookProducts(l.id); if (q) assert.equal(q.label, l.name, l.id); }
});

test('named guides point only at existing looks', () => {
  assert.equal(namedGuideFor('k_beauty_glass').id, 'k_beauty_seoul');
  assert.equal(namedGuideFor('festival_glitter'), null);
});
