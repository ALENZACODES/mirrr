/**
 * Complexion Lab view. Pick what to correct, your Fitzpatrick type, undertone, skin type, coverage,
 * face shape, occasion, community and a skin tone; the server plans correct, base, set and sculpt
 * from the makeup guides and this view draws an illustrated face in that Monk skin tone: one panel
 * with the corrector where the guide puts it, one with contour, highlight and blush placed where
 * the guide says for that face shape. No photo is used.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const cx = { options: null, plan: null, choices: null, seq: 0 };
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

  // ---- Face geometry -----------------------------------------------------------------------------
  // Widths (half-widths from the centre line) at forehead, cheekbone, jaw and chin, with top and chin
  // heights, drawn from the guide's description of each shape (e.g. heart: wide forehead, narrow chin).
  const SHAPES = {
    oval: [66, 80, 60, 22, 40, 262], round: [76, 90, 80, 40, 52, 246], square: [80, 84, 84, 50, 44, 256],
    heart: [88, 82, 54, 12, 42, 262], long: [64, 68, 60, 26, 26, 280], diamond: [54, 88, 58, 16, 40, 262],
  };
  function outline(shape) {
    const [fw, cw, jw, chw, top, chin] = SHAPES[shape] ?? SHAPES.oval;
    const right = [[120 + fw * 0.7, top + 8], [120 + fw, 88], [120 + cw, 142], [120 + jw, 206], [120 + chw, chin - 14]];
    const pts = [[120, top], ...right, [120, chin], ...right.reverse().map(([x, y]) => [240 - x, y])];
    // Closed Catmull-Rom spline through the points.
    let d = `M${pts[0].join(',')}`;
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return { d: d + 'Z', fw, cw, jw, chw, top, chin };
  }
  const pair = (dx, y, rx, ry, rot, fill, op) => [-1, 1].map(s => `<ellipse cx="${120 + s * dx}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${s * rot} ${120 + s * dx} ${y})" fill="${fill}" opacity="${op}"/>`).join('');
  const one = (x, y, rx, ry, fill, op) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${op}"/>`;
  /** Where each named zone sits on this face; contour and highlight read "forehead", "chin" and "nose" differently. */
  function zone(z, g, layer, fill, op) {
    const hi = layer === 'highlight';
    switch (z) {
      case 'cheekHollow': return pair(g.cw - 26, 168, 24, 7, -22, fill, op);
      case 'temples': return pair(g.fw - 10, 92, 10, 20, 0, fill, op);
      case 'hairline': return one(120, g.top + 12, g.fw * 0.7, 9, fill, op);
      case 'forehead': return hi ? one(120, g.top + 40, 16, 12, fill, op) : pair(g.fw - 18, g.top + 30, 16, 12, 20, fill, op);
      case 'jaw': return pair(g.jw - 8, 214, 9, 24, -25, fill, op);
      case 'underChin': return one(120, g.chin + 2, g.chw + 18, 6, fill, op);
      case 'chin': return hi ? one(120, g.chin - 20, 9, 6, fill, op) : one(120, g.chin - 8, g.chw + 6, 6, fill, op);
      case 'cheekbone': return hi ? pair(g.cw - 30, 140, 18, 5, -20, fill, op) : pair(g.cw - 22, 154, 20, 6, -20, fill, op);
      case 'nose': return hi ? one(120, 142, 3, 22, fill, op) : pair(10, 142, 3, 20, 0, fill, op);
      case 'cupid': return one(120, 197, 7, 3, fill, op);
      case 'browBone': return pair(34, 101, 12, 3, 0, fill, op);
      case 'innerCorner': return pair(19, 120, 3, 3, 0, fill, op);
      case 'underEye': return pair(34, 129, 15, 5, 0, fill, op);
      case 'apples': return pair(46, 162, 14, 12, 0, fill, op);
      default: return '';
    }
  }
  const STROKE = {
    diagonal: (g, f) => pair(g.cw - 28, 146, 26, 9, -30, f, 0.55), horizontal: (g, f) => pair(g.cw - 34, 160, 24, 9, 0, f, 0.55),
    apples: (g, f) => pair(46, 162, 15, 13, 0, f, 0.55), low: (g, f) => pair(g.cw - 30, 172, 20, 8, -10, f, 0.55),
  };
  function features(skin) {
    const line = mix(skin, '#1a0f0a', 0.65);
    return `<g fill="none" stroke="${line}" stroke-width="2" stroke-linecap="round">
      <path d="M70 104 q16 -8 32 -2"/><path d="M138 102 q16 -6 32 2"/>
      <path d="M74 120 q12 -8 24 0 q-12 6 -24 0z" fill="${mix(skin, '#ffffff', 0.5)}"/><path d="M142 120 q12 -8 24 0 q-12 6 -24 0z" fill="${mix(skin, '#ffffff', 0.5)}"/>
      <circle cx="86" cy="119" r="3" fill="${line}"/><circle cx="154" cy="119" r="3" fill="${line}"/>
      <path d="M116 130 q-2 20 -8 28 q12 6 24 0 q-6 -8 -8 -28" stroke-width="1.4"/>
      <path d="M100 200 q20 -10 40 0 q-20 12 -40 0z" fill="${mix(skin, '#7a2c2c', 0.45)}" stroke-width="1"/></g>`;
  }
  function face(title, note, p, layers) {
    const g = outline(p.choices.faceShape);
    const skin = p.tone.hex;
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="${esc(title)}"><defs><filter id="cxBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter><clipPath id="cxClip-${title.toLowerCase()}"><path d="${g.d}"/></clipPath></defs>
      <rect width="240" height="300" rx="14" fill="#141414"/><path d="${g.d}" fill="${skin}" stroke="${mix(skin, '#ffffff', 0.25)}" stroke-width="1.2"/>
      <g clip-path="url(#cxClip-${title.toLowerCase()})" filter="url(#cxBlur)">${layers(g, skin)}</g>${features(skin)}</svg>
      <figcaption><strong>${esc(title)}</strong>${note ? `<span>${esc(note)}</span>` : ''}</figcaption></figure>`;
  }
  function contourColour(p) {
    // The guides: contour is a shadow in your own undertone; cool grey reads ashy on medium-deep skin.
    const cool = p.choices.undertone === 'cool' && ['I', 'II', 'III'].includes(p.choices.fitzpatrick);
    // Deeper tones need a deeper shadow to show at all (the guides: "need significant depth to show up").
    const l = lum(p.tone.hex);
    return mix(p.tone.hex, cool ? '#4a3f3f' : l < 0.03 ? '#0a0402' : '#2b160a', l < 0.03 ? 0.8 : l < 0.08 ? 0.6 : 0.45);
  }
  function correctLayer(p) {
    const c = p.correct;
    if (!c) return () => '';
    const f = c.swatches[0]?.hex ?? '#f4ae86';
    const op = 0.55;
    return g => c.zones.map(z => {
      if (z === 'marks') return [[78, 150], [160, 158], [150, 176], [92, 70], [140, 64], [84, 172]].map(([x, y]) => one(x, y, 6, 6, f, op)).join('');
      if (z === 'redness') return pair(15, 158, 9, 7, 0, f, op) + one(120, g.chin - 18, 10, 6, f, op);
      return zone(z, g, 'correct', f, z === 'underEye' ? op : 0.3);
    }).join('');
  }
  function sculptLayer(p) {
    const s = p.sculpt;
    const contour = contourColour(p);
    const hi = s.highlight.swatch?.hex ?? '#ecd3a8';
    const blush = s.blush.swatch?.hex ?? '#d9798a';
    return g => s.contour.zones.map(z => zone(z, g, 'contour', contour, 0.6)).join('')
      + STROKE[s.blush.stroke](g, blush)
      + s.highlight.zones.map(z => zone(z, g, 'highlight', hi, 0.75)).join('');
  }
  function drawPreview(p) {
    const c = p.correct;
    $('cxPreview').innerHTML = face('Correct', c ? `${c.colour.split(/[.(—]/)[0].trim()} · ${p.tone.label}` : 'Nothing to correct', p, correctLayer(p))
      + face('Sculpt', `${p.sculpt.blush.stroke} blush · ${p.sculpt.highlight.swatch?.word ?? 'soft'} highlight`, p, sculptLayer(p));
  }

  // ---- Controls ---------------------------------------------------------------------------------
  function select(id, label, values, current) {
    return `<label class="st-field"><span>${esc(label)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = cx.options; const c = cx.choices;
    $('cxControls').innerHTML = `
      ${select('cxCorrect', 'Correct', o.correct, c.correct)}
      ${select('cxFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('cxUndertone', 'Undertone', o.undertones, c.undertone)}
      ${select('cxSkin', 'Skin type', o.skinTypes, c.skinType)}
      ${select('cxCoverage', 'Coverage', o.coverage, c.coverage)}
      ${select('cxShape', 'Face shape', o.faceShapes, c.faceShape)}
      ${select('cxOccasion', 'Occasion', o.occasions, c.occasion)}
      ${select('cxCommunity', 'Community', o.communities, c.community)}
      ${select('cxTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  const ul = xs => (xs?.length ? `<ul>${xs.map(li).join('')}</ul>` : '');
  const p_ = (label, text) => (text ? `<p>${label ? `<strong>${esc(label)}:</strong> ` : ''}${esc(text)}</p>` : '');
  function renderPlan() {
    const p = cx.plan; const b = p.base; const s = p.set; const sc = p.sculpt; const c = p.correct;
    drawPreview(p);
    $('cxSummary').innerHTML = `
      <p class="hl-big">${esc(b.formula.type)} · ${esc(b.finish.finish)} · ${esc(b.coverage.level)}</p>
      ${p_('Why this formula', b.formula.why)}${p_('Why this finish', b.finish.why)}`;
    const sw = x => `<span class="cx-swatch" style="background:${esc(x.hex)}" title="${esc(x.word)}"></span>`;
    $('cxPlan').innerHTML = [
      card('Prep for your skin type', `<ol>${p.prep.map(li).join('')}</ol>`),
      c ? card(`Correct: ${c.concern}`, `<p class="cx-colour">${c.swatches.map(sw).join('')} <strong>${esc(c.colour)}</strong></p>${p_('', c.why)}${c.products.length ? p_('Try', c.products.join(' · ')) : ''}${p_('Tip', c.tip)}${p_('', c.deepNote)}${p_(`${p.community.label} tip`, c.communityNote)}`) : '',
      card('Foundation', `${p_('Formula', b.formula.description)}${p_('Careful', b.formula.caution)}${p_('Finish', b.finish.appearance)}${p_('Careful', b.finish.caution)}${p_('Coverage', `${b.coverage.description} ${b.coverage.when ?? ''}`)}${p_('Apply with', b.tool.text)}`),
      card('Your undertone', `${p_('', b.undertone.describe)}${p_('Check it', b.undertone.check)}${p_(`${p.community.label} note`, b.undertone.communityNote)}${p_('Shade tip', b.undertone.tip)}`),
      b.oxidation ? card('Oxidation', `${p_('', b.oxidation.who)}${p_('Test', b.oxidation.prevent)}`, ' hl-warn') : '',
      card('Primer, powder and spray', `${s.primers.map(x => p_(x.type, `${x.what ?? ''}${x.popular.length ? ` Try: ${x.popular.join(', ')}.` : ''}`)).join('')}${p_(s.powder.type, s.powder.text)}${p_('Under the eyes', s.powder.underEye)}${p_('How to set', s.method.text)}${s.spray ? p_(s.spray.type, `${s.spray.what ?? ''}${s.spray.popular.length ? ` Try: ${s.spray.popular.join(', ')}.` : ''}`) : ''}${p_('Sunscreen', s.spfNote)}`),
      s.flashback ? card('Flash photos', `${p_('', s.flashback.why)}${ul(s.flashback.solutions)}${s.flashback.avoid.length ? p_('Avoid', s.flashback.avoid.join('; ')) : ''}`, ' hl-warn') : '',
      s.longwear ? card('Long event in the heat', `${p_('', s.longwear.strategy)}${p_('Extra step', s.longwear.extra)}${ul(s.longwear.kit)}`) : '',
      card(`Sculpt a ${esc(p.choices.faceShape)} face`, `${p_('Goal', sc.goal)}${p_('Contour shade', sc.contour.shade)}${ul(sc.contour.where)}${p_('Highlight', sc.highlight.colour)}${ul(sc.highlight.where)}${p_('Blush', sc.blush.placement)}${p_('Blush colours', sc.blush.work)}${p_('Skip', sc.blush.skip)}${p_('Bronzer', `${sc.bronzer.rule} ${sc.bronzer.shade}`)}${p_('', sc.note)}`),
      card('Tools', `<ul>${p.tools.brushes.map(x => `<li><strong>${esc(x.use)}</strong>${x.type ? ` · ${esc(x.type)}` : ''}${x.technique ? `: ${esc(x.technique)}` : ''}${x.pick ? ` (e.g. ${esc(x.pick)})` : ''}</li>`).join('')}</ul>${p.tools.sponge ? `${p_(p.tools.sponge.name, p.tools.sponge.tip)}${p_('On deeper skin', p.tools.sponge.melanin)}` : ''}`),
      card('Taking it off', `${p_('First cleanse', p.remove.first.what)}${ul(p.remove.first.how)}${p_('', p.remove.first.note)}${p.remove.first.options.length ? p_('Options', p.remove.first.options.join(', ')) : ''}${p_('Second cleanse', p.remove.second)}${p.remove.longwear ? `${ul(p.remove.longwear.technique)}${p_('Common mistake', p.remove.longwear.common_mistake)}` : ''}`),
      card(`${p.community.label} notes`, Object.entries(p.communityNotes).filter(([, v]) => v).map(([k, v]) => p_(k[0].toUpperCase() + k.slice(1), v)).join('')),
    ].join('');
  }

  async function replan() {
    const seq = ++cx.seq;
    try {
      const plan = await api('/api/complexion/plan', cx.choices);
      if (seq !== cx.seq) return;
      cx.plan = plan;
      renderPlan();
    } catch (e) {
      $('cxPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openLab() {
    try {
      if (!cx.options) cx.options = await api('/api/complexion/options');
      if (!cx.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? cx.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : cx.options.tones[6];
        cx.choices = { correct: 'dark_circles', fitzpatrick: 'V', undertone: 'warm', skinType: 'combination', coverage: 'medium', faceShape: 'oval', occasion: 'everyday', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('cxPlan').innerHTML = `<p class="lib-note">The Complexion Lab could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { cxCorrect: 'correct', cxFitz: 'fitzpatrick', cxUndertone: 'undertone', cxSkin: 'skinType', cxCoverage: 'coverage', cxShape: 'faceShape', cxOccasion: 'occasion', cxCommunity: 'community', cxTone: 'tone' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !cx.choices) return;
    cx.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view="complexion"], [data-open-complexion]');
    if (!t) return;
    if (t.dataset.openComplexion !== undefined) { document.querySelector('.nav-link[data-view="complexion"]')?.click(); return; }
    openLab();
  });
})();
