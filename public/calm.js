/**
 * Calm & Self-Image view. Pick your community and one of its rituals, how long you have, what you
 * want help with, a ritual-design principle, the season, a scent, your hair type, Fitzpatrick type,
 * a tone and where you live; the server builds the plan from the mental-health guides, and this
 * view draws the session as a clock, the senses the ritual uses, and a portrait with the support
 * line for your region. Supportive and non-clinical; no photo is used.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const cm = { options: null, plan: null, choices: null, seq: 0 };
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
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const inkOn = h => (lum(h) > 0.18 ? '#141414' : '#f5f5f5');
  const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
  const short = (s, n = 18) => clip(String(s).split(/[(,:—]/)[0].trim(), n);
  const SCENT_COL = { rose: '#e5989b', frankincense: '#d4a373', coconut: '#f1faee', sandalwood: '#b08968', 'ylang-ylang': '#ffd166', lavender: '#b8b8ff', jasmine: '#fefae0', vetiver: '#6b705c' };
  const SEASON_COL = { winter: '#1d3557', spring: '#2d6a4f', summer: '#9c6644', autumn: '#7f4f24' };
  const FOCUS_COL = { calm: '#90e0ef', image: '#ffafcc', connection: '#ffd166', shedding: '#cdb4db' };
  const SENSES = [['touch', 'Touch'], ['smell', 'Scent'], ['sound', 'Sound'], ['warmth', 'Warmth']];
  const PRINCIPLE_ICON = {
    time: (x, y) => `<rect x="${x - 4}" y="${y - 10}" width="8" height="18" rx="2" fill="#fefae0"/><path d="M${x},${y - 18} q5,5 0,8 q-5,-3 0,-8" fill="#ffb703"/>`,
    senses: (x, y) => [0, 1, 2].map(i => `<circle cx="${x - 8 + i * 8}" cy="${y}" r="4" fill="${['#e5989b', '#ffd166', '#90e0ef'][i]}"/>`).join(''),
    repeat: (x, y) => `<path d="M${x - 9},${y} a9,9 0 1,1 4,7" stroke="#fefae0" stroke-width="3" fill="none"/><path d="M${x - 12},${y + 3} l3,6 l5,-4" fill="#fefae0"/>`,
    private: (x, y) => `<rect x="${x - 9}" y="${y - 6}" width="18" height="12" rx="3" fill="none" stroke="#fefae0" stroke-width="2"/><path d="M${x - 12},${y + 9} L${x + 12},${y - 9}" stroke="#e63946" stroke-width="3"/>`,
    heritage: (x, y) => `<path d="M${x},${y + 10} V${y - 4} M${x},${y} q-9,-3 -9,-12 q9,0 9,9 M${x},${y - 4} q9,-3 9,-12 q-9,0 -9,9" stroke="#95d5b2" stroke-width="2.5" fill="none"/>`,
    receive: (x, y) => `<circle cx="${x - 6}" cy="${y - 5}" r="4" fill="#fefae0"/><circle cx="${x + 6}" cy="${y - 5}" r="4" fill="#fefae0"/><path d="M${x - 13},${y + 9} q7,-9 13,0 q6,-9 13,0" fill="#fefae0"/>`,
  };

  // ---- Panel 1: the session as a clock -----------------------------------------------------------
  function clockPanel(p) {
    const n = p.session.steps.length; const cx = 120; const cy = 128; const r = 76; const col = SCENT_COL[p.scent.id];
    const seg = p.session.steps.map((s, i) => {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n + 0.04; const a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / n - 0.04; const am = (a0 + a1) / 2;
      const pt = (a, rr) => `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
      const big = a1 - a0 > Math.PI ? 1 : 0;
      return `<path d="M${pt(a0, r)} A${r},${r} 0 ${big},1 ${pt(a1, r)} L${pt(a1, r - 22)} A${r - 22},${r - 22} 0 ${big},0 ${pt(a0, r - 22)} Z" fill="${col}" fill-opacity="${0.45 + (0.55 * (i + 1)) / n}" stroke="#141414" stroke-width="1.5"/><text x="${(cx + (r - 11) * Math.cos(am)).toFixed(1)}" y="${(cy + (r - 11) * Math.sin(am) + 3).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${inkOn(col)}">${i + 1}</text>`;
    }).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Session clock">
      <rect width="240" height="300" rx="14" fill="#22223b"/>${seg}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="22" font-weight="700" fill="#fefae0">${p.session.minutes}</text>
      <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="9" fill="#fefae0">minutes · ${n} steps</text>
      <g>${PRINCIPLE_ICON[p.principle.id](26, 30)}</g>
      <text x="44" y="34" font-size="8" fill="#fefae0">${esc(clip(p.principle.label, 30))}</text>
      <text x="120" y="232" text-anchor="middle" font-size="9" font-weight="700" fill="#fefae0">${esc(clip(p.session.protocol.replace(' Beauty Protocol', ''), 36))}</text>
      <text x="120" y="248" text-anchor="middle" font-size="8" fill="#c9c9c9">${p.session.short ? `short version: ${n} of ${p.session.allSteps} steps, ending with the last` : `all ${n} steps`}</text>
      <text x="120" y="270" text-anchor="middle" font-size="8" fill="#c9c9c9">${esc(clip(p.session.steps[n - 1], 44))}</text></svg>
      <figcaption><strong>${esc(p.session.label)}</strong><span>${esc(p.session.protocol)}</span></figcaption></figure>`;
  }

  // ---- Panel 2: the senses the ritual uses -------------------------------------------------------
  function sensesPanel(p) {
    const cx = 120; const cy = 120; const col = SCENT_COL[p.scent.id]; const bg = SEASON_COL[p.season.id];
    const petals = SENSES.map(([k, label], i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 2; const x = cx + 50 * Math.cos(a); const y = cy + 50 * Math.sin(a); const on = p.ritual.senses[k];
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="30" ry="30" fill="${on ? '#fefae0' : '#fefae0'}" fill-opacity="${on ? 0.95 : 0.15}" stroke="#fefae0" stroke-width="1.5"/><text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${on ? '#141414' : '#fefae0'}">${label}</text>`;
    }).join('');
    const used = SENSES.filter(([k]) => p.ritual.senses[k]).map(([, l]) => l.toLowerCase());
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Senses">
      <rect width="240" height="300" rx="14" fill="${bg}"/>
      <text x="120" y="30" text-anchor="middle" font-size="10" font-weight="700" fill="#fefae0">${esc(p.season.label)}</text>${petals}
      <circle cx="${cx}" cy="${cy}" r="20" fill="${col}" stroke="#141414" stroke-width="2"/>
      <text x="120" y="212" text-anchor="middle" font-size="10" font-weight="700" fill="#fefae0">${esc(short(p.scent.label, 28))}</text>
      <text x="120" y="228" text-anchor="middle" font-size="8" fill="#fefae0">${p.scent.yours ? `a ${esc(p.community.label)} scent in the guide` : (p.scent.traditions.includes('cross-cultural') ? 'used across traditions' : `in the guide for ${esc(clip(p.scent.traditions.join(', '), 34))}`)}</text>
      <text x="120" y="256" text-anchor="middle" font-size="9" fill="#fefae0">${esc(clip(p.ritual.name, 40))}</text>
      <text x="120" y="272" text-anchor="middle" font-size="8" fill="#fefae0">ritual + session use ${used.length ? esc(used.join(', ')) : 'attention more than the senses'}</text></svg>
      <figcaption><strong>${esc(p.ritual.name)}</strong><span>${esc(p.ritual.function)}</span></figcaption></figure>`;
  }

  // ---- Panel 3: portrait and support line --------------------------------------------------------
  function hairShape(id, hex) {
    if (id === 'type4') return `<circle cx="120" cy="92" r="58" fill="${hex}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${(120 + 54 * Math.cos(i * 0.785)).toFixed(1)}" cy="${(92 + 54 * Math.sin(i * 0.785)).toFixed(1)}" r="14" fill="${hex}"/>`).join('')}`;
    if (id === 'type3') return `<path d="M64,140 C50,90 70,40 120,38 C170,40 190,90 176,140 C172,120 168,110 160,104 L80,104 C72,110 68,120 64,140 Z" fill="${hex}"/>${[0, 1, 2, 3].map(i => `<path d="M${70 + i * 34},132 q8,10 0,22 q-8,10 0,20" stroke="${hex}" stroke-width="8" fill="none"/>`).join('')}`;
    return `<path d="M70,180 L70,90 C70,52 92,40 120,40 C148,40 170,52 170,90 L170,180 L156,180 L156,100 L84,100 L84,180 Z" fill="${hex}"/>`;
  }
  function portraitPanel(p) {
    const skin = p.tone.hex; const hair = '#2b2118'; const fc = FOCUS_COL[p.focus.id]; const line = p.support.lines[0] ?? p.support.global[0];
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Portrait and support">
      <rect width="240" height="300" rx="14" fill="#14213d"/>${hairShape(p.hair.id, hair)}
      <rect x="104" y="138" width="32" height="26" fill="${skin}"/>
      <ellipse cx="120" cy="104" rx="38" ry="46" fill="${skin}"/>
      <path d="M104,104 q6,-5 12,0 M124,104 q6,-5 12,0" stroke="${inkOn(skin)}" stroke-width="2.4" fill="none"/>
      <path d="M108,126 q12,9 24,0" stroke="${inkOn(skin)}" stroke-width="2.4" fill="none"/>
      <path d="M60,200 C66,170 92,160 120,160 C148,160 174,170 180,200 Z" fill="${fc}"/>
      <text x="120" y="190" text-anchor="middle" font-size="10" font-weight="700" fill="#141414">${esc(p.focus.label)}</text>
      <rect x="16" y="214" width="208" height="70" rx="10" fill="#fefae0"/>
      <text x="120" y="232" text-anchor="middle" font-size="9" font-weight="700" fill="#141414">Need to talk to someone now?</text>
      <text x="120" y="250" text-anchor="middle" font-size="9" fill="#141414">${esc(clip(`${line.name} · ${p.support.label}`, 44))}</text>
      <text x="120" y="266" text-anchor="middle" font-size="9" font-weight="700" fill="#9d0208">${esc(clip(line.contact ?? line.url.replace(/^https?:\/\//, '').replace(/\/.*$/, ''), 44))}</text>
      <text x="120" y="279" text-anchor="middle" font-size="7" fill="#495057">Type ${esc(p.skin.type)} · ${esc(p.tone.label)} · ${esc(short(p.hair.label, 22))}</text></svg>
      <figcaption><strong>Support in ${esc(p.support.label)}</strong><span>${esc(line.name)}${line.contact ? ` · ${esc(line.contact)}` : ''}</span></figcaption></figure>`;
  }

  // ---- Plan cards ------------------------------------------------------------------------------
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  const pts = a => a.map(x => `<p><strong>${esc(x.title)}</strong> ${esc(x.text)}</p>`).join('');
  const lineHtml = l => `<li><strong>${esc(l.name)}</strong>${l.contact ? ` · ${esc(l.contact)}` : ''}${l.url ? ` · ${esc(l.url)}` : ''}${l.note ? ` <span class="lib-note">(${esc(l.note)})</span>` : ''}</li>`;
  function focusCard(f) {
    let body = `<p>${esc(f.intro)}</p>${pts(f.points)}`;
    if (f.steps) body += ul(f.steps);
    if (f.identity) body += `<details><summary>Hair and identity (${esc(f.identity.community)})</summary><p>${esc(f.identity.text)}</p></details>`;
    if (f.community && f.community.length) body += `<details><summary>${f.id === 'image' ? 'Pressures the guide names' : 'What helps, from the guide'}</summary>${ul(f.community)}</details>`;
    if (f.affirming) body += `<p><em>${esc(f.affirming)}</em></p>`;
    if (f.extra) body += `<p class="lib-note">${esc(f.extra)}</p>`;
    if (f.check) body += `<details><summary>Ritual or worry? A gentle check</summary><p>${esc(f.check.ritual)}</p><p>${esc(f.check.about)}</p>${ul(f.check.signs)}</details>`;
    return card(f.label, body);
  }
  function renderPlan() {
    const p = cm.plan; const r = p.ritual; const s = p.season; const sp = p.support;
    $('cmPreview').innerHTML = clockPanel(p) + sensesPanel(p) + portraitPanel(p);
    $('cmSummary').innerHTML = `<p class="hl-big">${esc(r.name)}</p><p>${esc(p.session.label)} · ${esc(p.focus.label)}</p>`;
    $('cmPlan').innerHTML = [
      card('If you need support now', `<p>${esc(sp.note)}</p><ul>${sp.lines.map(lineHtml).join('')}</ul><details${sp.lines.length ? '' : ' open'}><summary>Text lines and other countries</summary><ul>${sp.global.map(lineHtml).join('')}</ul></details>`, ' cm-support'),
      card(`${p.community.label}: ${r.name}`, `<p class="lib-note">${esc(r.function)}</p>${r.description ? `<p>${esc(r.description)}</p>` : ''}${r.extras.map(x => `<details><summary>${esc(x.label)}</summary><p>${esc(x.text)}</p></details>`).join('')}`),
      card(`Your ${p.session.label} session`, `<p><strong>${esc(p.session.protocol)}</strong></p><ol>${p.session.steps.map(li).join('')}</ol>${p.session.short ? `<p class="lib-note">Shortened from ${p.session.allSteps} steps: the first steps and the closing one.</p>` : ''}`),
      focusCard(p.focus),
      card(p.principle.label, `<p>${esc(p.principle.description)}</p><p><strong>Try:</strong> ${esc(p.principle.practical)}</p>`),
      card(`${s.label}`, `<p><strong>On your mind:</strong> ${esc(s.mind.join('; '))}</p><p><strong>Skin:</strong> ${esc(s.skin.join('; '))}</p>${ul(s.adjustments)}${s.community ? `<p class="lib-note">${esc(p.community.label)}: ${esc(s.community)}</p>` : ''}`),
      card(`Scent: ${p.scent.label}`, `<p>${esc(p.scent.effect)}</p><p class="lib-note">Traditions in the guide: ${esc(p.scent.traditions.join(', '))}</p><p>${esc(p.scent.note)}</p>`),
      card(`Stress and your skin (Type ${p.skin.type})`, `<p>${esc(p.skin.intro)}</p>${pts(p.skin.pathways)}`),
      card(`Stress shedding: ${p.hair.label}`, ul(p.hair.concerns)),
      card(`More ${p.community.label} rituals`, p.more.map(m => `<details><summary>${esc(m.name)}</summary>${m.origin ? `<p class="lib-note">${esc(m.origin)}</p>` : ''}${m.function ? `<p><em>${esc(m.function)}</em></p>` : ''}${m.description ? `<p>${esc(m.description)}</p>` : ''}</details>`).join('') + (p.community.recommendations ? `<p class="lib-note">${esc(p.community.recommendations)}</p>` : '')),
    ].join('');
  }

  async function replan() {
    const seq = ++cm.seq;
    try {
      const plan = await api('/api/calm/plan', cm.choices);
      if (seq !== cm.seq) return;
      cm.plan = plan;
      cm.choices.ritual = plan.choices.ritual;
      renderPlan();
    } catch (e) {
      $('cmPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function search() {
    const q = $('cmSearch')?.value ?? ''; if (q.trim().length < 3) return;
    try {
      const r = await api(`/api/calm/search?q=${encodeURIComponent(q)}`);
      $('cmSearchOut').innerHTML = r.results.length ? `<ul>${r.results.map(x => `<li><strong>${esc(x.name)}</strong> · ${esc(x.community)}</li>`).join('')}</ul>` : `No ritual in the guides mentions "${esc(r.query)}".`;
    } catch (e) { $('cmSearchOut').textContent = `Search failed (${e.message}).`; }
  }
  function select(id, text, values, current) {
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = cm.options; const c = cm.choices;
    $('cmControls').innerHTML = `
      ${select('cmCommunity', 'Community', o.communities, c.community)}
      ${select('cmRitual', 'Ritual', o.rituals[c.community] ?? [], c.ritual)}
      ${select('cmMinutes', 'Time you have', o.minutes, c.minutes)}
      ${select('cmFocus', 'What would help', o.focus, c.focus)}
      ${select('cmPrinciple', 'Ritual idea to try', o.principles, c.principle)}
      ${select('cmSeason', 'Season', o.seasons, c.season)}
      ${select('cmScent', 'Scent', o.scents, c.scent)}
      ${select('cmHair', 'Hair type', o.hair, c.hair)}
      ${select('cmFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('cmTone', 'Skin tone for the picture', o.tones, c.tone)}
      ${select('cmRegion', 'Where you live (for support lines)', o.regions, c.region)}
      <label class="st-field"><span>Find a ritual by word</span><input id="cmSearch" type="search" placeholder="e.g. henna, oil, singing" maxlength="60"></label>
      <button type="button" class="btn btn-secondary" id="cmSearchGo">Search</button><div id="cmSearchOut" class="lib-note" aria-live="polite"></div>`;
  }
  async function openStudio() {
    try {
      if (!cm.options) cm.options = await api('/api/calm/options');
      if (!cm.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? cm.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : cm.options.tones[6];
        const community = cm.options.communities.some(x => x.id === pr.communityId) ? pr.communityId : 'west_african';
        cm.choices = { community, ritual: '0', minutes: '20', focus: 'calm', principle: 'time', season: 'autumn', scent: 'rose', hair: 'type4', region: 'canada', fitzpatrick: 'V', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('cmPlan').innerHTML = `<p class="lib-note">The Calm &amp; Self-Image studio could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { cmCommunity: 'community', cmRitual: 'ritual', cmMinutes: 'minutes', cmFocus: 'focus', cmPrinciple: 'principle', cmSeason: 'season', cmScent: 'scent', cmHair: 'hair', cmFitz: 'fitzpatrick', cmTone: 'tone', cmRegion: 'region' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !cm.choices) return;
    cm.choices[k] = e.target.value;
    if (k === 'community') { cm.choices.ritual = '0'; renderControls(); }
    replan();
  });
  document.addEventListener('keydown', e => { if (e.target.id === 'cmSearch' && e.key === 'Enter') { e.preventDefault(); search(); } });
  document.addEventListener('click', e => {
    if (e.target.id === 'cmSearchGo') { search(); return; }
    const t = e.target.closest('[data-view="calm"], [data-open-calm]');
    if (!t) return;
    if (t.dataset.openCalm !== undefined) { document.querySelector('.nav-link[data-view="calm"]')?.click(); return; }
    openStudio();
  });
})();
