/**
 * Ingredient Checker view. Pick up to four ingredients, Fitzpatrick type, pregnancy stage,
 * concern, community and a tone; the server checks every pair against the guides and builds a
 * week of routines, and this view draws the pairs, the week and the layers on a skin block in the
 * tone you pick. No photo is used.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const mx = { options: null, plan: null, choices: null, seq: 0 };
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
  const rgbHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const LEVEL = {
    great: ['#2a9d8f', 'good together'], ok: ['#8ab17d', 'fine together'], none: ['#8d99ae', 'no rule in the guides'], order: ['#e9c46a', 'mind the order'],
    split: ['#f4a261', 'split AM/PM or nights'], caution: ['#f4a261', 'go gently'], avoid: ['#e63946', 'do not mix'], apart: ['#6c757d', 'not a face step'],
  };
  const PALETTE = ['#e9c46a', '#e76f51', '#2a9d8f', '#a78bfa'];
  const BASE = { cleanse: '#cfd8dc', moist: '#f1e3c6', buffer: '#f1e3c6', spf: '#ffd166' };
  const short = s => String(s).split(' (')[0].replace(/^Vitamin C$/, 'Vit C');
  const colourOf = (p, id) => BASE[id] ?? PALETTE[p.ingredients.findIndex(i => i.id === id)] ?? '#bbb';

  // ---- Pairs: one line per pair, coloured by the verdict ----------------------------------------
  function pairPanel(p) {
    const n = p.ingredients.length; const cx = 120; const cy = 112; const r = 66;
    const at = i => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const idx = id => p.ingredients.findIndex(i => i.id === id);
    const left = new Set((p.pregnancy?.items ?? []).filter(x => x.verdict === 'avoid').map(x => x.id));
    const edges = p.pairs.map(q => {
      const [x1, y1] = at(idx(q.a)); const [x2, y2] = at(idx(q.b)); const [col] = LEVEL[q.level];
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${q.level === 'avoid' ? 6 : 4}"${q.level === 'apart' || q.level === 'none' ? ' stroke-dasharray="6 5"' : ''}/>`;
    }).join('');
    const nodes = p.ingredients.map((g, i) => {
      const [x, y] = at(i); const out = left.has(g.id);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="20" fill="${PALETTE[i]}" stroke="#141414" stroke-width="2"/>${out ? `<path d="M${(x - 13).toFixed(1)},${(y - 13).toFixed(1)} l26,26 m0,-26 l-26,26" stroke="#e63946" stroke-width="4"/>` : ''}<text x="${x.toFixed(1)}" y="${(y + (y < cy - 1 ? -26 : 34)).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#f5f5f5">${esc(short(g.name))}</text>`;
    }).join('');
    const used = [...new Set(p.pairs.map(q => q.level))];
    const legend = used.map((l, i) => `<rect x="14" y="${232 + i * 13}" width="10" height="8" fill="${LEVEL[l][0]}"/><text x="30" y="${240 + i * 13}" font-size="9" fill="#f5f5f5">${esc(LEVEL[l][1])}</text>`).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Pairs">
      <rect width="240" height="300" rx="14" fill="#1a1420"/>${edges}${nodes}${legend}</svg>
      <figcaption><strong>${esc(p.pairs.filter(q => q.level === 'avoid').length ? 'Some do not mix' : p.pairs.some(q => q.level === 'split') ? 'Split some of these' : 'These can share a routine')}</strong><span>${p.pairs.length} pairs checked${left.size ? ` · ${left.size} left out for pregnancy` : ''}</span></figcaption></figure>`;
  }

  // ---- Week: morning and night chips for each day -----------------------------------------------
  function weekPanel(p) {
    const cell = (steps, x, y) => steps.map((s, i) => `<rect x="${x}" y="${y + i * 9}" width="26" height="7" rx="2" fill="${colourOf(p, s.id)}"/>`).join('');
    const cols = p.week.map((d, i) => {
      const x = 12 + i * 31; const hi = d.night === 'retinoid' ? '#e76f51' : d.night === 'acid' ? '#e9c46a' : '#3a3040';
      return `<text x="${x + 13}" y="30" text-anchor="middle" font-size="10" font-weight="700" fill="#f5f5f5">${d.day}</text>${cell(d.am, x, 44)}<rect x="${x - 2}" y="146" width="30" height="${Math.max(d.pm.length * 9 + 6, 20)}" rx="4" fill="none" stroke="${hi}" stroke-width="2"/>${cell(d.pm, x, 150)}`;
    }).join('');
    const nights = p.week.filter(d => d.night === 'retinoid').length; const acid = p.week.filter(d => d.night === 'acid').length;
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Week">
      <rect width="240" height="300" rx="14" fill="#1a1420"/>
      <text x="8" y="40" font-size="8" fill="#f5f5f5">AM</text><text x="8" y="144" font-size="8" fill="#f5f5f5">PM</text>${cols}
      <text x="120" y="268" text-anchor="middle" font-size="10" fill="#e76f51">${nights} retinol night${nights === 1 ? '' : 's'}</text>
      <text x="120" y="284" text-anchor="middle" font-size="10" fill="#e9c46a">${acid} acid night${acid === 1 ? '' : 's'}</text></svg>
      <figcaption><strong>Your week</strong><span>${p.week.some(d => d.pm.some(s => s.id === 'buffer')) ? 'moisturiser buffer on retinol nights · ' : ''}one colour per ingredient</span></figcaption></figure>`;
  }

  // ---- Layers on skin: the busiest night, bottom to top -----------------------------------------
  function layerPanel(p) {
    const skin = p.tone.hex; const deep = lum(skin) < 0.18; const ink = deep ? mix(skin, '#ffffff', 0.75) : mix(skin, '#000000', 0.6);
    const night = p.week.reduce((a, b) => (b.pm.length > a.pm.length ? b : a)); const layers = night.pm.filter(s => s.id !== 'cleanse');
    const h = Math.min(22, 150 / Math.max(layers.length, 1));
    const bands = layers.map((s, i) => { const y = 200 - (i + 1) * h; return `<rect x="30" y="${y.toFixed(1)}" width="180" height="${(h - 2).toFixed(1)}" rx="3" fill="${colourOf(p, s.id)}" opacity="0.9"/><text x="120" y="${(y + h / 2 + 3).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="#141414">${esc(short(s.label))}</text>`; }).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Layers">
      <rect width="240" height="300" rx="14" fill="#2b2433"/>
      ${bands}<rect x="30" y="200" width="180" height="70" rx="6" fill="${skin}" stroke="${ink}" stroke-width="1.5"/>
      <text x="120" y="240" text-anchor="middle" font-size="11" font-weight="700" fill="${ink}">your skin</text>
      ${p.sunCare ? `<text x="120" y="262" text-anchor="middle" font-size="9" fill="${ink}">SPF every morning after this</text>` : ''}</svg>
      <figcaption><strong>${esc(night.day)} night, bottom to top</strong><span>Type ${esc(p.skin.type)} · ${esc(p.tone.label)}</span></figcaption></figure>`;
  }

  function select(id, text, values, current) {
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = mx.options; const c = mx.choices; const ing = o.ingredients.map(i => ({ id: i.id, label: `${i.label} · ${i.group}` }));
    const none = [{ id: 'none', label: 'None' }, ...ing];
    $('mxControls').innerHTML = `
      ${select('mxA', 'Ingredient 1', ing, c.a)}${select('mxB', 'Ingredient 2', ing, c.b)}
      ${select('mxC', 'Ingredient 3', none, c.c)}${select('mxD', 'Ingredient 4', none, c.d)}
      ${select('mxFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('mxStage', 'Pregnancy', o.stages, c.stage)}
      ${select('mxConcern', 'Main concern', o.concerns, c.concern)}
      ${select('mxCommunity', 'Community', o.communities, c.community)}
      ${select('mxTone', 'Skin tone for the picture', o.tones, c.tone)}
      <label class="st-field"><span>Look up a term</span><input id="mxTerm" type="search" placeholder="e.g. PIH, humectant" maxlength="60"></label>
      <button type="button" class="btn btn-secondary" id="mxTermGo">Look up</button><div id="mxTermOut" class="lib-note" aria-live="polite"></div>`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  const dayLine = d => `<p><strong>${esc(d.day)}</strong>: AM ${esc(d.am.map(s => short(s.label)).join(' → '))}; PM ${esc(d.pm.map(s => short(s.label)).join(' → '))}</p>`;
  function renderPlan() {
    const p = mx.plan; const s = p.skin; const c = p.concern; const cn = p.communityNotes;
    $('mxPreview').innerHTML = pairPanel(p) + weekPanel(p) + layerPanel(p);
    const avoid = p.pairs.filter(q => q.level === 'avoid').length; const split = p.pairs.filter(q => q.level === 'split').length;
    $('mxSummary').innerHTML = `<p class="hl-big">${p.pairs.length} pairs: ${avoid} do not mix, ${split} to split, ${p.pairs.length - avoid - split} fine or no rule</p>${p.leftOut.length ? `<p>Left out of the routine for pregnancy: ${esc(p.leftOut.join(', '))}.</p>` : ''}`;
    $('mxPlan').innerHTML = [
      card('Pairs', p.pairs.map(q => `<p><strong>${esc(q.names.join(' + '))}: ${esc(q.title)}</strong><br>${esc(q.text)}${q.source ? `<br><em>${esc(q.source)}</em>` : ''}</p>`).join(''), avoid ? ' hl-warn' : ''),
      p.pregnancy ? card(`Pregnancy: ${p.pregnancy.stage}`, p.pregnancy.items.map(x => `<p><strong>${esc(x.name)}: ${esc({ ok: 'OK', caution: 'Caution', avoid: 'Avoid', ask: 'Ask your doctor' }[x.verdict])}</strong><br>${esc(x.text)}</p>`).join(''), p.leftOut.length ? ' hl-warn' : '') : '',
      card('Your week', `${p.week.map(dayLine).join('')}<p class="lib-note">${esc(p.layering.pm)} ${esc(p.layering.am)}</p>${p.offFace.length ? `<p class="lib-note">Not in the face routine (hair, body or ritual): ${esc(p.offFace.join(', '))}.</p>` : ''}`),
      card('Each ingredient', p.ingredients.map(i => `<details><summary><strong>${esc(i.name)}</strong> · ${esc(i.category)}</summary>${i.what ? `<p>${esc(i.what)}</p>` : ''}<p><strong>How:</strong> ${esc(i.howToUse)}</p>${i.concentration ? `<p><strong>Strength:</strong> ${esc(i.concentration)}</p>` : ''}${i.avoidWith.length ? `<p><strong>Keep apart from:</strong> ${esc(i.avoidWith.join('; '))}</p>` : ''}${i.note ? `<p>${esc(i.note)}</p>` : ''}${i.caution ? `<p><em>${esc(i.caution)}</em></p>` : ''}${i.darkSkin ? `<p><strong>For your skin type:</strong> ${esc(i.darkSkin)}</p>` : ''}${i.sunCare ? '<p>Needs daily SPF.</p>' : ''}${i.products.length ? `<p><strong>Named in the guides:</strong> ${esc(i.products.join('; '))}</p>` : ''}${i.glossary ? `<p class="lib-note"><strong>${esc(i.glossary.term)}:</strong> ${esc(i.glossary.definition)}</p>` : ''}</details>`).join('')),
      card(`Skin type ${s.type}`, `<p>${esc(s.headline)}</p>${s.principle ? `<p>${esc(s.principle)}</p>` : ''}${s.order ? `<p><strong>Actives in order of priority</strong></p>${ul(s.order)}` : ''}<details><summary>Starting a retinoid</summary>${s.retinoidStartDeeper ? `<p>${esc(s.retinoidStartDeeper)}</p>` : ''}${ul(s.retinoidStart)}<p><strong>Slow down if</strong></p>${ul(s.slowDown)}</details>`),
      card(`${c.label}: what helps`, `<p><strong>${esc(c.title)}</strong></p>${ul(c.items)}<p><strong>Ingredients in the encyclopedia for this</strong></p>${ul(c.suggestions.map(x => `${x.name}${x.careOnDeeperSkin ? ' (go slowly and wear SPF)' : ''}`))}${c.leftOut.length ? `<p>Left out for pregnancy: ${esc(c.leftOut.join(', '))}</p>` : ''}${c.warn ? `<p class="lib-note">${esc(c.warn)}</p>` : ''}`),
      card(`${p.community.label}: traditional ingredients`, cn.traditional.length ? cn.traditional.map(t => `<p><strong>${esc(t.name)}</strong> · ${esc(t.origin)}${t.faceRoutine ? '' : ' · hair, body or ritual'}<br>${esc(t.use)}</p>`).join('') + ul(cn.notes) : '<p class="lib-note">The encyclopedia names no ingredients for this community beyond the ones for everyone.</p>'),
    ].join('');
  }

  async function replan() {
    const seq = ++mx.seq;
    try {
      const plan = await api('/api/mix/plan', mx.choices);
      if (seq !== mx.seq) return;
      mx.plan = plan;
      renderPlan();
    } catch (e) {
      $('mxPlan').innerHTML = `<p class="lib-note">Could not check these (${esc(e.message)}).</p>`;
    }
  }
  async function lookUp() {
    const q = $('mxTerm')?.value ?? ''; if (q.trim().length < 2) return;
    try {
      const r = await api(`/api/mix/term?q=${encodeURIComponent(q)}`);
      $('mxTermOut').innerHTML = r.entry ? `<strong>${esc(r.entry.term)}:</strong> ${esc(r.entry.definition)}` : `No glossary entry for "${esc(r.query)}".`;
    } catch (e) { $('mxTermOut').textContent = `Lookup failed (${e.message}).`; }
  }
  async function openStudio() {
    try {
      if (!mx.options) mx.options = await api('/api/mix/options');
      if (!mx.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? mx.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : mx.options.tones[6];
        mx.choices = { a: 'retinol', b: 'glycolic_acid', c: 'vitamin_c', d: 'niacinamide', fitzpatrick: 'V', stage: 'no', concern: 'darkspots', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('mxPlan').innerHTML = `<p class="lib-note">The Ingredient Checker could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { mxA: 'a', mxB: 'b', mxC: 'c', mxD: 'd', mxFitz: 'fitzpatrick', mxStage: 'stage', mxConcern: 'concern', mxCommunity: 'community', mxTone: 'tone' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !mx.choices) return;
    mx.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('keydown', e => { if (e.target.id === 'mxTerm' && e.key === 'Enter') { e.preventDefault(); lookUp(); } });
  document.addEventListener('click', e => {
    if (e.target.id === 'mxTermGo') { lookUp(); return; }
    const t = e.target.closest('[data-view="mix"], [data-open-mix]');
    if (!t) return;
    if (t.dataset.openMix !== undefined) { document.querySelector('.nav-link[data-view="mix"]')?.click(); return; }
    openStudio();
  });
})();
