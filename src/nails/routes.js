/**
 * Nails & Scent Studio routes. Returns true when the request was handled.
 *   GET  /api/nails/options
 *   POST /api/nails/plan  { fitzpatrick, undertone, shape, finish, wear, nailOccasion, family, scentOccasion, climate, community, tone }
 */
import { buildNailScentPlan, nailScentOptions } from './studio.js';

export async function handleNails(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/nails/')) return false;
  if (method === 'GET' && path === '/api/nails/options') {
    sendJSON(res, 200, nailScentOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/nails/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildNailScentPlan(body ?? {}));
    return true;
  }
  return false;
}
