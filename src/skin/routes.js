/**
 * Skin Clinic routes. Returns true when the request was handled.
 *   GET  /api/skin/options
 *   POST /api/skin/plan  { community, concern, fitzpatrick, acneLevel, tone }
 */
import { buildSkinPlan, skinClinicOptions } from './clinic.js';

export async function handleSkinClinic(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/skin/')) return false;
  if (method === 'GET' && path === '/api/skin/options') {
    sendJSON(res, 200, skinClinicOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/skin/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildSkinPlan(body ?? {}));
    return true;
  }
  return false;
}
