/**
 * Eco Beauty routes. Returns true when the request was handled.
 *   GET  /api/eco/options
 *   GET  /api/eco/term?q=...      eco glossary lookup
 *   POST /api/eco/plan  { swap, community, season, ingredient, focus, hair, fitzpatrick, tone }
 */
import { buildEcoPlan, ecoOptions, lookupEcoTerm } from './studio.js';

export async function handleEco(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/eco/')) return false;
  if (method === 'GET' && path === '/api/eco/options') {
    sendJSON(res, 200, ecoOptions());
    return true;
  }
  if (method === 'GET' && path === '/api/eco/term') {
    sendJSON(res, 200, lookupEcoTerm(url.searchParams.get('q')));
    return true;
  }
  if (method === 'POST' && path === '/api/eco/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildEcoPlan(body ?? {}));
    return true;
  }
  return false;
}
