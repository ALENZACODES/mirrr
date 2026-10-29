import { describe, it, expect } from '@jest/globals';
import { buildAestheticVector } from '../src/aesthetic.js';

describe('affinity weighting', () => {
  it('is identical to unweighted scoring when no affinities exist', () => {
    const plain = buildAestheticVector(['glam', 'bold', 'natural']);
    const strs = buildAestheticVector([{ name: 'glam' }, { name: 'bold' }, { name: 'natural' }]);
    expect(strs.intensity).toBe(plain.intensity);
    expect(strs.boldness).toBe(plain.boldness);
  });

  it('different affinities on the same tags move the vector by >= 0.1', () => {
    const a = buildAestheticVector([
      { name: 'afrobeats', affinity: 0.95 },
      { name: 'minimalist', affinity: 0.05 },
    ]);
    const b = buildAestheticVector([
      { name: 'afrobeats', affinity: 0.05 },
      { name: 'minimalist', affinity: 0.95 },
    ]);
    const diff = Math.max(
      Math.abs(a.intensity - b.intensity),
      Math.abs(a.boldness - b.boldness),
      Math.abs(a.warmth - b.warmth),
      Math.abs(a.texture - b.texture),
    );
    expect(diff).toBeGreaterThanOrEqual(0.1);
  });

  it('reads affinity from score and query.affinity fallbacks', () => {
    const a = buildAestheticVector([{ name: 'afrobeats', score: 0.9 }, { name: 'minimalist', query: { affinity: 0.1 } }]);
    expect(a.trace.join(' ')).toContain('affinity-weighted');
  });
});
