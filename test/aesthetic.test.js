/**
 * Tests for the MIRRR aesthetic engine.
 */
import { describe, it, expect } from '@jest/globals';
import { buildAestheticVector, getArchetypes } from '../src/aesthetic.js';

describe('buildAestheticVector', () => {
  it('returns neutral defaults for empty input', () => {
    const vec = buildAestheticVector([]);
    expect(vec.intensity).toBe(0.5);
    expect(vec.warmth).toBe(0.5);
    expect(vec.boldness).toBe(0.5);
    expect(vec.texture).toBe(0.5);
    expect(vec.colour_palette).toBe('neutral');
    expect(vec.hair_vibe).toBe('natural');
    expect(vec.archetypes).toContain('clean_minimal');
  });

  it('produces warm, high-intensity vector for Afrobeats signals', () => {
    const tags = [
      { name: 'afrobeats' },
      { name: 'naija' },
      { name: 'ankara' },
      { name: 'glam' },
    ];
    const vec = buildAestheticVector(tags);
    expect(vec.intensity).toBeGreaterThan(0.6);
    expect(vec.warmth).toBeGreaterThan(0.6);
    expect(vec.colour_palette).toBe('rich-earth');
    expect(vec.archetypes).toContain('afro_glam');
  });

  it('produces cool, low-intensity vector for K-Beauty signals', () => {
    const tags = [
      { name: 'k-beauty' },
      { name: 'glass skin' },
      { name: 'korean' },
      { name: 'dewy' },
    ];
    const vec = buildAestheticVector(tags);
    expect(vec.warmth).toBeLessThan(0.5);
    expect(vec.texture).toBeGreaterThan(0.7);
    expect(vec.archetypes).toContain('k_beauty');
    expect(vec.colour_palette).toBe('soft-pastels');
  });

  it('applies freeText signals', () => {
    const vec = buildAestheticVector([], { freeText: ['bollywood', 'south asian', 'jewel tones'] });
    expect(vec.archetypes).toContain('desi_glam');
  });

  it('picks correct hair_vibe for hip hop signals', () => {
    const tags = [{ name: 'hip hop' }, { name: 'urban' }, { name: 'baddie' }];
    const vec = buildAestheticVector(tags);
    expect(vec.hair_vibe).toBe('long-sleek-wig');
  });

  it('picks correct hair_vibe for Afro signals', () => {
    const tags = [{ name: 'afrobeats' }, { name: 'natural hair' }, { name: 'braids' }];
    const vec = buildAestheticVector(tags);
    expect(vec.hair_vibe).toBe('natural-afro');
  });

  it('all dimensions are in [0, 1]', () => {
    const tags = Array.from({ length: 20 }, (_, i) => ({ name: `tag-${i}` }));
    const vec = buildAestheticVector(tags);
    ['intensity', 'warmth', 'boldness', 'texture'].forEach((dim) => {
      expect(vec[dim]).toBeGreaterThanOrEqual(0);
      expect(vec[dim]).toBeLessThanOrEqual(1);
    });
  });
});

describe('getArchetypes', () => {
  it('returns an array of archetype objects', () => {
    const archetypes = getArchetypes();
    expect(Array.isArray(archetypes)).toBe(true);
    expect(archetypes.length).toBeGreaterThan(4);
  });

  it('each archetype has id, label, keywords', () => {
    const archetypes = getArchetypes();
    for (const a of archetypes) {
      expect(typeof a.id).toBe('string');
      expect(typeof a.label).toBe('string');
      expect(Array.isArray(a.keywords)).toBe(true);
    }
  });
});
