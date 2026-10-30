/**
 * Eco Beauty view. Pick a product to swap, your community, the season, an ingredient, what you
 * care about most, your hair type, Fitzpatrick type and a tone; the server builds the plan from
 * the eco guides, and this view draws the swap, the community starter kit on a shelf, and a
 * season wheel with the white-cast scale for your sunscreen. No photo is used.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const ec = { options: null, plan: null, choices: null, seq: 0 };
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
  const short = (s, n = 16) => { const t = String(s).split(/[(,:—]/)[0].trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
  const PLASTIC = '#8ecae6'; const ECO = '#b5835a'; const GREEN = '#6a994e';
  const FOCUS_COL = { plastic: '#219ebc', water: '#4cc9f0', sourcing: '#e9c46a', microplastics: '#e76f51' };
  const SEASON_COL = { spring: '#90be6d', summer: '#f9c74f', autumn: '#f3722c', winter: '#a2d2ff' };
  const RISK_COL = ['#2a9d8f', '#8ab17d', '#e9c46a', '#f4a261', '#e76f51', '#e63946'];

  // ---- Shapes ----------------------------------------------------------------------------------
  function shape(kind, x, y) {
    switch (kind) {
      case 'bottle': return `<rect x="${x - 16}" y="${y - 40}" width="32" height="70" rx="8" fill="${PLASTIC}" stroke="#023047" stroke-width="2"/><rect x="${x - 7}" y="${y - 54}" width="14" height="14" fill="#023047"/>`;
      case 'pump': return `<rect x="${x - 16}" y="${y - 30}" width="32" height="60" rx="8" fill="${PLASTIC}" stroke="#023047" stroke-width="2"/><path d="M${x - 3},${y - 30} v-18 h18" stroke="#023047" stroke-width="5" fill="none"/>`;
      case 'tub': return `<rect x="${x - 26}" y="${y - 8}" width="52" height="36" rx="6" fill="${PLASTIC}" stroke="#023047" stroke-width="2"/><rect x="${x - 29}" y="${y - 18}" width="58" height="12" rx="4" fill="#023047"/>`;
      case 'pads': return [0, 1, 2, 3].map(i => `<ellipse cx="${x - 18 + i * 12}" cy="${y + 10 - (i % 2) * 6}" rx="14" ry="14" fill="#f8f9fa" stroke="#adb5bd" stroke-width="2"/>`).join('') + `<rect x="${x - 34}" y="${y + 22}" width="68" height="10" fill="${PLASTIC}"/>`;
      case 'razor': return `<rect x="${x - 4}" y="${y - 30}" width="8" height="62" rx="4" fill="${PLASTIC}" stroke="#023047" stroke-width="2"/><rect x="${x - 16}" y="${y - 42}" width="32" height="12" rx="3" fill="#ffb703"/>`;
      case 'brush': return `<rect x="${x - 4}" y="${y - 30}" width="8" height="62" rx="4" fill="${PLASTIC}" stroke="#023047" stroke-width="2"/><rect x="${x - 6}" y="${y - 46}" width="12" height="16" fill="#f8f9fa" stroke="#adb5bd"/>`;
      case 'can': return `<rect x="${x - 15}" y="${y - 38}" width="30" height="68" rx="6" fill="#adb5bd" stroke="#495057" stroke-width="2"/><rect x="${x - 6}" y="${y - 50}" width="12" height="12" fill="${PLASTIC}"/>`;
      case 'bar': return `<rect x="${x - 26}" y="${y - 6}" width="52" height="30" rx="10" fill="#e9d8a6" stroke="${ECO}" stroke-width="2"/><path d="M${x - 26},${y + 4} h52" stroke="${ECO}" stroke-dasharray="4 3"/>`;
      case 'jar': return `<rect x="${x - 22}" y="${y - 14}" width="44" height="44" rx="8" fill="#cde7e3" fill-opacity="0.7" stroke="#2a9d8f" stroke-width="2"/><rect x="${x - 24}" y="${y - 22}" width="48" height="10" rx="3" fill="${ECO}"/>`;
      case 'tin': return `<ellipse cx="${x}" cy="${y + 18}" rx="28" ry="10" fill="#ced4da" stroke="#6c757d" stroke-width="2"/><rect x="${x - 28}" y="${y}" width="56" height="18" fill="#ced4da"/><ellipse cx="${x}" cy="${y}" rx="28" ry="10" fill="#e9ecef" stroke="#6c757d" stroke-width="2"/>`;
      case 'cloth': return [0, 1, 2].map(i => `<rect x="${x - 26 + i * 6}" y="${y - 6 + i * 8}" width="40" height="22" rx="4" fill="${['#e9edc9', '#ccd5ae', '#fefae0'][i]}" stroke="${GREEN}" stroke-width="2"/>`).join('');
      case 'safety': return `<rect x="${x - 4}" y="${y - 24}" width="8" height="56" rx="3" fill="#adb5bd" stroke="#495057" stroke-width="2"/><rect x="${x - 20}" y="${y - 38}" width="40" height="14" rx="3" fill="#6c757d"/>`;
      case 'bamboo': return `<rect x="${x - 4}" y="${y - 30}" width="8" height="62" rx="4" fill="#dda15e" stroke="${ECO}" stroke-width="2"/><path d="M${x - 4},${y} h8 M${x - 4},${y + 14} h8" stroke="${ECO}"/><rect x="${x - 6}" y="${y - 46}" width="12" height="16" fill="#f8f9fa" stroke="#adb5bd"/>`;
      case 'shaker': return `<rect x="${x - 16}" y="${y - 30}" width="32" height="60" rx="4" fill="#e9d8a6" stroke="${ECO}" stroke-width="2"/>${[0, 1, 2].map(i => `<circle cx="${x - 8 + i * 8}" cy="${y - 36}" r="2" fill="${ECO}"/>`).join('')}<rect x="${x - 16}" y="${y - 34}" width="32" height="6" fill="${ECO}"/>`;
      default: return '';
    }
  }
  const vessel = pk => (/dropper/i.test(pk) ? 'dropper' : /jar/i.test(pk) ? 'glassjar' : /bottle|spray/i.test(pk) ? 'glass' : /plant|no packaging|zero|stone|garden|fresh/i.test(pk) ? 'leaf' : /bag|tin/i.test(pk) ? 'bag' : 'block');
  function kitItem(kind, x, y) {
    switch (kind) {
      case 'dropper': return `<rect x="${x - 9}" y="${y - 26}" width="18" height="34" rx="4" fill="#7f5539" fill-opacity="0.85"/><rect x="${x - 4}" y="${y - 40}" width="8" height="14" rx="3" fill="#212529"/>`;
      case 'glassjar': return `<rect x="${x - 14}" y="${y - 22}" width="28" height="30" rx="5" fill="#cde7e3" fill-opacity="0.75" stroke="#2a9d8f"/><rect x="${x - 15}" y="${y - 28}" width="30" height="7" rx="2" fill="${ECO}"/>`;
      case 'glass': return `<rect x="${x - 10}" y="${y - 34}" width="20" height="42" rx="6" fill="#99d98c" fill-opacity="0.7" stroke="#52b69a"/><rect x="${x - 4}" y="${y - 42}" width="8" height="8" fill="#212529"/>`;
      case 'leaf': return `<path d="M${x},${y + 8} C${x - 22},${y - 6} ${x - 10},${y - 34} ${x},${y - 40} C${x + 10},${y - 34} ${x + 22},${y - 6} ${x},${y + 8} Z" fill="${GREEN}"/><path d="M${x},${y + 8} V${y - 34}" stroke="#386641"/>`;
      case 'bag': return `<path d="M${x - 14},${y + 8} L${x - 12},${y - 26} L${x + 12},${y - 26} L${x + 14},${y + 8} Z" fill="#d4a373" stroke="#a47148"/><path d="M${x - 12},${y - 20} h24" stroke="#a47148"/>`;
      default: return `<rect x="${x - 16}" y="${y - 14}" width="32" height="22" rx="3" fill="#e9d8a6" stroke="${ECO}"/><path d="M${x - 16},${y - 6} h32" stroke="${ECO}" stroke-dasharray="3 3"/>`;
    }
  }

  // ---- Panel 1: the swap -------------------------------------------------------------------------
  function swapPanel(p) {
    const [from, to] = p.swap.shapes; const fc = FOCUS_COL[p.focus.id];
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Swap">
      <rect width="240" height="300" rx="14" fill="#14213d"/>
      <text x="62" y="40" text-anchor="middle" font-size="10" font-weight="700" fill="${PLASTIC}">NOW</text><text x="178" y="40" text-anchor="middle" font-size="10" font-weight="700" fill="#e9d8a6">SWAP TO</text>
      ${shape(from, 62, 130)}${shape(to, 178, 130)}
      <path d="M100,130 h36 l-8,-8 m8,8 l-8,8" stroke="#f5f5f5" stroke-width="3" fill="none"/>
      <text x="62" y="190" text-anchor="middle" font-size="9" fill="#f5f5f5">${esc(short(p.swap.conventional, 20))}</text>
      <text x="178" y="190" text-anchor="middle" font-size="9" fill="#f5f5f5">${esc(short(p.swap.sustainable, 20))}</text>
      <rect x="20" y="226" width="200" height="40" rx="10" fill="${fc}"/>
      <text x="120" y="244" text-anchor="middle" font-size="11" font-weight="700" fill="${inkOn(fc)}">${esc(p.focus.label)}</text>
      <text x="120" y="259" text-anchor="middle" font-size="9" fill="${inkOn(fc)}">${p.focus.steps.length} steps below</text></svg>
      <figcaption><strong>One swap at a time</strong><span>${esc(p.swap.conventional)} → ${esc(p.swap.sustainable)}</span></figcaption></figure>`;
  }

  // ---- Panel 2: the starter kit on a shelf -------------------------------------------------------
  function kitPanel(p) {
    const kit = p.community.kit; const items = kit ? kit.products : [];
    const step = items.length ? 200 / items.length : 40;
    const row = items.map((it, i) => { const x = 20 + step * (i + 0.5); return `${kitItem(vessel(it.packaging), x, 150)}<text x="${x.toFixed(1)}" y="${i % 2 ? 196 : 182}" text-anchor="middle" font-size="8" fill="#f5f5f5">${esc(short(it.product, 13))}</text>`; }).join('');
    const ings = p.community.ingredients.slice(0, 5).map((g, i) => `<circle cx="${30 + i * 45}" cy="238" r="8" fill="${g.threat ? '#e76f51' : GREEN}"/><text x="${30 + i * 45}" y="${i % 2 ? 268 : 256}" text-anchor="middle" font-size="7" fill="#f5f5f5">${esc(short(g.name, 11))}</text>`).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Starter kit">
      <rect width="240" height="300" rx="14" fill="#283618"/>
      <text x="120" y="40" text-anchor="middle" font-size="11" font-weight="700" fill="#fefae0">${esc(p.community.label)} starter kit</text>
      <text x="120" y="58" text-anchor="middle" font-size="8" fill="#fefae0">${esc(clip(kit?.packaging ?? '', 46))}</text>
      ${row}<rect x="12" y="158" width="216" height="6" rx="2" fill="#bc6c25"/>
      <text x="120" y="222" text-anchor="middle" font-size="8" fill="#fefae0">key ingredients · red = climate threat in the guide</text>${ings}</svg>
      <figcaption><strong>${items.length} products, little or no plastic</strong><span>${esc(kit?.title ?? '')}</span></figcaption></figure>`;
  }

  // ---- Panel 3: season wheel, ingredient and the white-cast scale --------------------------------
  function seasonPanel(p) {
    const order = ['spring', 'summer', 'autumn', 'winter']; const cx = 120; const cy = 100; const r = 62;
    const arc = (i, rr) => { const a0 = -Math.PI / 2 + (i * Math.PI) / 2; const a1 = a0 + Math.PI / 2; return `M${cx},${cy} L${(cx + rr * Math.cos(a0)).toFixed(1)},${(cy + rr * Math.sin(a0)).toFixed(1)} A${rr},${rr} 0 0 1 ${(cx + rr * Math.cos(a1)).toFixed(1)},${(cy + rr * Math.sin(a1)).toFixed(1)} Z`; };
    const wedges = order.map((s, i) => { const on = s === p.season.id; const a = -Math.PI / 4 + (i * Math.PI) / 2; return `<path d="${arc(i, on ? r + 8 : r)}" fill="${SEASON_COL[s]}" fill-opacity="${on ? 1 : 0.35}" stroke="#141414" stroke-width="2"/><text x="${(cx + (r - 18) * Math.cos(a)).toFixed(1)}" y="${(cy + (r - 18) * Math.sin(a) + 3).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="#141414">${s[0].toUpperCase() + s.slice(1, 3)}</text>`; }).join('');
    const ing = p.ingredient; const dot = ing.climateThreat ? '#e76f51' : ing.resilient ? GREEN : '#adb5bd';
    const skin = p.tone.hex; const ink = inkOn(skin); const lvl = p.sun.level;
    const scale = RISK_COL.map((c, i) => `<rect x="${24 + i * 32}" y="212" width="30" height="14" fill="${c}" fill-opacity="${i === lvl ? 1 : 0.35}"/><text x="${39 + i * 32}" y="222" text-anchor="middle" font-size="8" fill="#141414">${['I', 'II', 'III', 'IV', 'V', 'VI'][i]}</text>`).join('');
    const at = 24 + ['I', 'II', 'III', 'IV', 'V', 'VI'].indexOf(p.sun.type) * 32 + 15;
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Season and sun">
      <rect width="240" height="300" rx="14" fill="#1b263b"/>${wedges}
      <circle cx="${cx}" cy="${cy}" r="26" fill="#f5f5f5" stroke="${dot}" stroke-width="5"/>
      <text x="${cx}" y="${cy + 3}" text-anchor="middle" font-size="8" font-weight="700" fill="#141414">${esc(short(ing.name, 12))}</text>
      <text x="120" y="204" text-anchor="middle" font-size="8" fill="#f5f5f5">white cast from untinted mineral SPF</text>${scale}
      <path d="M${at},230 l-5,8 h10 Z" fill="#f5f5f5"/>
      <rect x="24" y="246" width="192" height="36" rx="8" fill="${skin}"/>
      <text x="120" y="261" text-anchor="middle" font-size="9" font-weight="700" fill="${ink}">Type ${esc(p.sun.type)} · ${esc(p.tone.label)}</text>
      <text x="120" y="275" text-anchor="middle" font-size="8" fill="${ink}">risk: ${esc(short(p.sun.whiteCastRisk, 30))}</text></svg>
      <figcaption><strong>${esc(p.season.label)}: ${esc(short(p.season.theme, 34))}</strong><span>${esc(ing.name)} · ${ing.climateThreat ? 'climate threat in the guide' : ing.resilient ? `climate-resilient #${ing.resilient.rank}` : 'no climate note in the guides'}</span></figcaption></figure>`;
  }

  // ---- Plan cards ------------------------------------------------------------------------------
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  function renderPlan() {
    const p = ec.plan; const c = p.community; const g = p.ingredient; const h = p.hair; const s = p.sun;
    $('ecPreview').innerHTML = swapPanel(p) + kitPanel(p) + seasonPanel(p);
    $('ecSummary').innerHTML = `<p class="hl-big">Swap: ${esc(p.swap.sustainable)}</p><p>${esc(p.swap.impact ?? '')}</p>`;
    $('ecPlan').innerHTML = [
      card('Your swap', `<p><strong>${esc(p.swap.conventional)} → ${esc(p.swap.sustainable)}</strong></p>${p.swap.impact ? `<p>${esc(p.swap.impact)}</p>` : ''}<p>${esc(p.swap.tip)}</p><details><summary>Switching without waste</summary>${ul(p.routine)}</details>`),
      card(`${p.focus.label}: steps`, `${p.focus.intro ? `<p>${esc(p.focus.intro)}</p>` : ''}${ul(p.focus.steps)}${p.focus.extra ? `<p class="lib-note">${esc(p.focus.extra)}</p>` : ''}`),
      c.kit ? card(c.kit.title, `${c.tagline ? `<p><em>${esc(c.tagline)}</em></p>` : ''}${c.kit.products.map(it => `<p><strong>${esc(it.product)}</strong> · ${esc(it.use)}<br><span class="lib-note">${esc(it.packaging)}</span></p>`).join('')}${c.kit.packaging ? `<p>${esc(c.kit.packaging)}</p>` : ''}${c.kit.recipe ? `<details><summary>${esc(c.kit.recipe.name)}</summary><p>${esc(c.kit.recipe.ingredients)}</p><p>${esc(c.kit.recipe.method)}</p></details>` : ''}`) : '',
      card(`${c.label}: ingredients and threats`, c.ingredients.map(i => `<p><strong>${esc(i.name)}</strong>${i.profile ? ` · ${esc(i.profile)}` : ''}${i.threat ? `<br><span class="lib-note">${esc(i.threat)}</span>` : ''}</p>`).join('') + (c.sourcing.length ? `<details><summary>Sourcing notes</summary>${c.sourcing.map(x => `<p><strong>${esc(x.topic)}:</strong> ${esc(x.text)}</p>`).join('')}</details>` : '') + (c.brands.length ? `<p class="lib-note">Named in the guide: ${esc(c.brands.join('; '))}</p>` : '')),
      card(`${g.name}: where it comes from`, `<p>Used in the guides for: ${esc(g.communities.join(', '))}</p>${g.uses.map(u => `<details><summary>${esc(u.community)}${u.profile ? ` · ${esc(u.profile)}` : ''}</summary>${u.notes ? `<p>${esc(u.notes)}</p>` : ''}${ul(u.uses)}${u.threat ? `<p class="lib-note">${esc(u.threat)}</p>` : ''}</details>`).join('')}${g.sourcing ? `<p><strong>Origin:</strong> ${esc(g.sourcing.origin)}</p>${g.sourcing.ethics ? `<p>${esc(g.sourcing.ethics)}</p>` : ''}${g.sourcing.action ? `<p><strong>Look for:</strong> ${esc(g.sourcing.action)}</p>` : ''}` : ''}${g.ethical ? `<p>${esc(g.ethical.concern)}</p><p><strong>Better choice:</strong> ${esc(g.ethical.choice)}</p>${g.ethical.hidden ? `<p class="lib-note">${esc(g.ethical.hidden)}</p>` : ''}` : ''}${g.climateThreat ? `<p><strong>Climate threat:</strong> ${esc(g.climateThreat.threat)} ${esc(g.climateThreat.response)}</p>` : ''}${g.resilient ? `<p><strong>Climate-resilient (#${g.resilient.rank} of ${g.resilient.of}):</strong> ${esc(g.resilient.reason ?? g.resilient.level)}</p>` : ''}${g.deepDive ? `<details><summary>More on ${esc(g.deepDive.title)}</summary>${ul(g.deepDive.points)}</details>` : ''}`),
      card(`${p.season.label}`, `<p><em>${esc(p.season.theme)}</em></p>${ul(p.season.practices)}${p.season.focus ? `<p class="lib-note">${esc(p.season.focus)}</p>` : ''}`),
      card(`Wash day: ${h.label}`, `<p><strong>${esc(h.technique)}</strong></p><p>${esc(h.extend)}</p>${ul([...h.dryShampoo, ...h.styling])}${h.community ? `<p class="lib-note">${esc(c.label)} guide: ${esc(h.community)}</p>` : ''}`),
      card(`Sunscreen for Type ${s.type}`, `<p>${esc(s.reef)}</p><p><strong>For your skin type:</strong> ${esc(s.forYou)}</p><p>White-cast risk: ${esc(s.whiteCastRisk)}</p>${s.mineral ? `<p class="lib-note">${esc(s.mineral)}</p>` : ''}${s.stick ? `<p class="lib-note">Solid sunscreen stick: ${esc(s.stick)}</p>` : ''}`),
      card('Low-waste DIY', ul(p.diy) + (c.waterless.length ? `<p><strong>${esc(c.label)} waterless routine</strong></p>${ul(c.waterless.map(w => `${w.when}: ${w.what}`))}` : '')),
    ].join('');
  }

  async function replan() {
    const seq = ++ec.seq;
    try {
      const plan = await api('/api/eco/plan', ec.choices);
      if (seq !== ec.seq) return;
      ec.plan = plan;
      renderPlan();
    } catch (e) {
      $('ecPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function lookUp() {
    const q = $('ecTerm')?.value ?? ''; if (q.trim().length < 2) return;
    try {
      const r = await api(`/api/eco/term?q=${encodeURIComponent(q)}`);
      $('ecTermOut').innerHTML = r.entry ? `<strong>${esc(r.entry.term)}:</strong> ${esc(r.entry.definition)}` : `No eco glossary entry for "${esc(r.query)}".`;
    } catch (e) { $('ecTermOut').textContent = `Lookup failed (${e.message}).`; }
  }
  function select(id, text, values, current) {
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = ec.options; const c = ec.choices;
    $('ecControls').innerHTML = `
      ${select('ecSwap', 'What you use now', o.swaps, c.swap)}
      ${select('ecFocus', 'What matters most', o.focus, c.focus)}
      ${select('ecCommunity', 'Community', o.communities, c.community)}
      ${select('ecSeason', 'Season', o.seasons, c.season)}
      ${select('ecIngredient', 'Ingredient', o.ingredients, c.ingredient)}
      ${select('ecHair', 'Hair type', o.hair, c.hair)}
      ${select('ecFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('ecTone', 'Skin tone for the picture', o.tones, c.tone)}
      <label class="st-field"><span>Look up an eco term</span><input id="ecTerm" type="search" placeholder="e.g. upcycling, Nagoya" maxlength="60"></label>
      <button type="button" class="btn btn-secondary" id="ecTermGo">Look up</button><div id="ecTermOut" class="lib-note" aria-live="polite"></div>`;
  }
  async function openStudio() {
    try {
      if (!ec.options) ec.options = await api('/api/eco/options');
      if (!ec.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? ec.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : ec.options.tones[6];
        ec.choices = { swap: 'shampoo', community: pr.communityId || 'west_african', season: 'autumn', ingredient: 'shea-butter', focus: 'plastic', hair: 'type4', fitzpatrick: 'V', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('ecPlan').innerHTML = `<p class="lib-note">The Eco Beauty planner could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { ecSwap: 'swap', ecFocus: 'focus', ecCommunity: 'community', ecSeason: 'season', ecIngredient: 'ingredient', ecHair: 'hair', ecFitz: 'fitzpatrick', ecTone: 'tone' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !ec.choices) return;
    ec.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('keydown', e => { if (e.target.id === 'ecTerm' && e.key === 'Enter') { e.preventDefault(); lookUp(); } });
  document.addEventListener('click', e => {
    if (e.target.id === 'ecTermGo') { lookUp(); return; }
    const t = e.target.closest('[data-view="eco"], [data-open-eco]');
    if (!t) return;
    if (t.dataset.openEco !== undefined) { document.querySelector('.nav-link[data-view="eco"]')?.click(); return; }
    openStudio();
  });
})();
