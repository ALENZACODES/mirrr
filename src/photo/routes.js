/**
 * Photo palette routes. Returns true when the request was handled. The photo itself never comes
 * here: these only describe colours, and the browser lays them on the photo.
 *   GET  /api/photo/looks                      looks that can be tried on a photo
 *   GET  /api/photo/palette?look=id&skin=hex   one look's palette (skin: the user's sampled colour)
 *   POST /api/photo/palette { picture }        a studio picture turned into a checked palette
 */
import { photoPalette, photoLooks, paletteFromPicture } from './palette.js';

export async function handlePhoto(method, path, url, req, res, { sendJSON, readBody }) {
  if (!path.startsWith('/api/photo/')) return false;
  if (method === 'GET' && path === '/api/photo/looks') {
    sendJSON(res, 200, { looks: photoLooks() });
    return true;
  }
  if (method === 'GET' && path === '/api/photo/palette') {
    const p = photoPalette(url.searchParams.get('look'), url.searchParams.get('skin'));
    if (!p) { sendJSON(res, 404, { error: 'Unknown look' }); return true; }
    sendJSON(res, 200, p);
    return true;
  }
  if (method === 'POST' && path === '/api/photo/palette') {
    let body;
    try { body = await readBody(req); } catch (e) { sendJSON(res, 400, { error: e.message }); return true; }
    sendJSON(res, 200, paletteFromPicture(body?.picture ?? {}));
    return true;
  }
  return false;
}
