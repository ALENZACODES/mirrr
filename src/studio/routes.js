/**
 * Brow & Kohl Studio routes. Returns true when the request was handled.
 *   GET  /api/studio/options
 *   GET  /api/studio/looks?community=arab      eye looks ranked for a community, with reasons
 *   POST /api/studio/plan   { community, faceShape, eyeShape, browDensity, browStyle, eyeLook, wearsGlasses }
 */
import { buildStudioPlan, studioOptions, rankEyeLooks } from './brow_kohl.js';

export async function handleStudio(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/studio/')) return false;
  if (method === 'GET' && path === '/api/studio/options') {
    sendJSON(res, 200, studioOptions());
    return true;
  }
  if (method === 'GET' && path === '/api/studio/looks') {
    sendJSON(res, 200, { looks: rankEyeLooks(url.searchParams.get('community')) });
    return true;
  }
  if (method === 'POST' && path === '/api/studio/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildStudioPlan(body ?? {}));
    return true;
  }
  return false;
}
