/** Product dialog seams (audit 2026-10-30, Fix 7): every look's products say where they come
 * from, and every named-brand link points at a curated guide that exists. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { getLookProducts } from '../src/product_engine.js';
import { LOOKS } from '../src/look_engine.js';
import { getPersonalisedLook } from '../src/style_match_engine.js';

test('fallback product lists are labelled with their basis; named guides exist with brands', () => {
  for (const l of LOOKS) {
    const p = getLookProducts(l.id);
    assert.equal(p.label, l.name);
    if (p.basis !== 'curated') { assert.ok(p.formulaFrom, l.id); assert.ok(typeof p.note === 'string' && p.note.length > 10, l.id); }
    if (p.namedGuide) {
      const g = getPersonalisedLook(p.namedGuide.id, 'IV', 'neutral');
      assert.ok(g && !g.error, `${l.id} -> ${p.namedGuide.id}`);
      assert.doesNotMatch(JSON.stringify(g), /\[object Object\]/);
    }
  }
});
