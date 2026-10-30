/**
 * Routine Builder view. You pick your own skin type, undertone, how your skin feels, your main concern,
 * climate, number of steps, pregnancy and an optional heritage; the server builds a morning and night
 * routine from the audited ingredient guide. This view draws your shelf (morning and night bottles),
 * your week (which nights the strong active goes on) and a face in the tone you pick showing your
 * concern, skin feel, climate, sun type and undertone. The face is an illustration, never your photo.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const rt = { options: null, plan: null, choices: null, seq: 0 };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ul = a => (a && a.length ? `<ul>${a.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : '');
  const card = (title, body) => (body ? `<article class="st-card"><h4>${esc(title)}</h4>${body}</article>` : '');
  const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }
  const hexRgb = h => { const s = String(h).replace('#', ''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16)); };
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const shade = (h, t) => { const c = hexRgb(h).map(v => Math.max(0, Math.min(255, Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t)))); return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`; };

  // ---- Panel 1: the shelf ---------------------------------------------------------------------------
  function bottle(b, x, y, colours, i, n) {
    const max = n <= 3 ? 16 : n === 4 ? 12 : 9;
    const col = colours[b.category] ?? '#adb5bd';
    const tall = b.category === 'sunscreen' ? 'M-9,0 L-9,-44 Q-9,-50 -3,-52 L3,-52 Q9,-50 9,-44 L9,0 Z' : b.category === 'cleanser' ? 'M-11,0 L-11,-36 L11,-36 L11,0 Z M-3,-36 L-3,-46 L3,-46 L3,-36' : 'M-7,0 L-7,-34 Q-7,-40 0,-42 Q7,-40 7,-34 L7,0 Z M-2,-42 L-2,-50 L2,-50 L2,-42';
    const ring = b.swap ? `<rect x="-14" y="-56" width="28" height="60" rx="5" fill="none" stroke="#ffd166" stroke-width="1.6" stroke-dasharray="4 3"/>` : '';
    return `<g transform="translate(${x},${y})"><path d="${tall}" fill="${col}" stroke="#14141f" stroke-width="1"/>${ring}<text x="0" y="-16" text-anchor="middle" font-size="9" font-weight="700" fill="#14141f">${i + 1}</text>
      <text x="0" y="13" text-anchor="middle" font-size="6.6" fill="#e9ecef">${esc(clip(b.label, max))}</text></g>`;
  }
  function shelfPanel(p) {
    const pic = p.picture; const W = 240;
    const row = (list, y) => list.map((b, i) => bottle(b, (W / (list.length + 1)) * (i + 1), y, pic.colours, i, list.length)).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Your morning and night bottles in order">
      <rect width="240" height="300" rx="14" fill="#1b1b2f"/>
      <text x="14" y="24" font-size="11" font-weight="700" fill="#ffd166">Morning · ${pic.am.length} steps</text>
      <rect x="10" y="102" width="220" height="5" rx="2" fill="#6c584c"/>${row(pic.am, 100)}
      <text x="14" y="160" font-size="11" font-weight="700" fill="#a2d2ff">Night · ${pic.pm.length} steps</text>
      <rect x="10" y="238" width="220" height="5" rx="2" fill="#6c584c"/>${row(pic.pm, 236)}
      <text x="120" y="284" text-anchor="middle" font-size="8" fill="#c9c9c9">${p.heritage ? `dashed gold = ${esc(clip(p.heritage.label, 30))} swap` : 'colour = what each step does'}</text></svg>
      <figcaption><strong>Your shelf</strong><span>${esc(p.choices.steps)}-step plan, in order</span></figcaption></figure>`;
  }

  // ---- Panel 2: the week ----------------------------------------------------------------------------
  function weekPanel(p) {
    const pmTreat = p.picture.pm.find((b, i) => p.night[i].slot === 'pm-treat');
    const col = pmTreat ? p.picture.colours[pmTreat.category] ?? '#adb5bd' : '#adb5bd';
    const cells = p.week.map((w, i) => {
      const x = 14 + i * 31;
      const fill = w.active ? col : '#2b2d42';
      const extra = w.extra ? `<circle cx="${x + 13}" cy="196" r="7" fill="#f28482"/><text x="${x + 13}" y="199" text-anchor="middle" font-size="8" font-weight="700" fill="#14141f">+</text>` : '';
      return `<rect x="${x}" y="70" width="26" height="110" rx="6" fill="${fill}" stroke="#495057"/><text x="${x + 13}" y="62" text-anchor="middle" font-size="9" fill="#e9ecef">${w.day}</text>
        <text x="${x + 13}" y="130" text-anchor="middle" font-size="8" font-weight="700" fill="${w.active ? '#14141f' : '#adb5bd'}" transform="rotate(-90 ${x + 13} 130)">${w.active ? esc(clip(w.active, 16)) : 'rest'}</text>${extra}`;
    }).join('');
    const n = p.week.filter(w => w.active).length;
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Which nights the treatment goes on">
      <rect width="240" height="300" rx="14" fill="#1b1b2f"/>
      <text x="120" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="#fefae0">Your week of nights</text>
      <text x="120" y="44" text-anchor="middle" font-size="8" fill="#c9c9c9">${n === 7 ? 'treatment every night' : `treatment ${n} night${n === 1 ? '' : 's'}, rest the others`}</text>
      ${cells}
      <text x="120" y="226" text-anchor="middle" font-size="8" fill="#f28482">${p.week.some(w => w.extra) ? '+ = ' + esc(clip(p.week.filter(w => w.extra).map(w => `${w.day}: ${w.extra}`).join(' · '), 52)) : 'no extra weekly step'}</text>
      <text x="120" y="252" text-anchor="middle" font-size="8" fill="#ffd166">${esc(clip(p.pace, 60))}</text>
      <text x="120" y="268" text-anchor="middle" font-size="8" fill="#ffd166">${esc(clip(p.pace.slice(59), 60))}</text></svg>
      <figcaption><strong>Pacing</strong><span>${esc(p.type.label)}</span></figcaption></figure>`;
  }

  // ---- Panel 3: the face ----------------------------------------------------------------------------
  const ZONES = {
    cheeks: '<ellipse cx="86" cy="150" rx="22" ry="16"/><ellipse cx="154" cy="150" rx="22" ry="16"/>',
    upper: '<ellipse cx="120" cy="82" rx="44" ry="16"/><ellipse cx="88" cy="134" rx="18" ry="12"/><ellipse cx="152" cy="134" rx="18" ry="12"/>',
    jaw: '<path d="M70,180 Q120,240 170,180"/>',
    tzone: '<path d="M80,84 L160,84 L160,98 L130,98 L130,160 L110,160 L110,98 L80,98 Z"/>',
    eyes: '<ellipse cx="96" cy="118" rx="22" ry="10"/><ellipse cx="144" cy="118" rx="22" ry="10"/>',
    whole: '<ellipse cx="120" cy="136" rx="62" ry="88"/>',
  };
  const CLIMATE = {
    humid: '<g fill="#4cc9f0"><path d="M206,30 q6,10 0,14 q-6,-4 0,-14Z"/><path d="M220,40 q5,8 0,11 q-5,-3 0,-11Z"/></g>',
    dry: '<circle cx="212" cy="36" r="10" fill="#ffb703"/><g stroke="#ffb703" stroke-width="2">' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="${212 + 13 * Math.cos(a * Math.PI / 180)}" y1="${36 + 13 * Math.sin(a * Math.PI / 180)}" x2="${212 + 17 * Math.cos(a * Math.PI / 180)}" y2="${36 + 17 * Math.sin(a * Math.PI / 180)}"/>`).join('') + '</g>',
    temperate: '<path d="M200,40 q2,-12 14,-10 q8,-8 16,2 q8,2 4,10 Z" fill="#dee2e6"/>',
    cold: '<g stroke="#caf0f8" stroke-width="2">' + [0, 60, 120].map(a => `<line x1="${212 - 12 * Math.cos(a * Math.PI / 180)}" y1="${36 - 12 * Math.sin(a * Math.PI / 180)}" x2="${212 + 12 * Math.cos(a * Math.PI / 180)}" y2="${36 + 12 * Math.sin(a * Math.PI / 180)}"/>`).join('') + '</g>',
  };
  function feelLayer(feel, skin) {
    const shine = (n) => Array.from({ length: n }, (_, i) => `<ellipse cx="${112 + (i % 3) * 8}" cy="${88 + Math.floor(i / 3) * 22}" rx="3" ry="2" fill="#fff" opacity="0.55"/>`).join('');
    if (feel === 'oily') return shine(9) + '<ellipse cx="86" cy="146" rx="4" ry="2.5" fill="#fff" opacity="0.45"/><ellipse cx="154" cy="146" rx="4" ry="2.5" fill="#fff" opacity="0.45"/>';
    if (feel === 'combination') return shine(6);
    if (feel === 'dry') return [0, 1, 2, 3, 4, 5].map(i => `<path d="M${76 + (i % 3) * 8 + (i > 2 ? 64 : 0)},${144 + (i % 2) * 8} l5,2" stroke="${shade(skin, 0.45)}" stroke-width="1.2"/>`).join('');
    if (feel === 'sensitive') return '<ellipse cx="86" cy="150" rx="18" ry="12" fill="#e5383b" opacity="0.35"/><ellipse cx="154" cy="150" rx="18" ry="12" fill="#e5383b" opacity="0.35"/><ellipse cx="120" cy="150" rx="6" ry="5" fill="#e5383b" opacity="0.3"/>';
    return '';
  }
  function facePanel(p) {
    const pic = p.picture; const skin = pic.skin;
    const burn = ['I', 'II', 'III', 'IV', 'V', 'VI'].map((t, i) => `<rect x="${42 + i * 26}" y="252" width="22" height="10" rx="3" fill="${i === pic.burn ? '#ffd166' : '#495057'}"/><text x="${53 + i * 26}" y="272" text-anchor="middle" font-size="7" fill="${i === pic.burn ? '#ffd166' : '#adb5bd'}">${t}</text>`).join('');
    const ut = pic.undertone ? `<circle cx="28" cy="36" r="12" fill="${pic.undertone}" stroke="#fefae0" stroke-width="2"/><text x="28" y="58" text-anchor="middle" font-size="7" fill="#fefae0">undertone</text>` : '<circle cx="28" cy="36" r="12" fill="none" stroke="#fefae0" stroke-width="2" stroke-dasharray="3 3"/><text x="28" y="40" text-anchor="middle" font-size="11" fill="#fefae0">?</text><text x="28" y="58" text-anchor="middle" font-size="7" fill="#fefae0">undertone</text>';
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="A face in your tone showing your concern, skin feel and climate">
      <rect width="240" height="300" rx="14" fill="#1b1b2f"/>${CLIMATE[pic.climate] ?? ''}${ut}
      <path d="M92,214 L92,236 Q120,246 148,236 L148,214 Z" fill="${shade(skin, -0.08)}"/>
      <path d="M52,70 Q120,4 188,70 L196,150 Q190,70 120,52 Q50,70 44,150 Z" fill="#2b1b14"/>
      <ellipse cx="120" cy="136" rx="66" ry="92" fill="${skin}"/>
      ${feelLayer(pic.feel, skin)}
      <path d="M78,104 Q96,94 112,100 M128,100 Q144,94 162,104" stroke="#2b1b14" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="96" cy="118" rx="10" ry="5" fill="#fbf7f2"/><circle cx="96" cy="118" r="3.6" fill="#3b2418"/>
      <ellipse cx="144" cy="118" rx="10" ry="5" fill="#fbf7f2"/><circle cx="144" cy="118" r="3.6" fill="#3b2418"/>
      <path d="M120,130 q-6,12 -2,18 q2,2 4,0" stroke="${shade(skin, -0.3)}" stroke-width="1.6" fill="none"/>
      <path d="M104,176 Q120,186 136,176" stroke="${shade(skin, -0.4)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g fill="none" stroke="#ffd166" stroke-width="2.4" stroke-dasharray="6 4">${ZONES[pic.zone] ?? ''}</g>
      <text x="120" y="248" text-anchor="middle" font-size="8" fill="#c9c9c9">how your skin reacts to sun (your pick)</text>${burn}
      <text x="120" y="290" text-anchor="middle" font-size="8" fill="#ffd166">${esc(clip(p.concern.label, 46))}</text></svg>
      <figcaption><strong>${esc(p.tone.label)}</strong><span>${esc(p.undertone.label)} · ${esc(p.choices.feel)} · ${esc(p.choices.climate)}</span></figcaption></figure>`;
  }

  const stepList = list => `<ol>${list.map(s => `<li><strong>${esc(s.label)}</strong>${s.ingredient && s.ingredient.strength ? ` <span class="lib-note">(${esc(s.ingredient.strength)})</span>` : ''}: ${esc(s.why)}${s.ingredient && s.ingredient.note && !s.swap ? `<br><span class="lib-note">${esc(s.ingredient.note)}</span>` : ''}</li>`).join('')}</ol>`;
  function renderPlan() {
    const p = rt.plan;
    $('rtPreview').innerHTML = shelfPanel(p) + weekPanel(p) + facePanel(p);
    $('rtSummary').innerHTML = `<p class="hl-big">${esc(p.type.label)}</p><p>${esc(p.message)}</p>`;
    const u = p.undertone; const h = p.heritage;
    $('rtPlan').innerHTML = [
      card('Morning', stepList(p.morning)),
      card('Night', stepList(p.night) + `<p class="lib-note">${esc(p.pace)}</p>`),
      card('Keep in mind', ul([...p.clashes, ...p.notes])),
      card(`Sun: type ${p.type.id}`, `<p>${esc(p.type.burns)}. ${esc(p.type.notes)}</p><p>${esc(p.type.sun)}</p>`),
      card(`Undertone: ${u.label}`, u.id === 'unsure' ? `<p>${esc(u.description)}</p>${ul(u.tests)}` : `<p>${esc(u.description)}</p><p class="lib-note">How to check: ${esc(u.check)}</p><p><strong>Makeup that suits it:</strong> ${esc(u.makeup.join(', '))}</p><p><strong>Go easy on:</strong> ${esc(u.avoid.join(', '))}</p><p><strong>Skincare:</strong> ${esc(u.skincare.join('; '))}</p>`),
      h ? card(h.label, `<p><strong>Swap:</strong> ${esc(h.how)}</p><p class="lib-note">${esc(h.swap.note)}</p>${h.weekly.length ? `<p><strong>Weekly rituals:</strong></p>${ul(h.weekly.map(w => `${w.treatment} (${w.frequency}): ${w.benefit}`))}` : ''}<p><strong>Traditional ingredients:</strong> ${esc(h.remedies.join(', '))}</p>${h.note ? `<p><em>${esc(h.note)}</em></p>` : ''}`) : card('Heritage swaps', '<p>Pick a heritage to see traditional ingredients and rituals that can stand in for a step. It never changes your skin type.</p>'),
    ].join('');
  }
  // Nothing is pre-selected: every dropdown opens on a disabled "Choose…" and shows a value only once
  // picked here. Until the first pick the studio shows its neutral base (no tint, no plan); after it,
  // fields still on "Choose…" fall back to a suggested value so the plan never sees undefined.
  const PICKED = new Set(); const OWN = new Set();
  const anyPicked = () => [...OWN].some(id => PICKED.has(id));
  function renderBase() {
    ++rt.seq; rt.plan = null;
    const put = (k, h) => { const el = $('rt' + k); if (el) el.innerHTML = h; };
    put('Preview', '');
    put('Summary', '<p class="lib-note choose-first">Choose your options above to see your plan.</p>');
    put('Plan', '');
  }
  function select(id, text, values, current) {
    OWN.add(id);
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}"><option value="" disabled${PICKED.has(id) ? '' : ' selected'}>Choose…</option>${values.map(v => `<option value="${esc(v.id)}"${PICKED.has(id) && String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = rt.options; const c = rt.choices;
    const q = $('rtSearch')?.value ?? ''; const out = $('rtSearchOut')?.innerHTML ?? '';
    $('rtControls').innerHTML = `
      ${select('rtType', 'Your skin type (how it reacts to sun)', o.types, c.type)}
      ${select('rtUndertone', 'Your undertone', o.undertones, c.undertone)}
      ${select('rtFeel', 'How your skin feels', o.feels, c.feel)}
      ${select('rtConcern', 'Main concern', o.concerns, c.concern)}
      ${select('rtClimate', 'Climate', o.climates, c.climate)}
      ${select('rtSteps', 'How many steps', o.steps, c.steps)}
      ${select('rtPregnant', 'Pregnant or breastfeeding?', o.pregnancy, c.pregnant)}
      ${select('rtHeritage', 'Heritage swaps (optional)', o.heritages, c.heritage)}
      ${select('rtTone', 'Skin tone for the picture', o.tones, c.tone)}
      <label class="st-field"><span>Find an ingredient by word</span><input id="rtSearch" type="search" placeholder="e.g. acne, brightening, barrier" maxlength="40" value="${esc(q)}"></label>
      <button type="button" class="btn btn-secondary" id="rtSearchGo">Search</button><div id="rtSearchOut" class="lib-note" aria-live="polite">${out}</div>`;
  }
  async function replan() {
    const seq = ++rt.seq;
    try {
      const plan = await api('/api/routine/plan', rt.choices);
      if (seq !== rt.seq) return;
      rt.plan = plan;
      renderControls();
      renderPlan();
    } catch (e) {
      $('rtPlan').innerHTML = `<p class="lib-note">Could not build the routine (${esc(e.message)}).</p>`;
    }
  }
  async function search() {
    const q = $('rtSearch')?.value ?? ''; if (q.trim().length < 3) return;
    try {
      const r = await api(`/api/routine/ingredients?q=${encodeURIComponent(q)}`);
      $('rtSearchOut').innerHTML = r.results.length ? `<ul>${r.results.map(x => `<li><strong>${esc(x.name)}</strong> · ${esc(x.category)}: ${esc(x.benefit)}</li>`).join('')}</ul>` : `No ingredient mentions "${esc(r.query)}".`;
    } catch (e) { $('rtSearchOut').textContent = `Search failed (${e.message}).`; }
  }
  async function openStudio() {
    try {
      if (!rt.options) rt.options = await api('/api/routine/options');
      if (!rt.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? rt.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : rt.options.tones[6];
        // The saved community is not used to choose a skin type or a heritage: both are the reader's own picks.
        rt.choices = { type: 'IV', undertone: 'unsure', feel: 'combination', concern: 'dark_marks', climate: 'temperate', steps: '5', pregnant: 'no', heritage: 'none', tone: tone.id };
      }
      renderControls();
      if (anyPicked()) await replan(); else renderBase();
    } catch (e) {
      $('rtPlan').innerHTML = `<p class="lib-note">The Routine Builder could not load (${esc(e.message)}).</p>`;
    }
  }
  const FIELD = { rtType: 'type', rtUndertone: 'undertone', rtFeel: 'feel', rtConcern: 'concern', rtClimate: 'climate', rtSteps: 'steps', rtPregnant: 'pregnant', rtHeritage: 'heritage', rtTone: 'tone' };
  document.addEventListener('change', e => {
    if (OWN.has(e.target.id) && e.target.value !== '') PICKED.add(e.target.id);
    const k = FIELD[e.target.id];
    if (!k || !rt.choices) return;
    rt.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('keydown', e => { if (e.target.id === 'rtSearch' && e.key === 'Enter') { e.preventDefault(); search(); } });
  document.addEventListener('click', e => {
    if (e.target.id === 'rtSearchGo') { search(); return; }
    const t = e.target.closest('[data-view="routine"], [data-open-routine]');
    if (!t) return;
    if (t.dataset.openRoutine !== undefined) { document.querySelector('.nav-link[data-view="routine"]')?.click(); return; }
    openStudio();
  });
})();
