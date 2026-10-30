/**
 * Smile & Lip Care routes. Returns true when the request was handled.
 *   GET  /api/smile/options
 *   POST /api/smile/plan  { concern, practice, teeth, community, tone }
 */
import { buildSmilePlan, smileOptions } from './studio.js';

export async function handleSmile(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/smile/')) return false;
  if (method === 'GET' && path === '/api/smile/options') {
    sendJSON(res, 200, smileOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/smile/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildSmilePlan(body ?? {}));
    return true;
  }
  return false;
}
