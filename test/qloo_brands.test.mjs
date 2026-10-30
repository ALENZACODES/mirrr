import test from 'node:test';
import assert from 'node:assert/strict';
import { qlooTaste, provenance, beautyBrands } from '../src/taste_signals.js';

test('Qloo brand insights keep only beauty and fashion brands', async () => {
  const client = {
    _apiKey: 'x',
    resolveName: async n => ({ id: 'e1', name: n, type: 'urn:entity:artist' }),
    insightTagsOfType: async (ids, t) => (t.includes('music') ? [{ name: 'Afrobeats', affinity: 0.9 }] : []),
    insightBrands: async () => [
      { name: 'Fenty Beauty', affinity: 0.8, tags: ['Cosmetics'] },
      { name: 'Coca-Cola', affinity: 0.7, tags: ['Soft drinks'] },
      { name: 'Some Label', affinity: 0.5, tags: ['Fashion'] },
    ],
  };
  const p = provenance(await qlooTaste(['Burna Boy'], { client }));
  assert.equal(p.calls, 4);
  assert.equal(p.brands_received, 3);
  assert.deepEqual(p.brands.map(b => b.name), ['Fenty Beauty', 'Some Label']);
});

test('no brand call when the client has no insightBrands', async () => {
  assert.deepEqual(beautyBrands([]), []);
});

test('brand filter does not pass cars, drinks or lifestyle tags as beauty', () => {
  const kept = beautyBrands([
    { name: 'Mercedes-Benz', tags: ['Luxury', 'Automotive'] },
    { name: 'Delf Shelf Co', tags: ['Lifestyle', 'Accessories'] },
    { name: 'MAC', tags: [] },
    { name: 'SKIMS', tags: ['Shapewear'] },
    { name: 'Glossy Nails Bar', tags: ['Nail salon'] },
  ]).map(b => b.name);
  assert.deepEqual(kept, ['MAC', 'SKIMS', 'Glossy Nails Bar']);
});
