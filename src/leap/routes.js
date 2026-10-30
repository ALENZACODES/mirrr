/**
 * Taste Leap routes. Returns true when the request was handled.
 *   GET  /api/leap/options
 *   POST /api/leap/plan  { profile, inputs?, dest1, dest2, dest3, strength, tone, focus }
 * Only profile 'mine' with inputs reaches Qloo (through the cached pipeline).
 */
import { buildLeapPlan, leapOptions } from './studio.js';

export async function handleLeap(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/leap/')) return false;
  if (method === 'GET' && path === '/api/leap/options') {
    sendJSON(res, 200, leapOptions());
    return true;
  }
  if (method === 'POST' && path === '/api/leap/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    try {
      sendJSON(res, 200, await buildLeapPlan(body ?? {}));
    } catch (e) {
      console.error('[/api/leap/plan]', e);
      sendJSON(res, 500, { error: 'Taste Leap could not build a plan' });
    }
    return true;
  }
  return false;
}
