/**
 * Hair Removal Planner view. Pick the area, your hair texture and colour, skin type, a method, an
 * event, community and a skin tone; the server judges the method from the hair removal guides and
 * this view draws the body with the area marked, a cross-section of the hair in the skin showing
 * what the method does, and the plan. No photo is used.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const hr = { options: null, plan: null, choices: null, seq: 0 };
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
  const label = k => String(k).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
  const LEVEL = { good: ['#2a9d8f', 'Good choice'], caution: ['#e9c46a', 'Take care'], avoid: ['#e76f51', 'Avoid'] };

  /** Any guide value (text, list or nested object) as readable HTML. */
  function val(v, depth = 0) {
    if (v == null || v === '') return '';
    if (typeof v !== 'object') return `<p>${esc(v)}</p>`;
    if (Array.isArray(v)) return `<ul>${v.map(x => (typeof x === 'object' && x ? `<li>${val(x, depth + 1)}</li>` : li(x))).join('')}</ul>`;
    return Object.entries(v).map(([k, x]) => (typeof x === 'object' && x
      ? (depth < 2 ? `<p><strong>${esc(label(k))}</strong></p>${val(x, depth + 1)}` : '')
      : `<p><strong>${esc(label(k))}:</strong> ${esc(x)}</p>`)).join('');
  }

  // ---- Body: the chosen area marked in the verdict colour ------------------------------------------
  const ZONES = {
    face: '<ellipse cx="120" cy="46" rx="18" ry="22"/>',
    underarms: '<ellipse cx="96" cy="92" rx="8" ry="10"/><ellipse cx="144" cy="92" rx="8" ry="10"/>',
    arms: '<rect x="70" y="84" width="14" height="96" rx="7"/><rect x="156" y="84" width="14" height="96" rx="7"/>',
    bikini: '<path d="M100,168 L140,168 L120,196 Z"/>',
    legs: '<rect x="100" y="198" width="17" height="86" rx="8"/><rect x="123" y="198" width="17" height="86" rx="8"/>',
  };
  function bodyPanel(p) {
    const skin = p.tone.hex; const deep = lum(skin) < 0.18; const line = deep ? mix(skin, '#ffffff', 0.35) : mix(skin, '#000000', 0.35);
    const [col, word] = LEVEL[p.verdict.level];
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Body">
      <rect width="240" height="300" rx="14" fill="#141414"/>
      <g fill="${skin}" stroke="${line}"><ellipse cx="120" cy="46" rx="18" ry="22"/><rect x="113" y="66" width="14" height="12"/>
        <path d="M92,80 Q120,72 148,80 L150,168 L90,168 Z"/><rect x="70" y="84" width="14" height="96" rx="7"/><rect x="156" y="84" width="14" height="96" rx="7"/>
        <path d="M90,166 L150,166 L142,200 L98,200 Z"/><rect x="100" y="198" width="17" height="86" rx="8"/><rect x="123" y="198" width="17" height="86" rx="8"/></g>
      <g fill="${col}" fill-opacity="0.55" stroke="${col}" stroke-width="2">${ZONES[p.choices.area]}</g>
      <text x="120" y="296" text-anchor="middle" font-size="11" fill="${col}">${esc(word)}: ${esc(p.method.name)}</text></svg>
      <figcaption><strong>${esc(p.areaLabel)}</strong><span>${esc(p.method.name)} · Type ${esc(p.choices.fitzpatrick)}</span></figcaption></figure>`;
  }

  // ---- Cross-section: what the method does to the hair ------------------------------------------
  function hairPath(x, texture, top, bottom) {
    if (texture === 'fine') return `M${x},${bottom} L${x},${top}`;
    const amp = texture === 'wavy' ? 5 : 9; const step = texture === 'wavy' ? 22 : 11;
    let d = `M${x},${bottom}`;
    for (let y = bottom, s = 1; y > top; y -= step, s = -s) d += ` Q${x + amp * s},${y - step / 2} ${x},${Math.max(top, y - step)}`;
    return d;
  }
  function sectionPanel(p) {
    const skin = p.tone.hex; const m = p.choices.method; const c = p.choices;
    const hairCol = c.colour === 'light' ? '#d9c27a' : '#1b1310';
    const surface = 110; const root = 220; const x = 120;
    const removedFromRoot = ['waxing', 'sugaring', 'epilating', 'threading'].includes(m);
    const cutAtSurface = ['shaving', 'depilatoryCreams'].includes(m);
    const lightBased = ['laser', 'IPL'].includes(m);
    const works = !(lightBased && c.colour === 'light');
    // a halo keeps the strand readable on the deepest tones and light hair readable on light skin
    const halo = lum(skin) < 0.18 ? mix(skin, '#ffffff', 0.5) : (c.colour === 'light' ? mix(skin, '#000000', 0.45) : null);
    const strand = d => `${halo ? `<path d="${d}" stroke="${halo}" stroke-width="7" fill="none" stroke-linecap="round"/>` : ''}<path d="${d}" stroke="${hairCol}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    let hairSvg = ''; let note = '';
    if (cutAtSurface) {
      hairSvg = strand(hairPath(x, c.hair, surface, root - 20));
      if (c.hair === 'coily') { hairSvg += `${strand(`M${x},${surface} Q${x + 22},${surface - 14} ${x + 28},${surface + 14}`)}<circle cx="${x + 28}" cy="${surface + 6}" r="9" fill="#c0392b" opacity="0.5"/>`; note = 'Cut tip curls back into the skin'; } else note = 'Cut at the surface; grows back in days';
    } else if (removedFromRoot) {
      hairSvg = `${strand(hairPath(x, c.hair, 40, 96))}<ellipse cx="${x}" cy="${root - 12}" rx="6" ry="10" fill="none" stroke="#f5f5f5" stroke-dasharray="3 2"/>`;
      note = 'Pulled out from the root; weeks to regrow';
    } else if (lightBased) {
      hairSvg = `${strand(hairPath(x, c.hair, surface - 30, root - 20))}${works ? `<circle cx="${x}" cy="${root - 16}" r="16" fill="#ff9f1c" opacity="0.6"/>` : ''}<path d="M${x - 40},20 L${x - 6},${root - 30} M${x + 40},20 L${x + 6},${root - 30}" stroke="${works ? '#ff9f1c' : '#888'}" stroke-width="2" stroke-dasharray="4 3"/>`;
      note = works ? 'Light heats the dark hair root' : 'Light hair absorbs too little light to work';
    } else {
      hairSvg = `${strand(hairPath(x, c.hair, surface - 30, root - 20))}<path d="M${x + 4},${surface - 40} L${x + 2},${root - 16}" stroke="#cfd8dc" stroke-width="2"/><circle cx="${x + 2}" cy="${root - 14}" r="7" fill="#4fc3f7" opacity="0.6"/>`;
      note = 'A probe destroys the root, one hair at a time';
    }
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Hair in the skin">
      <rect width="240" height="300" rx="14" fill="#141414"/>
      <rect x="20" y="${surface}" width="200" height="140" fill="${skin}"/><rect x="20" y="${surface}" width="200" height="10" fill="${mix(skin, '#000000', 0.2)}"/>
      <ellipse cx="${x}" cy="${root - 12}" rx="10" ry="16" fill="${mix(skin, '#7a3b2e', 0.4)}" opacity="0.7"/>
      ${hairSvg}
      <text x="120" y="280" text-anchor="middle" font-size="11" fill="#f5f5f5">${esc(note)}</text></svg>
      <figcaption><strong>${esc(p.hairLabel)}</strong><span>${esc(p.colourLabel)}</span></figcaption></figure>`;
  }

  // ---- Controls ---------------------------------------------------------------------------------
  function select(id, text, values, current) {
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = hr.options; const c = hr.choices;
    $('hrControls').innerHTML = `
      ${select('hrArea', 'Area', o.areas, c.area)}
      ${select('hrMethod', 'Method', o.methods, c.method)}
      ${select('hrHair', 'Hair texture', o.hair, c.hair)}
      ${select('hrColour', 'Hair colour', o.colours, c.colour)}
      ${select('hrFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('hrOccasion', 'Event', o.occasions, c.occasion)}
      ${select('hrCommunity', 'Community', o.communities, c.community)}
      ${select('hrTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  function renderPlan() {
    const o = hr.options; const raw = hr.plan; const find = (list, id) => list.find(x => x.id === id)?.label ?? id;
    const p = { ...raw, areaLabel: find(o.areas, raw.choices.area), hairLabel: find(o.hair, raw.choices.hair), colourLabel: find(o.colours, raw.choices.colour) };
    const v = p.verdict; const a = p.aftercare; const cn = p.communityNotes; const m = p.method;
    $('hrPreview').innerHTML = bodyPanel(p) + sectionPanel(p);
    $('hrSummary').innerHTML = `<p class="hl-big">${esc(LEVEL[v.level][1])}: ${esc(m.name)} for ${esc(p.areaLabel.toLowerCase())}</p>${v.why.length ? `<ul>${v.why.map(li).join('')}</ul>` : '<p>Nothing about your skin or hair rules this out.</p>'}`;
    const cmp = `<ul class="hr-compare">${p.compare.map(x => `<li><span class="hr-dot" style="background:${LEVEL[x.level][0]}"></span><button type="button" class="btn btn-ghost" data-hr-method="${esc(x.id)}">${esc(x.label)}</button> ${esc(LEVEL[x.level][1])}</li>`).join('')}</ul><p class="lib-note">Tap a method to plan it.</p>`;
    $('hrPlan').innerHTML = [
      card(m.name, `<p>${esc(m.description)}</p>${m.bestFor ? `<p><strong>Best for:</strong> ${esc(m.bestFor)}</p>` : ''}${m.risks ? `<p><strong>Risks</strong></p>${val(m.risks)}` : ''}${m.more ? `<details><summary>How to do it</summary>${val(m.more)}</details>` : ''}`),
      card('Every method for you', `${cmp}<p><strong>Named best for ${esc(p.areaLabel.toLowerCase())}:</strong> ${esc(p.suitedToArea.map(id => find(o.methods, id)).join(', ') || 'none listed')}</p>`),
      card('Lasers and your skin', `<ul>${p.lasers.map(l => `<li><strong>${esc(l.label)}</strong>: ${l.safe ? 'safe for you' : 'not for you'}${l.note ? ` (${esc(l.note)})` : ''}</li>`).join('')}</ul>${p.choices.colour === 'light' ? '<p>No laser works on light hair; electrolysis does.</p>' : ''}${p.laserSafety ? `<details><summary>Laser safety on deeper skin</summary>${val(p.laserSafety)}</details>` : ''}`, p.choices.method === 'laser' || p.choices.method === 'IPL' ? ' hl-warn' : ''),
      card('Before', val(a.before)),
      card('Aftercare', `<p><strong>First 24 hours</strong></p>${val(a.first24Hours)}<p><strong>Days 2 to 7</strong></p>${val(a.days2To7)}`),
      a.ingrown ? card('Ingrown hairs and razor bumps', `${val(a.ingrown.prevention)}${a.ingrown.razorBumps ? `<p><strong>If razor bumps keep coming back</strong></p>${val(a.ingrown.razorBumps)}` : ''}<details><summary>More prevention</summary>${val(a.ingrown.more)}</details><details><summary>If they happen</summary>${val(a.ingrown.treatment)}</details>`) : '',
      a.darkMarks ? card('Dark marks', `<p><strong>Niacinamide</strong></p>${val(a.darkMarks.niacinamide)}<p><strong>Azelaic acid</strong></p>${val(a.darkMarks.azelaicAcid)}`) : '',
      card('Common mistakes', a.mistakes.map(x => `<p><strong>${esc(x.mistake)}</strong><br>${esc(x.why)}<br><em>Fix:</em> ${esc(x.fix)}</p>`).join('')),
      p.occasion ? card(p.occasion.title, `<p>${esc(p.occasion.timeline)}</p>${p.occasion.yourTradition ? `<p><strong>${esc(p.community.label)} tradition:</strong> ${esc(p.occasion.yourTradition)}</p>` : ''}${p.occasion.areas ? val(p.occasion.areas) : ''}${p.occasion.essentials ? val(p.occasion.essentials) : ''}`) : '',
      card(`${p.community.label} traditions`, `<p><strong>Common method:</strong> ${esc(cn.signature?.primary)}; aftercare with ${esc(cn.signature?.postCare)}</p>${cn.postCareOil ? `<p><strong>${esc(cn.postCareOil.oil)}:</strong> ${esc(cn.postCareOil.reasoning)}</p>` : ''}<details><summary>More</summary>${val(cn.traditions)}${val(cn.notes)}</details>`),
    ].join('');
  }

  async function replan() {
    const seq = ++hr.seq;
    try {
      const plan = await api('/api/hair-removal/plan', hr.choices);
      if (seq !== hr.seq) return;
      hr.plan = plan;
      renderPlan();
    } catch (e) {
      $('hrPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openStudio() {
    try {
      if (!hr.options) hr.options = await api('/api/hair-removal/options');
      if (!hr.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? hr.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : hr.options.tones[6];
        hr.choices = { area: 'underarms', hair: 'coily', colour: 'dark', fitzpatrick: 'V', method: 'shaving', occasion: 'none', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('hrPlan').innerHTML = `<p class="lib-note">The Hair Removal Planner could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { hrArea: 'area', hrMethod: 'method', hrHair: 'hair', hrColour: 'colour', hrFitz: 'fitzpatrick', hrOccasion: 'occasion', hrCommunity: 'community', hrTone: 'tone' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !hr.choices) return;
    hr.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('click', e => {
    const pickBtn = e.target.closest('[data-hr-method]');
    if (pickBtn && hr.choices) { hr.choices.method = pickBtn.dataset.hrMethod; renderControls(); replan(); return; }
    const t = e.target.closest('[data-view="hair-removal"], [data-open-hair-removal]');
    if (!t) return;
    if (t.dataset.openHairRemoval !== undefined) { document.querySelector('.nav-link[data-view="hair-removal"]')?.click(); return; }
    openStudio();
  });
})();
