/**
 * Hair Removal Planner routes. Returns true when the request was handled.
 *   GET  /api/hair-removal/options
 *   POST /api/hair-removal/plan  { area, hair, colour, fitzpatrick, method, occasion, community, tone }
 */
import { buildHairRemovalPlan, hairRemovalOptions } from './studio.js';

export async function handleHairRemoval(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/hair-removal/')) return false;
  if (method === 'GET' && path === '/api/hair-removal/options') {
    sendJSON(res, 200, hairRemovalOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/hair-removal/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildHairRemovalPlan(body ?? {}));
    return true;
  }
  return false;
}
