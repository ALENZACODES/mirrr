/**
 * Routine Builder routes. Returns true when the request was handled.
 *   GET  /api/routine/options
 *   GET  /api/routine/ingredients?q=...   ingredients whose benefit, category or notes mention a word
 *   POST /api/routine/plan  { type, undertone, feel, concern, climate, steps, pregnant, heritage, tone }
 */
import { buildRoutinePlan, routineOptions, searchRoutineIngredients } from './studio.js';

export async function handleRoutine(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/routine/')) return false;
  if (method === 'GET' && path === '/api/routine/options') {
    sendJSON(res, 200, routineOptions());
    return true;
  }
  if (method === 'GET' && path === '/api/routine/ingredients') {
    sendJSON(res, 200, searchRoutineIngredients(url.searchParams.get('q')));
    return true;
  }
  if (method === 'POST' && path === '/api/routine/plan') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, buildRoutinePlan(body ?? {}));
    return true;
  }
  return false;
}
