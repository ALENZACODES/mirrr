/**
 * Hair Colour Lab routes. Returns true when the request was handled.
 *   GET  /api/hairlab/options
 *   POST /api/hairlab/plan   { community, texture, porosity, history, startLevel, target, technique }
 *   GET  /api/hairlab/journey-options
 *   POST /api/hairlab/journey { journey, community, texture, months, installHours, edges, scalp, locMethod, strand, relaxedCm, goalCm }
 */
import { buildColourPlan, colourLabOptions } from './colour_lab.js';
import { buildJourney, journeyOptions } from './journeys.js';

export async function handleHairLab(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/hairlab/')) return false;
  if (method === 'GET' && path === '/api/hairlab/options') {
    sendJSON(res, 200, colourLabOptions());
    return true;
  }
  if (method === 'GET' && path === '/api/hairlab/journey-options') {
    sendJSON(res, 200, journeyOptions());
    return true;
  }
  const build = { '/api/hairlab/plan': buildColourPlan, '/api/hairlab/journey': buildJourney }[path];
  if (method === 'POST' && build) {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, build(body ?? {}));
    return true;
  }
  return false;
}
