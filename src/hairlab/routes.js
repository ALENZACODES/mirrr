/**
 * Hair Colour Lab routes. Returns true when the request was handled.
 *   GET  /api/hairlab/options
 *   POST /api/hairlab/plan   { community, texture, porosity, history, startLevel, target, technique }
 */
import { buildColourPlan, colourLabOptions } from './colour_lab.js';

export async function handleHairLab(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/hairlab/')) return false;
  if (method === 'GET' && path === '/api/hairlab/options') {
    sendJSON(res, 200, colourLabOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/hairlab/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildColourPlan(body ?? {}));
    return true;
  }
  return false;
}
