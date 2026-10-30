import { describe, it, expect } from '@jest/globals';
import { buildTransform, rankLooksForTaste, TransformInputError } from '../src/pipeline/transform.js';
import { SHADE_SPECTRUM } from '../src/shade_finder.js';

const ids = new Set(SHADE_SPECTRUM.map((s) => s.id));
const face = { undertone: 'warm', depth: 30, hairTexture: '4c', hairLength: 'medium', communityId: 'west_african' };

function allShades(plan) {
  return plan.stages.flatMap((s) => s.steps).filter((st) => st.shade).map((st) => st.shade);
}

describe('transformation engine', () => {
  it('returns the three stages in order', async () => {
    const p = await buildTransform({ face, targetLookId: 'afro_glam_editorial' });
    expect(p.stages.map((s) => s.id)).toEqual(['today', 'week', 'full']);
    expect(p.stages.every((s) => s.steps.length > 0)).toBe(true);
    expect(p.target.id).toBe('afro_glam_editorial');
  });

  it('stage 1 is makeup only; stage 2 is brows and hair', async () => {
    const p = await buildTransform({ face, targetLookId: 'afro_glam_editorial' });
    expect(new Set(p.stages[0].steps.map((s) => s.area))).toEqual(new Set(['base', 'eyes', 'lips']));
    expect(new Set(p.stages[1].steps.map((s) => s.area))).toEqual(new Set(['brows', 'hair']));
  });

  it('every shade is a real spectrum entry, with and without a shadeId', async () => {
    const a = await buildTransform({ face, targetLookId: 'desi_everyday_chic' });
    const b = await buildTransform({ face: { ...face, shadeId: SHADE_SPECTRUM[10].id }, targetLookId: 'desi_everyday_chic' });
    const c = await buildTransform({ face: { shadeId: 'NOPE' }, targetLookId: 'desi_everyday_chic' });
    for (const p of [a, b, c]) {
      expect(allShades(p).length).toBeGreaterThan(0);
      for (const sh of allShades(p)) expect(ids.has(sh.code)).toBe(true);
    }
    expect(allShades(b)[0].code).toBe(SHADE_SPECTRUM[10].id);
  });

  it('rejects a missing or unknown look with a 400-class error', async () => {
    await expect(buildTransform({ face, targetLookId: 'no_such_look' })).rejects.toBeInstanceOf(TransformInputError);
    await expect(buildTransform({ face })).rejects.toMatchObject({ status: 400 });
  });

  it('names the chips that drove the choice, and nothing for unknown chips', async () => {
    const known = await buildTransform({ face, targetLookId: 'afro_glam_editorial', tasteChips: ['afrobeats', 'gold'] });
    expect(known.because.length).toBeGreaterThan(0);
    expect(known.because[0]).toMatch(/^Because you love /);
    expect(known.source).toBe('taste+catalogue');
    const none = await buildTransform({ face, targetLookId: 'afro_glam_editorial', tasteChips: ['zzzzunknown'] });
    expect(none.because).toEqual([]);
    const empty = await buildTransform({ face, targetLookId: 'afro_glam_editorial' });
    expect(empty.because).toEqual([]);
    expect(empty.source).toBe('catalogue');
  });
});

describe('taste changes the ranking (mocked tag inputs, no network)', () => {
  it('different taste sets yield different top looks', () => {
    const a = rankLooksForTaste(['afrobeats', 'gold'], { topN: 3 });
    const b = rankLooksForTaste(['k-pop', 'glass skin'], { topN: 3 });
    expect(a[0].id).not.toBe(b[0].id);
    expect(a.map((x) => x.id)).not.toEqual(b.map((x) => x.id));
  });
});
