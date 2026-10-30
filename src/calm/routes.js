/**
 * Calm & Self-Image routes. Returns true when the request was handled.
 *   GET  /api/calm/options
 *   GET  /api/calm/search?q=...   rituals across communities that mention a word
 *   POST /api/calm/plan  { community, ritual, minutes, focus, principle, season, scent, hair, region, fitzpatrick, tone }
 */
import { buildCalmPlan, calmOptions, searchCalmRituals } from './studio.js';

export async function handleCalm(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/calm/')) return false;
  if (method === 'GET' && path === '/api/calm/options') {
    sendJSON(res, 200, calmOptions());
    return true;
  }
  if (method === 'GET' && path === '/api/calm/search') {
    sendJSON(res, 200, searchCalmRituals(url.searchParams.get('q')));
    return true;
  }
  if (method === 'POST' && path === '/api/calm/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildCalmPlan(body ?? {}));
    return true;
  }
  return false;
}
