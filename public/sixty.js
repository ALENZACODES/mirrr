/**
 * 60-Second Transformation view. Each step calls the same endpoints the full pages use:
 * /api/communities, /api/agent/run (taste, live Qloo), /api/shades/find (shade), /api/transform
 * (plan), /api/photo/palette (try-on colours). The try-on paints the model face nearest the picked
 * shade on this device; nothing is uploaded. Nothing is pre-selected: every choice is hers.
 */
import { SIXTY_STEPS, SIXTY_UNDERTONES, SIXTY_LOOKS, cleanPick, stepAfter, progressLabel, secondsLeft, tasteRequest, tasteOutcome, shadeRequest, transformRequest, shareText, SIXTY_LAST_RUN_KEY, SIXTY_REPLAY_LABEL, slimRun, isCompletedRun, readCompletedRun, thinkSteps } from './sixty-core.js';

const fresh = () => ({ step: 0, communities: sx?.communities ?? null, spectrum: sx?.spectrum ?? null, communityId: null, pick: '', tappedLook: null, outcome: null, lookIdx: null, depth: null, undertone: null, shades: [], shadeIdx: 0, shadeNote: '', finderTop: '', plan: null, run: null, modelFace: null, replay: null, seq: 0, busy: false, error: '', status: '' });
let sx = null; sx = fresh();
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
}
const communityLabel = () => sx.communities?.find(c => c.id === sx.communityId)?.label ?? '';
// Her saved shade (My Face, else the last saved 60-second plan). When one exists the chain plans with it,
// and says so plainly when the shade finder's top match differs.
function savedShade() {
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const f = read('mirrr.profile.v1')?.face;
  if (f?.shadeId && f?.shadeName) return { name: f.shadeName, code: f.shadeId, hex: f.hex || '#999', undertone: f.undertone || null, coverageNote: 'Your saved shade (My Face)', saved: true };
  const x = read('mirrr.sixty.v1');
  if (x?.shade?.code && x?.shade?.name) return { name: x.shade.name, code: x.shade.code, hex: x.shade.hex || '#999', undertone: x.undertone || null, coverageNote: 'Your saved shade (last 60-second plan)', saved: true };
  return null;
}
const chosenLook = () => (sx.tappedLook ? SIXTY_LOOKS.find(l => l.id === sx.tappedLook) : sx.lookIdx == null ? null : sx.outcome?.looks?.[sx.lookIdx]) ?? null;

function progress() {
  const pct = Math.round((sx.step / (SIXTY_STEPS.length - 1)) * 100);
  return `<ol class="sx-progress">${SIXTY_STEPS.map((s, i) => `<li class="${i < sx.step ? 'sx-done' : i === sx.step ? 'sx-now' : ''}"${i === sx.step ? ' aria-current="step"' : ''}><span>${i + 1}</span>${esc(s.label)}</li>`).join('')}</ol>
    <div class="sx-bar" role="progressbar" aria-valuemin="1" aria-valuemax="${SIXTY_STEPS.length}" aria-valuenow="${sx.step + 1}" aria-valuetext="${esc(progressLabel(sx.step))}"><i style="width:${pct}%"></i></div>
    <p class="sx-progress-label" data-sx-progress data-sx-seconds="${secondsLeft(sx.step)}">${esc(progressLabel(sx.step))}</p>`;
}
const nav = (nextLabel, ready) => `<div class="sx-nav">${sx.step > 0 ? '<button type="button" class="btn btn-ghost" data-sx="back">← Back</button>' : '<span></span>'}${nextLabel ? `<button type="button" class="btn btn-primary" data-sx="next"${sx.busy || !ready ? ' disabled' : ''}>${esc(sx.busy ? 'Working…' : nextLabel)}</button>` : ''}</div>`;
const communityChips = () => `<div class="sx-chips">${(sx.communities ?? []).map(c => `<button type="button" class="sx-chip${sx.communityId === c.id ? ' sx-on' : ''}" data-sx-community="${esc(c.id)}" aria-pressed="${sx.communityId === c.id}">${esc(c.emoji ?? '')} ${esc(c.label)}</button>`).join('')}</div>`;
const lookTiles = () => `<div class="sx-tiles">${SIXTY_LOOKS.map(l => `<button type="button" class="sx-tile${sx.tappedLook === l.id ? ' sx-on' : ''}" data-sx-tap="${l.id}" aria-pressed="${sx.tappedLook === l.id}"><img src="${l.img}" alt="${esc(l.name)} — look portrait" loading="lazy" decoding="async" width="120" height="150"><span>${esc(l.name)}</span></button>`).join('')}</div>`;

function communityStep() {
  return `<h3>Which community is your beauty from?</h3>${communityChips()}${nav('Next →', !!sx.communityId)}`;
}
function pickStep() {
  return `<h3>One pick: a song or artist you love, or tap a look</h3>
    <form id="sxPickForm" class="sx-pick" autocomplete="off"><input id="sxPick" class="hero-try-input" type="text" value="${esc(sx.pick)}" placeholder="A song or an artist" aria-label="A song or an artist you love"></form>
    <p class="sx-or">or tap a look</p>${lookTiles()}
    ${nav(sx.tappedLook ? 'Use this look →' : 'Find my taste →', !!(sx.pick || sx.tappedLook))}`;
}
function tasteStep() {
  if (sx.tappedLook) {
    const l = chosenLook();
    return `<h3>Your look: ${esc(l.name)}</h3><p class="sx-source sx-local">You tapped this look, so no taste lookup was needed.</p>${nav('Match my shade →', true)}`;
  }
  const o = sx.outcome;
  const topLabel = o.live ? "Qloo's top pick for your taste" : 'Top match for your pick';
  const looks = o.looks.map((l, i) => `<button type="button" class="sx-look${i === sx.lookIdx ? ' sx-on' : ''}" data-sx-look="${i}" aria-pressed="${i === sx.lookIdx}">
      ${i === 0 && !o.failed ? `<b class="sx-toppick" data-sx-toppick>${esc(topLabel)}</b>` : ''}<strong>${i + 1}. ${esc(l.name)}</strong><span>${esc(l.description.slice(0, 140))}</span>
      ${l.evidence.length ? `<em>Picked by Qloo tags: ${esc(l.evidence.slice(0, 4).join(', '))}</em>` : ''}</button>`).join('');
  return `<h3>${o.failed ? 'Your taste needs one more tap' : 'Qloo read your taste'}</h3>
    <p class="sx-source ${o.live ? 'sx-live' : 'sx-local'}" data-sx-live="${o.live}">${esc(o.text)}</p>
    ${looks ? `${sx.lookIdx == null && !o.failed ? '<p class="lib-note" data-sx-choose>Nothing is chosen yet: tap the look you want.</p>' : ''}<div class="sx-looks">${looks}</div>` : ''}
    ${o.failed ? `<div class="sx-manual"><h4>Your community</h4>${communityChips()}<h4>Pick a look</h4>${lookTiles()}</div>` : ''}
    ${nav('Match my shade →', !!chosenLook())}`;
}
function shadeStep() {
  const tiers = (sx.spectrum?.depth_labels ?? []).filter(t => t.id !== 'mixed');
  const swatch = t => sx.spectrum?.spectrum?.reduce((b, s) => (Math.abs(s.depth - t.depth) < Math.abs(b.depth - t.depth) ? s : b))?.hex ?? '#999';
  const top = sx.shades[sx.shadeIdx];
  const sv = savedShade();
  const tt = top?.saved ? 'Your saved shade' : top && top.code === sx.finderTop ? 'Your TrueTone shade' : 'Your pick';
  const useSaved = sv && !sx.shades.length && !sx.busy ? `<div class="sx-field sx-saved"><button type="button" class="btn btn-primary" data-sx-saved="1"><i class="sx-dot" style="background:${esc(sv.hex)}"></i> Use my saved shade: ${esc(sv.name)} (${esc(sv.code)})</button><span>Or tap a tone below to see other matches.</span></div>` : '';
  return `<h3>Your TrueTone shade</h3>${useSaved}
    <div class="sx-field"><span>Tap the tone closest to your skin</span><div class="sx-tones">${tiers.map(t => `<button type="button" class="sx-tone${Number(sx.depth) === t.depth ? ' sx-on' : ''}" data-sx-depth="${t.depth}" aria-pressed="${Number(sx.depth) === t.depth}"><i style="background:${esc(swatch(t))}"></i>${esc(t.label)}</button>`).join('')}</div></div>
    <div class="sx-field"><span>Your undertone</span><div class="chip-row">${SIXTY_UNDERTONES.map(u => `<button type="button" class="chip-btn${sx.undertone === u ? ' chip-btn--active' : ''}" data-sx-under="${u}" aria-pressed="${sx.undertone === u}">${u[0].toUpperCase() + u.slice(1)}</button>`).join('')}</div></div>
    ${top ? `<div class="sx-shade-hero" data-sx-shade-name="${esc(top.name)}"><i style="background:${esc(top.hex)}"></i><div><strong data-sx-truetone>${tt}: ${esc(top.name)} (${esc(top.code)})</strong><span>${esc(top.coverageNote ?? '')}</span></div></div>
      ${sx.shadeNote ? `<p class="sx-shade-note" data-sx-shade-note>${esc(sx.shadeNote)}</p>` : ''}
      ${sx.shades.length > 1 ? `<div class="sx-shades">${sx.shades.map((s, i) => `<button type="button" class="sx-shade${i === sx.shadeIdx ? ' sx-on' : ''}" data-sx-shade="${i}" aria-pressed="${i === sx.shadeIdx}"><i style="background:${esc(s.hex)}"></i><strong>${esc(s.name)}</strong><span>${esc(s.code)}</span></button>`).join('')}</div>` : ''}
      <p class="lib-note">TrueTone is MIRRR's name for the shade finder's top-ranked match, ranked for ${esc(communityLabel())} skin on the tone and undertone you tapped. It is a ranking, not a skin scan. Screen colours; check in daylight.</p>` : (sx.busy ? '<p class="lib-note">Finding your shade…</p>' : '')}
    ${nav('Build my plan →', !!top)}`;
}
function planStep() {
  const p = sx.plan;
  return `<h3>${esc(p.target?.name)} on you, in ${p.stages.length} steps</h3>
    ${(() => { const sh = sx.shades[sx.shadeIdx]; return sh ? `<p class="sx-because" data-sx-plan-shade="${esc(sh.code)}">Planned in ${sh.saved ? 'your saved shade' : 'your shade'}: <strong>${esc(sh.name)} (${esc(sh.code)})</strong>.${sx.shadeNote && sh.saved && sh.code !== sx.finderTop && sx.finderTop ? ` ${esc(sx.shadeNote.replace(/ Tap .* to switch\.$/, ''))}` : ''}</p>` : ''; })()}
    ${(p.because ?? []).map(b => `<p class="sx-because">${esc(b)}</p>`).join('')}
    <div class="sx-stages">${p.stages.map((s, i) => `<section class="sx-stage"><h4>${i + 1}. ${esc(s.title)}</h4><p>${esc(s.subtitle ?? '')}</p>
      <ol>${(s.steps ?? []).map(st => `<li><strong>${esc(st.title)}</strong>${st.shade?.hex ? ` <i class="sx-dot" style="background:${esc(st.shade.hex)}"></i>` : ''}<span>${esc(st.technique)}</span></li>`).join('')}</ol></section>`).join('')}</div>
    ${nav('See before & after →', true)}`;
}
function tryonStep() {
  const l = chosenLook(); const s = sx.shades[sx.shadeIdx];
  return `${sx.replay ? `<p class="sx-replay-label" data-sx-replay-label>${esc(SIXTY_REPLAY_LABEL)}</p>` : ''}<h3>${esc(l?.name)} in ${esc(s?.name)}: before and after</h3>
    <div class="sx-ba"><figure><canvas id="sxBefore" width="300" height="400" role="img" aria-label="Model face before"></canvas><figcaption>Before</figcaption></figure>
      <figure><canvas id="sxAfter" width="300" height="400" role="img" aria-label="Model face wearing ${esc(l?.name)}"></canvas><figcaption>After: ${esc(l?.name)}</figcaption></figure></div>
    <p class="lib-note" id="sxFaceNote">Painting the look…</p>
    <div class="sx-save"><button type="button" class="btn btn-primary" data-sx="save">Save</button><button type="button" class="btn btn-secondary" data-sx="share">Share</button><button type="button" class="btn btn-ghost" data-sx="full">Try it on my own photo</button></div>
    <p class="sx-status" id="sxStatus" role="status">${esc(sx.status)}</p>
    <div id="sxThinkHolder">${thinkHtml()}</div>
    ${nav('', false)}<p><button type="button" class="btn btn-ghost" data-sx="restart">Start again</button></p>`;
}

/** WATCH MIRRR THINK: rendered only from this run's own data; a step with no data is left out. */
function thinkHtml() {
  const steps = thinkSteps({ run: sx.tappedLook ? null : sx.run, look: chosenLook(), shade: sx.shades[sx.shadeIdx], plan: sx.plan, modelFace: sx.modelFace });
  if (!steps.length) return '';
  return `<details class="sx-think" data-sx-think><summary>WATCH MIRRR THINK</summary><ol>${steps.map(st => `<li data-think-step="${esc(st.id)}"><strong>${esc(st.title)}</strong><span>${esc(st.text)}</span></li>`).join('')}</ol></details>`;
}
function refreshThink() {
  const h = $('sxThinkHolder'); if (!h) return;
  const wasOpen = !!h.querySelector('details')?.open;
  h.innerHTML = thinkHtml();
  if (wasOpen) h.querySelector('details')?.setAttribute('open', '');
}
// Read only when she taps SEE A COMPLETED RUN (and to decide whether to show it); a fresh run never reads it.
const readLastRun = () => readCompletedRun(globalThis.localStorage);
/** The SEE A COMPLETED RUN button shows only when a real completed run is cached on this device. */
function syncReplayButton() {
  const has = !!readLastRun();
  document.querySelectorAll('[data-sx-replay-wrap]').forEach(w => { w.hidden = !has; });
}
function cacheCompletedRun(before, after) {
  if (sx.replay || sx.tappedLook || !sx.outcome || sx.outcome.failed || !sx.run) return;
  const c = { v: 1, at: new Date().toISOString(), communityId: sx.communityId, pick: sx.pick, outcome: sx.outcome, lookIdx: sx.lookIdx, run: sx.run,
    depth: sx.depth, undertone: sx.undertone, shades: sx.shades, shadeIdx: sx.shadeIdx, plan: sx.plan, modelFace: sx.modelFace, before, after };
  if (!isCompletedRun(c)) return;
  try { localStorage.setItem(SIXTY_LAST_RUN_KEY, JSON.stringify(c)); } catch { /* storage full or blocked: no replay offered */ }
  syncReplayButton();
}

const STEP_VIEWS = [communityStep, pickStep, tasteStep, shadeStep, planStep, tryonStep];
function render() {
  const root = $('sxRoot'); if (!root) return;
  root.innerHTML = progress() + `<div class="sx-body card">${STEP_VIEWS[sx.step]()}${sx.error ? `<p class="sx-error" role="alert">${esc(sx.error)}</p>` : ''}</div>`;
  if (sx.step === 5) paintTryOn(++sx.seq);
}

async function paintTryOn(seq) {
  const note = $('sxFaceNote');
  if (sx.replay) {
    try {
      const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const [b, a] = await Promise.all([load(sx.replay.before), load(sx.replay.after)]);
      if (seq !== sx.seq) return;
      $('sxBefore')?.getContext('2d').drawImage(b, 0, 0, 300, 400);
      const after = $('sxAfter'); if (!after) return;
      after.getContext('2d').drawImage(a, 0, 0, 300, 400);
      after.dataset.modelFace = sx.modelFace?.id ?? ''; after.dataset.painted = 'replay';
      if (note) note.textContent = `The ${sx.modelFace?.label ?? ''} model face, nearest to ${sx.shades[sx.shadeIdx]?.name ?? ''}.`;
    } catch { if (note) note.textContent = 'The saved before and after could not be shown here; the plan above still stands.'; }
    return;
  }
  try {
    const [engine, faces] = await Promise.all([import('./photo-engine.js'), import('./model-faces.js')]);
    const shade = sx.shades[sx.shadeIdx]; const look = chosenLook();
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
    if (note) note.textContent = `The ${mf.label} model face, nearest to ${shade.name}.`;
    sx.modelFace = { id: mf.id, label: mf.label }; refreshThink();
    if (face.ok && palette) {
      try { cacheCompletedRun($('sxBefore').toDataURL('image/jpeg', 0.82), after.toDataURL('image/jpeg', 0.82)); } catch { /* canvas not exportable: no replay */ }
    }
  } catch { if (note) note.textContent = 'The model face could not be painted here; the plan above still stands.'; }
}

async function findShades() {
  if (!sx.depth || !sx.undertone) return;
  const seq = ++sx.seq; sx.busy = true; sx.error = ''; render();
  try {
    const r = await api('/api/shades/find', shadeRequest(sx));
    if (seq !== sx.seq) return;
    sx.shades = r.shades ?? []; sx.shadeIdx = 0; sx.shadeNote = ''; sx.finderTop = sx.shades[0]?.code ?? '';
    if (!sx.shades.length) sx.error = 'No shade matched that tone. Tap the next tone along.';
    else applySavedShade();
  } catch (e) { sx.error = `The shade finder did not answer (${e.message}). Tap a tone to try again.`; }
  sx.busy = false; render();
}

// When she has a saved shade, the plan uses it; if the finder's top match differs, say so and offer the switch.
function applySavedShade() {
  const sv = savedShade(); if (!sv || !sx.shades.length) return;
  const top = sx.shades[0];
  let i = sx.shades.findIndex(s => s.code === sv.code);
  if (i < 0) { sx.shades.unshift({ ...sv }); i = 0; } else sx.shades[i] = { ...sx.shades[i], saved: true, coverageNote: `${sv.coverageNote} · ${sx.shades[i].coverageNote ?? ''}`.replace(/ · $/, '') };
  sx.shadeIdx = i;
  sx.shadeNote = top.code === sv.code
    ? `Your saved shade, ${sv.name} (${sv.code}), is also the shade finder's top match.`
    : `The shade finder's top match for the tone you tapped is ${top.name} (${top.code}). Your saved shade is ${sv.name} (${sv.code}), so the plan uses ${sv.name}. Tap ${top.name} below to switch.`;
}

async function next() {
  sx.error = '';
  if (sx.step === 1) { sx.pick = cleanPick($('sxPick')?.value); if (!sx.pick && !sx.tappedLook) { sx.error = 'Type a song or artist, or tap a look.'; render(); return; } }
  sx.busy = true; render();
  try {
    if (sx.step === 1 && !sx.tappedLook) {
      // The shade step waits for this answer: the chain only moves on once the taste is back.
      let run = null;
      try { run = await api('/api/agent/run', tasteRequest(sx)); } catch { run = null; }
      sx.run = slimRun(run);
      sx.outcome = tasteOutcome(run, sx.pick); sx.lookIdx = null; // nothing pre-selected: the top pick is badged, she taps to choose
    } else if (sx.step === 2) {
      if (!sx.spectrum) sx.spectrum = await api('/api/shades/spectrum');
      sx.depth = null; sx.undertone = null; sx.shades = [];
    } else if (sx.step === 3) {
      sx.plan = await api('/api/transform', transformRequest({ shade: sx.shades[sx.shadeIdx], undertone: sx.undertone ?? sx.shades[sx.shadeIdx]?.undertone ?? null, communityId: sx.communityId, lookId: chosenLook().id, pick: sx.tappedLook ? '' : sx.pick }));
    }
    sx.step = stepAfter(sx.step, 'next');
  } catch (e) { sx.error = `That step did not work (${e.message}).`; }
  sx.busy = false; render();
  $('sxRoot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function save() {
  const look = chosenLook(); const shade = sx.shades[sx.shadeIdx];
  try {
    localStorage.setItem('mirrr.sixty.v1', JSON.stringify({ at: new Date().toISOString(), communityId: sx.communityId, pick: sx.tappedLook ? null : sx.pick, look: { id: look.id, name: look.name }, shade: { name: shade.name, code: shade.code, hex: shade.hex }, undertone: sx.undertone }));
    const { canvasToPhotoFile, savePhotoFile } = await import('./photo-save.js');
    const { file } = await canvasToPhotoFile($('sxAfter'));
    const how = await savePhotoFile(file);
    sx.status = how === 'cancelled' ? 'Saved on this device; the photo was not shared.' : 'Saved: your plan is kept on this device and the after photo was downloaded.';
  } catch { sx.status = 'Saved your plan on this device; the photo could not be exported here.'; }
  render();
  window.dispatchEvent(new CustomEvent('mirrr:moment', { detail: { kind: 'plan_save' } }));
}
async function share() {
  const look = chosenLook(); const shade = sx.shades[sx.shadeIdx];
  const text = shareText({ look: look.name, shade, community: communityLabel() }); const url = `${window.MirrrMoney ? window.MirrrMoney.shareUrl('sixty', look.id) : `${location.origin}/`}#sixty`;
  window.MirrrMoney?.count('share');
  try {
    if (navigator.share) { await navigator.share({ title: 'My MIRRR look', text, url }); sx.status = 'Shared.'; }
    else { await navigator.clipboard.writeText(`${text} ${url}`); sx.status = 'Copied a share link to your clipboard.'; }
  } catch (e) { sx.status = e?.name === 'AbortError' ? 'Not shared.' : `Copy this to share: ${text} ${url}`; }
  render();
}

let replayNext = false;
async function open() {
  const wantReplay = replayNext; replayNext = false;
  sx = fresh();
  const c = wantReplay ? readLastRun() : null;
  if (c) {
    // Replays the cached payloads of her last completed live run, exactly as they came back. No sample data.
    Object.assign(sx, { communityId: c.communityId, pick: c.pick, outcome: c.outcome, lookIdx: c.lookIdx, run: c.run, depth: c.depth, undertone: c.undertone,
      shades: c.shades, shadeIdx: c.shadeIdx, plan: c.plan, modelFace: c.modelFace, replay: { before: c.before, after: c.after, at: c.at }, step: 5 });
    render();
  }
  try {
    if (!sx.communities) sx.communities = (await api('/api/communities')).communities ?? [];
  } catch { if (!c) sx.error = 'The community list could not load. Refresh to try again.'; }
  render();
}
function show() { document.querySelector('.nav-link[data-view="sixty"]')?.click(); }

document.addEventListener('submit', e => { if (e.target.id === 'sxPickForm') { e.preventDefault(); sx.tappedLook = null; next(); } });
document.addEventListener('input', e => {
  if (e.target.id !== 'sxPick') return;
  sx.pick = cleanPick(e.target.value);
  if (sx.pick && sx.tappedLook) { sx.tappedLook = null; document.querySelectorAll('[data-sx-tap]').forEach(b => { b.classList.remove('sx-on'); b.setAttribute('aria-pressed', 'false'); }); }
  const btn = document.querySelector('#sxRoot [data-sx="next"]');
  if (btn) { btn.disabled = !(sx.pick || sx.tappedLook); btn.textContent = sx.tappedLook ? 'Use this look →' : 'Find my taste →'; }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('[data-open-sixty]') && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.target.click(); } });
document.addEventListener('click', e => {
  if (e.target.closest('[data-sx-replay]')) { if (readLastRun()) { replayNext = true; show(); } return; }
  if (e.target.closest('[data-open-sixty]')) { show(); return; }
  if (e.target.closest('.nav-link[data-view="sixty"]')) { open(); return; }
  if (!e.target.closest('#sxRoot')) return;
  const t = e.target.closest('[data-sx], [data-sx-community], [data-sx-tap], [data-sx-depth], [data-sx-under], [data-sx-look], [data-sx-shade], [data-sx-saved]');
  if (!t || sx.busy) return;
  if (t.dataset.sxCommunity) { sx.communityId = t.dataset.sxCommunity; render(); return; }
  if (t.dataset.sxTap) { sx.tappedLook = t.dataset.sxTap; if (sx.step === 1) { sx.pick = ''; } render(); return; }
  if (t.dataset.sxDepth) { sx.depth = Number(t.dataset.sxDepth); sx.shades = []; render(); findShades(); return; }
  if (t.dataset.sxUnder) { sx.undertone = t.dataset.sxUnder; sx.shades = []; render(); findShades(); return; }
  if (t.dataset.sxLook) { sx.lookIdx = Number(t.dataset.sxLook); sx.tappedLook = null; render(); return; }
  if (t.dataset.sxShade) {
    sx.shadeIdx = Number(t.dataset.sxShade); const s = sx.shades[sx.shadeIdx];
    if (sx.shadeNote) sx.shadeNote = s?.saved ? sx.shadeNote : `You switched to ${s?.name} (${s?.code}); your saved shade stays saved.`;
    render(); return;
  }
  if (t.dataset.sxSaved) { const sv = savedShade(); if (sv) { sx.shades = [sv]; sx.shadeIdx = 0; sx.finderTop = ''; sx.undertone ??= sv.undertone; sx.shadeNote = `Using your saved shade, ${sv.name} (${sv.code}). Tap a tone to see other matches.`; } render(); return; }
  const a = t.dataset.sx;
  if (a === 'back') { sx.replay = null; sx.error = ''; sx.status = ''; sx.step = stepAfter(sx.step, 'back'); render(); }
  else if (a === 'next') next();
  else if (a === 'restart') open();
  else if (a === 'save') save();
  else if (a === 'share') share();
  else if (a === 'full') { const l = chosenLook(); window.dispatchEvent(new CustomEvent('mirrr:tryon-look', { detail: { lookId: l.id, name: l.name } })); }
});
syncReplayButton();
// Deep link: /#sixty opens the chain.
if (location.hash === '#sixty') setTimeout(show, 0);
