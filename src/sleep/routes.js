/**
 * Night Routine routes. Returns true when the request was handled.
 *   GET  /api/night/options
 *   POST /api/night/plan  { hair, method, skin, active, position, hours, fitzpatrick, community, tone }
 */
import { buildNightPlan, nightOptions } from './studio.js';

export async function handleNight(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/night/')) return false;
  if (method === 'GET' && path === '/api/night/options') {
    sendJSON(res, 200, nightOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/night/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildNightPlan(body ?? {}));
    return true;
  }
  return false;
}
