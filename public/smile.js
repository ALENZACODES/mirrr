/**
 * Smile & Lip Care view. Pick a concern, a traditional practice, how your teeth and gums feel, a
 * community and a skin tone; the server builds the routine from the oral care guide and this view
 * shows a smile with the concern and the practice: photographic plates (studio-photo.js) for the
 * smile state and a still-life of the practice; with no plate, the drawing renders.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const sm = { options: null, plan: null, choices: null, seq: 0 };
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

  // ---- Smile: the concern drawn on lips, gums and teeth in the chosen tone ---------------------------
  function smilePanel(p) {
    const skin = p.tone.hex; const c = p.choices; const deep = lum(skin) < 0.18;
    const ink = deep ? mix(skin, '#ffffff', 0.75) : mix(skin, '#000000', 0.55);
    const lip = mix(skin, '#5a1f2b', 0.35);
    // gums: pink, with natural brown pigment on deeper tones; red and swollen when they bleed
    const gumBase = deep || lum(skin) < 0.3 ? mix('#d9737f', skin, 0.35) : '#e58c95';
    const gum = c.teeth === 'bleeding' || c.concern === 'gumHealth' ? (c.teeth === 'bleeding' ? '#c0392b' : mix(gumBase, '#c0392b', 0.35)) : gumBase;
    const stained = c.concern === 'whitening';
    const polished = stained && p.practice.targets;
    const tooth = i => (stained ? (polished && i >= 3 ? '#f4efe3' : '#d9c48e') : '#f6f2ea');
    const teeth = [0, 1, 2, 3, 4, 5].map(i => `<rect x="${66 + i * 18}" y="150" width="16" height="${i === 2 || i === 3 ? 26 : 22}" rx="4" fill="${tooth(i)}" stroke="#bfb6a5" stroke-width="0.8"/>`).join('');
    const marks = [];
    if (c.concern === 'halitosis') marks.push(...[0, 1, 2].map(i => `<path d="M${190 + i * 10},${140 - i * 18} q8,-8 0,-16 q-8,-8 0,-16" stroke="${p.practice.targets ? '#7fd1b9' : '#b0a46a'}" stroke-width="2.4" fill="none" opacity="0.85"/>`));
    if (c.concern === 'toothache') marks.push(`<circle cx="${66 + 4 * 18 + 8}" cy="162" r="13" fill="none" stroke="#e76f51" stroke-width="3"/><circle cx="${66 + 4 * 18 + 8}" cy="162" r="20" fill="none" stroke="#e76f51" stroke-width="1.5" opacity="0.6"/>`);
    if (c.concern === 'lipCare') marks.push(`<path d="M80,124 l4,8 M100,121 l3,9 M140,121 l-3,9 M160,124 l-4,8 M92,196 l3,-8 M120,199 l0,-9 M148,196 l-3,-8" stroke="${ink}" stroke-width="1.8"/><ellipse cx="54" cy="168" rx="9" ry="14" fill="${mix(lip, '#000000', 0.35)}" stroke="${ink}" stroke-width="1.4" stroke-dasharray="3 2"/><ellipse cx="186" cy="168" rx="9" ry="14" fill="${mix(lip, '#000000', 0.35)}" stroke="${ink}" stroke-width="1.4" stroke-dasharray="3 2"/>`);
    if (c.teeth === 'sensitive') marks.push(`<path d="M${66 + 18 + 8},148 l-4,-8 l6,0 l-4,-8" stroke="#4fc3f7" stroke-width="2" fill="none"/>`);
    const word = { whitening: polished ? 'Surface stains polished' : 'Surface stains', halitosis: p.practice.targets ? 'Fresher breath' : 'Breath odour', gumHealth: 'Gum line', lipCare: 'Dry, darker lip corners', toothache: 'Sore tooth' }[c.concern];
    const drawing = `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Smile">
      <rect width="240" height="300" rx="14" fill="${skin}"/>
      <path d="M40,168 Q120,96 200,168 Q120,236 40,168 Z" fill="${lip}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M58,168 Q120,132 182,168 Q120,206 58,168 Z" fill="#2a1416"/>
      <path d="M62,150 Q120,134 178,150 L178,156 Q120,142 62,156 Z" fill="${gum}"/>
      ${teeth}
      ${marks.join('')}
      <text x="120" y="272" text-anchor="middle" font-size="12" fill="${ink}">${esc(word)}</text></svg>
      <figcaption><strong>${esc(p.concern.label)}</strong><span>${esc(p.teethLabel)}</span></figcaption></figure>`;
    if (!window.StudioPhoto) return drawing;
    // Photo plate per state of the smile; whitening shows the stained and whitened plates together.
    const SP = window.StudioPhoto; const cc = p.choices.concern; const t = p.choices.teeth;
    const id = cc === 'lipCare' ? 'lips_care' : cc === 'gumHealth' || t === 'bleeding' ? (t === 'bleeding' ? 'gums_inflamed' : 'gums_healthy') : cc === 'whitening' ? 'stained' : 'healthy';
    const cap = `<strong>${esc(p.concern.label)}</strong><span>${esc(p.teethLabel)}</span>`;
    const one = SP.panel({ studio: 'smile', id: `smile-${id}`, fallback: drawing, w: 960, h: 720, alt: `${p.concern.label}: smile close-up`, caption: cap });
    if (cc !== 'whitening' || !SP.photoFor('smile', 'smile-whitened')) return one;
    return one + SP.panel({ studio: 'smile', id: 'smile-whitened', fallback: '', w: 960, h: 720, alt: 'The same smile after whitening', caption: '<strong>After whitening</strong><span>Brighter, still natural</span>' });
  }

  // ---- The practice, with a verdict colour --------------------------------------------------------
  const ICONS = {
    chewingSticks: '<rect x="70" y="110" width="100" height="14" rx="6" fill="#8d6e4a"/><path d="M170,110 l14,-6 M170,116 l16,0 M170,122 l14,6" stroke="#c9a77c" stroke-width="3"/>',
    oilPulling: '<path d="M120,80 C150,130 160,150 160,170 A40,40 0 0 1 80,170 C80,150 90,130 120,80 Z" fill="#e9c46a"/>',
    charcoalWhitening: '<rect x="85" y="100" width="70" height="90" rx="10" fill="#222" stroke="#9e9e9e" stroke-width="2"/><rect x="85" y="92" width="70" height="16" rx="4" fill="#555"/>',
    greenTea: '<path d="M80,110 h80 v40 a40,40 0 0 1 -80,0 Z" fill="#7cb342"/><path d="M160,120 a16,16 0 0 1 0,30" stroke="#7cb342" stroke-width="6" fill="none"/>',
    tongueScraping: '<path d="M80,90 v60 a40,40 0 0 0 80,0 v-60" stroke="#b87333" stroke-width="8" fill="none"/>',
    saltWaterRinse: '<path d="M90,90 h60 l-8,100 h-44 Z" fill="#cfe8f3" stroke="#90a4ae" stroke-width="2"/><circle cx="110" cy="150" r="3" fill="#fff"/><circle cx="126" cy="166" r="3" fill="#fff"/>',
    naturalBreathFresheners: '<path d="M100,100 v60 M90,100 a10,10 0 0 1 20,0 Z M140,110 v60 M130,110 a10,10 0 0 1 20,0 Z" stroke="#6d4c41" stroke-width="5" fill="#6d4c41"/>',
    honeyOralCare: '<rect x="85" y="110" width="70" height="80" rx="16" fill="#f4a261"/><rect x="92" y="98" width="56" height="16" rx="4" fill="#8d6e4a"/>',
  };
  function practicePanel(p) {
    const ok = !!p.practice.targets; const warn = p.practice.warnings.length > 0;
    const col = !ok ? '#8d8d8d' : (warn ? '#e9c46a' : '#2a9d8f');
    const word = ok ? (warn ? 'Helps, with care' : 'Helps') : 'Not for this concern';
    const drawing = `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Practice">
      <rect width="240" height="300" rx="14" fill="#141414"/>
      <g opacity="${ok ? 1 : 0.45}">${ICONS[p.practice.id]}</g>
      <rect x="40" y="226" width="160" height="30" rx="15" fill="${col}"/>
      <text x="120" y="246" text-anchor="middle" font-size="13" fill="#141414">${esc(word)}</text></svg>
      <figcaption><strong>${esc(p.practice.label)}</strong><span>${esc(p.practice.targets ?? 'Pick a practice that targets this concern')}</span></figcaption></figure>`;
    if (!window.StudioPhoto) return drawing;
    return window.StudioPhoto.panel({ studio: 'smile', id: `practice-${p.choices.practice}`, fallback: drawing, w: 960, h: 720, alt: `${p.practice.label}: still life`, caption: `<strong>${esc(p.practice.label)}</strong><span>${esc(p.practice.targets ?? 'Pick a practice that targets this concern')}</span>` });
  }

  // ---- Controls ---------------------------------------------------------------------------------
  // Nothing is pre-selected: every dropdown opens on a disabled "Choose…" and shows a value only once
  // picked here. Until the first pick the studio shows its neutral base (no tint, no plan); after it,
  // fields still on "Choose…" fall back to a suggested value so the plan never sees undefined.
  const PICKED = new Set(); const OWN = new Set();
  const anyPicked = () => [...OWN].some(id => PICKED.has(id));
  function renderBase() {
    ++sm.seq; sm.plan = null;
    const put = (k, h) => { const el = $('sm' + k); if (el) el.innerHTML = h; };
    // First view: real smile photos (nothing chosen, nothing tinted); the drawing is only the no-photo fallback.
    put('Preview', window.StudioPhoto ? window.StudioPhoto.gallery('smile', [
      { id: 'smile-healthy', title: 'A healthy smile', note: 'Pick your concern above to see yours', alt: 'Close-up of a woman smiling, healthy teeth and gums' },
      { id: 'smile-lips_care', title: 'Lip care', note: 'Soft, cared-for lips', alt: 'Close-up of a woman\'s smile with cared-for lips' },
    ]) : '');
    put('Summary', '<p class="lib-note choose-first">Choose your options above to see your plan.</p>');
    put('Plan', '');
  }
  function select(id, text, values, current) {
    OWN.add(id);
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}"><option value="" disabled${PICKED.has(id) ? '' : ' selected'}>Choose…</option>${values.map(v => `<option value="${esc(v.id)}"${PICKED.has(id) && String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = sm.options; const c = sm.choices;
    $('smControls').innerHTML = `
      ${select('smConcern', 'Main concern', o.concerns, c.concern)}
      ${select('smPractice', 'Traditional practice', o.practices, c.practice)}
      ${select('smTeeth', 'Teeth and gums', o.teeth, c.teeth)}
      ${select('smCommunity', 'Community', o.communities, c.community)}
      ${select('smTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  function renderPlan() {
    const o = sm.options; const raw = sm.plan;
    const p = { ...raw, teethLabel: o.teeth.find(x => x.id === raw.choices.teeth)?.label ?? '' };
    const r = p.routine; const pr = p.practice; const cn = p.communityNotes;
    $('smPreview').innerHTML = smilePanel(p) + practicePanel(p);
    $('smSummary').innerHTML = `<p class="hl-big">${esc(pr.label)} for ${esc(p.concern.label.toLowerCase())}: ${esc(pr.targets ?? 'does not target this concern')}</p>${pr.warnings.length ? `<ul>${pr.warnings.map(li).join('')}</ul>` : ''}`;
    const ritual = Object.entries(p.ritual).map(([when, steps]) => `<p><strong>${esc(label(when))}</strong></p><ul>${steps.map(s => `<li${s.caution ? ' class="hr-flag"' : ''}>${esc(s.step)}${s.caution ? ` <em>(${esc(s.caution)})</em>` : ''}</li>`).join('')}</ul>`).join('');
    const cmp = `<ul class="hr-compare">${p.compare.map(x => `<li><span class="hr-dot" style="background:${x.targets ? '#2a9d8f' : '#555'}"></span><button type="button" class="btn btn-ghost" data-sm-practice="${esc(x.id)}">${esc(x.label)}</button> ${esc(x.targets ?? 'not for this')}</li>`).join('')}</ul>`;
    $('smPlan').innerHTML = [
      card('Your daily routine', `<ul>${r.daily.map(li).join('')}</ul><p><strong>For ${esc(p.concern.label.toLowerCase())}</strong></p><ul>${r.forConcern.map(li).join('')}</ul>${r.forTeeth.length ? `<p><strong>For your teeth and gums</strong></p><ul>${r.forTeeth.map(li).join('')}</ul>` : ''}`, p.choices.teeth !== 'healthy' || p.choices.concern === 'toothache' ? ' hl-warn' : ''),
      card(pr.label, `${pr.notes ? `<p>${esc(pr.notes)}</p>` : ''}${pr.ingredient ? `<p>${esc(pr.ingredient)}</p>` : ''}<p><strong>Used in:</strong> ${esc(pr.communities.join(', '))}</p>`),
      card('Practices for this concern', cmp),
      card('Traditions for this concern', `<ul>${p.concern.traditions.map(t => li(`${t.method} (${t.community})`)).join('')}</ul>${p.concern.note ? `<p class="lib-note">${esc(p.concern.note)}</p>` : ''}`),
      p.ingredients.length ? card('Ingredients', p.ingredients.map(i => `<p><strong>${esc(i.name)}</strong>: ${esc(i.use)}<br>${esc(i.note)}</p>`).join('')) : card('Ingredients', '<p>No traditional ingredient changes the colour of a tooth; they polish surface stains at most.</p>'),
      card(`${p.community.label} ritual`, ritual),
      card(`${p.community.label} traditions`, `<p>${esc(cn.overview)}</p>${cn.practices.length ? `<p><strong>Shared practices:</strong> ${esc(cn.practices.join(', '))}</p>` : ''}<details><summary>More</summary>${cn.sections.map(s => `<p><strong>${esc(s.title)}</strong></p><p>${esc(s.body)}</p>`).join('')}</details>`),
    ].join('');
  }

  async function replan() {
    const seq = ++sm.seq;
    try {
      const plan = await api('/api/smile/plan', sm.choices);
      if (seq !== sm.seq) return;
      sm.plan = plan;
      renderPlan();
    } catch (e) {
      $('smPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openStudio() {
    try {
      if (!sm.options) sm.options = await api('/api/smile/options');
      if (!sm.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? sm.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : sm.options.tones[6];
        sm.choices = { concern: 'whitening', practice: 'chewingSticks', teeth: 'healthy', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      if (anyPicked()) await replan(); else renderBase();
    } catch (e) {
      $('smPlan').innerHTML = `<p class="lib-note">The Smile & Lip Care planner could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { smConcern: 'concern', smPractice: 'practice', smTeeth: 'teeth', smCommunity: 'community', smTone: 'tone' };
  document.addEventListener('change', e => {
    if (OWN.has(e.target.id) && e.target.value !== '') PICKED.add(e.target.id);
    const k = FIELD[e.target.id];
    if (!k || !sm.choices) return;
    sm.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('click', e => {
    const pickBtn = e.target.closest('[data-sm-practice]');
    if (pickBtn && sm.choices) { sm.choices.practice = pickBtn.dataset.smPractice; PICKED.add('smPractice'); renderControls(); replan(); return; }
    const t = e.target.closest('[data-view="smile"], [data-open-smile]');
    if (!t) return;
    if (t.dataset.openSmile !== undefined) { document.querySelector('.nav-link[data-view="smile"]')?.click(); return; }
    openStudio();
  });
})();
