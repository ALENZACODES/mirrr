import { createNewsService, SOURCES, LAYER_LABELS, COMMUNITIES } from './feed.js';
import { biz } from '../money/routes.js';
import { createWaitlistLimiter } from '../money/store.js';
import { NEWS_INTERESTS } from '../money/biz.js';

export const news = createNewsService();
const allow = createWaitlistLimiter();

/** /api/news, /api/news/sources, /api/news/signup, /api/news/remove */
export async function handleNews(method, path, url, req, res, { sendJSON, readBody, address, service = news }) {
  if (!path.startsWith('/api/news')) return false;
  if (method === 'GET' && path === '/api/news') {
    sendJSON(res, 200, {
      ...service.get(),
      layers: LAYER_LABELS,
      rules: 'Headline, source, date, a one-line snippet from the feed and a link to the original only. No articles or images are copied. Men\u2019s grooming, slurs, colourist \u201cwhitening\u201d products and off-topic items are filtered out.',
    });
    return true;
  }
  if (method === 'GET' && path === '/api/news/sources') {
    sendJSON(res, 200, {
      checked_at: SOURCES.checked_at,
      communities: SOURCES.communities.map(({ id, label }) => ({ id, label })),
      brands: SOURCES.brands.map(({ name, communities, basis }) => ({ name, communities, basis })),
      feeds: SOURCES.feeds.map(({ id, name, url, kind }) => ({ id, name, url, kind })),
      google_topics: SOURCES.google_topics.map(({ q, community }) => ({ q, community })),
      interests: NEWS_INTERESTS,
      community_ids: COMMUNITIES,
    });
    return true;
  }
  if (method === 'POST' && (path === '/api/news/signup' || path === '/api/news/remove')) {
    if (!allow(address)) { sendJSON(res, 429, { error: 'Too many tries. Please wait a few minutes.' }); return true; }
    let body; try { body = await readBody(req); } catch { sendJSON(res, 400, { error: 'Bad request' }); return true; }
    if (path === '/api/news/remove') {
      const r = biz.leaveInterest(body?.email);
      sendJSON(res, r.ok ? 200 : 400, r.ok ? { ok: true, message: 'If that email was on a MIRRR list, it has been removed.' } : { error: r.error });
      return true;
    }
    const r = biz.joinInterest({ kind: 'news', email: body?.email, consent: body?.consent, interests: body?.interests });
    sendJSON(res, r.ok ? 200 : 400, r.ok ? { ok: true, already: !!r.already, note: 'Email digests start soon; we\u2019ll only email you if you tick consent.' } : { error: r.error });
    return true;
  }
  return false;
}
