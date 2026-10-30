import { shopForLook, createStore, createWaitlistLimiter, CLIENT_EVENTS } from './store.js';

export const store = createStore();
const allowWaitlist = createWaitlistLimiter();

/** /api/shop/:lookId, /api/count, /api/stats, /api/waitlist, /api/waitlist/remove */
export async function handleMoney(method, path, url, req, res, { sendJSON, readBody, address }) {
  const shop = path.match(/^\/api\/shop\/([a-z0-9_]{1,60})$/);
  if (method === 'GET' && shop) {
    const s = shopForLook(shop[1]);
    sendJSON(res, 200, s ?? { lookId: shop[1], products: [], fallback: 'Product types only for this look, no named product yet.' });
    return true;
  }
  if (method === 'GET' && path === '/api/stats') { sendJSON(res, 200, store.stats()); return true; }
  if (method === 'POST' && path === '/api/count') {
    let body; try { body = await readBody(req); } catch { sendJSON(res, 400, { error: 'Bad request' }); return true; }
    if (!CLIENT_EVENTS.includes(body?.event)) { sendJSON(res, 400, { error: 'Unknown event' }); return true; }
    store.count(body.event); sendJSON(res, 200, { ok: true }); return true;
  }
  if (method === 'POST' && (path === '/api/waitlist' || path === '/api/waitlist/remove')) {
    if (!allowWaitlist(address)) { sendJSON(res, 429, { error: 'Too many tries. Please wait a few minutes.' }); return true; }
    let body; try { body = await readBody(req); } catch { sendJSON(res, 400, { error: 'Bad request' }); return true; }
    if (path === '/api/waitlist') {
      if (body?.consent !== true) { sendJSON(res, 400, { error: 'Please tick the box to agree before joining.' }); return true; }
      const r = store.joinWaitlist(body?.email, body?.moment);
      sendJSON(res, r.ok ? 200 : 400, r.ok ? { ok: true, already: !!r.already } : { error: r.error }); return true;
    }
    const r = store.leaveWaitlist(body?.email);
    sendJSON(res, r.ok ? 200 : 400, r.ok ? { ok: true, message: 'If that email was on the list, it has been removed.' } : { error: r.error }); return true;
  }
  return false;
}
