/**
 * Pregnancy & Postpartum routes. Returns true when the request was handled.
 *   GET  /api/bump/options
 *   POST /api/bump/plan  { stage, concern, ingredient, fitzpatrick, community, tone }
 */
import { buildBumpPlan, bumpOptions } from './studio.js';

export async function handleBump(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/bump/')) return false;
  if (method === 'GET' && path === '/api/bump/options') {
    sendJSON(res, 200, bumpOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/bump/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildBumpPlan(body ?? {}));
    return true;
  }
  return false;
}
