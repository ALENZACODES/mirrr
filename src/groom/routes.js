/**
 * Grooming Studio routes. Returns true when the request was handled.
 *   GET  /api/groom/options
 *   GET  /api/groom/search?q=...   rituals, styles and tips that mention a word
 *   POST /api/groom/plan  { texture, goal, tool, direction, problem, scent, heritage, tone }
 */
import { buildGroomPlan, groomOptions, searchGroom } from './studio.js';

export async function handleGroom(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/groom/')) return false;
  if (method === 'GET' && path === '/api/groom/options') {
    sendJSON(res, 200, groomOptions());
    return true;
  }
  if (method === 'GET' && path === '/api/groom/search') {
    sendJSON(res, 200, searchGroom(url.searchParams.get('q')));
    return true;
  }
  if (method === 'POST' && path === '/api/groom/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildGroomPlan(body ?? {}));
    return true;
  }
  return false;
}
