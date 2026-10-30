/**
 * Nails & Scent Studio view. Pick depth, undertone, nail shape, finish, how you wear your nails,
 * a nail-art occasion, a fragrance family, scent occasion, climate, community and a skin tone; the
 * server plans both from the nail and fragrance guides and this view draws a hand with the polish
 * in that shape and finish, and the fragrance pyramid with your family's notes. No photo is used.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const ns = { options: null, plan: null, choices: null, seq: 0, polish: null };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const li = s => `<li>${esc(s)}</li>`;
  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }
  const hexRgb = h => [1, 3, 5].map(i => parseInt(String(h).slice(i, i + 2), 16));
  const rgbHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

  // ---- Hand -----------------------------------------------------------------------------------------
  // Each finger: x of the nail centre, top of the finger, and finger width. Nail length grows with the
  // shape's required length; the tip outline follows the shape.
  const FINGERS = [[52, 92, 26], [86, 60, 28], [120, 50, 28], [154, 62, 27], [190, 128, 24]];
  const LENGTH = { short: 0, medium: 10, long: 22, 'very long': 30 };
  function tipPath(shape, x, top, w, len) {
    const h = w / 2 - 3; const base = top + 34; const tip = top + 6 - len;
    const side = `M${x - h},${base} L${x - h},${tip + 12}`;
    const back = `L${x + h},${base} Z`;
    switch (shape) {
      case 'square': return `${side} L${x - h},${tip} L${x + h},${tip} L${x + h},${tip + 12} ${back}`;
      case 'coffin': return `${side} L${x - h * 0.55},${tip} L${x + h * 0.55},${tip} L${x + h},${tip + 12} ${back}`;
      case 'stiletto': return `${side} Q${x - h},${tip + 2} ${x},${tip - 6} Q${x + h},${tip + 2} ${x + h},${tip + 12} ${back}`;
      case 'almond': return `${side} Q${x - h * 0.9},${tip - 2} ${x},${tip - 3} Q${x + h * 0.9},${tip - 2} ${x + h},${tip + 12} ${back}`;
      case 'flare': return `M${x - h},${base} L${x - h - 5},${tip} L${x + h + 5},${tip} L${x + h},${base} Z`;
      default: return `${side} Q${x - h},${tip - 4} ${x},${tip - 4} Q${x + h},${tip - 4} ${x + h},${tip + 12} ${back}`;
    }
  }
  function handPanel(p) {
    const skin = p.tone.hex; const n = p.nails; const polish = ns.polish ?? n.polish;
    const len = LENGTH[String(n.shape.length ?? '').toLowerCase().replace(/ \(.*$/, '').trim()] ?? (/long/i.test(n.shape.length) ? 22 : 8);
    const fin = n.finish.id;
    const sheen = { chrome: 0.9, metallic: 0.7, duochrome: 0.6, jelly: 0.5, shimmer: 0.45, glitter: 0.4, creme: 0.35, velvet: 0.15, matte: 0 }[fin] ?? 0.3;
    const op = fin === 'jelly' ? 0.75 : 1;
    const line = mix(skin, '#000', 0.35);
    const fingers = FINGERS.map(([x, top, w]) => {
      const d = tipPath(n.shape.id, x, top, w, len);
      const glit = fin === 'glitter' ? [0, 1, 2, 3].map(k => `<circle cx="${x - 5 + (k % 2) * 9}" cy="${top + 12 - len / 2 + k * 6}" r="1.4" fill="#fff" opacity="0.85"/>`).join('') : '';
      const duo = fin === 'duochrome' ? `<path d="${d}" fill="url(#nsDuo)" opacity="0.55"/>` : '';
      return `<rect x="${x - w / 2}" y="${top + 18}" width="${w}" height="${250 - top}" rx="${w / 2}" fill="${skin}" stroke="${line}" stroke-width="1"/>
        <path d="${d}" fill="${polish.hex}" opacity="${op}" stroke="${mix(polish.hex, '#000', 0.3)}" stroke-width="0.8"/>${duo}${glit}
        ${sheen ? `<rect x="${x - 4}" y="${top + 10 - len}" width="3" height="${18 + len * 0.6}" rx="1.5" fill="#fff" opacity="${sheen}"/>` : ''}
`;
    }).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Hand">
      <defs><linearGradient id="nsDuo" x1="0" x2="1"><stop offset="0" stop-color="#5ad1c8"/><stop offset="1" stop-color="#b05ad1"/></linearGradient></defs>
      <rect width="240" height="300" rx="14" fill="#141414"/>
      <path d="M30,300 L30,200 Q30,180 50,180 L210,180 Q222,190 214,214 L200,300 Z" fill="${skin}" stroke="${line}" stroke-width="1"/>${fingers}
      <text x="120" y="290" text-anchor="middle" font-size="12" fill="#f5f5f5">${esc(polish.word)} · ${esc(n.finish.name)}</text></svg>
      <figcaption><strong>${esc(n.shape.name)}</strong><span>${esc(n.wear.label)}</span></figcaption></figure>`;
  }
  function pyramidPanel(p) {
    const s = p.scent;
    const rows = s.pyramid.map((r, i) => {
      const y = 70 + i * 70; const half = 40 + i * 35;
      const mine = r.mine.length ? r.mine.join(', ') : '—';
      return `<path d="M${120 - half},${y + 60} L${120 - half + 20},${y} L${120 + half - 20},${y} L${120 + half},${y + 60} Z" fill="${['#e9c46a', '#e76f51', '#6d4c41'][i]}" opacity="${r.mine.length ? 0.95 : 0.35}"/>
        <text x="120" y="${y + 26}" text-anchor="middle" font-size="11" fill="#111" font-weight="600">${esc(r.name)}</text>
        <text x="120" y="${y + 42}" text-anchor="middle" font-size="10" fill="#111">${esc(mine)}</text>`;
    }).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Fragrance pyramid"><rect width="240" height="300" rx="14" fill="#141414"/>
      <text x="120" y="40" text-anchor="middle" font-size="13" fill="#f5f5f5">${esc(s.family.name)} · ${esc(s.concentration.name.replace(/ \(.*/, ''))}</text>${rows}</svg>
      <figcaption><strong>${esc(s.family.name)}</strong><span>${esc(s.concentration.longevity)} · ${esc(p.choices.climate.replace('_', ' and '))}</span></figcaption></figure>`;
  }

  // ---- Controls ---------------------------------------------------------------------------------
  function select(id, label, values, current) {
    return `<label class="st-field"><span>${esc(label)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = ns.options; const c = ns.choices;
    $('nsControls').innerHTML = `
      ${select('nsFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('nsUndertone', 'Undertone', o.undertones, c.undertone)}
      ${select('nsShape', 'Nail shape', o.shapes, c.shape)}
      ${select('nsFinish', 'Finish', o.finishes, c.finish)}
      ${select('nsWear', 'How you wear them', o.wear, c.wear)}
      ${select('nsArt', 'Nail art for', o.nailOccasions, c.nailOccasion)}
      ${select('nsFamily', 'Fragrance family', o.families, c.family)}
      ${select('nsScentOcc', 'Scent occasion', o.scentOccasions, c.scentOccasion)}
      ${select('nsClimate', 'Climate', o.climates, c.climate)}
      ${select('nsCommunity', 'Community', o.communities, c.community)}
      ${select('nsTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  const ul = xs => (xs?.length ? `<ul>${xs.map(li).join('')}</ul>` : '');
  const p_ = (label, text) => (text ? `<p>${label ? `<strong>${esc(label)}:</strong> ` : ''}${esc(text)}</p>` : '');
  const sw = (x, on) => `<button type="button" class="cx-swatch ns-pick${on ? ' ns-on' : ''}" style="background:${esc(x.hex)}" title="${esc(x.line ?? x.word)}" data-ns-polish="${esc(x.word)}" data-hex="${esc(x.hex)}" aria-label="${esc(x.word)}"></button>`;
  function renderPlan() {
    const p = ns.plan; const n = p.nails; const c = n.colours; const w = n.wear; const s = p.scent; const cn = p.communityNotes;
    const polish = ns.polish ?? n.polish;
    $('nsPreview').innerHTML = handPanel(p) + pyramidPanel(p);
    $('nsSummary').innerHTML = `<p class="hl-big">${esc(polish.word)} ${esc(n.shape.name.toLowerCase())} nails · ${esc(n.finish.name)} · ${esc(s.family.name)} ${esc(s.concentration.name)}</p>${p_('', c.tip)}`;
    const group = (t, xs) => (xs.length ? `<p><strong>${esc(t)}:</strong> ${xs.map(x => sw(x, x.word === polish.word)).join('')}</p>` : '');
    $('nsPlan').innerHTML = [
      card(`Polish for ${c.skin}`, `${group('Everyday', c.everyday)}${group('Statement', c.statement)}${group('Dark', c.dark)}${group('Also flattering', c.flattering)}<p class="lib-note">Tap a swatch to try it on the hand.</p>${p_('Metallics', c.metallics)}${c.avoid.length ? p_('Can look muddy or vanish', c.avoid.join('; ')) : ''}${c.skipped.length ? p_(`Left out for a ${p.choices.undertone} undertone`, c.skipped.join('; ')) : ''}${p_('Undertone', c.undertone)}`),
      card(`Shape: ${n.shape.name}`, `${p_('', n.shape.description)}${p_('Length', n.shape.length)}${p_('Best for', n.shape.bestFor)}${p_('Tip', n.shape.tip)}`),
      w.lengthWarning ? card('Length', p_('', w.lengthWarning), ' hl-warn') : '',
      card(`Finish: ${n.finish.name}`, `${p_('', n.finish.description)}${p_('Best for', n.finish.bestFor)}${p_('At home', n.finish.atHome)}`),
      card(w.label, `${p_('', w.what)}${w.pros.length ? p_('Good', w.pros.join('; ')) : ''}${w.cons.length ? p_('Watch', w.cons.join('; ')) : ''}${ul(w.tips)}${p_('', w.note)}${w.removal ? `<p><strong>Taking them off safely</strong></p><ol>${w.removal.steps.map(li).join('')}</ol>${p_('', w.removal.note)}` : ''}${p_('Removal', w.hardGelRemoval)}`),
      card(`Nail art: ${n.art.name}`, `${p_('', n.art.description)}${n.art.colours.length ? p_('Colours', n.art.colours.join('; ')) : ''}${n.art.techniques.length ? p_('Tools', n.art.techniques.join(', ')) : ''}${n.art.occasions.length ? p_('For', n.art.occasions.join(', ')) : ''}${p_('', n.art.context)}`),
      card('Cuticles', `${p_('When', n.cuticles.routine.when)}${p_('How', n.cuticles.routine.how)}${n.cuticles.routine.ingredients_to_look_for ? p_('Look for', n.cuticles.routine.ingredients_to_look_for.join(', ')) : ''}${p_('On deeper skin', typeof n.cuticles.deepSkin === 'string' ? n.cuticles.deepSkin : n.cuticles.deepSkin ? Object.values(n.cuticles.deepSkin).filter(v => typeof v === 'string').join(' ') : null)}`),
      card('Dark streaks in a nail', `${p_('', n.streaks.normal)}<p><strong>See a doctor if:</strong></p>${ul(n.streaks.seeADoctor)}`, ' hl-warn'),
      card(`${s.family.name} fragrance`, `${p_('', s.family.character)}${p_('Notes', s.family.notes.join(', '))}${p_('Lasts', s.family.longevity)}${p_('Best for', s.family.bestFor)}`),
      card(`For ${p.choices.scentOccasion}: ${s.concentration.name}`, `${p_('Strength', s.concentration.strength)}${p_('Lasts', s.concentration.longevity)}${p_('', s.concentration.character)}${p_('How', s.concentration.how)}${s.concentration.alcoholFree ? p_('', 'Alcohol-free.') : ''}`),
      card('Your climate', `${p_('', s.climate)}${p_('', s.amount)}`),
      card('Applying it', `<ol>${s.prep.map(li).join('')}</ol>${p_('Pulse points', s.pulsePoints.join(', '))}${s.layering.length ? `<p><strong>Layer it</strong></p>${ul(s.layering.map(x => `${x.a} + ${x.b}: ${x.result}`))}` : ''}`),
      card(`${p.community.label} notes`, `${p_('Nails', cn.nails)}${cn.nailStyles.length ? p_('Nail art', cn.nailStyles.join(', ')) : ''}${cn.scent ? `${p_('Scents', cn.scent.signature.join(', '))}${p_('Style', cn.scent.style)}${p_('', cn.scent.note)}` : ''}${cn.gifting ? `${p_('Fragrance gifts for', cn.gifting.occasions.join(', '))}${ul(cn.gifting.gifts)}` : ''}`),
    ].join('');
  }

  async function replan() {
    const seq = ++ns.seq;
    try {
      const plan = await api('/api/nails/plan', ns.choices);
      if (seq !== ns.seq) return;
      ns.plan = plan; ns.polish = null;
      renderPlan();
    } catch (e) {
      $('nsPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openStudio() {
    try {
      if (!ns.options) ns.options = await api('/api/nails/options');
      if (!ns.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? ns.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : ns.options.tones[6];
        ns.choices = { fitzpatrick: 'V', undertone: 'warm', shape: 'oval', finish: 'creme', wear: 'natural', nailOccasion: 'minimal', family: 'woody', scentOccasion: 'office', climate: 'hot_humid', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('nsPlan').innerHTML = `<p class="lib-note">The Nails &amp; Scent Studio could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { nsFitz: 'fitzpatrick', nsUndertone: 'undertone', nsShape: 'shape', nsFinish: 'finish', nsWear: 'wear', nsArt: 'nailOccasion', nsFamily: 'family', nsScentOcc: 'scentOccasion', nsClimate: 'climate', nsCommunity: 'community', nsTone: 'tone' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !ns.choices) return;
    ns.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('click', e => {
    const sw = e.target.closest('[data-ns-polish]');
    if (sw && ns.plan) { ns.polish = { word: sw.dataset.nsPolish, hex: sw.dataset.hex }; renderPlan(); return; }
    const t = e.target.closest('[data-view="nails"], [data-open-nails]');
    if (!t) return;
    if (t.dataset.openNails !== undefined) { document.querySelector('.nav-link[data-view="nails"]')?.click(); return; }
    openStudio();
  });
})();
