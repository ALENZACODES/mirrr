/**
 * Tests for MIRRR Qloo client.
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { QlooClient, QlooError } from '../src/qloo.js';

// ---------------------------------------------------------------------------
// Mock fetch helper
// ---------------------------------------------------------------------------

function makeFetch(responseBody, status = 200) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => responseBody,
    text: async () => JSON.stringify(responseBody),
  });
}

// ---------------------------------------------------------------------------
// QlooClient
// ---------------------------------------------------------------------------

describe('QlooClient', () => {
  it('throws QlooError when QLOO_API_KEY is not set', async () => {
    const client = new QlooClient({ apiKey: '', fetchImpl: makeFetch({}) });
    await expect(client.search('Burna Boy')).rejects.toThrow(QlooError);
  });

  describe('search()', () => {
    it('returns entity array on success', async () => {
      const body = { results: { entities: [{ id: 'q1', name: 'Burna Boy', type: 'urn:entity:artist' }] } };
      const client = new QlooClient({ apiKey: 'test-key', fetchImpl: makeFetch(body) });
      const results = await client.search('Burna Boy');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Burna Boy');
    });

    it('returns empty array on missing results', async () => {
      const client = new QlooClient({ apiKey: 'test-key', fetchImpl: makeFetch({}) });
      const results = await client.search('nothing');
      expect(results).toEqual([]);
    });

    it('throws QlooError on non-2xx response', async () => {
      const client = new QlooClient({ apiKey: 'test-key', fetchImpl: makeFetch({ error: 'not found' }, 404) });
      await expect(client.search('x')).rejects.toThrow(QlooError);
    });
  });

  describe('resolveName()', () => {
    it('returns first result when no preferred types', async () => {
      const body = { results: { entities: [
        { id: 'q1', name: 'Burna Boy', type: 'urn:entity:artist' },
        { id: 'q2', name: 'Burna Boy Fan Page', type: 'urn:entity:brand' },
      ] } };
      const client = new QlooClient({ apiKey: 'test-key', fetchImpl: makeFetch(body) });
      const entity = await client.resolveName('Burna Boy');
      expect(entity.id).toBe('q1');
    });

    it('prefers entity matching preferred type', async () => {
      const body = { results: { entities: [
        { id: 'q1', name: 'Lagos', type: 'urn:entity:destination' },
        { id: 'q2', name: 'Lagos Artist', type: 'urn:entity:artist' },
      ] } };
      const client = new QlooClient({ apiKey: 'test-key', fetchImpl: makeFetch(body) });
      const entity = await client.resolveName('Lagos', ['urn:entity:artist']);
      expect(entity.id).toBe('q2');
    });

    it('returns null when no results', async () => {
      const client = new QlooClient({ apiKey: 'test-key', fetchImpl: makeFetch({ results: { entities: [] } }) });
      const entity = await client.resolveName('xyzzy');
      expect(entity).toBeNull();
    });
  });

  describe('resolveMany()', () => {
    it('resolves all names and returns array of same length', async () => {
      const body = { results: { entities: [{ id: 'q1', name: 'Test', type: 'urn:entity:artist' }] } };
      const client = new QlooClient({ apiKey: 'test-key', fetchImpl: makeFetch(body) });
      const results = await client.resolveMany(['Afrobeats', 'Lagos', 'Amapiano'], 3);
      expect(results).toHaveLength(3);
    });

    it('returns null for failed items without throwing', async () => {
      let call = 0;
      const mockFetch = async () => {
        call++;
        if (call === 2) throw new Error('network fail');
        return { ok: true, json: async () => ({ results: { entities: [{ id: `q${call}`, name: 'x', type: 'y' }] } }), text: async () => '' };
      };
      const client = new QlooClient({ apiKey: 'test-key', fetchImpl: mockFetch });
      const results = await client.resolveMany(['a', 'b', 'c'], 3);
      expect(results).toHaveLength(3);
      expect(results[1]).toBeNull();
    });
  });

  describe('caching', () => {
    it('returns cached result on second call', async () => {
      let fetchCount = 0;
      const mockFetch = async () => {
        fetchCount++;
        return { ok: true, json: async () => ({ results: { entities: [{ id: 'q1', name: 'x', type: 'y' }] } }), text: async () => '' };
      };
      const client = new QlooClient({ apiKey: 'test-key', fetchImpl: mockFetch });
      await client.search('Burna Boy');
      await client.search('Burna Boy');
      expect(fetchCount).toBe(1);
    });
  });
});
