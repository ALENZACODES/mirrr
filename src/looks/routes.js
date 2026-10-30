/**
 * Look Book routes. Returns true when the request was handled.
 *   GET  /api/looks/options
 *   GET  /api/looks/search?q=...   looks whose name, description, tags or occasions mention a word
 *   POST /api/looks/plan  { community, category, time, skill, season, look, lip, practise, tone }
 */
import { buildLookPlan, looksOptions, searchLooks } from './studio.js';

export async function handleLooks(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/looks/')) return false;
  if (method === 'GET' && path === '/api/looks/options') {
    sendJSON(res, 200, looksOptions());
    return true;
  }
  if (method === 'GET' && path === '/api/looks/search') {
    sendJSON(res, 200, searchLooks(url.searchParams.get('q')));
    return true;
  }
  if (method === 'POST' && path === '/api/looks/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildLookPlan(body ?? {}));
    return true;
  }
  return false;
}
