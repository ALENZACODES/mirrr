/**
 * Grooming Studio view. You pick your beard texture, the look you want, your razor or trimmer, the way
 * you shave, the skin problem you have, a beard-oil scent and an optional heritage; the server scores
 * your razor-bump risk and builds the shave and beard plan from the audited grooming guides. This view
 * draws a face in the tone you pick wearing the look, the risk meter with what moved it, and your week.
 * The face is an illustration, never your photo.
 */
(() => {
  const gr = { options: null, plan: null, choices: null, seq: 0 };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ul = a => (a && a.length ? `<ul>${a.filter(Boolean).map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : '');
  const card = (title, body) => (body ? `<article class="st-card"><h4>${esc(title)}</h4>${body}</article>` : '');
  const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }
  const hexRgb = h => { const s = String(h).replace('#', ''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16)); };
  const shade = (h, t) => { const c = hexRgb(h).map(v => Math.max(0, Math.min(255, Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t)))); return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`; };

  // ---- Panel 1: the face wearing the look -----------------------------------------------------------
  const HAIR = '#1f1612';
  const BEARD = {
    clean_shave: '',
    short_stubble: 'M62,150 Q64,206 120,224 Q176,206 178,150 Q170,176 150,182 Q120,170 90,182 Q70,176 62,150 Z',
    medium_stubble: 'M60,146 Q62,210 120,230 Q178,210 180,146 Q172,178 150,186 Q120,174 90,186 Q68,178 60,146 Z',
    short_box_beard: 'M58,140 Q58,216 120,240 Q182,216 182,140 Q174,180 150,190 Q120,176 90,190 Q66,180 58,140 Z',
    full_beard: 'M56,136 Q50,240 120,266 Q190,240 184,136 Q176,182 150,192 Q120,178 90,192 Q64,182 56,136 Z',
    bald_with_beard: 'M56,136 Q50,240 120,266 Q190,240 184,136 Q176,182 150,192 Q120,178 90,192 Q64,182 56,136 Z',
    moustache_only: '',
    uncut: 'M54,132 Q44,262 120,290 Q196,262 186,132 Q178,182 150,192 Q120,178 90,192 Q62,182 54,132 Z',
  };
  const STACHE = 'M96,168 Q108,160 120,166 Q132,160 144,168 Q132,174 120,170 Q108,174 96,168 Z';
  function texture(kind, goal) {
    if (!BEARD[goal]) return '';
    const marks = [];
    for (let i = 0; i < 26; i++) {
      const x = 74 + (i * 37) % 92; const y = 196 + (i * 23) % (goal === 'uncut' ? 80 : goal.includes('stubble') ? 22 : 50);
      if (kind === 'straight') marks.push(`<path d="M${x},${y} l1,7" stroke="#000" stroke-width="0.8" opacity="0.5"/>`);
      else if (kind === 'wavy') marks.push(`<path d="M${x},${y} q3,3 0,6 q-3,3 0,6" stroke="#000" stroke-width="0.8" fill="none" opacity="0.5"/>`);
      else marks.push(`<circle cx="${x}" cy="${y}" r="2.2" stroke="#000" stroke-width="0.8" fill="none" opacity="0.5"/>`);
    }
    return marks.join('');
  }
  function facePanel(p) {
    const pic = p.picture; const skin = pic.skin; const g = pic.goal;
    const stubble = g.includes('stubble');
    const beard = BEARD[g] ? `<path d="${BEARD[g]}" fill="${HAIR}" opacity="${stubble ? (g === 'short_stubble' ? 0.35 : 0.55) : 0.95}"/>` : '';
    const stache = g === 'clean_shave' ? '' : `<path d="${STACHE}" fill="${HAIR}" opacity="${stubble ? 0.5 : 0.95}"/>`;
    const scalp = g === 'bald_with_beard' ? '' : `<path d="M54,92 Q120,20 186,92 Q180,62 120,48 Q60,62 54,92 Z" fill="${HAIR}"/>`;
    const shine = g === 'bald_with_beard' ? '<ellipse cx="104" cy="66" rx="16" ry="6" fill="#fff" opacity="0.25"/>' : '';
    const bumps = pic.risk >= 3 && (g === 'clean_shave' || g === 'moustache_only' || g === 'bald_with_beard' || pic.problem === 'bumps')
      ? Array.from({ length: Math.min(12, pic.risk * 2) }, (_, i) => `<circle cx="${84 + (i * 29) % 72}" cy="${(g === 'clean_shave' || g === 'moustache_only') ? 214 + (i * 7) % 22 : 248 + (i * 5) % 14}" r="2.4" fill="${shade(skin, -0.35)}" stroke="#e5383b" stroke-width="0.8"/>`).join('') : '';
    const flakes = pic.problem === 'flakes' ? Array.from({ length: 10 }, (_, i) => `<rect x="${82 + (i * 31) % 76}" y="${200 + (i * 17) % 36}" width="3" height="2" fill="#f8f9fa" opacity="0.9"/>`).join('') : '';
    const marks = pic.problem === 'dark_marks' ? '<ellipse cx="96" cy="236" rx="8" ry="5" fill="#000" opacity="0.25"/><ellipse cx="146" cy="232" rx="7" ry="4" fill="#000" opacity="0.25"/>' : '';
    const oil = pic.oil ? `<path d="M150,200 q8,-10 16,0" stroke="#ffd166" stroke-width="1.6" fill="none" opacity="0.8"/><text x="200" y="40" text-anchor="middle" font-size="16">${pic.scent === 'none' ? '' : '~'}</text>` : '';
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="A face in your tone wearing the beard look">
      <rect width="240" height="300" rx="14" fill="#1b1b2f"/>
      <path d="M94,250 L94,290 L146,290 L146,250 Z" fill="${shade(skin, -0.1)}"/>
      <ellipse cx="120" cy="150" rx="66" ry="96" fill="${skin}"/>${scalp}${shine}
      <path d="M80,116 Q96,108 112,114 M128,114 Q144,108 160,116" stroke="${HAIR}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="96" cy="128" rx="10" ry="5" fill="#fbf7f2"/><circle cx="96" cy="128" r="3.6" fill="#3b2418"/>
      <ellipse cx="144" cy="128" rx="10" ry="5" fill="#fbf7f2"/><circle cx="144" cy="128" r="3.6" fill="#3b2418"/>
      <path d="M120,140 q-6,12 -2,18 q2,2 4,0" stroke="${shade(skin, -0.3)}" stroke-width="1.6" fill="none"/>
      ${beard}${texture(pic.texture, g)}${stache}
      <path d="M106,180 Q120,188 134,180" stroke="${shade(skin, -0.45)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${bumps}${flakes}${marks}${oil}
      <text x="120" y="22" text-anchor="middle" font-size="10" font-weight="700" fill="#fefae0">${esc(clip(p.goal.label, 34))}</text></svg>
      <figcaption><strong>${esc(p.goal.label)}</strong><span>${esc(p.texture.label)} · ${esc(p.tone.label)}</span></figcaption></figure>`;
  }

  // ---- Panel 2: razor-bump risk ---------------------------------------------------------------------
  function riskPanel(p) {
    const r = p.risk; const ang = Math.PI * (1 - r.score / 10);
    const col = r.level === 'high' ? '#e5383b' : r.level === 'medium' ? '#ffb703' : '#80ed99';
    const nx = 120 + 70 * Math.cos(ang); const ny = 130 - 70 * Math.sin(ang);
    const bars = r.parts.map((x, i) => `<text x="16" y="${178 + i * 22}" font-size="8" fill="#e9ecef">${esc(clip(x.why, 34))}</text>
      <rect x="${x.add >= 0 ? 170 : 170 + x.add * 8}" y="${170 + i * 22}" width="${Math.abs(x.add) * 8}" height="10" rx="2" fill="${x.add >= 0 ? '#e5383b' : '#80ed99'}"/>`).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Razor-bump risk and what moved it">
      <rect width="240" height="300" rx="14" fill="#1b1b2f"/>
      <path d="M50,130 A70,70 0 0 1 190,130" stroke="#495057" stroke-width="14" fill="none"/>
      <path d="M50,130 A70,70 0 0 1 ${nx.toFixed(1)},${ny.toFixed(1)}" stroke="${col}" stroke-width="14" fill="none"/>
      <line x1="120" y1="130" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#fefae0" stroke-width="2.5"/><circle cx="120" cy="130" r="4" fill="#fefae0"/>
      <text x="120" y="34" text-anchor="middle" font-size="11" font-weight="700" fill="#fefae0">Razor-bump risk</text>
      <text x="120" y="152" text-anchor="middle" font-size="14" font-weight="700" fill="${col}">${r.level} · ${r.score}/10</text>
      <line x1="170" y1="164" x2="170" y2="${172 + r.parts.length * 22}" stroke="#adb5bd" stroke-width="1"/>${bars}</svg>
      <figcaption><strong>Risk</strong><span>red raises it, green lowers it</span></figcaption></figure>`;
  }

  // ---- Panel 3: the week ----------------------------------------------------------------------------
  function weekPanel(p) {
    const rows = [['shave', '#a2d2ff', w => w.shave], ['wash', '#90e0ef', w => w.wash && 'wash'], ['exfoliate', '#f28482', w => w.exfoliate && 'BHA'], ['oil', '#ffd166', w => w.oil && 'oil']];
    const cells = p.week.map((w, i) => `<text x="${50 + i * 26}" y="56" text-anchor="middle" font-size="8" fill="#e9ecef">${w.day}</text>` + rows.map(([, col, f], j) => { const v = f(w); return `<rect x="${39 + i * 26}" y="${64 + j * 40}" width="22" height="32" rx="5" fill="${v ? col : '#2b2d42'}"/>${v ? `<text x="${50 + i * 26}" y="${84 + j * 40}" text-anchor="middle" font-size="6.5" font-weight="700" fill="#14141f">${esc(String(v).slice(0, 6))}</text>` : ''}`; }).join('')).join('');
    const labels = rows.map(([n], j) => `<text x="34" y="${84 + j * 40}" text-anchor="end" font-size="7" fill="#c9c9c9">${n}</text>`).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Your grooming week">
      <rect width="240" height="300" rx="14" fill="#1b1b2f"/><text x="120" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="#fefae0">Your week</text>${labels}${cells}
      <text x="120" y="244" text-anchor="middle" font-size="8" fill="#ffd166">${esc(clip(p.barber ?? 'No barber visits needed for a clean shave.', 56))}</text>
      <text x="120" y="262" text-anchor="middle" font-size="8" fill="#c9c9c9">${p.week.filter(w => w.shave).length ? `${p.week.filter(w => w.shave).length} ${esc(p.week.find(w => w.shave).shave)} day(s) a week` : 'no razor days'}</text></svg>
      <figcaption><strong>Week</strong><span>${esc(p.message)}</span></figcaption></figure>`;
  }

  function renderPlan() {
    const p = gr.plan; const s = p.shaving; const b = p.beard; const h = p.heritage;
    $('grPreview').innerHTML = facePanel(p) + riskPanel(p) + weekPanel(p);
    $('grSummary').innerHTML = `<p class="hl-big">${esc(p.goal.label)}</p><p>${esc(p.message)}</p><p class="lib-note">${esc(p.texture.about)}</p>`;
    $('grPlan').innerHTML = [
      card('Watch out', ul(p.warnings)),
      s ? card(`Shaving: ${s.area}`, `<p><strong>Prep:</strong></p>${ul(s.prep)}<p><strong>Lather:</strong> ${esc(s.lather)}</p><p><strong>${esc(s.tool.type)}:</strong> ${esc(s.tool.how ?? '')} ${esc(s.tool.best_for ?? s.tool.note ?? '')}</p><p><strong>Technique:</strong></p>${ul(s.technique)}<p><strong>After:</strong></p>${ul(s.after)}`) : card('Shaving', '<p>An uncut beard needs no razor: wash, oil and comb.</p>'),
      b ? card(`Beard: ${b.style.label}`, `${b.style.tools ? `<p><strong>Tools:</strong> ${esc(b.style.tools)}</p>` : ''}${b.style.maintenance ? `<p><strong>Upkeep:</strong> ${esc(b.style.maintenance)}</p>` : ''}${b.style.shaping ? `<p><strong>Shape:</strong> ${esc(b.style.shaping)}</p>` : ''}${b.style.note ? `<p class="lib-note">${esc(b.style.note)}</p>` : ''}<p><strong>Washing:</strong> ${esc(b.wash)}</p>${b.product ? `<p><strong>${esc(b.product.name)}:</strong> ${esc(b.product.what)} ${esc(b.product.best_for)}</p>` : ''}<p class="lib-note">${esc(b.spf)}</p>`) : '',
      b ? card('Your beard oil (30 ml)', `${ul(b.oil.carriers.map(o => `${o.ml} ml ${o.oil}: ${o.why}`))}${b.oil.essential ? `<p><strong>+ ${b.oil.essential.drops} drops ${esc(b.oil.essential.name)}:</strong> ${esc(b.oil.essential.note)}</p><p class="lib-note">${esc(b.oil.dilution)}</p>` : ''}<p class="lib-note">${esc(b.oil.caution)}</p><ol>${b.oil.howTo.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`) : '',
      card(p.problem.title, ul(p.problem.steps)),
      p.growth ? card('Growing it', `<p>${esc(p.growth.expect)}</p><p>${esc(p.growth.myth)}</p><p class="lib-note">Minoxidil: ${esc(p.growth.minoxidil)}</p>`) : '',
      h ? card(`${h.label} grooming`, `${h.philosophy ? `<p>${esc(h.philosophy)}</p>` : ''}${h.beardTradition ? `<p><em>${esc(h.beardTradition)}</em></p>` : ''}${h.faith ? `<p class="lib-note">${esc(h.faith)}</p>` : ''}${h.rituals.length ? `<p><strong>Rituals:</strong></p><ul>${h.rituals.map(r => `<li><strong>${esc(r.name)}:</strong> ${esc(r.text)} ${r.how ? `<span class="lib-note">${esc(r.how)}</span>` : ''}</li>`).join('')}</ul>` : ''}${h.careTips ? `<p><strong>Tips:</strong> ${esc(h.careTips)}</p>` : ''}${h.styles.length ? `<p><strong>Barbershop styles:</strong> ${esc(h.styles.join(', '))}</p>` : ''}`) : card('Heritage', '<p>Pick a heritage to see its grooming rituals, beard traditions and barbershop styles. It never changes your beard texture.</p>'),
    ].join('');
  }
  function select(id, text, values, current) {
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = gr.options; const c = gr.choices;
    const q = $('grSearch')?.value ?? ''; const out = $('grSearchOut')?.innerHTML ?? '';
    $('grControls').innerHTML = `
      ${select('grTexture', 'Your beard hair', o.textures, c.texture)}
      ${select('grGoal', 'The look you want', o.goals, c.goal)}
      ${select('grTool', 'Razor or trimmer', o.tools, c.tool)}
      ${select('grDirection', 'Which way you shave', o.directions, c.direction)}
      ${select('grProblem', 'Skin problem', o.problems, c.problem)}
      ${select('grScent', 'Beard oil scent', o.scents, c.scent)}
      ${select('grHeritage', 'Heritage (optional)', o.heritages, c.heritage)}
      ${select('grTone', 'Skin tone for the picture', o.tones, c.tone)}
      <label class="st-field"><span>Find a ritual or style</span><input id="grSearch" type="search" placeholder="e.g. oil, hammam, moustache" maxlength="40" value="${esc(q)}"></label>
      <button type="button" class="btn btn-secondary" id="grSearchGo">Search</button><div id="grSearchOut" class="lib-note" aria-live="polite">${out}</div>`;
  }
  async function replan() {
    const seq = ++gr.seq;
    try {
      const plan = await api('/api/groom/plan', gr.choices);
      if (seq !== gr.seq) return;
      gr.plan = plan; renderControls(); renderPlan();
    } catch (e) { $('grPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`; }
  }
  async function search() {
    const q = $('grSearch')?.value ?? ''; if (q.trim().length < 3) return;
    try {
      const r = await api(`/api/groom/search?q=${encodeURIComponent(q)}`);
      $('grSearchOut').innerHTML = r.results.length ? `<ul>${r.results.map(x => `<li><strong>${esc(x.name)}</strong> · ${esc(x.community)}: ${esc(clip(x.text, 120))}</li>`).join('')}</ul>` : `Nothing mentions "${esc(r.query)}".`;
    } catch (e) { $('grSearchOut').textContent = `Search failed (${e.message}).`; }
  }
  async function openStudio() {
    try {
      if (!gr.options) gr.options = await api('/api/groom/options');
      if (!gr.choices) gr.choices = { texture: 'wavy', goal: 'short_box_beard', tool: 'single_blade', direction: 'with', problem: 'bumps', scent: 'none', heritage: 'none', tone: 'mst7' };
      renderControls(); await replan();
    } catch (e) { $('grPlan').innerHTML = `<p class="lib-note">The Grooming Studio could not load (${esc(e.message)}).</p>`; }
  }
  const FIELD = { grTexture: 'texture', grGoal: 'goal', grTool: 'tool', grDirection: 'direction', grProblem: 'problem', grScent: 'scent', grHeritage: 'heritage', grTone: 'tone' };
  document.addEventListener('change', e => { const k = FIELD[e.target.id]; if (!k || !gr.choices) return; gr.choices[k] = e.target.value; replan(); });
  document.addEventListener('keydown', e => { if (e.target.id === 'grSearch' && e.key === 'Enter') { e.preventDefault(); search(); } });
  document.addEventListener('click', e => {
    if (e.target.id === 'grSearchGo') { search(); return; }
    const t = e.target.closest('[data-view="groom"], [data-open-groom]');
    if (!t) return;
    if (t.dataset.openGroom !== undefined) { document.querySelector('.nav-link[data-view="groom"]')?.click(); return; }
    openStudio();
  });
})();
