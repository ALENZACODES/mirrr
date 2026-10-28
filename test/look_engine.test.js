/**
 * Tests for the MIRRR look engine.
 */
import { describe, it, expect } from '@jest/globals';
import { LOOKS, scoreLook, recommendLooks } from '../src/look_engine.js';
import { buildAestheticVector } from '../src/aesthetic.js';

describe('LOOKS catalogue', () => {
  it('has at least 7 looks', () => {
    expect(LOOKS.length).toBeGreaterThanOrEqual(7);
  });

  it('every look has required fields', () => {
    for (const look of LOOKS) {
      expect(typeof look.id).toBe('string');
      expect(typeof look.name).toBe('string');
      expect(typeof look.archetype).toBe('string');
      expect(typeof look.description).toBe('string');
      expect(Array.isArray(look.products)).toBe(true);
      expect(Array.isArray(look.wig_styles)).toBe(true);
      expect(typeof look.weights).toBe('object');
    }
  });

  it('every look has all weight dimensions', () => {
    for (const look of LOOKS) {
      const dims = ['intensity', 'warmth', 'boldness', 'texture'];
      for (const d of dims) {
        expect(look.weights[d]).toBeGreaterThanOrEqual(0);
        expect(look.weights[d]).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('scoreLook', () => {
  it('returns a score in [0, 1]', () => {
    const vec = buildAestheticVector([{ name: 'afrobeats' }]);
    for (const look of LOOKS) {
      const score = scoreLook(look, vec);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('afro_glam_editorial scores highest for Afrobeats profile', () => {
    const tags = [
      { name: 'afrobeats' }, { name: 'naija' }, { name: 'ankara' }, { name: 'editorial' },
    ];
    const vec = buildAestheticVector(tags);
    const afroLook = LOOKS.find((l) => l.id === 'afro_glam_editorial');
    const kbLook = LOOKS.find((l) => l.id === 'k_beauty_glass');
    expect(scoreLook(afroLook, vec)).toBeGreaterThan(scoreLook(kbLook, vec));
  });

  it('k_beauty_glass scores higher than afro_glam for K-pop profile', () => {
    const tags = [{ name: 'k-beauty' }, { name: 'glass skin' }, { name: 'dewy' }, { name: 'korean' }];
    const vec = buildAestheticVector(tags);
    const afroLook = LOOKS.find((l) => l.id === 'afro_glam_editorial');
    const kbLook = LOOKS.find((l) => l.id === 'k_beauty_glass');
    expect(scoreLook(kbLook, vec)).toBeGreaterThan(scoreLook(afroLook, vec));
  });
});

describe('recommendLooks', () => {
  it('returns topN looks by default', () => {
    const vec = buildAestheticVector([{ name: 'dancehall' }, { name: 'soca' }]);
    const recs = recommendLooks(vec, { topN: 3 });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it('results are sorted by score descending', () => {
    const vec = buildAestheticVector([{ name: 'bollywood' }, { name: 'desi' }]);
    const recs = recommendLooks(vec, { topN: 5 });
    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i].score).toBeGreaterThanOrEqual(recs[i + 1].score);
    }
  });

  it('every recommendation has look, score, wigStyle', () => {
    const vec = buildAestheticVector([{ name: 'hip hop' }, { name: 'r&b' }]);
    const recs = recommendLooks(vec);
    for (const r of recs) {
      expect(r.look).toBeDefined();
      expect(typeof r.score).toBe('number');
      // wigStyle can be null for looks with no wig_styles
    }
  });

  it('handles empty vector gracefully', () => {
    const vec = buildAestheticVector([]);
    const recs = recommendLooks(vec, { topN: 3 });
    expect(Array.isArray(recs)).toBe(true);
  });
});
