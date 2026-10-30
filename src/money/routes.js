import { shopForLook, createStore, createWaitlistLimiter, CLIENT_EVENTS } from './store.js';
import { productData } from './store.js';
import { bundles, productsByCategory, createBizStore } from './biz.js';

export const store = createStore();
export const biz = createBizStore();
const CROSS_SELL = { lips: ['lip'], brow_kohl: ['brow', 'liner'], complexion: ['foundation', 'concealer', 'setting'], skin: ['prep', 'setting'], eyes: ['eyeshadow', 'lash', 'liner'], glow: ['blush', 'highlight', 'contour'] };
const allowWaitlist = createWaitlistLimiter();

/** /api/shop/:lookId, /api/count, /api/stats, /api/waitlist, /api/waitlist/remove */
export async function handleMoney(method, path, url, req, res, { sendJSON, readBody, address }) {
  const shop = path.match(/^\/api\/shop\/([a-z0-9_]{1,60})$/);
  if (method === 'GET' && shop && shop[1] !== 'bundles') {
    const s = shopForLook(shop[1]);
    sendJSON(res, 200, s ?? { lookId: shop[1], products: [], fallback: 'Product types only for this look, no named product yet.' });
    return true;
  }
  if (method === 'GET' && path === '/api/shop/bundles') { sendJSON(res, 200, { checked_at: productDataCheckedAt(), bundles: bundles(), note: 'Prices as listed on each brand\u2019s own store on the date shown. No affiliate deal: MIRRR earns nothing from these links today.' }); return true; }
  const xs = path.match(/^\/api\/shop\/routine\/([a-z_]{1,20})$/);
  if (method === 'GET' && xs) {
    const cats = CROSS_SELL[xs[1]];
    sendJSON(res, 200, cats ? { routine: xs[1], categories: cats, products: productsByCategory(cats, `routine_${xs[1]}`) } : { routine: xs[1], categories: [], products: [] }); return true;
  }
  if (method === 'GET' && path === '/api/brands/trends') { sendJSON(res, 200, biz.trends()); return true; }
  if (method === 'POST' && (path === '/api/interest' || path === '/api/interest/remove')) {
    if (!allowWaitlist(address)) { sendJSON(res, 429, { error: 'Too many tries. Please wait a few minutes.' }); return true; }
    let body; try { body = await readBody(req); } catch { sendJSON(res, 400, { error: 'Bad request' }); return true; }
    if (path === '/api/interest/remove') { const r = biz.leaveInterest(body?.email); sendJSON(res, r.ok ? 200 : 400, r.ok ? { ok: true, message: 'If that email was on a list, it has been removed.' } : { error: r.error }); return true; }
    const r = biz.joinInterest({ kind: body?.kind, email: body?.email, consent: body?.consent, type: body?.type });
    if (r.ok && !r.already) store.count(body.kind === 'brand' ? 'brand_interest' : 'pro_interest');
    sendJSON(res, r.ok ? 200 : 400, r.ok ? { ok: true, already: !!r.already } : { error: r.error }); return true;
  }
  if (method === 'GET' && path === '/api/stats') { sendJSON(res, 200, { ...store.stats(), interest_lists: biz.interestCounts() }); return true; }
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

const productDataCheckedAt = () => productData().checked_at;
