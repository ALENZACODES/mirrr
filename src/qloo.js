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
    baseUrl = process.env.QLOO_BASE_URL || DEFAULT_BASE,
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
  async tasteProfile(entityIds, { outputType, limit = 20 } = {}) {
    return this._request('POST', '/v2/taste', {
      body: {
        signal: { entities: entityIds },
        limit,
        ...(outputType ? { output_type: outputType } : {}),
      },
    });
  }

  /**
   * Get aesthetic/vibe tags for a set of entities.
   *
   * @param {string[]} entityIds
   * @param {number} [limit]
   * @returns {Promise<Array<{id: string, name: string, affinity: number}>>}
   */
  async insightTags(entityIds, limit = 40) {
    const data = await this._request('POST', '/v2/taste', {
      body: {
        signal: { entities: entityIds },
        output_type: 'urn:entity:tag',
        limit,
      },
    });
    return data?.results?.entities ?? [];
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
  async resolveMany(names, concurrency = 5) {
    const results = [];
    for (let i = 0; i < names.length; i += concurrency) {
      const chunk = names.slice(i, i + concurrency);
      const resolved = await Promise.all(
        chunk.map((name) =>
          this.resolveName(name).catch((err) => {
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
