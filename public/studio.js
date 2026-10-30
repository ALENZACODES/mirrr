/**
 * Brow & Kohl Studio view. Pick face shape, eye shape, brow density, a brow architecture and an
 * eye look; the server builds the technique plan from the guides, and this view draws the result
 * on a brow-and-eye diagram (in your saved skin shade when you have one). With photographic plates
 * (studio-photo.js), the slot shows the chosen eye look on a real eye beside the chosen brow
 * architecture on the same eye; with no plate, the diagram renders.
 */

const PROFILE_KEY = 'mirrr.profile.v1';
const st = { options: null, plan: null, choices: {}, seq: 0, toneChanged: false };
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nice = s => String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function profile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { return {}; }
}

async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ---- Diagram -------------------------------------------------------------------------------

const EYE = { x0: 80, x1: 250, y: 104 };
const lerp = (a, b, t) => a + (b - a) * t;
function quad(p0, c, p1, t) {
  return [lerp(lerp(p0[0], c[0], t), lerp(c[0], p1[0], t), t), lerp(lerp(p0[1], c[1], t), lerp(c[1], p1[1], t), t)];
}

function eyeCurves(eyeShape) {
  const open = eyeShape === 'round' ? 52 : eyeShape === 'monolid' ? 34 : eyeShape === 'hooded' ? 36 : 44;
  const upperC = [165, EYE.y - open - 4];
  const lowerC = [165, EYE.y + (eyeShape === 'round' ? 34 : 26)];
  const inner = [EYE.x0, EYE.y + 2]; const outer = [EYE.x1, EYE.y - (eyeShape === 'round' ? 0 : 5)];
  const shift = eyeShape === 'wide_set' ? 10 : eyeShape === 'close_set' ? -10 : 0;
  const s = p => [p[0] + shift, p[1]];
  return { inner: s(inner), outer: s(outer), upperC: s(upperC), lowerC: s(lowerC), shift };
}

function linerPolygon(cv, g) {
  if (!(g.inner || g.outer)) return '';
  const top = []; const bot = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24; const [x, y] = quad(cv.inner, cv.upperC, cv.outer, t);
    const w = lerp(g.inner, g.outer, t);
    top.push([x, y - w]); bot.push([x, y + 0.6]);
  }
  const rad = (g.wingAngle * Math.PI) / 180;
  const tip = [cv.outer[0] + g.wingLength * Math.cos(rad), cv.outer[1] - g.wingLength * Math.sin(rad)];
  const pts = g.wingLength ? [...top, tip, ...bot.reverse()] : [...top, ...bot.reverse()];
  return pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
}

function browPath(g, shift) {
  const hx = 70 + shift; const hy = 56; const run = 180 + (g.extend ?? 0);
  const ax = hx + run * g.archAt; const ay = hy - g.lift;
  const tx = hx + run; const ty = ay + g.tailDrop;
  const aw = (g.headWidth + g.tailWidth) / 2;
  if (g.strokes) {
    // sparse brows: drawn as hair strokes so the diagram shows strokes, not a block
    const lines = [];
    for (let i = 0; i <= 34; i++) {
      const t = i / 34;
      const x = t <= g.archAt ? lerp(hx, ax, t / g.archAt) : lerp(ax, tx, (t - g.archAt) / (1 - g.archAt));
      const y = t <= g.archAt ? lerp(hy, ay, t / g.archAt) : lerp(ay, ty, (t - g.archAt) / (1 - g.archAt));
      const w = lerp(g.headWidth, g.tailWidth, t);
      const lean = lerp(-0.2, 0.9, t);
      lines.push(`<line x1="${x.toFixed(1)}" y1="${(y + w / 2).toFixed(1)}" x2="${(x + lean * w).toFixed(1)}" y2="${(y - w / 2).toFixed(1)}" />`);
    }
    return `<g class="st-brow-strokes">${lines.join('')}</g>`;
  }
  const top = g.angular
    ? `M${hx},${hy - g.headWidth / 2} L${ax},${ay - aw / 2} L${tx},${ty - g.tailWidth / 2}`
    : `M${hx},${hy - g.headWidth / 2} Q${ax},${ay - aw / 2 - g.lift * 0.4} ${tx},${ty - g.tailWidth / 2}`;
  const bottom = g.angular
    ? `L${tx},${ty + g.tailWidth / 2} L${ax},${ay + aw / 2} L${hx},${hy + g.headWidth / 2} Z`
    : `L${tx},${ty + g.tailWidth / 2} Q${ax},${ay + aw / 2 - g.lift * 0.4} ${hx},${hy + g.headWidth / 2} Z`;
  return `<path class="st-brow" d="${top} ${bottom}" />`;
}

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex)); if (!m) return 0.5;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function drawDiagram(plan, skin) {
  const cv = eyeCurves(plan.choices.eyeShape);
  const g = plan.eye.geometry; const b = plan.brow.geometry;
  // A brown liner too close to the skin would vanish in the drawing, so below a 3:1 contrast it
  // is drawn in a deeper brown.
  const ink = g.colour ? ((luminance(skin) + 0.05) / (luminance(g.colour) + 0.05) < 3 ? '#1c0f08' : g.colour) : '#111';
  const upper = `M${cv.inner} Q${cv.upperC} ${cv.outer}`;
  const lower = `M${cv.inner} Q${cv.lowerC} ${cv.outer}`;
  const crease = plan.choices.eyeShape === 'monolid' ? '' :
    `<path class="st-crease" d="M${cv.inner[0] + 8},${cv.inner[1] - 10} Q${cv.upperC[0]},${cv.upperC[1] - (plan.choices.eyeShape === 'hooded' ? 2 : 14)} ${cv.outer[0] - 4},${cv.outer[1] - 12}" />`;
  const lowerPts = [];
  if (g.lower > 0) for (let i = 0; i <= 16; i++) lowerPts.push(quad(cv.inner, cv.lowerC, cv.outer, 1 - g.lower + (g.lower * i) / 16));
  const flick = g.innerFlick ? `<line class="st-ink" x1="${cv.inner[0]}" y1="${cv.inner[1]}" x2="${cv.inner[0] - g.innerFlick}" y2="${cv.inner[1] + 3}" stroke="${ink}" stroke-width="2.4" />` : '';
  const water = g.waterline.map(w => `<path class="st-water" d="${w === 'upper'
    ? `M${quad(cv.inner, cv.upperC, cv.outer, 0.06)} Q${cv.upperC[0]},${cv.upperC[1] + 7} ${quad(cv.inner, cv.upperC, cv.outer, 0.94)}`
    : `M${quad(cv.inner, cv.lowerC, cv.outer, 0.06)} Q${cv.lowerC[0]},${cv.lowerC[1] - 6} ${quad(cv.inner, cv.lowerC, cv.outer, 0.94)}`}" stroke="${ink}" />`).join('');
  const floating = g.floating ? `<path class="st-ink" d="M${cv.inner[0] + 30},${cv.inner[1] - 22} Q${cv.upperC[0]},${cv.upperC[1] - 18} ${cv.outer[0] + 10},${cv.outer[1] - 26}" stroke="${ink}" stroke-width="2.5" fill="none" />` : '';
  return `<svg class="st-svg" viewBox="0 0 320 170" role="img" aria-label="${esc(plan.brow.label)} with ${esc(plan.eye.label)}${plan.choices.wearsGlasses ? ', wearing glasses' : ''}">
    <defs><filter id="stSmudge"><feGaussianBlur stdDeviation="${g.smudge}" /></filter></defs>
    <rect width="320" height="170" rx="14" fill="${esc(skin)}" />
    <g class="st-brow-wrap" fill="#2b1d16" stroke="#2b1d16">${browPath(b, cv.shift)}</g>
    ${crease}
    <path d="${upper} Q${cv.lowerC} ${cv.inner}" fill="#f7f3ee" />
    <clipPath id="stEyeClip"><path d="${upper} Q${cv.lowerC} ${cv.inner}" /></clipPath>
    <g clip-path="url(#stEyeClip)"><circle cx="${165 + cv.shift}" cy="${EYE.y - 2}" r="21" fill="#4a2e1f" /><circle cx="${165 + cv.shift}" cy="${EYE.y - 2}" r="8" fill="#0b0705" /></g>
    <path d="${upper}" fill="none" stroke="#3a2a22" stroke-width="1.2" />
    <path d="${lower}" fill="none" stroke="#6b5246" stroke-width="0.8" />
    <g filter="${g.smudge ? 'url(#stSmudge)' : ''}">
      <polygon class="st-ink" points="${linerPolygon(cv, g)}" fill="${ink}" />
      ${lowerPts.length ? `<polyline class="st-ink" points="${lowerPts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${ink}" stroke-width="2.2" />` : ''}
      ${water}${flick}${floating}
    </g>
    ${plan.choices.wearsGlasses ? `<g class="st-frames"><rect x="${58 + cv.shift}" y="70" width="${222}" height="88" rx="28" fill="rgba(190,215,255,0.16)" stroke="#1d1d1f" stroke-width="5" /><line x1="${280 + cv.shift}" y1="88" x2="320" y2="82" stroke="#1d1d1f" stroke-width="5" /><line x1="0" y1="96" x2="${58 + cv.shift}" y2="100" stroke="#1d1d1f" stroke-width="5" /></g>` : ''}
  </svg>`;
}

// ---- Panels --------------------------------------------------------------------------------

// One slot: the eye-look plate and the brow-architecture plate of the same eye, side by side.
function photoSlot(p, drawing) {
  const SP = window.StudioPhoto;
  if (!SP || !SP.photoFor('brow', `eye-${p.eye.look}`)) return drawing;
  const eye = SP.panel({ studio: 'brow', id: `eye-${p.eye.look}`, fallback: drawing, w: 1152, h: 648, alt: `${p.eye.label} on a real eye`, caption: `<strong>${esc(p.eye.label)}</strong>` });
  const brow = SP.panel({ studio: 'brow', id: `brow-${p.brow.style}`, fallback: '', w: 1152, h: 648, alt: `${p.brow.label} brow`, caption: `<strong>${esc(p.brow.label)}</strong>` });
  return `<div class="st-photo-pair">${eye}${brow}</div>`;
}

function select(id, label, values, current, allowAuto) {
  return `<label class="st-field"><span>${esc(label)}</span><select id="${id}">
    ${allowAuto ? `<option value="">Recommended for me</option>` : ''}
    ${values.map(v => { const val = typeof v === 'string' ? v : v.id; const lab = typeof v === 'string' ? nice(v) : v.label; return `<option value="${esc(val)}"${val === current ? ' selected' : ''}>${esc(lab)}</option>`; }).join('')}
  </select></label>`;
}

function renderControls() {
  const o = st.options; const c = st.choices;
  $('stControls').innerHTML = `
    ${select('stCommunity', 'Community', o.communities, c.community)}
    ${select('stFace', 'Face shape', o.faceShapes, c.faceShape)}
    ${select('stEyeShape', 'Eye shape', o.eyeShapes, c.eyeShape)}
    ${select('stDensity', 'Your brows', o.browDensities, c.browDensity)}
    ${select('stTone', 'Skin depth', o.skinTones, c.skinTone)}
    ${select('stBrow', 'Brow architecture', o.browStyles, c.browStyle, true)}
    <label class="st-field st-check"><input type="checkbox" id="stGlasses"${c.wearsGlasses ? ' checked' : ''}> <span>I wear glasses</span></label>`;
}

function renderPlan() {
  const p = st.plan; if (!p) return;
  const TONE_SWATCH = { light: '#e3bf9f', 'medium-olive': '#c09062', 'medium-deep': '#8a5638', deep: '#4c2c1c' };
  const savedHex = profile().face?.hex;
  const skin = savedHex && st.choices.shadeId && !st.toneChanged ? savedHex : TONE_SWATCH[p.choices.skinTone];
  $('stDiagram').innerHTML = photoSlot(p, drawDiagram(p, skin));
  $('stLooks').innerHTML = p.ranking.map(l => `
    <button type="button" class="st-look${l.id === p.eye.look ? ' st-look--on' : ''}" data-st-look="${l.id}" aria-pressed="${l.id === p.eye.look}">
      <span class="st-look-name">${esc(l.label)}</span>
      ${l.forYou ? `<span class="lib-badge lib-badge--yours">${esc(p.community?.label ?? '')} tradition</span>` : ''}
    </button>`).join('');
  const li = s => `<li>${esc(s)}</li>`;
  $('stPlan').innerHTML = `
    ${p.because.length ? `<div class="st-because">${p.because.map(b => `<p><strong>Why this ${b.about === 'brow' ? 'brow' : 'eye look'}:</strong> ${esc(b.text)}</p>`).join('')}</div>` : ''}
    <article class="st-card">
      <h4>${esc(p.brow.label)} <span class="st-sub">${p.brow.chosenBy === 'you' ? 'your choice' : p.brow.chosenBy === 'community' ? `${esc(p.community?.label ?? '')} tradition` : `suits a ${esc(p.choices.faceShape)} face`}</span></h4>
      <ol class="st-steps">${p.brow.steps.map(li).join('')}</ol>
      ${p.brow.fill.products.length ? `<p class="st-products"><strong>Products:</strong> ${p.brow.fill.products.map(esc).join(' · ')}</p>` : ''}
      ${p.brow.faceAdvice?.avoid ? `<p class="st-avoid"><strong>Avoid:</strong> ${esc(p.brow.faceAdvice.avoid)}</p>` : ''}
    </article>
    <article class="st-card">
      <h4>${esc(p.eye.label)}</h4>
      ${p.eye.what ? `<p>${esc(p.eye.what)}</p>` : ''}
      <ol class="st-steps">${p.eye.steps.map(li).join('')}</ol>
      ${p.eye.eyeShapeTip ? `<p><strong>For your eye shape:</strong> ${esc(p.eye.eyeShapeTip.tip)}</p>` : ''}
      ${p.eye.waterlineSafety ? `<div class="st-safety"><strong>Waterline safety</strong><ul>${Object.values(p.eye.waterlineSafety).map(li).join('')}</ul></div>` : ''}
      ${p.eye.kohlSafety ? `<div class="st-safety"><strong>${esc(p.eye.kohlSafety.name)}</strong><ul>${p.eye.kohlSafety.risk.map(li).join('')}</ul>${p.eye.kohlSafety.safer.length ? `<p><strong>Safer choices:</strong> ${p.eye.kohlSafety.safer.map(esc).join(' · ')}</p>` : ''}</div>` : ''}
      ${p.eye.shadowColours ? `<p><strong>Shadow colours for ${esc(p.eye.shadowColours.tones ?? nice(p.choices.skinTone))} skin:</strong> ${(p.eye.shadowColours.what_works ?? []).map(esc).join(' · ')}</p>${p.eye.shadowColours.avoid ? `<p class="st-avoid"><strong>Skip:</strong> ${[].concat(p.eye.shadowColours.avoid).map(esc).join(' · ')}</p>` : ''}` : ''}
      ${p.eye.products.length ? `<p class="st-products"><strong>Products:</strong> ${p.eye.products.map(x => esc(x.name ?? x)).join(' · ')}</p>` : ''}
    </article>
    ${p.glasses ? `<article class="st-card"><h4>With glasses</h4><ul>${p.glasses.principles.map(li).join('')}</ul></article>` : ''}`;
}

async function replan() {
  const seq = ++st.seq;
  try {
    const plan = await api('/api/studio/plan', st.choices);
    if (seq !== st.seq) return; // a newer choice already won
    st.plan = plan;
    st.choices.community = plan.community?.id ?? st.choices.community;
    st.choices.skinTone = plan.choices.skinTone;
    renderPlan();
  } catch (e) {
    $('stPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
  }
}

async function openStudio() {
  try {
    if (!st.options) st.options = await api('/api/studio/options');
    if (!st.choices.community) {
      const pr = profile();
      st.choices = { community: pr.communityId || 'south_asian', faceShape: 'oval', eyeShape: 'almond', browDensity: 'medium', browStyle: '', eyeLook: '', wearsGlasses: false, shadeId: pr.face?.shadeId ?? null, skinTone: '' };
    }
    renderControls();
    await replan();
    renderControls();
  } catch (e) {
    $('stPlan').innerHTML = `<p class="lib-note">The Studio could not load (${esc(e.message)}).</p>`;
  }
}

const FIELD = { stCommunity: 'community', stFace: 'faceShape', stEyeShape: 'eyeShape', stDensity: 'browDensity', stBrow: 'browStyle', stTone: 'skinTone' };
document.addEventListener('change', e => {
  if (FIELD[e.target.id]) {
    st.choices[FIELD[e.target.id]] = e.target.value;
    if (e.target.id === 'stCommunity') st.choices.eyeLook = '';
    if (e.target.id === 'stTone') st.toneChanged = true;
    replan();
  } else if (e.target.id === 'stGlasses') { st.choices.wearsGlasses = e.target.checked; replan(); }
});
document.addEventListener('click', e => {
  const t = e.target.closest('[data-view="studio"], [data-st-look], [data-open-studio]');
  if (!t) return;
  if (t.dataset.openStudio !== undefined) { document.querySelector('.nav-link[data-view="studio"]')?.click(); return; }
  if (t.dataset.stLook) { st.choices.eyeLook = t.dataset.stLook; replan(); return; }
  openStudio();
});
