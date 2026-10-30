/**
 * Bridal Countdown routes. Returns true when the request was handled.
 *   GET  /api/bridal/options
 *   POST /api/bridal/plan  { time, fitzpatrick, hairType, style, community, tone }
 */
import { buildBridalPlan, bridalOptions } from './studio.js';

export async function handleBridal(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/bridal/')) return false;
  if (method === 'GET' && path === '/api/bridal/options') {
    sendJSON(res, 200, bridalOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/bridal/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildBridalPlan(body ?? {}));
    return true;
  }
  return false;
}
