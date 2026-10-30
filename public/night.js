/**
 * Night Routine view. Pick your hair, how you protect it, skin type, tonight's active, sleep
 * position and hours, Fitzpatrick type, community and a tone; the server builds the plan from the sleep
 * guides and this view draws a sleeper on a pillow with the hair protection, position and hours,
 * and tonight's skincare layers. The sleeper is a photographic plate per hair protection
 * (studio-photo.js); with no plate, the drawing renders.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const nt = { options: null, plan: null, choices: null, seq: 0 };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const li = s => `<li>${esc(s)}</li>`;
  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }
  const hexRgb = h => { const s = String(h).replace('#', ''); const f = s.length === 3 ? [...s].map(c => c + c).join('') : s; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)); };
  const rgbHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const label = k => String(k).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());

  // ---- Sleeper: head on a pillow, hair protection, position, hours ------------------------------
  function sleeperPanel(p) {
    const skin = p.tone.hex; const c = p.choices; const deep = lum(skin) < 0.18;
    const ink = deep ? mix(skin, '#ffffff', 0.7) : mix(skin, '#000000', 0.5);
    const silk = c.method === 'silkPillowcase';
    const pillow = silk ? '#d8c3e6' : '#e8e4da';
    const hairCol = '#1d1412'; const satin = '#8e5ea2';
    const hx = 120; const hy = 150;
    const hairDraw = {
      bonnet: `<path d="M${hx - 46},${hy - 6} A50,52 0 0 1 ${hx + 46},${hy - 6} Q${hx},${hy - 16} ${hx - 46},${hy - 6} Z" fill="${satin}"/><path d="M${hx - 46},${hy - 6} Q${hx},${hy - 18} ${hx + 46},${hy - 6}" stroke="#f3e5f5" stroke-width="3" fill="none"/>`,
      headWrap: `<path d="M${hx - 44},${hy - 4} A46,50 0 0 1 ${hx + 44},${hy - 4} Z" fill="#c2185b"/><path d="M${hx + 30},${hy - 46} q18,-14 26,0 q-10,10 -26,0" fill="#c2185b" stroke="#f8bbd0" stroke-width="1.5"/>`,
      pineapple: `<path d="M${hx - 42},${hy - 4} A44,40 0 0 1 ${hx + 42},${hy - 4} Z" fill="${hairCol}"/><circle cx="${hx}" cy="${hy - 58}" r="20" fill="${hairCol}"/><rect x="${hx - 12}" y="${hy - 44}" width="24" height="6" rx="3" fill="${satin}"/>`,
      looseBraid: `<path d="M${hx - 42},${hy - 4} A44,40 0 0 1 ${hx + 42},${hy - 4} Z" fill="${hairCol}"/>${[0, 1, 2, 3].map(i => `<ellipse cx="${hx + 52 + i * 12}" cy="${hy + 4}" rx="8" ry="6" fill="${hairCol}"/>`).join('')}`,
      twistMethod: `<path d="M${hx - 46},${hy - 6} A50,52 0 0 1 ${hx + 46},${hy - 6} Q${hx},${hy - 16} ${hx - 46},${hy - 6} Z" fill="${satin}"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${hx - 30 + i * 15},${hy - 14} q4,-8 0,-16" stroke="#f3e5f5" stroke-width="2" fill="none"/>`).join('')}`,
      silkPillowcase: `<path d="M${hx - 42},${hy - 4} A44,40 0 0 1 ${hx + 42},${hy - 4} Z" fill="${hairCol}"/>`,
    }[c.method];
    const creases = c.position === 'back_sleeping' ? '' : `<path d="M${hx + 18},${hy + 16} l12,6 M${hx + 14},${hy + 26} l14,4" stroke="${ink}" stroke-width="1.6" opacity="${silk ? 0.4 : 0.9}"/>`;
    const face = c.position === 'face_down'
      ? `<ellipse cx="${hx}" cy="${hy + 10}" rx="40" ry="34" fill="${skin}" stroke="${ink}" stroke-width="1.2"/><path d="M${hx - 30},${hy + 40} q30,10 60,0" stroke="${ink}" stroke-width="2" fill="none"/>`
      : `<ellipse cx="${hx}" cy="${hy + 10}" rx="40" ry="44" fill="${skin}" stroke="${ink}" stroke-width="1.2"/><path d="M${hx - 18},${hy + 8} q6,4 12,0 M${hx + 6},${hy + 8} q6,4 12,0" stroke="${ink}" stroke-width="2" fill="none"/><path d="M${hx - 10},${hy + 34} q10,5 20,0" stroke="${ink}" stroke-width="2" fill="none"/>`;
    const filled = Math.min(9, c.hours);
    const bar = [...Array(9)].map((_, i) => `<rect x="${42 + i * 18}" y="252" width="14" height="14" rx="3" fill="${i < filled ? (c.hours >= 7 ? '#2a9d8f' : '#e9c46a') : '#333'}"/>`).join('');
    const drawing = `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Sleeper">
      <rect width="240" height="300" rx="14" fill="#101425"/>
      <circle cx="200" cy="40" r="14" fill="#f1e3a0"/><circle cx="206" cy="35" r="12" fill="#101425"/>
      <rect x="22" y="${hy + 36}" width="196" height="54" rx="22" fill="${pillow}"/>${silk ? `<path d="M40,${hy + 50} q80,-14 160,0" stroke="#fff" stroke-width="3" opacity="0.6" fill="none"/>` : ''}
      ${face}${hairDraw}${creases}
      ${bar}<text x="120" y="286" text-anchor="middle" font-size="11" fill="#f5f5f5">${esc(c.hours)} hours · ${esc(p.positionLabel)}</text></svg>
      <figcaption><strong>${esc(p.hairProtection.method.name)}</strong><span>${esc(p.hairProtection.suited ? 'Suits your hair' : 'Not the best match for your hair')}</span></figcaption></figure>`;
    if (!window.StudioPhoto) return drawing;
    return window.StudioPhoto.panel({ studio: 'night', id: p.choices.method, fallback: drawing, w: 960, h: 720, alt: `Asleep with a ${p.hairProtection.method.name}`, caption: `<strong>${esc(p.hairProtection.method.name)}</strong><span>${esc(p.hairProtection.suited ? 'Suits your hair' : 'Not the best match for your hair')}</span>` });
  }

  // ---- Tonight's layers ---------------------------------------------------------------------------
  function layersPanel(p) {
    const skin = p.tone.hex; const colours = ['#90caf9', '#ce93d8', '#a5d6a7', '#ffe082'];
    const layers = p.routine.map((r, i) => `<rect x="40" y="${200 - i * 40}" width="160" height="34" rx="8" fill="${r.step.startsWith('Skip') ? '#444' : colours[i % colours.length]}" opacity="0.9"/><text x="120" y="${222 - i * 40}" text-anchor="middle" font-size="11" fill="#141414">${esc(r.step.split(/[(:]/)[0].trim().slice(0, 28))}</text>`).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Tonight's layers">
      <rect width="240" height="300" rx="14" fill="#141414"/>
      <rect x="30" y="240" width="180" height="30" rx="6" fill="${skin}"/><text x="120" y="260" text-anchor="middle" font-size="11" fill="${lum(skin) < 0.18 ? '#f5f5f5' : '#141414'}">Skin</text>
      ${layers}</svg>
      <figcaption><strong>Tonight's layers</strong><span>${esc(p.activeLabel)} · Type ${esc(p.choices.fitzpatrick)}</span></figcaption></figure>`;
  }

  // Nothing is pre-selected: every dropdown opens on a disabled "Choose…" and shows a value only once
  // picked here. Until the first pick the studio shows its neutral base (no tint, no plan); after it,
  // fields still on "Choose…" fall back to a suggested value so the plan never sees undefined.
  const PICKED = new Set(); const OWN = new Set();
  const anyPicked = () => [...OWN].some(id => PICKED.has(id));
  function renderBase() {
    ++nt.seq; nt.plan = null;
    const put = (k, h) => { const el = $('nt' + k); if (el) el.innerHTML = h; };
    put('Preview', '');
    put('Summary', '<p class="lib-note choose-first">Choose your options above to see your plan.</p>');
    put('Plan', '');
  }
  function select(id, text, values, current) {
    OWN.add(id);
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}"><option value="" disabled${PICKED.has(id) ? '' : ' selected'}>Choose…</option>${values.map(v => `<option value="${esc(v.id)}"${PICKED.has(id) && String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = nt.options; const c = nt.choices;
    $('ntControls').innerHTML = `
      ${select('ntHair', 'Hair', o.hair, c.hair)}
      ${select('ntMethod', 'Hair protection', o.methods, c.method)}
      ${select('ntSkin', 'Skin type', o.skin, c.skin)}
      ${select('ntActive', 'Active tonight', o.actives, c.active)}
      ${select('ntPosition', 'Sleep position', o.positions, c.position)}
      ${select('ntHours', 'Hours of sleep', o.hours, c.hours)}
      ${select('ntFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('ntCommunity', 'Community', o.communities, c.community)}
      ${select('ntTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  function renderPlan() {
    const o = nt.options; const raw = nt.plan;
    const p = { ...raw, positionLabel: o.positions.find(x => x.id === raw.choices.position)?.label ?? '', activeLabel: o.actives.find(x => x.id === raw.choices.active)?.label ?? '' };
    const hp = p.hairProtection; const s = p.sleep; const cn = p.communityNotes;
    $('ntPreview').innerHTML = sleeperPanel(p) + layersPanel(p);
    $('ntSummary').innerHTML = `<p class="hl-big">${esc(hp.method.name)}${hp.suited ? ' suits your hair' : ' is not named for your hair'}; ${esc(s.enough ? `${s.hours} hours is in the healthy range` : `${s.hours} hours is short`)}</p>${hp.suited ? '' : `<p>Named for your hair: ${esc(hp.suggested.join(', '))}</p>`}`;
    $('ntPlan').innerHTML = [
      card('Tonight, in order', `<ol>${p.routine.map(r => `<li><strong>${esc(r.step)}</strong>: ${esc(r.detail)}${r.beginner ? `<br><em>Starting out:</em> ${esc(r.beginner)}` : ''}${r.strength ? `<br><em>For your skin type:</em> ${esc(r.strength)}` : ''}</li>`).join('')}</ol>${p.skinType.darkMarks ? `<p class="lib-note">${esc(p.skinType.darkMarks)}: be gentle with actives and wear sunscreen by day.</p>` : ''}${p.conflicts.avoid.length ? `<p><strong>Not tonight</strong></p><ul>${p.conflicts.avoid.map(li).join('')}</ul>` : ''}${p.conflicts.fine.length ? `<p><strong>Fine together</strong></p><ul>${p.conflicts.fine.map(li).join('')}</ul>` : ''}`),
      card(hp.method.name, `${hp.method.description ? `<p>${esc(hp.method.description)}</p>` : ''}<p><strong>Named for:</strong> ${esc(hp.method.bestFor.join(', '))}</p>${hp.method.tips ? `<ul>${hp.method.tips.map(li).join('')}</ul>` : ''}${hp.method.choosing ? Object.entries(hp.method.choosing).map(([k, v]) => `<p><strong>${esc(label(k))}:</strong> ${esc(v)}</p>`).join('') : ''}`, hp.suited ? '' : ' hl-warn'),
      hp.overnightMask ? card('Overnight hair mask', `<p>${esc(hp.overnightMask.how)}</p><p class="lib-note">${esc(hp.overnightMask.caution)}</p>`) : '',
      card('Sleep', `<p><strong>${esc(s.position.position)}:</strong> ${esc(s.position.skin_impact)}</p>${s.position.mitigation ? `<p>${esc(s.position.mitigation)}</p>` : ''}${s.position.disadvantages ? `<p>${esc(s.position.disadvantages)}</p>` : ''}<p>${esc(s.duration)}</p><p>${esc(s.deepSleep)}</p>${s.shortSleepEffects ? `<p><strong>After a short night</strong></p><ul>${s.shortSleepEffects.map(li).join('')}</ul>` : ''}<p><strong>Bedroom:</strong> ${esc(Object.entries(s.environment).map(([k, v]) => `${label(k)} ${v}`).join('; '))}</p>`, s.enough ? '' : ' hl-warn'),
      card('Wind-down', `<ol>${p.windDown.map(w => `<li><strong>${esc(w.name)}</strong> (${esc(w.time)}): ${esc(w.action)}</li>`).join('')}</ol>`),
      card(`${p.community.label} night traditions`, `${cn.traditions ? `<p>${esc(cn.traditions)}</p>` : ''}<p><strong>Overnight hero:</strong> ${esc(cn.summary.keyOvernightHero)}</p><p><strong>Tradition:</strong> ${esc(cn.summary.uniqueTradition)}</p><p><strong>Scent:</strong> ${esc(cn.scent)}</p><details><summary>More</summary><p>${esc(cn.philosophy)}</p>${cn.rituals.map(r => `<p><strong>${esc(r.name)}</strong>${r.description ? `<br>${esc(r.description)}` : ''}</p>`).join('')}${cn.ingredients.map(i => `<p><strong>${esc(label(i.id))}:</strong> ${esc(i.overnight)}</p>`).join('')}</details>`),
    ].join('');
  }

  async function replan() {
    const seq = ++nt.seq;
    try {
      const plan = await api('/api/night/plan', nt.choices);
      if (seq !== nt.seq) return;
      nt.plan = plan;
      renderPlan();
    } catch (e) {
      $('ntPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openStudio() {
    try {
      if (!nt.options) nt.options = await api('/api/night/options');
      if (!nt.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? nt.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : nt.options.tones[6];
        nt.choices = { hair: 'coily', method: 'bonnet', skin: 'normal', active: 'none', position: 'side_sleeping', hours: 7, fitzpatrick: 'V', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      if (anyPicked()) await replan(); else renderBase();
    } catch (e) {
      $('ntPlan').innerHTML = `<p class="lib-note">The Night Routine planner could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { ntHair: 'hair', ntMethod: 'method', ntSkin: 'skin', ntActive: 'active', ntPosition: 'position', ntHours: 'hours', ntFitz: 'fitzpatrick', ntCommunity: 'community', ntTone: 'tone' };
  document.addEventListener('change', e => {
    if (OWN.has(e.target.id) && e.target.value !== '') PICKED.add(e.target.id);
    const k = FIELD[e.target.id];
    if (!k || !nt.choices) return;
    nt.choices[k] = k === 'hours' ? Number(e.target.value) : e.target.value;
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view="night"], [data-open-night]');
    if (!t) return;
    if (t.dataset.openNight !== undefined) { document.querySelector('.nav-link[data-view="night"]')?.click(); return; }
    openStudio();
  });
})();
