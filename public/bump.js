/**
 * Pregnancy & Postpartum view. Pick your stage, a concern, an ingredient or treatment to check,
 * Fitzpatrick type, community and a tone; the server answers from the pregnancy and postpartum
 * guides and this view draws a figure at your stage with the concern marked, and a verdict
 * light for the ingredient at every stage. The figure is a clothed photographic portrait per stage
 * (studio-photo.js); with no plate, the drawing renders.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const bp = { options: null, plan: null, choices: null, seq: 0 };
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
  const VERDICT = { ok: ['#2a9d8f', 'OK at this stage'], caution: ['#e9c46a', 'Use with care'], avoid: ['#e76f51', 'Avoid at this stage'], ask: ['#8d99ae', 'No rule: ask'] };

  // ---- Figure at your stage, with the concern marked ---------------------------------------------
  function figurePanel(p) {
    const skin = p.tone.hex; const deep = lum(skin) < 0.18; const c = p.choices;
    const ink = deep ? mix(skin, '#ffffff', 0.72) : mix(skin, '#000000', 0.5);
    const belly = { t1: 6, t2: 22, t3: 38, bf: 14, pp: 14 }[c.stage];
    const hair = '#1d1412'; const dress = '#5c6bc0';
    const thick = p.stage.pregnant && c.concern === 'hair';
    const bx = 119; const by = 178; const rx = 20 + belly * 0.55; const ry = 24 + belly * 0.35;
    const bare = c.concern === 'stretch' || c.concern === 'itch';
    const marks = {
      melasma: `<g stroke="${ink}" stroke-width="1.4" stroke-dasharray="3 2" fill="${mix(skin, '#000000', 0.28)}"><ellipse cx="106" cy="66" rx="7" ry="5"/><ellipse cx="132" cy="66" rx="7" ry="5"/><ellipse cx="119" cy="50" rx="9" ry="3"/></g>`,
      acne: `<g fill="${mix(skin, '#8b0000', 0.45)}" stroke="${ink}" stroke-width="0.8">${[[104, 70], [110, 74], [134, 72], [128, 78], [118, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join('')}</g>`,
      stretch: `<g stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round">${[-1, 1].map(side => [0, 1, 2].map(i => `<path d="M${bx + side * (rx - 4 - i * 3)},${by - 12 + i * 11} q${-side * 6},4 ${-side * 12},3"/>`).join('')).join('')}</g>`,
      hair: p.stage.pregnant ? '' : `<g stroke="${hair}" stroke-width="1.4" fill="none">${[0, 1, 2, 3, 4].map(i => `<path d="M${70 + i * 9},${284 - (i % 2) * 6} q5,-6 10,0"/>`).join('')}</g><g stroke="#f5f5f5" stroke-width="0.6" fill="none">${[0, 1, 2, 3, 4].map(i => `<path d="M${70 + i * 9},${284 - (i % 2) * 6} q5,-6 10,0"/>`).join('')}</g>`,
      itch: `<g stroke="${ink}" stroke-width="1.6">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${bx - 12 + (i % 3) * 10},${by - 8 + Math.floor(i / 3) * 14} l4,-4 M${bx - 10 + (i % 3) * 10},${by - 6 + Math.floor(i / 3) * 14} l4,-4"/>`).join('')}</g>`,
    }[c.concern];
    const baby = c.stage === 'bf' ? `<ellipse cx="146" cy="138" rx="16" ry="12" fill="#f3e5f5" stroke="${ink}" stroke-width="1"/><circle cx="156" cy="132" r="8" fill="${mix(skin, '#ffffff', 0.15)}" stroke="${ink}" stroke-width="1"/>` : '';
    const drawing = `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Figure at your stage">
      <rect width="240" height="300" rx="14" fill="#141a26"/>
      <path d="M${thick ? 86 : 92},70 Q${thick ? 84 : 90},${thick ? 20 : 26} 120,${thick ? 20 : 26} Q${thick ? 156 : 150},${thick ? 20 : 26} ${thick ? 154 : 148},70 L${thick ? 160 : 152},${thick ? 120 : 104} L${thick ? 80 : 88},${thick ? 120 : 104} Z" fill="${hair}"/>
      <ellipse cx="119" cy="64" rx="26" ry="31" fill="${skin}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M108,62 q4,3 8,0 M124,62 q4,3 8,0" stroke="${ink}" stroke-width="1.8" fill="none"/><path d="M112,82 q7,4 14,0" stroke="${ink}" stroke-width="1.8" fill="none"/>
      <rect x="111" y="93" width="16" height="14" fill="${skin}"/>
      <path d="M86,110 Q119,98 152,110 L${150 + belly * 0.5},165 Q${156 + belly * 0.6},200 146,222 L150,280 L88,280 L92,222 Q${82 - belly * 0.6},200 ${88 - belly * 0.5},165 Z" fill="${dress}" stroke="#c5cae9" stroke-width="1"/>
      <ellipse cx="${bx}" cy="${by}" rx="${rx}" ry="${ry}" fill="${bare ? skin : mix(dress, '#ffffff', 0.12)}" stroke="${bare ? ink : '#c5cae9'}" stroke-width="1.2"/>
      ${baby}${marks}</svg>
      <figcaption><strong>${esc(p.stage.label)}</strong><span>${esc(p.concern.title)} · Type ${esc(p.melasma.type)}</span></figcaption></figure>`;
    if (!window.StudioPhoto) return drawing;
    return window.StudioPhoto.panel({ studio: 'bump', id: p.choices.stage, fallback: drawing, w: 720, h: 960, alt: `${p.stage.label}: portrait`, caption: `<strong>${esc(p.stage.label)}</strong><span>${esc(p.concern.title)} · Type ${esc(p.melasma.type)}</span>` });
  }

  // ---- Verdict light for the ingredient, at every stage ------------------------------------------
  function verdictPanel(p) {
    const k = p.check; const [col, word] = VERDICT[k.verdict];
    const all = [{ stage: p.choices.stage, verdict: k.verdict }, ...k.otherStages].sort((a, b) => ['t1', 't2', 't3', 'bf', 'pp'].indexOf(a.stage) - ['t1', 't2', 't3', 'bf', 'pp'].indexOf(b.stage));
    const names = { t1: '1st', t2: '2nd', t3: '3rd', bf: 'Feeding', pp: 'After' };
    const row = all.map((s, i) => `<circle cx="${32 + i * 44}" cy="226" r="${s.stage === p.choices.stage ? 15 : 11}" fill="${VERDICT[s.verdict][0]}" stroke="${s.stage === p.choices.stage ? '#fff' : 'none'}" stroke-width="3"/><text x="${32 + i * 44}" y="258" text-anchor="middle" font-size="10" fill="#f5f5f5">${names[s.stage]}</text>`).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Ingredient verdict">
      <rect width="240" height="300" rx="14" fill="#141414"/>
      <circle cx="120" cy="96" r="58" fill="${col}"/><text x="120" y="92" text-anchor="middle" font-size="15" font-weight="700" fill="#141414">${esc(word.split(' ')[0])}</text><text x="120" y="112" text-anchor="middle" font-size="11" fill="#141414">${esc(word.split(' ').slice(1).join(' '))}</text>
      <text x="120" y="184" text-anchor="middle" font-size="11" fill="#f5f5f5">${esc(k.label.slice(0, 40))}</text>
      ${row}</svg>
      <figcaption><strong>${esc(word)}</strong><span>Every stage, left to right</span></figcaption></figure>`;
  }

  function select(id, text, values, current) {
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = bp.options; const c = bp.choices;
    $('bpControls').innerHTML = `
      ${select('bpStage', 'Stage', o.stages, c.stage)}
      ${select('bpConcern', 'Concern', o.concerns, c.concern)}
      ${select('bpIngredient', 'Check an ingredient or treatment', o.ingredients, c.ingredient)}
      ${select('bpFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('bpCommunity', 'Community', o.communities, c.community)}
      ${select('bpTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  function communityCard(p) {
    const cn = p.communityNotes;
    if (cn.kind === 'pregnancy') {
      return card(`${p.community.label} pregnancy traditions`, `<p>${esc(cn.philosophy)}</p><p><strong>Watch out for</strong></p><ul>${cn.avoid.map(a => `<li><strong>${esc(a.ingredient)}</strong>: ${esc(a.reason)}</li>`).join('')}</ul><p><strong>Safer swaps</strong></p><ul>${cn.safeAlternatives.map(a => `<li><strong>${esc(a.ingredient)}</strong>: ${esc(a.benefit)}</li>`).join('')}</ul>${cn.notes ? `<p class="lib-note">${esc(cn.notes)}</p>` : ''}<details><summary>Rituals, foods and a glow recipe</summary>${cn.rituals.map(r => `<p><strong>${esc(r.name)}</strong>${r.description ? `<br>${esc(r.description)}` : ''}${r.safetyNote ? `<br><em>${esc(r.safetyNote)}</em>` : ''}</p>`).join('')}<p><strong>Foods</strong></p>${ul(cn.foods)}<p><strong>Stretch-mark traditions</strong></p>${ul(cn.stretchMarks.traditional)}<p><strong>Hair</strong></p>${ul(cn.hair)}<p><strong>${esc(cn.recipe.name)}</strong> (${esc(cn.recipe.origin)})</p>${ul(cn.recipe.ingredients)}<p>${esc(cn.recipe.method)}</p><p class="lib-note">${esc(cn.recipe.safetyNote)}</p></details>`);
    }
    return card(`${p.community.label} postpartum traditions`, `${cn.philosophy ? `<p>${esc(cn.philosophy)}</p>` : ''}<details open><summary>Practices</summary>${cn.practices.map(x => `<p><strong>${esc(x.title)}</strong>${x.text ? `<br>${esc(x.text)}` : ''}</p>${ul(x.items)}`).join('')}</details><p class="lib-note">Traditions are shared as culture, not medical advice; ask your midwife about any herb you take by mouth.</p>`);
  }
  function renderPlan() {
    const p = bp.plan; const k = p.check; const cp = p.concern; const s = p.stageNotes; const m = p.melasma;
    $('bpPreview').innerHTML = figurePanel(p) + verdictPanel(p);
    $('bpSummary').innerHTML = `<p class="hl-big">${esc(k.label)}: ${esc(VERDICT[k.verdict][1].toLowerCase())} (${esc(p.stage.label.toLowerCase())})</p><p>${esc(k.text)}</p>`;
    $('bpPlan').innerHTML = [
      card(cp.title, `<p>${esc(cp.about)}</p>${cp.cause ? `<p>${esc(cp.cause)}</p>` : ''}<p><strong>What you can do now</strong></p>${ul(cp.doNow)}${cp.notNow.length ? `<p><strong>Not now</strong></p>${ul(cp.notNow)}` : ''}${cp.later ? `<p><strong>Later:</strong> ${esc(cp.later)}</p>` : ''}${cp.expectations ? `<p class="lib-note">${esc(cp.expectations)}</p>` : ''}${cp.texturedHair ? `<p>${esc(cp.texturedHair)}</p>` : ''}${cp.seeDoctor ? `<p><strong>See your doctor or midwife</strong></p>${ul(cp.seeDoctor)}` : ''}`),
      card(`Melasma and your skin (Type ${m.type})`, `<p>${esc(m.note)}</p>${m.deeperSkin ? `<p><strong>On deeper skin</strong></p>${ul(m.deeperSkin.concerns)}<p><strong>What helps</strong></p>${ul(m.deeperSkin.strategies)}` : ''}`, m.higher ? ' hl-warn' : ''),
      card(`This stage (${s.weeks})`, `<p>${esc(s.focus)}</p><p><strong>What happens</strong></p>${ul(s.whatHappens)}<p><strong>Tips</strong></p>${ul(s.tips)}<details><summary>Skin changes</summary>${ul(s.skinChanges)}</details>`),
      communityCard(p),
      `<p class="lib-disclaimer">${esc(p.disclaimer)}</p>`,
    ].join('');
  }

  async function replan() {
    const seq = ++bp.seq;
    try {
      const plan = await api('/api/bump/plan', bp.choices);
      if (seq !== bp.seq) return;
      bp.plan = plan;
      renderPlan();
    } catch (e) {
      $('bpPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openStudio() {
    try {
      if (!bp.options) bp.options = await api('/api/bump/options');
      if (!bp.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? bp.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : bp.options.tones[6];
        bp.choices = { stage: 't2', concern: 'melasma', ingredient: 'retinoid', fitzpatrick: 'V', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('bpPlan').innerHTML = `<p class="lib-note">The Pregnancy & Postpartum planner could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { bpStage: 'stage', bpConcern: 'concern', bpIngredient: 'ingredient', bpFitz: 'fitzpatrick', bpCommunity: 'community', bpTone: 'tone' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !bp.choices) return;
    bp.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view="bump"], [data-open-bump]');
    if (!t) return;
    if (t.dataset.openBump !== undefined) { document.querySelector('.nav-link[data-view="bump"]')?.click(); return; }
    openStudio();
  });
})();
