/**
 * Colour & Lip Studio routes. Returns true when the request was handled.
 *   GET  /api/colour/options
 *   POST /api/colour/plan  { fitzpatrick, undertone, formula, look, finish, liner, care, community, tone }
 */
import { buildColourPlan, colourOptions } from './studio.js';

export async function handleColour(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/colour/')) return false;
  if (method === 'GET' && path === '/api/colour/options') {
    sendJSON(res, 200, colourOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/colour/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildColourPlan(body ?? {}));
    return true;
  }
  return false;
}
