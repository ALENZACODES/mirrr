/**
 * Ageing Studio routes. Returns true when the request was handled.
 *   GET  /api/ageing/options
 *   POST /api/ageing/plan  { decade, fitzpatrick, concern, stage, community, tone }
 */
import { buildAgeingPlan, ageingOptions } from './studio.js';

export async function handleAgeing(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/ageing/')) return false;
  if (method === 'GET' && path === '/api/ageing/options') {
    sendJSON(res, 200, ageingOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/ageing/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildAgeingPlan(body ?? {}));
    return true;
  }
  return false;
}
