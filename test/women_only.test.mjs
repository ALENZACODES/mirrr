/** MIRRR is for women (audit 2026-10-30, Fix 1): no men's grooming studio, guides, faces or
 * references. Run: node --test test/women_only.test.mjs */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { isMensContent, withoutMensContent } from '../src/women_only.js';
import { searchLibrary, listLibrary, readGuide, guideIds } from '../src/library/index.js';
import { buildNailScentPlan, nailScentOptions } from '../src/nails/studio.js';
import { buildHairRemovalPlan, hairRemovalOptions } from '../src/bodyhair/studio.js';

const strings = (v, out = []) => { if (typeof v === 'string') out.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out)); return out; };

test('the men\'s-content check catches beards and men\'s products, not women\'s words', () => {
  for (const s of ['grow a beard', 'Classic men\'s fragrance format', 'face (men)', 'a barbershop fade']) assert.ok(isMensContent(s), s);
  for (const s of ['women\'s rituals', 'menstrual cycle', 'threading the upper lip', 'shaving your legs']) assert.ok(!isMensContent(s), s);
  assert.deepEqual(withoutMensContent({ a: ['ok', 'beard oil'], beardStyles: ['x'], b: 'fine' }), { a: ['ok'], b: 'fine' });
});

test('a library search for beard, moustache or barbershop returns nothing', () => {
  for (const q of ['beard', 'beards', 'moustache', 'barbershop', 'goatee']) assert.equal(searchLibrary(q).total, 0, q);
});

test('the library has no grooming shelf and no guide shows men\'s content', () => {
  assert.ok(!listLibrary().shelves.some(s => s.id === 'grooming' || /beard|groom/i.test(s.title)));
  assert.ok(!guideIds().some(id => /beard|mens_groom/.test(id)));
  for (const id of guideIds()) for (const c of [null, 'west-african', 'south-asian']) {
    const g = readGuide(id, c);
    assert.ok(!strings(g.sections).some(isMensContent), `${id} ${c}`);
  }
});

test('Nails & Scent and Hair Removal carry no men\'s references in any option', () => {
  for (const [opts, build] of [[nailScentOptions, buildNailScentPlan], [hairRemovalOptions, buildHairRemovalPlan]]) {
    const o = opts();
    assert.ok(!strings(o).some(isMensContent));
    for (const [k, arr] of Object.entries(o).filter(([, v]) => Array.isArray(v))) for (const item of arr) {
      const field = k.replace(/ies$/, 'y').replace(/s$/, '');
      const plan = build({ [field]: item.id ?? item });
      const bad = strings(plan).filter(isMensContent);
      assert.deepEqual(bad, [], `${field}=${item.id ?? item}`);
    }
  }
});

test('no Grooming Studio view, script, nav entry or bearded face template ships', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.ok(!/data-view="groom"|groom\.js|Grooming Studio/.test(html));
  assert.ok(!fs.existsSync('public/groom.js') && !fs.existsSync('src/groom'));
  for (const f of fs.readdirSync('public').filter(n => /\.(js|html)$/.test(n))) {
    assert.doesNotMatch(fs.readFileSync(`public/${f}`, 'utf8'), /\bbeards?\b|moustache|barbershop/i, f);
  }
});
