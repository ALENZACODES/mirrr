/**
 * MIRRR Library HTTP routes. Returns true when the request was handled.
 *   GET /api/library?community=west_african
 *   GET /api/library/search?q=shea&community=arab
 *   GET /api/library/guide/:id?community=south_asian
 */
import { listLibrary, readGuide, searchLibrary } from './index.js';

export function handleLibrary(method, path, url, res, sendJSON) {
  if (method !== 'GET' || !path.startsWith('/api/library')) return false;
  const community = url.searchParams.get('community') || null;
  if (path === '/api/library') {
    sendJSON(res, 200, listLibrary(community));
    return true;
  }
  if (path === '/api/library/search') {
    const q = (url.searchParams.get('q') || '').slice(0, 80);
    sendJSON(res, 200, searchLibrary(q, { community }));
    return true;
  }
  const m = path.match(/^\/api\/library\/guide\/([a-z0-9_]+)$/);
  if (m) {
    const view = readGuide(m[1], community);
    if (!view) sendJSON(res, 404, { error: `No guide called ${m[1]}` });
    else sendJSON(res, 200, view);
    return true;
  }
  return false;
}
