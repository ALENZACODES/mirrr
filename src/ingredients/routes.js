/**
 * Ingredient Checker routes. Returns true when the request was handled.
 *   GET  /api/mix/options
 *   GET  /api/mix/term?q=...      glossary lookup
 *   POST /api/mix/plan  { a, b, c, d, fitzpatrick, stage, concern, community, tone }
 */
import { buildMixPlan, mixOptions, lookupGlossary } from './studio.js';

export async function handleMix(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/mix/')) return false;
  if (method === 'GET' && path === '/api/mix/options') {
    sendJSON(res, 200, mixOptions());
    return true;
  }
  if (method === 'GET' && path === '/api/mix/term') {
    sendJSON(res, 200, lookupGlossary(url.searchParams.get('q')));
    return true;
  }
  if (method === 'POST' && path === '/api/mix/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildMixPlan(body ?? {}));
    return true;
  }
  return false;
}
