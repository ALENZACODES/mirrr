/**
 * 60-Second Transformation view. Each step calls the same endpoints the full pages use:
 * /api/agent/run (taste), /api/shades/find (shade), /api/transform (plan), /api/photo/palette
 * (try-on colours). The try-on paints the model face nearest the picked shade on this device.
 */
import { SIXTY_STEPS, SIXTY_UNDERTONES, parseFavourites, missingForStart, stepAfter, progressLabel, tasteRequest, topLooks, tasteSource, transformRequest } from './sixty-core.js';

const sx = { step: 0, favourites: [], depth: null, undertone: null, spectrum: null, run: null, looks: [], lookIdx: 0, shades: [], shadeIdx: 0, plan: null, seq: 0, busy: false, error: '' };
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
}

function progress() {
  return `<ol class="sx-progress" aria-label="${esc(progressLabel(sx.step))}">${SIXTY_STEPS.map((s, i) => `<li class="${i < sx.step ? 'sx-done' : i === sx.step ? 'sx-now' : ''}"${i === sx.step ? ' aria-current="step"' : ''}><span>${i + 1}</span>${esc(s.label)}</li>`).join('')}</ol>
    <p class="sx-progress-label" data-sx-progress>${esc(progressLabel(sx.step))}</p>`;
}
const nav = (nextLabel, { next = true } = {}) => `<div class="sx-nav">${sx.step > 0 ? '<button type="button" class="btn btn-ghost" data-sx="back">← Back</button>' : '<span></span>'}${next ? `<button type="button" class="btn btn-primary" data-sx="next"${sx.busy ? ' disabled' : ''}>${esc(sx.busy ? 'Working…' : nextLabel)}</button>` : ''}</div>`;

function youStep() {
  const tiers = (sx.spectrum?.depth_labels ?? []).filter(t => t.id !== 'mixed');
  const swatch = t => sx.spectrum?.spectrum?.reduce((b, s) => (Math.abs(s.depth - t.depth) < Math.abs(b.depth - t.depth) ? s : b))?.hex ?? '#999';
  return `<h3>Who is this for?</h3>
    <label class="sx-field"><span>Artists, films, shows or brands you love (comma-separated)</span>
      <input id="sxFavs" class="hero-try-input" type="text" value="${esc(sx.favourites.join(', '))}" placeholder="e.g. Burna Boy, Tems" autocomplete="off"></label>
    <div class="sx-field"><span>Skin tone closest to yours</span><div class="sx-tones">${tiers.map(t => `<button type="button" class="sx-tone${Number(sx.depth) === t.depth ? ' sx-on' : ''}" data-sx-depth="${t.depth}" aria-pressed="${Number(sx.depth) === t.depth}"><i style="background:${esc(swatch(t))}"></i>${esc(t.label)}</button>`).join('')}</div></div>
    <div class="sx-field"><span>Undertone</span><div class="chip-row">${SIXTY_UNDERTONES.map(u => `<button type="button" class="chip-btn${sx.undertone === u ? ' chip-btn--active' : ''}" data-sx-under="${u}">${u[0].toUpperCase() + u.slice(1)}</button>`).join('')}</div></div>
    ${nav('Find my looks →')}`;
}

function tasteStep() {
  const src = tasteSource(sx.run);
  return `<h3>Your taste picked these looks</h3>
    <p class="sx-source ${src.live ? 'sx-live' : 'sx-local'}">${esc(src.text)}</p>
    <div class="sx-looks">${sx.looks.map((l, i) => `<button type="button" class="sx-look${i === sx.lookIdx ? ' sx-on' : ''}" data-sx-look="${i}" aria-pressed="${i === sx.lookIdx}">
      <strong>${i + 1}. ${esc(l.name)}</strong><span>${esc(l.description.slice(0, 140))}</span>
      ${l.evidence.length ? `<em>Picked by: ${esc(l.evidence.slice(0, 4).join(', '))}</em>` : ''}</button>`).join('')}</div>
    ${nav('Match my shade →')}`;
}

function shadeStep() {
  return `<h3>Your named shade</h3>
    <div class="sx-shades">${sx.shades.map((s, i) => `<button type="button" class="sx-shade${i === sx.shadeIdx ? ' sx-on' : ''}" data-sx-shade="${i}" aria-pressed="${i === sx.shadeIdx}">
      <i style="background:${esc(s.hex)}"></i><strong>${esc(s.name)}</strong><span>${esc(s.code)} · ${esc(s.coverageNote ?? '')}</span></button>`).join('')}</div>
    <p class="lib-note">Ranked by the shade finder on the tone and undertone you picked. Swatches are screen colours; check in daylight.</p>
    ${nav('Build my plan →')}`;
}

function planStep() {
  const p = sx.plan;
  return `<h3>${esc(p.target?.name)} on you, in stages</h3>
    ${(p.because ?? []).map(b => `<p class="sx-because">${esc(b)}</p>`).join('')}
    <div class="sx-stages">${(p.stages ?? []).map(s => `<section class="sx-stage"><h4>${esc(s.title)}</h4><p>${esc(s.subtitle ?? '')}</p>
      <ol>${(s.steps ?? []).map(st => `<li><strong>${esc(st.title)}</strong>${st.shade?.hex ? ` <i class="sx-dot" style="background:${esc(st.shade.hex)}"></i>` : ''}<span>${esc(st.technique)}</span></li>`).join('')}</ol></section>`).join('')}</div>
    ${nav('See it on a face →')}`;
}

function tryonStep() {
  const l = sx.looks[sx.lookIdx]; const s = sx.shades[sx.shadeIdx];
  return `<h3>${esc(l?.name)} on the model face nearest ${esc(s?.name)}</h3>
    <div class="sx-ba"><figure><canvas id="sxBefore" width="300" height="400" role="img" aria-label="Model face before"></canvas><figcaption>Before</figcaption></figure>
      <figure><canvas id="sxAfter" width="300" height="400" role="img" aria-label="Model face wearing ${esc(l?.name)}"></canvas><figcaption>After: ${esc(l?.name)}</figcaption></figure></div>
    <p class="lib-note" id="sxFaceNote">Painting the look…</p>
    <p class="photo-try"><button type="button" class="btn btn-primary" data-sx="full">Try it on my own photo</button><span>Upload, camera, or another model face. Your photo stays on this device.</span></p>
    ${nav('', { next: false })}<p><button type="button" class="btn btn-ghost" data-sx="restart">Start again</button></p>`;
}

const STEP_VIEWS = [youStep, tasteStep, shadeStep, planStep, tryonStep];
function render() {
  const root = $('sxRoot'); if (!root) return;
  root.innerHTML = progress() + `<div class="sx-body card">${STEP_VIEWS[sx.step]()}${sx.error ? `<p class="sx-error" role="alert">${esc(sx.error)}</p>` : ''}</div>`;
  if (sx.step === 4) paintTryOn(++sx.seq);
}

async function paintTryOn(seq) {
  const note = $('sxFaceNote');
  try {
    const [engine, faces] = await Promise.all([import('./photo-engine.js'), import('./model-faces.js')]);
    const shade = sx.shades[sx.shadeIdx]; const look = sx.looks[sx.lookIdx];
    const mf = faces.nearestModelFace(engine.hexToLab(shade.hex)[0]);
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = mf.src; });
    if (seq !== sx.seq) return;
    const c = document.createElement('canvas'); c.width = 300; c.height = 400;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, 300, 400);
    const base = x.getImageData(0, 0, 300, 400); const face = engine.findFace(base);
    const skin = face.ok ? engine.labToRgb(face.skin.L, face.skin.a, face.skin.b).map(v => v.toString(16).padStart(2, '0')).join('') : '';
    const palette = await api(`/api/photo/palette?look=${encodeURIComponent(look.id)}&skin=${encodeURIComponent(skin)}`).catch(() => null);
    if (seq !== sx.seq) return;
    $('sxBefore')?.getContext('2d').putImageData(base, 0, 0);
    const out = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
    if (face.ok && palette) engine.applyLook(out, face, palette, { strength: 0.75, finish: 'natural' });
    const after = $('sxAfter'); if (!after) return;
    after.getContext('2d').putImageData(out, 0, 0);
    after.dataset.modelFace = mf.id; after.dataset.painted = face.ok && palette ? 'look' : 'plain';
    if (note) note.textContent = `The ${mf.label} model face, nearest to ${shade.name}. ${faces.MODEL_FACE_NOTE}`;
  } catch { if (note) note.textContent = 'The model face could not be painted here; the plan above still stands.'; }
}

async function next() {
  sx.error = '';
  if (sx.step === 0) {
    sx.favourites = parseFavourites($('sxFavs')?.value);
    const miss = missingForStart(sx); if (miss) { sx.error = miss; render(); return; }
  }
  sx.busy = true; render();
  try {
    if (sx.step === 0) {
      sx.run = await api('/api/agent/run', tasteRequest(sx));
      sx.looks = topLooks(sx.run); sx.lookIdx = 0;
      if (!sx.looks.length) throw new Error('No look matched those picks. Try another artist.');
    } else if (sx.step === 1) {
      const r = await api('/api/shades/find', { depthTarget: Number(sx.depth), undertone: sx.undertone, topN: 3 });
      sx.shades = r.shades ?? []; sx.shadeIdx = 0;
      if (!sx.shades.length) throw new Error('No shade matched. Pick a different tone.');
    } else if (sx.step === 2) {
      sx.plan = await api('/api/transform', transformRequest({ shade: sx.shades[sx.shadeIdx], undertone: sx.undertone, lookId: sx.looks[sx.lookIdx].id, favourites: sx.favourites }));
    }
    sx.step = stepAfter(sx.step, 'next');
  } catch (e) { sx.error = `That step did not work (${e.message}).`; }
  sx.busy = false; render();
  $('sxRoot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function open(prefill) {
  const favs = parseFavourites(prefill);
  if (favs.length) sx.favourites = favs;
  try {
    const pr = JSON.parse(localStorage.getItem('mirrr.profile.v1') || 'null');
    if (!sx.favourites.length && Array.isArray(pr?.chips)) sx.favourites = pr.chips.slice(0, 5);
  } catch { /* no saved profile */ }
  if (!sx.spectrum) { try { sx.spectrum = await api('/api/shades/spectrum'); } catch { sx.error = 'The shade list could not load. Refresh to try again.'; } }
  render();
}

document.addEventListener('click', e => {
  const opener = e.target.closest('[data-open-sixty]');
  if (opener) {
    document.querySelector('.nav-link[data-view="sixty"]')?.click();
    open(document.getElementById('heroTryInput')?.value);
    return;
  }
  if (e.target.closest('.nav-link[data-view="sixty"]')) { if (!$('sxRoot')?.childElementCount) open(''); return; }
  if (!e.target.closest('#sxRoot')) return;
  const t = e.target.closest('[data-sx], [data-sx-depth], [data-sx-under], [data-sx-look], [data-sx-shade]');
  if (!t || sx.busy) return;
  if (sx.step === 0) sx.favourites = parseFavourites($('sxFavs')?.value);
  if (t.dataset.sxDepth) { sx.depth = Number(t.dataset.sxDepth); render(); return; }
  if (t.dataset.sxUnder) { sx.undertone = t.dataset.sxUnder; render(); return; }
  if (t.dataset.sxLook) { sx.lookIdx = Number(t.dataset.sxLook); render(); return; }
  if (t.dataset.sxShade) { sx.shadeIdx = Number(t.dataset.sxShade); render(); return; }
  const a = t.dataset.sx;
  if (a === 'back') { sx.error = ''; sx.step = stepAfter(sx.step, 'back'); render(); }
  else if (a === 'next') next();
  else if (a === 'restart') { sx.step = 0; sx.error = ''; render(); }
  else if (a === 'full') {
    const l = sx.looks[sx.lookIdx];
    window.dispatchEvent(new CustomEvent('mirrr:tryon-look', { detail: { lookId: l.id, name: l.name } }));
  }
});
