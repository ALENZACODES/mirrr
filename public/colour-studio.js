/**
 * Colour & Lip Studio view. Pick your Fitzpatrick type, undertone, a colour formula, a lip look,
 * finish, liner technique, lip-care concern, community and a skin tone; the server plans the palette
 * and the lips from the colour and lip guides, and this view draws them: lips in the chosen shade,
 * finish and liner technique on the Monk tone you pick, and the palette as swatches against it.
 * No photo is used.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const cl = { options: null, plan: null, choices: null, seq: 0 };
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

  // ---- Lips ----------------------------------------------------------------------------------------
  // Upper and lower lip outlines around the centre (120, 150); `scale` grows or shrinks them about
  // the natural border (overline / underline), `bow` sharpens the cupid's bow (X technique).
  function lipPaths(scale, bow) {
    const s = v => 120 + (v - 120) * scale; const y = v => 150 + (v - 150) * scale;
    const peak = 118 - bow;
    const upper = `M${s(52)},${y(150)} C${s(70)},${y(132)} ${s(92)},${y(peak)} ${s(106)},${y(peak)} C${s(112)},${y(peak)} ${s(116)},${y(126 + bow / 2)} ${s(120)},${y(128 + bow / 2)} C${s(124)},${y(126 + bow / 2)} ${s(128)},${y(peak)} ${s(134)},${y(peak)} C${s(148)},${y(peak)} ${s(170)},${y(132)} ${s(188)},${y(150)} C${s(160)},${y(154)} ${s(140)},${y(150)} ${s(120)},${y(152)} C${s(100)},${y(150)} ${s(80)},${y(154)} ${s(52)},${y(150)}Z`;
    const lower = `M${s(52)},${y(150)} C${s(80)},${y(156)} ${s(100)},${y(154)} ${s(120)},${y(156)} C${s(140)},${y(154)} ${s(160)},${y(156)} ${s(188)},${y(150)} C${s(172)},${y(178)} ${s(148)},${y(190)} ${s(120)},${y(190)} C${s(92)},${y(190)} ${s(68)},${y(178)} ${s(52)},${y(150)}Z`;
    return { upper, lower };
  }
  const LINER_SHAPE = { overline: [1.07, 0], underline: [0.93, 0], x_technique: [1, 6] };
  function lipsPanel(p) {
    const skin = p.tone.hex;
    const shade = p.lips.shade.colour.hex;
    const centre = p.lips.shade.centre?.hex;
    const [scale, bow] = LINER_SHAPE[p.choices.liner] ?? [1, 0];
    const { upper, lower } = lipPaths(scale, bow);
    const natural = lipPaths(1, 0);
    const linerHex = mix(shade, '#000000', 0.25);
    const fin = p.choices.finish;
    const sheen = { gloss: 0.55, glossy: 0.8, vinyl: 0.75, metallic: 0.5, satin: 0.22, velvet: 0.08, matte: 0 }[fin] ?? 0.2;
    const sheenHex = fin === 'metallic' ? '#f1d9a0' : '#ffffff';
    const fill = centre ? 'url(#clOmbre)' : shade;
    const cornerShade = p.choices.liner === 'ombre_liner'
      ? `<g filter="url(#clSoft)" opacity="0.7"><ellipse cx="${120 - 62 * scale}" cy="152" rx="12" ry="8" fill="${mix(shade, '#000', 0.45)}"/><ellipse cx="${120 + 62 * scale}" cy="152" rx="12" ry="8" fill="${mix(shade, '#000', 0.45)}"/></g>` : '';
    const clean = p.choices.liner === 'concealer_clean_up' ? `<path d="${upper}" fill="none" stroke="${mix(skin, '#ffffff', 0.35)}" stroke-width="5" opacity="0.6"/><path d="${lower}" fill="none" stroke="${mix(skin, '#ffffff', 0.35)}" stroke-width="5" opacity="0.6"/>` : '';
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Lips">
      <defs><radialGradient id="clOmbre" cx="50%" cy="55%" r="60%"><stop offset="0%" stop-color="${centre ?? shade}"/><stop offset="20%" stop-color="${centre ?? shade}"/><stop offset="70%" stop-color="${shade}"/></radialGradient>
      <filter id="clSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>
      <rect width="240" height="300" rx="14" fill="${skin}"/>
      ${scale !== 1 ? `<g fill="none" stroke="${lum(skin) > 0.3 ? '#1a1a1a' : '#ffffff'}" stroke-dasharray="3 3" stroke-width="1.2" opacity="0.75"><path d="${natural.upper}"/><path d="${natural.lower}"/></g>` : ''}
      ${clean}
      <path d="${upper}" fill="${fill}"/><path d="${lower}" fill="${fill}"/>${cornerShade}
      <path d="${upper}" fill="none" stroke="${linerHex}" stroke-width="1.6"/><path d="${lower}" fill="none" stroke="${linerHex}" stroke-width="1.6"/>
      ${sheen ? `<g filter="url(#clSoft)"><ellipse cx="120" cy="${150 + 26 * scale}" rx="${22 * scale}" ry="5" fill="${sheenHex}" opacity="${sheen}"/><ellipse cx="108" cy="${150 - 12 * scale}" rx="9" ry="3" fill="${sheenHex}" opacity="${sheen * 0.8}"/></g>` : ''}
      <path d="M58,151 C90,156 150,156 182,151" fill="none" stroke="${mix(shade, '#000', 0.55)}" stroke-width="1.2"/>
      <text x="120" y="240" text-anchor="middle" font-size="12" fill="${lum(skin) > 0.3 ? '#1a1a1a' : '#f5f5f5'}">${esc(p.lips.shade.colour.word)}${centre ? ` → ${esc(p.lips.shade.centre.word)}` : ''} · ${esc(p.finish.finish)}</text></svg>
      <figcaption><strong>${esc(p.lips.look.name)}</strong><span>${esc(p.liner.technique)}</span></figcaption></figure>`;
  }
  function palettePanel(p) {
    const skin = p.tone.hex; const cs = p.palette.colours;
    const dots = cs.map((c, i) => {
      const x = 50 + (i % 3) * 70; const y = 80 + Math.floor(i / 3) * 90;
      return `<circle cx="${x}" cy="${y}" r="28" fill="${c.hex}" stroke="${mix(skin, '#fff', 0.3)}"/><text x="${x}" y="${y + 44}" text-anchor="middle" font-size="11" fill="${lum(skin) > 0.3 ? '#1a1a1a' : '#f5f5f5'}">${esc(c.word)}</text>`;
    }).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Palette"><rect width="240" height="300" rx="14" fill="${skin}"/>${dots}</svg>
      <figcaption><strong>${esc(p.palette.formula)}</strong><span>${esc(p.palette.undertone.label)} · ${esc(p.tone.label)}</span></figcaption></figure>`;
  }

  // ---- Controls ---------------------------------------------------------------------------------
  function select(id, label, values, current) {
    return `<label class="st-field"><span>${esc(label)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = cl.options; const c = cl.choices;
    $('clControls').innerHTML = `
      ${select('clFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('clUndertone', 'Undertone', o.undertones, c.undertone)}
      ${select('clFormula', 'Colour formula', o.formulas, c.formula)}
      ${select('clLook', 'Lip look', o.looks, c.look)}
      ${select('clFinish', 'Finish', o.finishes, c.finish)}
      ${select('clLiner', 'Liner technique', o.liners, c.liner)}
      ${select('clCare', 'Lip care', o.care, c.care)}
      ${select('clCommunity', 'Community', o.communities, c.community)}
      ${select('clTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  const ul = xs => (xs?.length ? `<ul>${xs.map(li).join('')}</ul>` : '');
  const p_ = (label, text) => (text ? `<p>${label ? `<strong>${esc(label)}:</strong> ` : ''}${esc(text)}</p>` : '');
  const sw = x => `<span class="cx-swatch" style="background:${esc(x.hex)}" title="${esc(x.word)}"></span>`;
  function renderPlan() {
    const p = cl.plan; const l = p.lips; const pal = p.palette; const f = p.finish; const ln = p.liner; const c = p.care; const n = p.communityNotes;
    $('clPreview').innerHTML = lipsPanel(p) + palettePanel(p) + '<p class="photo-try"><button type="button" class="btn btn-primary photo-try-btn" id="clPhotoTry">Try it on my photo</button><span>Laid on your own face, on this device. Nothing is uploaded.</span></p>';
    $('clPhotoTry').addEventListener('click', () => window.dispatchEvent(new CustomEvent('mirrr:tryon', { detail: {
      name: p.lips.shade.colour.word ?? 'your lip colour',
      picture: { lip: p.lips.shade.colour.hex, lipFinish: p.choices.finish, lipSheer: /gloss|stain|balm|sheer/.test(String(p.choices.finish)), intensity: 0.7 },
    } })));
    $('clSummary').innerHTML = `
      <p class="hl-big">${esc(l.shade.colour.word)} ${esc(l.look.name.toLowerCase())} · ${esc(f.finish)} · ${esc(pal.formula)}</p>
      ${p_('Why this shade', l.shade.from === 'undertone' ? `Every shade the guide names for your depth clashes with a ${p.choices.undertone} undertone, so this one comes from your undertone list.` : `From the guide for Fitzpatrick ${p.choices.fitzpatrick}: ${l.shade.line}`)}`;
    $('clPlan').innerHTML = [
      card(pal.formula, `<p class="cx-colour">${pal.colours.map(sw).join('')}</p>${p_('', pal.description)}${p_('Rule', pal.rule)}${p_('Skip', pal.avoid.join('; '))}${ul(pal.examples)}`),
      card(`Your undertone: ${pal.undertone.label}`, `${p_('', pal.undertone.describe)}${p_('Check it', pal.undertone.check)}${p_('Foundation', pal.undertone.makeup)}`),
      card(l.look.name, `<p class="cx-colour">${[l.shade.colour, l.shade.centre, ...l.shade.alternatives].filter(Boolean).map(sw).join('')}</p><ol>${l.look.steps.map(li).join('')}</ol>${p_('Tip', l.look.tip)}`),
      card(`Lip colour for ${l.forDepth.skin}`, `${p_('Nudes', l.forDepth.nudes)}${p_('Bolds', l.forDepth.bolds)}${p_('Flattering', l.forDepth.flattering.join(', '))}${l.forDepth.avoid.length ? p_('Can look ashy', l.forDepth.avoid.join('; ')) : ''}${p_('Tip', l.forDepth.tip)}`),
      card(`For a ${p.choices.undertone} undertone`, `${p_('Reach for', l.forUndertone.colours.join(', '))}${l.forUndertone.avoid.length ? p_('Skip', l.forUndertone.avoid.join('; ')) : ''}${p_('', l.philosophy)}`),
      f.caution ? card('Careful', p_('', f.caution), ' hl-warn') : '',
      card(`Finish: ${f.finish}`, `${p_('', f.description)}${f.pros.length ? p_('Good', f.pros.join('; ')) : ''}${f.cons.length ? p_('Watch', f.cons.join('; ')) : ''}${p_('Prep', f.prep)}${Array.isArray(f.how) ? ul(f.how) : p_('How', f.how)}${p_('', f.note)}`),
      card(`Liner: ${ln.technique}`, `<ol>${ln.steps.map(li).join('')}</ol>${p_('', ln.note)}${p_('Choosing the colour', ln.choosing)}${p_('Sharpen', ln.sharpen)}`),
      card(`Lip care: ${c.concern}`, `${p_('Focus', c.focus)}${c.sections.map(s => `<p><strong>${esc(s.title)}</strong></p>${ul(s.steps)}`).join('')}${p_('Sun', c.spf)}${p_('Your natural colour', c.natural)}`),
      card(`${p.community.label} notes`, `${p_('Lip traditions', n.lips)}${p_('Colour tradition', n.colour)}${n.iconicShades.length ? p_('Iconic shades', n.iconicShades.join('; ')) : ''}${n.care.length ? p_('Lip-care traditions', n.care.join(', ')) : ''}${n.heritage.map(h => p_(h.product, h.story)).join('')}${n.brands.map(b => p_(b.name, `${b.founder}, founded ${b.founded}${b.heroProducts?.length ? `. Known for ${b.heroProducts.join(', ')}` : ''}.`)).join('')}`),
    ].join('');
  }

  async function replan() {
    const seq = ++cl.seq;
    try {
      const plan = await api('/api/colour/plan', cl.choices);
      if (seq !== cl.seq) return;
      cl.plan = plan;
      renderPlan();
    } catch (e) {
      $('clPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openStudio() {
    try {
      if (!cl.options) cl.options = await api('/api/colour/options');
      if (!cl.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? cl.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : cl.options.tones[6];
        cl.choices = { fitzpatrick: 'V', undertone: 'warm', formula: 'harmony', look: 'nude', finish: 'satin', liner: 'basic_liner', care: 'daily', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('clPlan').innerHTML = `<p class="lib-note">The Colour &amp; Lip Studio could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { clFitz: 'fitzpatrick', clUndertone: 'undertone', clFormula: 'formula', clLook: 'look', clFinish: 'finish', clLiner: 'liner', clCare: 'care', clCommunity: 'community', clTone: 'tone' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !cl.choices) return;
    cl.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view="colour"], [data-open-colour]');
    if (!t) return;
    if (t.dataset.openColour !== undefined) { document.querySelector('.nav-link[data-view="colour"]')?.click(); return; }
    openStudio();
  });
})();
