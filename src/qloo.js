/**
 * Qloo Taste AI client for MIRRR.
 *
 * Wraps the Qloo Hackathon API with:
 *   - Entity search (name → Qloo UID)
 *   - Taste profile (affinities from seed entities)
 *   - Tag/aesthetic inference
 *   - In-memory TTL cache (server-side only)
 *
 * Env vars:
 *   QLOO_API_KEY   — required for live mode
 *   QLOO_BASE_URL  — optional, defaults to https://hackathon.api.qloo.com
 */

const DEFAULT_BASE = 'https://hackathon.api.qloo.com';
const DEFAULT_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// TTL cache
// ---------------------------------------------------------------------------

class TtlCache {
  constructor({ max = 800, ttlMs = 6 * 60 * 60 * 1_000 } = {}) {
    this.max = max;
    this.ttlMs = ttlMs;
    this._map = new Map();
  }

  get(key) {
    const hit = this._map.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this._map.delete(key);
      return undefined;
    }
    // refresh LRU position
    this._map.delete(key);
    this._map.set(key, hit);
    return hit.value;
  }

  set(key, value) {
    if (this._map.size >= this.max) {
      this._map.delete(this._map.keys().next().value);
    }
    this._map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class QlooError extends Error {
  constructor(message, { status, path } = {}) {
    super(message);
    this.name = 'QlooError';
    this.status = status;
    this.path = path;
  }
}

/**
 * Qloo returns entity_id and a generic `type` with the specific kind in `subtype`.
 * Normalise to { id, name, type, ... } so the rest of the app has one shape.
 */
export function normalizeEntity(e = {}) {
  return {
    ...e,
    id: e.id ?? e.entity_id ?? null,
    entity_id: e.entity_id ?? e.id ?? null,
    name: e.name ?? null,
    type: e.subtype ?? e.type ?? null,
  };
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class QlooClient {
  /**
   * @param {object} options
   * @param {string} [options.apiKey]      — defaults to QLOO_API_KEY env var
   * @param {string} [options.baseUrl]     — defaults to QLOO_BASE_URL or DEFAULT_BASE
   * @param {number} [options.timeoutMs]   — request timeout in ms
   * @param {TtlCache} [options.cache]     — injectable cache for testing
   * @param {Function} [options.fetchImpl] — injectable fetch for testing
   */
  constructor({
    apiKey = process.env.QLOO_API_KEY,
    baseUrl = process.env.QLOO_BASE_URL || process.env.QLOO_API_URL || DEFAULT_BASE,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cache = new TtlCache(),
    fetchImpl = globalThis.fetch,
  } = {}) {
    this._apiKey = apiKey;
    this._base = baseUrl.replace(/\/+$/, '');
    this._timeoutMs = timeoutMs;
    this._cache = cache;
    this._fetch = fetchImpl;
  }

  // ------------------------------------------------------------------
  // Low-level
  // ------------------------------------------------------------------

  _headers() {
    if (!this._apiKey) throw new QlooError('QLOO_API_KEY is not set');
    return {
      'X-API-Key': this._apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async _request(method, path, { params, body } = {}) {
    const cacheKey = `${method}:${path}:${JSON.stringify(params || body || {})}`;
    const hit = this._cache.get(cacheKey);
    if (hit !== undefined) return hit;

    // Hard daily ceiling on real upstream calls so usage can never run away.
    const day = new Date().toISOString().slice(0, 10);
    if (this._capDay !== day) { this._capDay = day; this._capCount = 0; }
    const cap = Number(process.env.QLOO_DAILY_CAP ?? 1500);
    if (this._capCount >= cap) throw new QlooError(`Qloo daily call cap (${cap}) reached`, { path });
    this._capCount += 1;

    let url = `${this._base}${path}`;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null)
      );
      url += `?${qs}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeoutMs);

    let resp;
    try {
      resp = await this._fetch(url, {
        method,
        headers: this._headers(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw new QlooError(`Qloo request timed out: ${path}`, { path });
      throw new QlooError(`Qloo network error: ${err.message}`, { path });
    } finally {
      clearTimeout(timer);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new QlooError(
        `Qloo ${method} ${path} returned ${resp.status}: ${text.slice(0, 200)}`,
        { status: resp.status, path }
      );
    }

    const data = await resp.json();
    this._cache.set(cacheKey, data);
    return data;
  }

  // ------------------------------------------------------------------
  // API methods
  // ------------------------------------------------------------------

  /**
   * Search for Qloo entities by name.
   *
   * @param {string} query          — free-text, e.g. "Burna Boy"
   * @param {object} [options]
   * @param {string} [options.type] — entity type URN filter
   * @param {number} [options.limit]
   * @returns {Promise<Array<{id: string, name: string, type: string}>>}
   */
  async search(query, { type, limit = 5 } = {}) {
    const data = await this._request('GET', '/v2/search', {
      params: { query, limit, ...(type ? { type } : {}) },
    });
    // Observed live: { results: [ { entity_id, name, type: 'urn:entity', subtype: 'urn:entity:person', popularity, ... } ] }
    const raw = Array.isArray(data?.results) ? data.results : (data?.results?.entities ?? []);
    return raw.map(normalizeEntity).filter((e) => e.id);
  }

  /**
   * Get Qloo taste recommendations from a seed set of entity IDs.
   *
   * @param {string[]} entityIds     — Qloo entity IDs the user likes
   * @param {object} [options]
   * @param {string} [options.outputType] — output entity type URN
   * @param {number} [options.limit]
   * @returns {Promise<object>} raw Qloo taste response
   */
  async tasteProfile(entityIds, { outputType = 'urn:entity:artist', limit = 20 } = {}) {
    // Observed live: GET /v2/insights returns { results: { entities: [...] } } for entity output types.
    return this._request('GET', '/v2/insights', {
      params: {
        'filter.type': outputType,
        'signal.interests.entities': entityIds.join(','),
        take: limit,
      },
    });
  }

  /**
   * Get aesthetic/vibe tags for a set of entities.
   * Observed live: GET /v2/insights with filter.type=urn:tag returns
   * { results: { tags: [ { tag_id, name, subtype, popularity, query: { affinity } } ] } }.
   *
   * @param {string[]} entityIds
   * @param {number} [limit]
   * @returns {Promise<Array<{id: string, name: string, affinity: number}>>}
   */
  async insightTags(entityIds, limit = 40) {
    const data = await this._request('GET', '/v2/insights', {
      params: {
        'filter.type': 'urn:tag',
        // Cultural tags (genres, themes, keywords) — not hotel ratings or credit-card tags
        'filter.tag.types': 'urn:tag:genre:media,urn:tag:keyword:media',
        'signal.interests.entities': entityIds.join(','),
        take: limit,
      },
    });
    const tags = data?.results?.tags ?? data?.results?.entities ?? [];
    return tags.map((t) => ({
      id: t.tag_id ?? t.id ?? null,
      name: t.name ?? null,
      affinity: t.query?.affinity ?? t.affinity ?? 1,
      popularity: t.popularity ?? null,
    })).filter((t) => t.name);
  }

  /**
   * Tags of one Qloo tag type (e.g. 'urn:tag:genre:music') for a set of entities, with affinity.
   * @returns {Promise<Array<{id, name, affinity, popularity, kind}>>}
   */
  async insightTagsOfType(entityIds, tagTypes, limit = 25) {
    const data = await this._request('GET', '/v2/insights', {
      params: { 'filter.type': 'urn:tag', 'filter.tag.types': tagTypes, 'signal.interests.entities': entityIds.join(','), take: limit },
    });
    const tags = data?.results?.tags ?? data?.results?.entities ?? [];
    return tags.map((t) => ({
      id: t.tag_id ?? t.id ?? null,
      name: String(t.name ?? '').trim() || null,
      affinity: t.query?.affinity ?? t.affinity ?? null,
      popularity: t.popularity ?? null,
      kind: tagTypes,
    })).filter((t) => t.name);
  }

  /**
   * Brands with taste affinity to a set of entities (GET /v2/insights, filter.type=urn:entity:brand).
   * Each brand keeps the names of the tags Qloo attaches to it, so callers can tell beauty and
   * fashion brands from the rest.
   * @returns {Promise<Array<{id, name, affinity, popularity, tags: string[]}>>}
   */
  async insightBrands(entityIds, limit = 50) {
    const data = await this._request('GET', '/v2/insights', {
      params: { 'filter.type': 'urn:entity:brand', 'signal.interests.entities': entityIds.join(','), take: limit },
    });
    const ents = data?.results?.entities ?? [];
    return ents.map((e) => ({
      id: e.entity_id ?? e.id ?? null,
      name: String(e.name ?? '').trim() || null,
      affinity: e.query?.affinity ?? e.affinity ?? null,
      popularity: e.popularity ?? null,
      tags: (e.tags ?? []).map((t) => String(t?.name ?? t ?? '').trim()).filter(Boolean),
    })).filter((b) => b.name);
  }

  /**
   * Resolve a single name to a Qloo entity (returns best match or null).
   *
   * @param {string} name
   * @param {string[]} [preferredTypes] — prefer entities of these type URNs
   * @returns {Promise<object|null>}
   */
  async resolveName(name, preferredTypes = []) {
    const results = await this.search(name, { limit: 10 });
    if (!results.length) return null;
    if (preferredTypes.length) {
      const match = results.find((e) => preferredTypes.includes(e.type));
      if (match) return match;
    }
    return results[0];
  }

  /**
   * Resolve multiple names concurrently.
   *
   * @param {string[]} names
   * @param {number} [concurrency]
   * @returns {Promise<Array<object|null>>}
   */
  async resolveMany(names, concurrency = 5, preferredTypes = ['urn:entity:artist', 'urn:entity:person', 'urn:entity:brand', 'urn:entity:movie', 'urn:entity:tv_show']) {
    const results = [];
    for (let i = 0; i < names.length; i += concurrency) {
      const chunk = names.slice(i, i + concurrency);
      const resolved = await Promise.all(
        chunk.map((name) =>
          this.resolveName(name, preferredTypes).catch((err) => {
            console.warn(`[qloo] resolve failed for ${JSON.stringify(name)}:`, err.message);
            return null;
          })
        )
      );
      results.push(...resolved);
    }
    return results;
  }
}

// ---------------------------------------------------------------------------
// Singleton — shared across all requests so the TtlCache persists
// ---------------------------------------------------------------------------

/**
 * Process-level singleton QlooClient.
 * Import this instead of `new QlooClient()` in route handlers so that
 * the TtlCache survives between requests.
 */
export const qlooClient = new QlooClient();
