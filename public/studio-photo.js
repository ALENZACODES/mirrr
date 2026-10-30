/**
 * Photographic studio plates. Each studio keeps ONE visual slot. When a photo exists for the chosen
 * subject (keyed by the studio's data id), the slot shows that photo on a canvas and the studio's own
 * option logic paints on it: a polish or lip colour multiplied into a mask of the nails or lips, a
 * finish as a sheen layer, glitter and duochrome as overlays. When there is no photo, or it fails to
 * load, the studio's old drawing renders instead, unchanged.
 *
 * Photos are generated sample photos of women, not real people; the caption says so.
 * Manifest: window.STUDIO_PHOTOS[studio][id] = { src, mask?, face? } (paths under /studio/; face is
 * the [x, y, w, h] box, as fractions, that a studio's 240x300 face drawing maps onto).
 */
(() => {
  const PHOTOS = (window.STUDIO_PHOTOS ??= {});
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cache = new Map();
  const load = src => {
    if (!cache.has(src)) cache.set(src, new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => rej(new Error(`missing ${src}`)); i.src = src; }));
    return cache.get(src);
  };
  let seq = 0;
  const jobs = new Map();
  const GEN = 'Generated photo, not a real person';

  /** The photo entry for a studio's subject id, or null (then the studio draws its illustration). */
  function photoFor(studio, id) { return PHOTOS[studio]?.[id] ?? null; }

  /**
   * HTML for the slot. `paint` = { colour, mode ('multiply'|'color'|'soft-light'), opacity, sheen 0..1,
   * glitter, duochrome, overlays: [{ x, y, rx, ry, colour, alpha, mode }] } applied on the photo.
   * `fallback` is the studio's drawing (HTML string), used if the photo is missing or fails.
   */
  function panel({ studio, id, alt, caption = '', paint = {}, fallback = '', w = 960, h = 720 }) {
    const ph = photoFor(studio, id);
    if (!ph) return fallback;
    const key = `sp${++seq}`;
    jobs.set(key, { ph, paint, fallback });
    return `<figure class="hl-panel cx-panel studio-photo" data-studio-photo="${esc(studio)}:${esc(id)}" data-sp="${key}">
      <canvas width="${w}" height="${h}" role="img" aria-label="${esc(alt)}"></canvas>
      <figcaption>${caption}<span class="gen-badge sp-gen">${GEN}</span></figcaption></figure>`;
  }

  function maskedLayer(cv, mask, fill) {
    const L = document.createElement('canvas'); L.width = cv.width; L.height = cv.height;
    const g = L.getContext('2d');
    fill(g, L);
    if (mask) { g.globalCompositeOperation = 'destination-in'; g.drawImage(mask, 0, 0, L.width, L.height); }
    return L;
  }

  async function draw(fig) {
    const job = jobs.get(fig.dataset.sp); if (!job) return;
    jobs.delete(fig.dataset.sp);
    const { ph, paint, fallback } = job;
    const cv = fig.querySelector('canvas'); const ctx = cv.getContext('2d');
    try {
      const [img, mask] = await Promise.all([load(ph.src), ph.mask ? load(ph.mask) : Promise.resolve(null)]);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      if (paint.colour && (mask || paint.whole)) {
        const col = maskedLayer(cv, mask, g => { g.fillStyle = paint.colour; g.fillRect(0, 0, cv.width, cv.height); });
        ctx.save(); ctx.globalAlpha = paint.opacity ?? 0.92; ctx.globalCompositeOperation = paint.mode ?? 'multiply'; ctx.drawImage(col, 0, 0); ctx.restore();
        if (paint.mode !== 'color' && paint.lift) { // keep very light colours light: lay a 'color' pass too
          ctx.save(); ctx.globalAlpha = paint.lift; ctx.globalCompositeOperation = 'color'; ctx.drawImage(col, 0, 0); ctx.restore();
        }
      }
      if (paint.duochrome && mask) {
        const d = maskedLayer(cv, mask, (g, L) => { const gr = g.createLinearGradient(0, 0, L.width, L.height); gr.addColorStop(0, '#5ad1c8'); gr.addColorStop(1, '#b05ad1'); g.fillStyle = gr; g.fillRect(0, 0, L.width, L.height); });
        ctx.save(); ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'color'; ctx.drawImage(d, 0, 0); ctx.restore();
      }
      if (paint.sheen && mask) { // finish: a soft specular band across the masked area
        const s = maskedLayer(cv, mask, (g, L) => { const gr = g.createLinearGradient(0, 0, L.width * 0.35, L.height); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, L.width, L.height); });
        ctx.save(); ctx.globalAlpha = Math.min(1, paint.sheen) * 0.55; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(s, 0, 0); ctx.restore();
      }
      if (paint.matte && mask) { // matte: flatten highlights
        const m = maskedLayer(cv, mask, g => { g.fillStyle = paint.colour ?? '#888'; g.fillRect(0, 0, cv.width, cv.height); });
        ctx.save(); ctx.globalAlpha = 0.25 * paint.matte; ctx.globalCompositeOperation = 'source-atop'; ctx.drawImage(m, 0, 0); ctx.restore();
      }
      if (paint.glitter && mask) {
        const gl = maskedLayer(cv, mask, (g, L) => { let r = 7; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${0.5 + rnd() * 0.5})`; g.beginPath(); g.arc(rnd() * L.width, rnd() * L.height, 0.8 + rnd() * 1.6, 0, 7); g.fill(); } });
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(gl, 0, 0); ctx.restore();
      }
      if (paint.svg) { // the studio's own zone layer (an SVG in its 240x300 face space) drawn over the face box
        const [bx, by, bw, bh] = ph.face ?? [0.18, 0.1, 0.64, 0.8];
        const url = URL.createObjectURL(new Blob([paint.svg], { type: 'image/svg+xml' }));
        try {
          const o = await load(url);
          ctx.save(); ctx.globalAlpha = paint.svgAlpha ?? 0.85; ctx.globalCompositeOperation = paint.svgMode ?? 'source-over';
          ctx.drawImage(o, bx * cv.width, by * cv.height, bw * cv.width, bh * cv.height); ctx.restore();
        } finally { URL.revokeObjectURL(url); cache.delete(url); }
      }
      for (const o of paint.overlays ?? []) { // soft round marks drawn on the photo (correctors, sculpt, blush)
        ctx.save(); ctx.globalAlpha = o.alpha ?? 0.35; ctx.globalCompositeOperation = o.mode ?? 'soft-light';
        const x = o.x * cv.width, y = o.y * cv.height, rx = o.rx * cv.width, ry = (o.ry ?? o.rx) * cv.height;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry)); gr.addColorStop(0, o.colour); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.translate(x, y); ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); ctx.translate(-x, -y);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, Math.max(rx, ry), 0, 7); ctx.fill(); ctx.restore();
      }
      fig.classList.add('sp-ready');
    } catch {
      fig.outerHTML = fallback; // photo missing: the illustration renders as before
    }
  }
  function hydrate(root = document) { root.querySelectorAll?.('figure[data-sp]').forEach(draw); }
  const start = () => new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && (n.matches?.('figure[data-sp]') ? draw(n) : hydrate(n))))).observe(document.body, { childList: true, subtree: true });
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  // Ingredient macro photos, deduped by name: 'shea-butter' and 'shea_butter' share one file,
  // a trailing '_oil' is dropped ('argan_oil' -> argan). Returns '' when there is no photo.
  const ingKey = id => String(id ?? '').toLowerCase().replace(/-/g, '_').replace(/_oil$/, '');
  function ingredientImg(id, name, cls = 'ing-photo') {
    const ph = photoFor('ingredients', ingKey(id));
    if (!ph) return '';
    return `<img class="${cls}" src="${ph.src}" alt="${esc(name)} — ingredient photo" width="400" height="400" loading="lazy" decoding="async" onerror="this.remove()">`;
  }
  // Homepage Power Ingredient cards: the photo replaces the emoji where one exists.
  function homeIngredients() {
    document.querySelectorAll('[data-ing-photo]').forEach(card => {
      if (card.querySelector('.ing-photo')) return;
      const img = ingredientImg(card.dataset.ingPhoto, card.querySelector('.ingredient-name')?.textContent ?? '', 'ing-photo ing-photo--card');
      if (!img) return;
      card.querySelector('.ingredient-emoji')?.classList.add('hidden');
      card.insertAdjacentHTML('afterbegin', img);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', homeIngredients); else homeIngredients();
  window.StudioPhoto = { panel, photoFor, hydrate, ingredientImg, ingKey, GEN };
})();
