/**
 * Look Book view. Pick your community, a category, the time you have, your skill level and the
 * season; the server lists the looks that fit (from the look database) and, for the one you choose,
 * the order to apply it, the lip colour you pick, shade notes for your tone, safety notes and a
 * step-by-step tutorial to practise. This view draws the face, the order of application and how the
 * look fits your filters. The face is an illustration in the tone you pick, never your photo.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const lb = { options: null, plan: null, choices: null, seq: 0 };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const li = s => `<li>${esc(s)}</li>`;
  const ul = a => (a && a.length ? `<ul>${a.map(li).join('')}</ul>` : '');
  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }
  const hexRgb = h => { const s = String(h).replace('#', ''); const f = s.length === 3 ? [...s].map(c => c + c).join('') : s; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)); };
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const inkOn = h => (lum(h) > 0.18 ? '#141414' : '#f5f5f5');
  const shade = (h, t) => { const c = hexRgb(h).map(v => Math.max(0, Math.min(255, Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t)))); return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`; };
  const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

  // ---- Panel 1: the face ---------------------------------------------------------------------------
  function eye(cx, cy, flip, pic) {
    const s = flip ? -1 : 1; const X = d => (cx + s * d).toFixed(1);
    const lids = pic.lid; const gid = `lbLid${flip ? 'R' : 'L'}`;
    const grad = `<linearGradient id="${gid}" x1="${flip ? 1 : 0}" x2="${flip ? 0 : 1}" y1="0" y2="0">${lids.map((c, i) => `<stop offset="${lids.length === 1 ? 0 : i / (lids.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
    const lid = `<path d="M${X(-17)},${cy} Q${cx},${cy - 22} ${X(19)},${cy - 2} Q${cx},${cy - 9} ${X(-17)},${cy} Z" fill="url(#${gid})" opacity="0.95"/>`;
    let liner = '';
    const lc = pic.linerColour;
    if (pic.liner === 'wing') liner = `<path d="M${X(-15)},${cy} Q${cx},${cy - 8} ${X(17)},${cy - 1} L${X(27)},${cy - 9}" stroke="${lc}" stroke-width="2.4" fill="none"/>`;
    else if (pic.liner === 'cat') liner = `<path d="M${X(-15)},${cy} Q${cx},${cy - 8} ${X(17)},${cy - 1} L${X(33)},${cy - 13}" stroke="${lc}" stroke-width="2.8" fill="none"/>`;
    else if (pic.liner === 'graphic') liner = `<path d="M${X(-15)},${cy} Q${cx},${cy - 8} ${X(17)},${cy - 1} L${X(29)},${cy - 7}" stroke="${lc}" stroke-width="2.2" fill="none"/><path d="M${X(-12)},${cy - 14} Q${cx},${cy - 26} ${X(22)},${cy - 10}" stroke="${lc}" stroke-width="1.6" fill="none"/>`;
    else if (pic.liner === 'puppy') liner = `<path d="M${X(-15)},${cy} Q${cx},${cy - 8} ${X(17)},${cy - 1} L${X(24)},${cy + 4}" stroke="${lc}" stroke-width="2.2" fill="none"/>`;
    else if (pic.liner === 'smudge') liner = `<path d="M${X(-15)},${cy} Q${cx},${cy - 8} ${X(17)},${cy - 1}" stroke="${lc}" stroke-width="3.2" fill="none" opacity="0.85"/><path d="M${X(-13)},${cy + 2} Q${cx},${cy + 8} ${X(16)},${cy + 1}" stroke="${lc}" stroke-width="2.6" fill="none" opacity="0.55"/>`;
    else if (pic.liner === 'thin') liner = `<path d="M${X(-15)},${cy} Q${cx},${cy - 8} ${X(17)},${cy - 1}" stroke="${lc}" stroke-width="1.4" fill="none"/>`;
    const lashes = pic.lashes === 'none' ? '' : [0.2, 0.4, 0.6, 0.8, 1].map(t => { const x = cx + s * (-12 + 28 * t); const y = cy - 6 + 4 * Math.abs(t - 0.5); const L = pic.lashes === 'full' ? 7 : 4; return `<path d="M${x.toFixed(1)},${y.toFixed(1)} l${(s * 2).toFixed(1)},-${L}" stroke="#111" stroke-width="1.2"/>`; }).join('');
    const white = `<path d="M${X(-15)},${cy} Q${cx},${cy - 8} ${X(17)},${cy - 1} Q${cx},${cy + 7} ${X(-15)},${cy} Z" fill="#fbf7f2"/><circle cx="${X(1)}" cy="${cy - 1}" r="4.6" fill="#3b2418"/>`;
    const gems = pic.gems ? [0, 1, 2].map(i => `<circle cx="${X(-6 + i * 9)}" cy="${cy + 9 + (i % 2) * 2}" r="1.8" fill="#e0fbfc" stroke="#9bf6ff" stroke-width="0.6"/>`).join('') : '';
    const glitter = pic.glitter ? [0, 1, 2, 3, 4].map(i => `<path d="M${X(-10 + i * 6)},${cy - 13 + (i % 2) * 4} l1.2,2 l-1.2,2 l-1.2,-2 Z" fill="#fff"/>`).join('') : '';
    return { defs: grad, g: lid + white + liner + lashes + gems + glitter };
  }
  function brows(pic, skin) {
    const col = pic.brow === 'bleached' ? shade(skin, 0.35) : '#2b1b14';
    const B = { bold: [5, 'M74,98 Q92,86 112,94'], thin: [1.8, 'M76,96 Q92,84 110,93'], straight: [4, 'M74,96 L112,93'], natural: [3.4, 'M75,97 Q92,88 111,94'], bleached: [4, 'M74,98 Q92,86 112,94'], connected: [4.4, 'M74,98 Q92,86 112,94'], none: [0, ''] }[pic.brow];
    if (!B[0]) return '';
    const m = d => d.replace(/(\d+),(\d+)/g, (_, x, y) => `${240 - Number(x)},${y}`);
    const join = pic.brow === 'connected' ? `<path d="M112,94 Q120,96 128,94" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round"/>` : '';
    return `<path d="${B[1]}" stroke="${col}" stroke-width="${B[0]}" fill="none" stroke-linecap="round"/><path d="${m(B[1])}" stroke="${col}" stroke-width="${B[0]}" fill="none" stroke-linecap="round"/>${join}`;
  }
  const FOCUS = { eyes: '<ellipse cx="120" cy="110" rx="70" ry="22"', lips: '<ellipse cx="120" cy="178" rx="34" ry="18"', brows: '<ellipse cx="120" cy="92" rx="70" ry="14"', base: '<ellipse cx="120" cy="140" rx="78" ry="92"', hands: '<rect x="30" y="236" width="180" height="40" rx="10"' };
  function facePanel(p) {
    const pic = p.picture; const skin = pic.skin; const L = eye(96, 112, false, pic); const R = eye(144, 112, true, pic);
    const lipHi = pic.lipFinish === 'gloss' || pic.lipFinish === 'shine' ? `<path d="M110,181 Q120,184 130,181" stroke="#fff" stroke-width="2.2" opacity="${pic.lipFinish === 'shine' ? 0.9 : 0.6}" fill="none" stroke-linecap="round"/>` : '';
    const focus = pic.focus && FOCUS[pic.focus] ? `${FOCUS[pic.focus]} fill="none" stroke="#ffd166" stroke-width="2.5" stroke-dasharray="6 4"/>` : '';
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="The look on a face in your tone">
      <defs>${L.defs}${R.defs}<radialGradient id="lbBlush"><stop offset="0" stop-color="${pic.blush}" stop-opacity="0.75"/><stop offset="1" stop-color="${pic.blush}" stop-opacity="0"/></radialGradient></defs>
      <rect width="240" height="300" rx="14" fill="#1b1b2f"/>
      <path d="M92,226 L92,262 Q120,276 148,262 L148,226 Z" fill="${pic.neck}"/>
      <path d="M52,70 Q120,4 188,70 L196,150 Q190,70 120,52 Q50,70 44,150 Z" fill="#2b1b14"/>
      <ellipse cx="120" cy="136" rx="66" ry="92" fill="${skin}"/>
      <ellipse cx="84" cy="150" rx="20" ry="13" fill="url(#lbBlush)"/><ellipse cx="156" cy="150" rx="20" ry="13" fill="url(#lbBlush)"/>
      <path d="M78,134 q8,-4 16,0 M146,134 q8,-4 16,0" stroke="${pic.highlight}" stroke-width="3" opacity="0.7" fill="none" stroke-linecap="round"/>
      <path d="M120,142 q-6,12 -2,18 q2,2 4,0" stroke="${shade(pic.neck, -0.25)}" stroke-width="1.6" fill="none"/>
      ${brows(pic, pic.neck)}${L.g}${R.g}
      <path d="M100,178 Q110,170 120,174 Q130,170 140,178 Q130,192 120,192 Q110,192 100,178 Z" fill="${pic.lip}" opacity="${pic.lipSheer ? 0.7 : 1}"/>
      <path d="M100,178 Q120,182 140,178" stroke="${shade(pic.lip, -0.35)}" stroke-width="1" fill="none"/>${lipHi}${focus}
      <text x="120" y="250" text-anchor="middle" font-size="10" font-weight="700" fill="#fefae0">${esc(clip(p.look.label, 32))}</text>
      <text x="120" y="266" text-anchor="middle" font-size="8" fill="#c9c9c9">${esc(clip(`${p.tone.label} · lip: ${p.lip.label}`, 46))}</text>
      <text x="120" y="282" text-anchor="middle" font-size="8" fill="#ffd166">${p.practise ? esc(clip(`practising: ${p.practise.title}`, 46)) : 'no tutorial picked'}</text></svg>
      <figcaption><strong>${esc(p.look.label)}</strong><span>${esc(p.look.community)} · ${esc(p.look.category)}</span></figcaption></figure>`;
  }

  // ---- Panel 2: order of application -------------------------------------------------------------
  const ZONE_COL = { base: '#d4a373', brows: '#6f4518', eyes: '#7b2cbf', face: '#e5989b', lips: '#c1121f', set: '#90e0ef' };
  function orderPanel(p) {
    const pic = p.picture;
    const chip = z => (z === 'eyes' ? pic.lid : z === 'lips' ? [pic.lip] : z === 'face' ? [pic.blush, pic.highlight] : z === 'base' ? [pic.skin] : []);
    const rows = p.order.steps.map((s, i) => {
      const y = 46 + i * 38; const hot = pic.focus && (pic.focus === s.zone || (pic.focus === 'base' && s.zone === 'base'));
      return `<rect x="14" y="${y}" width="212" height="30" rx="8" fill="${hot ? '#3a3a5e' : '#2a2a40'}" stroke="${hot ? '#ffd166' : 'none'}" stroke-width="1.5"/>
        <circle cx="32" cy="${y + 15}" r="10" fill="${ZONE_COL[s.zone]}"/><text x="32" y="${y + 19}" text-anchor="middle" font-size="10" font-weight="700" fill="${inkOn(ZONE_COL[s.zone])}">${i + 1}</text>
        <text x="50" y="${y + 19}" font-size="10" font-weight="700" fill="#fefae0">${esc(s.title)}</text>
        ${chip(s.zone).map((c, k) => `<rect x="${196 - k * 16}" y="${y + 8}" width="14" height="14" rx="3" fill="${c}" stroke="#fefae0" stroke-width="0.6"/>`).join('')}`;
    }).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Order of application">
      <rect width="240" height="300" rx="14" fill="#22223b"/>
      <text x="120" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="#fefae0">${p.order.eyesFirst ? 'Eyes first' : 'Base first'}</text>${rows}
      <text x="120" y="290" text-anchor="middle" font-size="8" fill="#c9c9c9">${esc(clip(p.look.lipLook.finish + ' lip · ' + p.look.face.setting, 48))}</text></svg>
      <figcaption><strong>${p.order.eyesFirst ? 'Eyes first' : 'Base first'}</strong><span>${esc(p.order.why)}</span></figcaption></figure>`;
  }

  // ---- Panel 3: how the look fits your filters ---------------------------------------------------
  function fitPanel(p) {
    const pic = p.picture; const lim = pic.timeLimit; const max = Math.max(120, lim ?? 0, p.look.minutes);
    const w = m => (190 * m) / max;
    const over = lim != null && p.look.minutes > lim;
    const dots = [1, 2, 3, 4, 5].map(i => `<circle cx="${44 + (i - 1) * 38}" cy="122" r="11" fill="${i <= p.look.difficulty ? (i > pic.skillLimit ? '#e63946' : '#ffd166') : '#3a3a5e'}" stroke="${i === pic.skillLimit ? '#fefae0' : 'none'}" stroke-width="2"/>`).join('');
    const sw = p.look.lips.map((l, i) => `<rect x="${24 + i * 50}" y="200" width="40" height="26" rx="6" fill="${l.hex}" stroke="${l.id === p.choices.lip ? '#ffd166' : '#fefae0'}" stroke-width="${l.id === p.choices.lip ? 3 : 0.6}"/><text x="${44 + i * 50}" y="240" text-anchor="middle" font-size="7" fill="#fefae0">${esc(clip(l.label, 12))}</text>`).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="How the look fits">
      <rect width="240" height="300" rx="14" fill="${p.fits ? '#1d3557' : '#5a189a'}"/>
      <text x="24" y="30" font-size="10" font-weight="700" fill="#fefae0">${esc(clip(p.filters.category, 30))}</text>
      <text x="216" y="30" text-anchor="end" font-size="9" fill="#fefae0">${esc(p.filters.season)}</text>
      <text x="24" y="58" font-size="9" fill="#fefae0">Time: ${p.look.minutes} min${lim != null ? ` of ${lim}` : ''}</text>
      <rect x="24" y="66" width="190" height="12" rx="6" fill="#3a3a5e"/><rect x="24" y="66" width="${w(p.look.minutes).toFixed(1)}" height="12" rx="6" fill="${over ? '#e63946' : '#95d5b2'}"/>
      ${lim != null ? `<path d="M${(24 + w(lim)).toFixed(1)},62 v20" stroke="#fefae0" stroke-width="2"/>` : ''}
      <text x="24" y="104" font-size="9" fill="#fefae0">Level: ${esc(p.look.level)} (your limit: ${esc(p.filters.skill)})</text>${dots}
      <text x="24" y="166" font-size="9" fill="#fefae0">${p.fits ? `${p.matches.length} look${p.matches.length === 1 ? '' : 's'} fit` : 'Nothing fits every filter: closest shown'}</text>
      <text x="24" y="190" font-size="9" fill="#fefae0">Lip options</text>${sw}
      <text x="120" y="272" text-anchor="middle" font-size="8" fill="#c9c9c9">${esc(clip(p.filters.community + ' · ' + p.filters.time, 46))}</text>
      ${p.look.deepSkinFocus ? '<text x="120" y="286" text-anchor="middle" font-size="8" fill="#ffd166">written for deep skin (V–VI)</text>' : ''}</svg>
      <figcaption><strong>${p.fits ? 'Fits your filters' : 'Closest look'}</strong><span>${esc(p.message)}</span></figcaption></figure>`;
  }

  // ---- Plan cards ------------------------------------------------------------------------------
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  function practiseCard(t) {
    if (!t) return '';
    return card(`Practise: ${t.title}`, `<p class="lib-note">${esc(t.why)} · ${esc(t.level)} · about ${t.minutes} minutes</p>${t.description ? `<p>${esc(t.description)}</p>` : ''}${t.context ? `<p><em>${esc(t.context)}</em></p>` : ''}
      ${t.ingredients.length ? `<details><summary>You need</summary>${ul([...t.ingredients, ...t.tools])}</details>` : ''}
      <ol>${t.steps.map(s => `<li><strong>${esc(s.title)}</strong>${s.time ? ` <span class="lib-note">(${esc(s.time)})</span>` : ''}<br>${esc(s.text)}${s.tip ? `<br><span class="lib-note">Tip: ${esc(s.tip)}</span>` : ''}</li>`).join('')}</ol>
      ${t.warnings.length ? `<p><strong>Take care:</strong></p>${ul(t.warnings)}` : ''}`);
  }
  function renderPlan() {
    const p = lb.plan; const L = p.look;
    $('lbPreview').innerHTML = facePanel(p) + orderPanel(p) + fitPanel(p);
    $('lbSummary').innerHTML = `<p class="hl-big">${esc(L.label)}</p><p>${esc(L.community)} · ${esc(L.category)} · ${L.minutes} minutes · ${esc(L.level)}</p>`;
    $('lbPlan').innerHTML = [
      card(p.fits ? 'Looks that fit' : 'Closest looks', `<p>${esc(p.message)}</p><ul>${p.matches.map(m => `<li>${m.id === L.id ? '<strong>' : ''}${esc(m.label)}${m.id === L.id ? '</strong>' : ''} · ${m.minutes} min · ${esc(m.level)}</li>`).join('')}</ul>`),
      card(`About ${L.label}`, `<p>${esc(L.description)}</p>${L.context ? `<p><em>${esc(L.context)}</em></p>` : ''}<p><strong>For:</strong> ${esc(L.occasions.join(', '))}</p><p class="lib-note">Season: ${esc(L.seasons.join(', '))}${L.deepSkinFocus ? ' · written for deep skin (Fitzpatrick V–VI)' : ' · any skin tone'}</p>`),
      card('Order of application', `<p class="lib-note">${esc(p.order.why)}</p><ol>${p.order.steps.map(s => `<li><strong>${esc(s.title)}:</strong> ${esc(s.text)}</li>`).join('')}</ol>`),
      card(`Lip: ${p.lip.label}`, `<p>Liner: ${esc(L.lipLook.liner)}. Finish: ${esc(L.lipLook.finish)}.</p><p class="lib-note">Other options in this look: ${esc(L.lips.filter(x => x.label !== p.lip.label).map(x => x.label).join(', '))}</p>`),
      card(`Shade notes for ${p.tone.label}`, p.shadeNotes.map(n => `<p>${esc(n.text)} <span class="lib-note">(${esc(n.source)})</span></p>`).join('')),
      card('Safety', p.safety.length ? ul(p.safety.map(s => s.text)) : ''),
      practiseCard(p.practise),
    ].join('');
  }

  function select(id, text, values, current) {
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = lb.options; const c = lb.choices; const p = lb.plan;
    const q = $('lbSearch')?.value ?? ''; const out = $('lbSearchOut')?.innerHTML ?? '';
    $('lbControls').innerHTML = `
      ${select('lbCommunity', 'Community', o.communities, c.community)}
      ${select('lbCategory', 'Category', o.categories, c.category)}
      ${select('lbTime', 'Time you have', o.times, c.time)}
      ${select('lbSkill', 'Your level (up to)', o.skills, c.skill)}
      ${select('lbSeason', 'Season', o.seasons, c.season)}
      ${p ? select('lbLook', 'Look', p.matches.map(m => ({ id: m.id, label: `${m.label} (${m.minutes} min)` })), p.choices.look) : ''}
      ${p ? select('lbLip', 'Lip colour', p.look.lips, p.choices.lip) : ''}
      ${p && p.related.length ? select('lbPractise', 'Tutorial to practise', p.related.map(r => ({ id: r.id, label: r.title })), p.choices.practise) : ''}
      ${select('lbTone', 'Skin tone for the picture', o.tones, c.tone)}
      <label class="st-field"><span>Find a look by word</span><input id="lbSearch" type="search" placeholder="e.g. bridal, eid, festival" maxlength="60" value="${esc(q)}"></label>
      <button type="button" class="btn btn-secondary" id="lbSearchGo">Search</button><div id="lbSearchOut" class="lib-note" aria-live="polite">${out}</div>`;
  }
  async function replan() {
    const seq = ++lb.seq;
    try {
      const plan = await api('/api/looks/plan', lb.choices);
      if (seq !== lb.seq) return;
      lb.plan = plan;
      Object.assign(lb.choices, { look: plan.choices.look, lip: plan.choices.lip, practise: plan.choices.practise });
      renderControls();
      renderPlan();
    } catch (e) {
      $('lbPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function search() {
    const q = $('lbSearch')?.value ?? ''; if (q.trim().length < 3) return;
    try {
      const r = await api(`/api/looks/search?q=${encodeURIComponent(q)}`);
      $('lbSearchOut').innerHTML = r.results.length ? `<ul>${r.results.map(x => `<li><strong>${esc(x.label)}</strong> · ${esc(x.category)} · ${x.minutes} min</li>`).join('')}</ul>` : `No look mentions "${esc(r.query)}".`;
    } catch (e) { $('lbSearchOut').textContent = `Search failed (${e.message}).`; }
  }
  async function openStudio() {
    try {
      if (!lb.options) lb.options = await api('/api/looks/options');
      if (!lb.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? lb.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : lb.options.tones[6];
        const community = lb.options.communities.some(x => x.id === pr.communityId) ? pr.communityId : 'west_african';
        lb.choices = { community, category: 'any', time: 'any', skill: '5', season: 'any', look: '', lip: '0', practise: '', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('lbPlan').innerHTML = `<p class="lib-note">The Look Book could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { lbCommunity: 'community', lbCategory: 'category', lbTime: 'time', lbSkill: 'skill', lbSeason: 'season', lbLook: 'look', lbLip: 'lip', lbPractise: 'practise', lbTone: 'tone' };
  const FILTERS = ['community', 'category', 'time', 'skill', 'season'];
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !lb.choices) return;
    lb.choices[k] = e.target.value;
    if (FILTERS.includes(k)) Object.assign(lb.choices, { look: '', lip: '0', practise: '' });
    if (k === 'look') Object.assign(lb.choices, { lip: '0', practise: '' });
    if (k === 'lip') lb.choices.practise = '';
    replan();
  });
  document.addEventListener('keydown', e => { if (e.target.id === 'lbSearch' && e.key === 'Enter') { e.preventDefault(); search(); } });
  document.addEventListener('click', e => {
    if (e.target.id === 'lbSearchGo') { search(); return; }
    const t = e.target.closest('[data-view="looks"], [data-open-looks]');
    if (!t) return;
    if (t.dataset.openLooks !== undefined) { document.querySelector('.nav-link[data-view="looks"]')?.click(); return; }
    openStudio();
  });
})();
