/**
 * Ageing Studio view. Pick your decade, Fitzpatrick type, main concern, hormone stage, community
 * and a skin tone; the server plans a morning and evening routine from the ageing guides and this
 * view draws a face showing the concern being treated, a decade timeline, and the routine.
 * With a photographic plate per decade (studio-photo.js) the face is a photo; otherwise it is drawn.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const ag = { options: null, plan: null, choices: null, seq: 0 };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const li = s => `<li>${esc(s)}</li>`;
  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }
  // '#rgb' and '#rrggbb' both work ('#000' used to parse as NaN and drop the outline it coloured)
  const hexRgb = h => { const s = String(h).replace('#', ''); const f = s.length === 3 ? [...s].map(c => c + c).join('') : s; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)); };
  const rgbHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const label = k => String(k).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());

  /** Any guide value (text, list or nested object) as readable HTML. */
  function val(v, depth = 0) {
    if (v == null || v === '') return '';
    if (typeof v !== 'object') return `<p>${esc(v)}</p>`;
    if (Array.isArray(v)) return `<ul>${v.map(x => (typeof x === 'object' && x ? `<li>${val(x, depth + 1)}</li>` : li(x))).join('')}</ul>`;
    return Object.entries(v).map(([k, x]) => (typeof x === 'object' && x
      ? (depth < 2 ? `<p><strong>${esc(label(k))}</strong></p>${val(x, depth + 1)}` : '')
      : `<p><strong>${esc(label(k))}:</strong> ${esc(x)}</p>`)).join('');
  }

  // ---- Face -------------------------------------------------------------------------------------
  // The concern you are treating is drawn on the face: spots for uneven tone, lines, a softer jaw for
  // firmness, dry flecks, or pores. Older decades soften the jaw a little; the tone is the one you pick.
  function facePanel(p) {
    const skin = p.tone.hex; const deep = lum(skin) < 0.18;
    const line = deep ? mix(skin, '#fff', 0.35) : mix(skin, '#000', 0.35);
    // Concern marks must read on every Monk tone: light ink on deep skin, dark ink on light skin.
    const ink = deep ? mix(skin, '#fff', 0.75) : mix(skin, '#000', 0.55); const mark = mix(skin, '#000', deep ? 0.7 : 0.45);
    const c = p.choices.concern; const age = p.ages.indexOf(p.choices.decade);
    const jaw = 228 + age * 3 + (c === 'firmness' ? 10 : 0);
    const overlay = {
      pigment: [[88, 150], [96, 162], [152, 152], [146, 166], [120, 112]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${5 + (i % 2) * 2}" ry="4" fill="${mark}" opacity="0.85"${deep ? ` stroke="${ink}" stroke-width="0.9" stroke-opacity="0.7"` : ''}/>`).join(''),
      lines: `<path d="M92,96 Q120,90 148,96 M96,106 Q120,100 144,106" stroke="${ink}" fill="none" stroke-width="1.6"/><path d="M70,134 l-8,-4 M70,140 l-9,0 M170,134 l8,-4 M170,140 l9,0 M98,186 Q92,200 96,212 M142,186 Q148,200 144,212" stroke="${ink}" fill="none" stroke-width="1.6"/>`,
      // jowl lines just inside the jaw, with arrows showing the downward pull
      firmness: `<path d="M78,${jaw - 44} Q84,${jaw - 10} 108,${jaw - 6} M162,${jaw - 44} Q156,${jaw - 10} 132,${jaw - 6}" stroke="${ink}" fill="none" stroke-width="2.4" stroke-dasharray="5 3" stroke-linecap="round"/>
        <path d="M86,${jaw - 40} v16 m-5,-5 l5,5 l5,-5 M154,${jaw - 40} v16 m-5,-5 l5,5 l5,-5" stroke="${ink}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      dryness: [[84, 120], [156, 124], [92, 176], [150, 178], [120, 76], [108, 196]].map(([x, y]) => `<path d="M${x},${y} l6,2 l-4,3" stroke="${ink}" fill="none" stroke-width="1.4" opacity="0.85"/>`).join(''),
      texture: Array.from({ length: 18 }, (_, i) => `<circle cx="${100 + (i % 6) * 8}" cy="${150 + Math.floor(i / 6) * 8}" r="1.4" fill="${deep ? ink : mark}" opacity="${deep ? 0.7 : 1}"/>`).join(''),
    }[c] ?? '';
    const drawing = `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Face">
      <rect width="240" height="300" rx="14" fill="#141414"/>
      <path d="M120,40 C174,40 184,90 182,140 C180,${jaw - 20} 160,${jaw} 120,${jaw + 6} C80,${jaw} 60,${jaw - 20} 58,140 C56,90 66,40 120,40 Z" fill="${skin}" stroke="${line}"/>
      <ellipse cx="96" cy="128" rx="11" ry="5" fill="#f3efe9"/><ellipse cx="144" cy="128" rx="11" ry="5" fill="#f3efe9"/><circle cx="96" cy="128" r="4" fill="#2b1d16"/><circle cx="144" cy="128" r="4" fill="#2b1d16"/>
      <path d="M120,134 L114,172 Q120,176 126,172" stroke="${line}" fill="none"/><path d="M104,196 Q120,204 136,196" stroke="${mix(skin, '#6b2b2b', 0.5)}" fill="none" stroke-width="3" stroke-linecap="round"/>
      ${overlay}
      <text x="120" y="288" text-anchor="middle" font-size="12" fill="#f5f5f5">${esc(p.concernLabel)}</text></svg>
      <figcaption><strong>${esc(p.concernLabel)}</strong><span>Type ${esc(p.choices.fitzpatrick)} · ${esc(p.tone.label)}</span></figcaption></figure>`;
    if (!window.StudioPhoto) return drawing;
    return window.StudioPhoto.panel({ studio: 'face', id: `age-${p.choices.decade}`, fallback: drawing, w: 720, h: 960, alt: `A woman in her ${p.decadeLabel}`, caption: `<strong>${esc(p.decadeLabel)}</strong><span>${esc(p.concernLabel)} · Type ${esc(p.choices.fitzpatrick)}</span>` });
  }
  function timelinePanel(p) {
    const segs = p.ages.map((d, i) => {
      const on = d === p.choices.decade; const x = 20 + i * 42;
      return `<rect x="${x}" y="40" width="38" height="24" rx="5" fill="${on ? '#e9c46a' : '#333'}"/><text x="${x + 19}" y="56" text-anchor="middle" font-size="11" fill="${on ? '#111' : '#ddd'}">${esc(d)}</text>`;
    }).join('');
    const steps = (list, y0, title) => `<text x="20" y="${y0}" font-size="12" fill="#e9c46a" font-weight="600">${title}</text>${list.map((s, i) => `<text x="28" y="${y0 + 18 + i * 16}" font-size="11" fill="#f5f5f5">${i + 1}. ${esc(s.step)}</text>`).join('')}`;
    const stage = p.choices.stage === 'none' ? '' : `<text x="120" y="82" text-anchor="middle" font-size="11" fill="#e76f51">${esc(p.stageLabel)}</text>`;
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Your routine">
      <rect width="240" height="300" rx="14" fill="#141414"/>${segs}${stage}
      ${steps(p.routine.am, 108, 'Morning')}${steps(p.routine.pm, 108 + 26 + p.routine.am.length * 16, 'Evening')}</svg>
      <figcaption><strong>${esc(p.decadeLabel)}</strong><span>${p.routine.am.length + p.routine.pm.length} steps a day</span></figcaption></figure>`;
  }

  // ---- Controls ---------------------------------------------------------------------------------
  // Nothing is pre-selected: every dropdown opens on a disabled "Choose…" and shows a value only once
  // picked here. Until the first pick the studio shows its neutral base (no tint, no plan); after it,
  // fields still on "Choose…" fall back to a suggested value so the plan never sees undefined.
  const PICKED = new Set(); const OWN = new Set();
  const anyPicked = () => [...OWN].some(id => PICKED.has(id));
  function renderBase() {
    ++ag.seq; ag.plan = null;
    const put = (k, h) => { const el = $('ag' + k); if (el) el.innerHTML = h; };
    put('Preview', '');
    put('Summary', '<p class="lib-note choose-first">Choose your options above to see your plan.</p>');
    put('Plan', '');
  }
  function select(id, text, values, current) {
    OWN.add(id);
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}"><option value="" disabled${PICKED.has(id) ? '' : ' selected'}>Choose…</option>${values.map(v => `<option value="${esc(v.id)}"${PICKED.has(id) && String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = ag.options; const c = ag.choices;
    $('agControls').innerHTML = `
      ${select('agDecade', 'Decade', o.decades, c.decade)}
      ${select('agFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('agConcern', 'Main concern', o.concerns, c.concern)}
      ${select('agStage', 'Hormone stage', o.stages, c.stage)}
      ${select('agCommunity', 'Community', o.communities, c.community)}
      ${select('agTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  const steps = xs => `<ol>${xs.map(s => `<li><strong>${esc(s.step)}</strong>: ${esc(s.detail)}</li>`).join('')}</ol>`;
  function renderPlan() {
    const o = ag.options; const raw = ag.plan;
    const p = {
      ...raw, ages: o.decades.map(d => d.id),
      concernLabel: o.concerns.find(x => x.id === raw.choices.concern)?.label ?? raw.choices.concern,
      decadeLabel: o.decades.find(x => x.id === raw.choices.decade)?.label ?? raw.choices.decade,
      stageLabel: o.stages.find(x => x.id === raw.choices.stage)?.label ?? '',
    };
    const r = p.retinoid; const cn = p.communityNotes; const h = p.hormones;
    $('agPreview').innerHTML = facePanel(p) + timelinePanel(p);
    $('agSummary').innerHTML = `<p class="hl-big">${esc(p.decadeLabel)} · ${esc(p.concernLabel)} · Type ${esc(p.depth.type)}${h ? ` · ${esc(p.stageLabel)}` : ''}</p><p>${esc(p.decade.overview)}</p><p class="lib-note">Retinoid pace and in-clinic advice for Fitzpatrick ${esc(p.depth.protocolFor)}.</p>`;
    $('agPlan').innerHTML = [
      card('Morning', steps(p.routine.am)),
      card('Evening', steps(p.routine.pm)),
      r ? card('Bringing in a retinoid', `<p><strong>Start with:</strong> ${esc(r.start)}</p><p><strong>How often:</strong> ${esc(r.frequency)}</p><p>${esc(r.notes)}</p>${r.special ? `<p>${esc(r.special)}</p>` : ''}${r.ramp ? `<p><strong>Ramp up</strong></p><ul>${r.ramp.map(li).join('')}</ul>` : ''}${r.deepSkin ? `<p>${esc(r.deepSkin)}</p>` : ''}`, ' hl-warn') : card('Retinoid', '<p>Not needed yet in your 20s unless lines are your concern; sunscreen and vitamin C come first.</p>'),
      card(`Lead ingredient: ${p.lead.name}`, `${val(p.lead.why)}<details><summary>Forms and strengths</summary>${val(p.lead.forms)}</details>`),
      card(`What changes in ${p.decadeLabel.replace(/^My /, 'your ')}`, `<ul>${p.decade.changes.map(li).join('')}</ul><p><strong>Priorities</strong></p><ul>${p.decade.priorities.map(li).join('')}</ul>${p.decade.expect ? `<details><summary>More on this decade</summary>${val(p.decade.expect)}</details>` : ''}`),
      p.clinic ? card(`In clinic: ${p.clinic.name}`, val(p.clinic.suitability)) : card('In clinic', '<p>Dryness is treated at home: a richer cream, gentler cleansing and fewer harsh actives.</p>'),
      h ? card(p.stageLabel, `<p>${esc(h.what)}</p>${h.signs ? `<ul>${h.signs.map(li).join('')}</ul>` : ''}${val(h.skin)}<p><strong>Principles</strong></p><ul>${h.principles.map(li).join('')}</ul>${h.hrt ? `<details><summary>Hormone therapy and skin</summary>${val(h.hrt)}</details>` : ''}`) : '',
      card('Collagen habits', `<p><strong>Sleep:</strong> ${esc(p.lifestyle.sleep)}</p><p><strong>Stress:</strong> ${esc(p.lifestyle.stress)}</p>${val(p.lifestyle.avoid)}`),
      card(`${p.community.label} notes`, `${cn.foods?.length ? `<p><strong>Foods:</strong> ${esc(cn.foods.join(', '))}</p>` : ''}${cn.collagenFoods ? `<p>${esc(cn.collagenFoods)}</p>` : ''}${cn.decadeTip ? `<p><strong>This decade:</strong> ${esc(cn.decadeTip)}</p>` : ''}${cn.menopause ? `<p><strong>Traditional menopause care</strong></p>${val(cn.menopause)}` : ''}${cn.traditions ? `<details><summary>Traditions</summary>${val(cn.traditions.items)}</details>` : ''}${cn.myths.length ? `<details><summary>Myths and facts</summary>${cn.myths.map(m => `<p><strong>Myth:</strong> ${esc(m.myth)}<br><strong>Fact:</strong> ${esc(m.fact)}</p>`).join('')}</details>` : ''}`),
    ].join('');
  }

  async function replan() {
    const seq = ++ag.seq;
    try {
      const plan = await api('/api/ageing/plan', ag.choices);
      if (seq !== ag.seq) return;
      ag.plan = plan;
      renderPlan();
    } catch (e) {
      $('agPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openStudio() {
    try {
      if (!ag.options) ag.options = await api('/api/ageing/options');
      if (!ag.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? ag.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : ag.options.tones[6];
        ag.choices = { decade: '30s', fitzpatrick: 'V', concern: 'pigment', stage: 'none', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      if (anyPicked()) await replan(); else renderBase();
    } catch (e) {
      $('agPlan').innerHTML = `<p class="lib-note">The Ageing Studio could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { agDecade: 'decade', agFitz: 'fitzpatrick', agConcern: 'concern', agStage: 'stage', agCommunity: 'community', agTone: 'tone' };
  document.addEventListener('change', e => {
    if (OWN.has(e.target.id) && e.target.value !== '') PICKED.add(e.target.id);
    const k = FIELD[e.target.id];
    if (!k || !ag.choices) return;
    ag.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view="ageing"], [data-open-ageing]');
    if (!t) return;
    if (t.dataset.openAgeing !== undefined) { document.querySelector('.nav-link[data-view="ageing"]')?.click(); return; }
    openStudio();
  });
})();
