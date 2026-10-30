/**
 * Complexion Lab routes. Returns true when the request was handled.
 *   GET  /api/complexion/options
 *   POST /api/complexion/plan  { correct, fitzpatrick, undertone, skinType, coverage, faceShape, occasion, community, tone }
 */
import { buildComplexionPlan, complexionOptions } from './complexion.js';

export async function handleComplexion(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/complexion/')) return false;
  if (method === 'GET' && path === '/api/complexion/options') {
    sendJSON(res, 200, complexionOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/complexion/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildComplexionPlan(body ?? {}));
    return true;
  }
  return false;
}
