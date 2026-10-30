/**
 * Hair Colour Lab view. Pick your texture, porosity, starting level, history and a target
 * colour; the server works out the lift, sessions, technique and warnings from the hair guides,
 * and this view draws the result on illustrated strands: now, after the first session, the goal,
 * and how the colour fades for your porosity. No photo is used.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const hl = { options: null, plan: null, choices: null, seq: 0 };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nice = s => String(s).replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  function profile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { return {}; }
  }
  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  // ---- Colour helpers ----------------------------------------------------------------------
  // '#rgb' and '#rrggbb' both work ('#000' used to parse as NaN and drop the outline it coloured)
  const hexRgb = h => { const s = String(h).replace('#', ''); const f = s.length === 3 ? [...s].map(c => c + c).join('') : s; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)); };
  const rgbHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));

  // ---- Strands -----------------------------------------------------------------------------
  const STRANDS = 22;
  /**
   * Curl type sets the strand path: class 1-4 (straight, waves, curls, coils) and sub-type a-c
   * (looser to tighter), with shorter strands for the shrinkage tighter patterns show.
   */
  function strandPath(x0, curl, seed, sub = 0) {
    const len = [0, 150, 146, 132, 112][curl] - (curl >= 3 ? sub * 12 : 0);
    const amp = [0, sub * 0.6, 3 + sub * 1.5, 6 + sub, 4 + sub][curl];
    const freq = [0, 0.02, 0.04 + sub * 0.015, 0.1 + sub * 0.025, 0.26 + sub * 0.07][curl];
    const pts = [];
    for (let y = 0; y <= len; y += 3) {
      const x = x0 + amp * Math.sin(y * freq + seed);
      pts.push(`${x.toFixed(1)},${(14 + y).toFixed(1)}`);
    }
    return { d: 'M' + pts.join(' L'), len };
  }
  /** Which strands take colour, and from how far down, for each technique pattern. */
  function strandCoverage(pattern, i) {
    switch (pattern) {
      case 'painted': return (i * 7) % 5 < 3 ? 0.35 + ((i * 13) % 4) * 0.06 : null;
      case 'foils': return i % 3 === 1 ? 0.02 : null;
      case 'face': return i < 3 || i > STRANDS - 4 ? 0.04 : null;
      case 'gradient': return 0.5;
      default: return 0;
    }
  }
  function panel(id, title, base, colour, pattern, curl, note, sub) {
    const parts = [];
    for (let i = 0; i < STRANDS; i++) {
      const x = 14 + i * (112 / (STRANDS - 1));
      const { d, len } = strandPath(x, curl, i * 1.7, sub);
      const from = colour ? strandCoverage(pattern, i) : null;
      let stroke = base;
      if (from != null) {
        const gid = `${id}-g${i}`;
        parts.push(`<linearGradient id="${gid}" x1="0" y1="14" x2="0" y2="${14 + len}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${base}"/><stop offset="${Math.max(0, from - 0.02)}" stop-color="${base}"/><stop offset="${Math.min(1, from + 0.12)}" stop-color="${colour}"/><stop offset="1" stop-color="${colour}"/></linearGradient>`);
        stroke = `url(#${gid})`;
      }
      parts.push(`<path d="${d}" stroke="${stroke}" stroke-width="4.2" fill="none" stroke-linecap="round"/>`);
    }
    return `<figure class="hl-panel"><svg viewBox="0 0 140 170" role="img" aria-label="${esc(title)}"><rect width="140" height="170" rx="12" fill="#f4ede6"/><rect x="8" y="6" width="124" height="10" rx="5" fill="#d9c7b8"/>${parts.join('')}</svg><figcaption><strong>${esc(title)}</strong>${note ? `<span>${esc(note)}</span>` : ''}</figcaption></figure>`;
  }

  const FADE = { low: 0.15, medium: 0.3, high: 0.5 };
  function drawPreview(p) {
    const m = p.choices.texture.match(/type_(\d)([abc])/);
    const curl = Number(m?.[1] ?? 4); const sub = 'abc'.indexOf(m?.[2] ?? 'a');
    const pattern = p.technique.pattern;
    const goal = p.plantDye && p.chemicalLift > 0 ? mix(p.start.hex, p.target.hex, 0.35) : p.target.hex;
    const panels = [panel('hlNow', 'Now', p.start.hex, null, pattern, curl, p.start.label, sub)];
    if (p.sessions > 1) panels.push(panel('hlS1', 'After session 1', p.start.hex, p.path[0].swatch, pattern, curl, `Underlying ${p.path[0].underlying.toLowerCase()}`, sub));
    panels.push(panel('hlGoal', p.sessions > 1 ? `Goal (${p.sessions} sessions)` : 'Goal', p.start.hex, goal, pattern, curl, p.plantDye && p.chemicalLift > 0 ? 'Shows as a tint' : p.target.label, sub));
    const fadeTo = p.stage ? p.stage.swatch : p.start.hex;
    panels.push(panel('hlFade', 'Weeks later', p.start.hex, mix(goal, fadeTo, FADE[p.choices.porosity]), pattern, curl, `${nice(p.choices.porosity)} porosity fades ${p.fade}`, sub));
    $('hlPreview').innerHTML = panels.join('');
  }

  // ---- Controls ----------------------------------------------------------------------------
  function select(id, label, values, current) {
    return `<label class="st-field"><span>${esc(label)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = hl.options; const c = hl.choices;
    const targetGroups = Object.entries(o.targets).map(([cat, list]) => `<optgroup label="${esc(nice(cat))}">${list.map(t => `<option value="${esc(t.id)}"${t.id === c.target ? ' selected' : ''}>${esc(t.label)}</option>`).join('')}</optgroup>`).join('');
    $('hlControls').innerHTML = `
      ${select('hlCommunity', 'Community', o.communities, c.community)}
      ${select('hlTexture', 'Texture', o.textures, c.texture)}
      ${select('hlPorosity', 'Porosity', o.porosities.map(x => ({ id: x, label: nice(x) })), c.porosity)}
      ${select('hlStart', 'Your colour now', o.startLevels.map(s => ({ id: s.level, label: s.label })), c.startLevel)}
      ${select('hlHistory', 'Hair history', o.histories, c.history)}
      <label class="st-field"><span>Target colour</span><select id="hlTarget">${targetGroups}</select></label>
      ${select('hlTechnique', 'Technique', [{ id: '', label: 'Recommended for me' }, ...o.techniques.map(t => ({ id: t.id, label: t.label }))], c.technique)}`;
  }

  const li = s => `<li>${esc(s)}</li>`;
  function renderPlan() {
    const p = hl.plan;
    drawPreview(p);
    const t = p.technique;
    $('hlSummary').innerHTML = `
      <p class="hl-big">${p.lift === 0 ? (p.plantDye ? 'No bleach: plant dye only' : 'No lift needed') : `${p.lift} level${p.lift > 1 ? 's' : ''} of lift · ${p.sessions} session${p.sessions > 1 ? 's' : ''}`}</p>
      <p>${esc(p.start.label)} → ${esc(p.target.label)}${p.stage ? ` (needs hair lightened to <em>${esc(p.stage.underlying.toLowerCase())}</em>, about level ${p.stage.level}: ${esc(p.stage.achievable)})` : ''}</p>
      <p><strong>${esc(t.name)}</strong>${t.why ? ` · ${esc(t.why)}` : ''}</p>
      ${t.fitNote ? `<p class="st-avoid">${esc(t.fitNote)}</p>` : ''}
      ${p.developer ? `<p><strong>Developer:</strong> ${esc(p.developer.volume)}${p.developer.note ? ` · ${esc(p.developer.note)}` : ''}</p>` : ''}`;
    $('hlPlan').innerHTML = `
      <article class="st-card"><h4>Steps</h4><ol>${p.steps.map(li).join('')}</ol></article>
      ${p.warnings.length ? `<article class="st-card hl-warn"><h4>Before you start</h4><ul>${p.warnings.map(w => `<li><strong>${esc(w.why)}:</strong> ${esc(w.text)}</li>`).join('')}</ul></article>` : ''}
      ${p.withoutBleach.length ? `<article class="st-card"><h4>Without bleach</h4><ul>${p.withoutBleach.map(o => `<li><strong>${esc(o.technique)}:</strong> ${esc(o.result || o.description || '')}</li>`).join('')}</ul></article>` : ''}
      ${p.tryOnWig ? `<article class="st-card"><h4>Try it on a wig first</h4><p>${esc(p.tryOnWig.why)}</p><button type="button" class="btn btn-secondary" data-hl-wig>Open Wig Match</button></article>` : ''}
      <article class="st-card"><h4>Aftercare${p.care.routineTitle ? ` · ${esc(p.care.routineTitle)}` : ''}</h4>
        <p><strong>${esc(p.care.texture.label)}:</strong> ${esc(p.care.texture.description)}</p>
        ${p.care.texture.tips.length ? `<ul>${p.care.texture.tips.map(li).join('')}</ul>` : ''}
        ${p.care.washFrequency ? `<p>${esc(p.care.washFrequency)}</p>` : ''}
        <ul>${p.care.colour.slice(0, 4).map(li).join('')}</ul>
        ${p.care.porosity ? `<p><strong>${esc(p.care.porosity.title)}:</strong> ${esc([].concat(p.care.porosity.best).slice(0, 3).join(' · '))}</p>` : ''}
        ${p.care.protective.length ? `<p><strong>Protective styles while it settles:</strong> ${p.care.protective.map(s => esc(s.name)).join(' · ')}</p>` : ''}
      </article>
      ${p.communityNotes ? `<article class="st-card"><h4>${esc(p.community.label)} colour notes</h4>
        ${p.communityNotes.popular.length ? `<ul>${p.communityNotes.popular.slice(0, 4).map(li).join('')}</ul>` : ''}
        ${p.communityNotes.traditions.length ? `<p><strong>Traditions:</strong> ${p.communityNotes.traditions.map(esc).join(' · ')}</p>` : ''}</article>` : ''}`;
  }

  async function replan() {
    const seq = ++hl.seq;
    try {
      const plan = await api('/api/hairlab/plan', hl.choices);
      if (seq !== hl.seq) return;
      hl.plan = plan;
      renderPlan();
    } catch (e) {
      $('hlPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }

  async function openLab() {
    try {
      if (!hl.options) hl.options = await api('/api/hairlab/options');
      if (!hl.choices) {
        const pr = profile();
        hl.choices = { community: pr.communityId || 'west_african', texture: 'type_4a', porosity: 'medium', startLevel: 2, history: 'virgin', target: 'honey_blonde', technique: '' };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('hlPlan').innerHTML = `<p class="lib-note">The Hair Colour Lab could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { hlCommunity: 'community', hlTexture: 'texture', hlPorosity: 'porosity', hlStart: 'startLevel', hlHistory: 'history', hlTarget: 'target', hlTechnique: 'technique' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !hl.choices) return;
    hl.choices[k] = k === 'startLevel' ? Number(e.target.value) : e.target.value;
    if (k === 'target' || k === 'community') hl.choices.technique = '';
    if (k === 'target' || k === 'community') renderControls();
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view="hairlab"], [data-open-hairlab], [data-hl-wig]');
    if (!t) return;
    if (t.dataset.hlWig !== undefined) { document.querySelector('.nav-link[data-view="wig"]')?.click(); return; }
    if (t.dataset.openHairlab !== undefined) { document.querySelector('.nav-link[data-view="hairlab"]')?.click(); return; }
    openLab();
  });
})();
