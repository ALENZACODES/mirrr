/**
 * Taste Leap view: "your look, another culture". The server turns your taste (a labelled demo
 * profile, or your own Taste-page inputs through the cached Qloo pipeline) into an aesthetic vector
 * and leaps it into three cities. This view draws the taste path (which tags moved which dimension)
 * and the same face, in the tone you pick, wearing each city's version of your look.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const lp = { options: null, plan: null, choices: null, seq: 0 };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const li = s => `<li>${esc(s)}</li>`;
  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }
  const hexRgb = h => { const s = String(h).replace('#', ''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16)); };
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const shade = (h, t) => { const c = hexRgb(h).map(v => Math.max(0, Math.min(255, Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t)))); return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`; };
  const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
  const DIM_COL = { intensity: '#e63946', warmth: '#f4a261', boldness: '#9b5de5', texture: '#4cc9f0' };

  // ---- Panel 1: the taste path ---------------------------------------------------------------------
  function pathPanel(p) {
    const t = p.taste; const tags = t.path.slice(0, 6); const dims = p.leaps[0].dims;
    const ty = i => 70 + i * 30; const dy = i => 80 + i * 40;
    const DI = { intensity: 0, warmth: 1, boldness: 2, texture: 3 };
    const lines = tags.flatMap((g, i) => g.pushes.map(x => `<path d="M100,${ty(i)} C130,${ty(i)} 120,${dy(DI[x.dim])} 150,${dy(DI[x.dim])}" stroke="${x.dir > 0 ? '#95d5b2' : x.dir < 0 ? '#ff8fa3' : '#e0e0e0'}" stroke-width="${(1 + Math.min(3, g.weight)).toFixed(1)}" fill="none" opacity="0.85"/>`)).join('');
    const tagEls = tags.map((g, i) => `<rect x="10" y="${ty(i) - 10}" width="90" height="20" rx="10" fill="#3a3a5e"/><text x="55" y="${ty(i) + 4}" text-anchor="middle" font-size="8" fill="#fefae0">${esc(clip(g.tag, 18))}</text>`).join('');
    const dimEls = dims.map((d, i) => `<text x="152" y="${dy(i) - 8}" font-size="8" fill="#fefae0">${d.label}</text><rect x="152" y="${dy(i) - 4}" width="76" height="8" rx="4" fill="#3a3a5e"/><rect x="152" y="${dy(i) - 4}" width="${(76 * d.you).toFixed(1)}" height="8" rx="4" fill="${DIM_COL[d.id]}"/>`).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Your taste path">
      <rect width="240" height="300" rx="14" fill="#22223b"/>
      <text x="120" y="26" text-anchor="middle" font-size="10" font-weight="700" fill="#fefae0">${esc(clip(t.label, 34))}</text>
      <text x="120" y="42" text-anchor="middle" font-size="7.5" fill="${t.source === 'qloo' ? '#95d5b2' : '#ffd166'}">${esc(clip(t.badge, 52))}</text>
      ${lines}${tagEls}${dimEls}
      ${tags.length ? '' : '<text x="55" y="120" text-anchor="middle" font-size="8" fill="#c9c9c9">no tag moved a dimension</text>'}
      <text x="120" y="270" text-anchor="middle" font-size="8" fill="#c9c9c9">green raises · pink lowers · grey = shimmer</text>
      <text x="120" y="286" text-anchor="middle" font-size="8" fill="#c9c9c9">${esc(clip(`home look: ${p.home?.name ?? '—'}`, 46))}</text></svg>
      <figcaption><strong>Your taste path</strong><span>${esc(t.inputs.join(', '))}</span></figcaption></figure>`;
  }

  // ---- Panels 2-4: the same face in each city ------------------------------------------------------
  function facePanel(p, L, i) {
    const pal = L.palette; const skin = p.tone.hex; const id = `lpLid${i}`; const lids = pal.lid.length ? pal.lid : [{ hex: shade(skin, -0.3) }];
    const lip = pal.lip.hex ?? shade(skin, -0.25); const hl = pal.highlight.hex;
    const grad = `<linearGradient id="${id}" x1="0" x2="1">${lids.map((c, k) => `<stop offset="${lids.length === 1 ? 0 : k / (lids.length - 1)}" stop-color="${c.hex}"/>`).join('')}</linearGradient>`;
    const graphic = /graphic|geometric|art/i.test(pal.liner ?? ''); const wing = /wing|cat|flick/i.test(pal.liner ?? '');
    const lashL = 3 + 6 * pal.drama;
    const eye = (cx, s) => {
      const X = d => (cx + s * d).toFixed(1); const cy = 112;
      return `<path d="M${X(-17)},${cy} Q${cx},${cy - 22} ${X(19)},${cy - 2} Q${cx},${cy - 9} ${X(-17)},${cy} Z" fill="url(#${id})"/>
        <path d="M${X(-15)},${cy} Q${cx},${cy - 8} ${X(17)},${cy - 1} Q${cx},${cy + 7} ${X(-15)},${cy} Z" fill="#fbf7f2"/><circle cx="${X(1)}" cy="${cy - 1}" r="4.6" fill="#3b2418"/>
        <path d="M${X(-15)},${cy} Q${cx},${cy - 8} ${X(17)},${cy - 1}${wing || graphic ? ` L${X(graphic ? 31 : 26)},${cy - (graphic ? 12 : 8)}` : ''}" stroke="#111" stroke-width="${graphic ? 2.6 : 2}" fill="none"/>
        ${graphic ? `<path d="M${X(-12)},${cy - 15} Q${cx},${cy - 27} ${X(22)},${cy - 11}" stroke="#111" stroke-width="1.4" fill="none"/>` : ''}
        ${[0.2, 0.45, 0.7, 0.95].map(t => `<path d="M${(cx + s * (-12 + 28 * t)).toFixed(1)},${cy - 6} l${s * 2},-${lashL.toFixed(1)}" stroke="#111" stroke-width="1.1"/>`).join('')}`;
    };
    const shine = pal.finish === 'glass' ? `<ellipse cx="96" cy="142" rx="10" ry="4" fill="#fff" opacity="0.45"/><ellipse cx="144" cy="142" rx="10" ry="4" fill="#fff" opacity="0.45"/><path d="M110,181 Q120,184 130,181" stroke="#fff" stroke-width="2.4" opacity="0.7" fill="none" stroke-linecap="round"/>`
      : pal.finish === 'shimmer' ? [0, 1, 2, 3].map(k => `<circle cx="${84 + k * 24}" cy="${101 + (k % 2) * 3}" r="1.3" fill="#fff"/>`).join('') : '';
    const bars = L.dims.map((d, k) => `<rect x="${30 + k * 48}" y="${262 - 28 * d.you}" width="9" height="${(28 * d.you).toFixed(1)}" fill="#6c757d"/><rect x="${40 + k * 48}" y="${262 - 28 * d.leap}" width="9" height="${(28 * d.leap).toFixed(1)}" fill="${DIM_COL[d.id]}"/><text x="${40 + k * 48}" y="272" text-anchor="middle" font-size="6.5" fill="#c9c9c9">${d.label.slice(0, 5)}</text>`).join('');
    const on = Number(p.choices.focus) === i;
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="${esc(L.destination.label)} version">
      <defs>${grad}<radialGradient id="lpBl${i}"><stop offset="0" stop-color="${lip}" stop-opacity="${(0.25 + 0.4 * pal.drama).toFixed(2)}"/><stop offset="1" stop-color="${lip}" stop-opacity="0"/></radialGradient></defs>
      <rect width="240" height="300" rx="14" fill="#1b1b2f" stroke="${on ? '#ffd166' : 'none'}" stroke-width="3"/>
      <text x="120" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="#fefae0">${esc(L.destination.label)}</text>
      <path d="M92,190 L92,226 Q120,236 148,226 L148,190 Z" fill="${skin}"/>
      <path d="M52,74 Q120,8 188,74 L196,150 Q190,74 120,56 Q50,74 44,150 Z" fill="#2b1b14"/>
      <ellipse cx="120" cy="134" rx="62" ry="80" fill="${skin}"/>
      <ellipse cx="86" cy="150" rx="18" ry="12" fill="url(#lpBl${i})"/><ellipse cx="154" cy="150" rx="18" ry="12" fill="url(#lpBl${i})"/>
      <path d="M78,132 q8,-4 16,0 M146,132 q8,-4 16,0" stroke="${hl}" stroke-width="3" opacity="0.75" fill="none" stroke-linecap="round"/>
      <path d="M75,96 Q92,86 111,93 M165,96 Q148,86 129,93" stroke="#2b1b14" stroke-width="${(2.5 + 2.5 * L.vector.boldness).toFixed(1)}" fill="none" stroke-linecap="round"/>
      ${eye(96, 1)}${eye(144, -1)}
      <path d="M100,178 Q110,170 120,174 Q130,170 140,178 Q130,192 120,192 Q110,192 100,178 Z" fill="${lip}"/>${shine}
      <text x="120" y="230" text-anchor="middle" font-size="8.5" font-weight="700" fill="#fefae0">${esc(clip(L.look.name, 34))}</text>
      ${bars}
      <text x="120" y="290" text-anchor="middle" font-size="7" fill="#c9c9c9">grey = you · colour = your ${esc(L.destination.label)} leap</text></svg>
      <figcaption><strong>${esc(L.destination.label)}: ${esc(L.look.name)}</strong><span>${esc(clip(L.because[0] ?? 'Your taste is neutral here, so the city leads.', 120))}</span></figcaption></figure>`;
  }

  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  function renderPlan() {
    const p = lp.plan; const t = p.taste; const F = p.focus;
    $('lpPreview').innerHTML = pathPanel(p) + p.leaps.map((L, i) => facePanel(p, L, i)).join('') + '<p class="photo-try"><button type="button" class="btn btn-primary photo-try-btn" id="lpPhotoTry">Try it on my photo</button><span>Laid on your own face, on this device. Nothing is uploaded.</span></p>';
    $('lpPhotoTry').addEventListener('click', () => {
      const L = p.leaps[Number(p.choices.focus) || 0] ?? p.leaps[0]; const pal = L.palette;
      window.dispatchEvent(new CustomEvent('mirrr:tryon', { detail: {
        name: `${L.destination.label}: ${L.look.name}`,
        picture: { lip: pal.lip.hex, lipFinish: pal.lip.finish ?? (pal.finish === 'glass' ? 'gloss' : pal.finish), lid: pal.lid.map(c => c.hex), liner: pal.liner ?? '', linerColour: '#111111', highlight: pal.highlight.hex, baseFinish: pal.base ?? '', intensity: pal.drama },
      } }));
    });
    $('lpSummary').innerHTML = `<p class="hl-big">${esc(p.leaps.map(L => L.destination.label).join(' · '))}</p><p>${esc(t.label)} · ${esc(STR[p.strength.id] ?? p.strength.id)} · ${esc(p.tone.label)}</p>`;
    $('lpPlan').innerHTML = [
      p.note ? `<p class="lib-note">${esc(p.note)}</p>` : '',
      card('Where your taste comes from', `<p><strong>${esc(t.badge)}</strong>${t.cached ? ' <span class="lib-note">(cached: no new Qloo call)</span>' : ''}</p><p>Inputs: ${esc(t.inputs.join(', '))}</p><p class="lib-note">Tags: ${esc(t.tags.map(g => g.affinity != null ? `${g.name} (${g.affinity.toFixed(2)})` : g.name).join(', ') || 'none')}</p><p>Your vector: ${Object.entries(t.vector).map(([k, v]) => `${esc(k)} ${v}`).join(' · ')}</p>${p.home ? `<p>At home, your top look is <strong>${esc(p.home.name)}</strong>.</p>` : ''}`),
      card(`${F.destination.label}: ${F.look.name}`, `<p>${esc(F.look.description)}</p><p><strong>Why this version:</strong></p><ul>${F.because.map(li).join('') || li('Your taste is neutral on these dimensions, so the city leads.')}</ul>
        <p><strong>Palette:</strong> lids ${esc(F.palette.lid.map(x => x.name).join(', '))} (ordered by how close each is to your blended warmth ${F.vector.warmth}); lip ${esc(F.palette.lip.name)}${F.palette.lip.finish ? ` (${esc(F.palette.lip.finish)})` : ''}; liner ${esc(F.palette.liner ?? '—')}; finish ${esc(F.palette.finish)}.</p>
        ${F.sharedCulture.length ? `<p class="lib-note">Shared culture tags: ${esc(F.sharedCulture.join(', '))}</p>` : ''}
        ${F.alternatives.length ? `<p class="lib-note">Also in ${esc(F.destination.label)}: ${esc(F.alternatives.map(a => `${a.name} (${a.score})`).join(', '))}</p>` : ''}`),
      card('How the leap works', `<p>Each city's vector is the average of the looks the engine files under that culture. Your leap moves ${Math.round(p.strength.s * 100)} in 100 of the way from your vector to the city's, then ranks that city's looks against the blend and orders the look's own shadow tones by your blended warmth.</p><ul>${p.leaps.map(L => li(`${L.destination.label}: ${L.dims.map(d => `${d.label.toLowerCase()} ${d.you}→${d.leap}`).join(', ')}`)).join('')}</ul>`),
    ].join('');
  }
  const STR = { light: 'light leap', half: 'halfway leap', full: 'full leap' };

  function select(id, text, values, current) {
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = lp.options; const c = lp.choices; const d = o.destinations.map(x => ({ id: x.id, label: `${x.label} (${x.culture})` }));
    const names = [c.dest1, c.dest2, c.dest3].map(id => o.destinations.find(x => x.id === id)?.label ?? id);
    $('lpControls').innerHTML = `
      ${select('lpProfile', 'Taste', o.profiles, c.profile)}
      ${select('lpDest1', 'City 1', d, c.dest1)}${select('lpDest2', 'City 2', d, c.dest2)}${select('lpDest3', 'City 3', d, c.dest3)}
      ${select('lpStrength', 'How far to leap', o.strengths, c.strength)}
      ${select('lpTone', 'Skin tone for the faces', o.tones, c.tone)}
      ${select('lpFocus', 'Details for', names.map((n, i) => ({ id: String(i), label: n })), c.focus)}`;
  }
  function myInputs() {
    try { const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); return Array.isArray(p?.chips) ? p.chips.slice(0, 10) : []; } catch { return []; }
  }
  async function replan() {
    const seq = ++lp.seq;
    try {
      const body = { ...lp.choices }; if (body.profile === 'mine') body.inputs = myInputs();
      const plan = await api('/api/leap/plan', body);
      if (seq !== lp.seq) return;
      lp.plan = plan;
      renderPlan();
    } catch (e) {
      $('lpPlan').innerHTML = `<p class="lib-note">Could not build the leap (${esc(e.message)}).</p>`;
    }
  }
  async function openStudio() {
    try {
      if (!lp.options) lp.options = await api('/api/leap/options');
      if (!lp.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? lp.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : lp.options.tones[6];
        lp.choices = { profile: Array.isArray(pr.chips) && pr.chips.length ? 'mine' : 'afrobeats', dest1: 'lagos', dest2: 'seoul', dest3: 'dubai', strength: 'half', tone: tone.id, focus: '0' };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('lpPlan').innerHTML = `<p class="lib-note">Taste Leap could not load (${esc(e.message)}).</p>`;
    }
  }
  const FIELD = { lpProfile: 'profile', lpDest1: 'dest1', lpDest2: 'dest2', lpDest3: 'dest3', lpStrength: 'strength', lpTone: 'tone', lpFocus: 'focus' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !lp.choices) return;
    lp.choices[k] = e.target.value;
    if (k.startsWith('dest')) renderControls();
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view="leap"], [data-open-leap]');
    if (!t) return;
    if (t.dataset.openLeap !== undefined) { document.querySelector('.nav-link[data-view="leap"]')?.click(); return; }
    openStudio();
  });
})();
