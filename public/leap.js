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
  // A real photographic model face (generated sample photo, nearest to the tone picked above) wearing
  // each city's palette, laid on by the same on-device photo engine as the try-on.
  function facePanel(p, L, i) {
    const bars = L.dims.map((d, k) => `<rect x="${30 + k * 48}" y="${40 - 28 * d.you}" width="9" height="${(28 * d.you).toFixed(1)}" fill="#6c757d"/><rect x="${40 + k * 48}" y="${40 - 28 * d.leap}" width="9" height="${(28 * d.leap).toFixed(1)}" fill="${DIM_COL[d.id]}"/><text x="${40 + k * 48}" y="50" text-anchor="middle" font-size="6.5" fill="#c9c9c9">${d.label.slice(0, 5)}</text>`).join('');
    const on = Number(p.choices.focus) === i;
    const pt = L.destination.portrait;
    const canvas = `<canvas data-lp-face="${i}" width="300" height="400" role="img" aria-label="${esc(L.destination.label)} version of ${esc(L.look.name)} on the model face nearest your tone"></canvas>`;
    // With a city portrait: the portrait leads, and the model face in your tone wearing this city's
    // palette sits beside it. Without one: the model face alone, as before.
    const photo = pt
      ? `<div class="lp-photo lp-photo--portrait" style="outline:${on ? '3px solid #ffd166' : 'none'}">
      <img class="lp-portrait" src="${esc(pt.src)}" alt="${esc(L.destination.label)}: ${esc(pt.shows)} — portrait" width="600" height="800" loading="lazy" decoding="async" data-lp-portrait="${esc(L.destination.id)}">
      <span class="lp-city">${esc(L.destination.label)}</span><span class="lp-gen">Generated photo, not a real person</span></div>
      <div class="lp-ontone">${canvas}<span>On the model face nearest your tone, in the ${esc(L.destination.label)} palette</span></div>`
      : `<div class="lp-photo" style="outline:${on ? '3px solid #ffd166' : 'none'}">
      ${canvas}
      <span class="lp-city">${esc(L.destination.label)}</span></div>`;
    return `<figure class="hl-panel cx-panel">${photo}
      <svg class="lp-bars" viewBox="0 0 240 70" role="img" aria-label="Your dimensions and the ${esc(L.destination.label)} leap">
      <rect width="240" height="70" rx="10" fill="#1b1b2f"/>${bars}
      <text x="120" y="64" text-anchor="middle" font-size="7" fill="#c9c9c9">grey = you · colour = your ${esc(L.destination.label)} leap</text></svg>
      <figcaption><strong>${esc(L.destination.label)}: ${esc(L.look.name)}</strong><span>${esc(clip(L.because[0] ?? 'Your taste is neutral here, so the city leads.', 120))}</span></figcaption></figure>`;
  }
  const pictureOf = pal => ({ lip: pal.lip.hex, lipFinish: pal.lip.finish ?? (pal.finish === 'glass' ? 'gloss' : pal.finish), lid: pal.lid.map(c => c.hex), liner: pal.liner ?? '', linerColour: '#111111', highlight: pal.highlight.hex, baseFinish: pal.base ?? '', intensity: pal.drama });
  const faceCache = new Map();
  async function modelFace(engine, mf) {
    if (faceCache.has(mf.id)) return faceCache.get(mf.id);
    const job = new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = mf.src; }).then(im => {
      const c = document.createElement('canvas'); c.width = 300; c.height = 400;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, 300, 400);
      const base = x.getImageData(0, 0, 300, 400);
      return { base, face: engine.findFace(base) };
    });
    faceCache.set(mf.id, job);
    return job;
  }
  async function paintFaces(p, seq) {
    try {
      const [engine, faces] = await Promise.all([import('./photo-engine.js'), import('./model-faces.js')]);
      const [toneL] = engine.hexToLab(p.tone.hex);
      const mf = faces.nearestModelFace(toneL);
      const { base, face } = await modelFace(engine, mf);
      const palettes = await Promise.all(p.leaps.map(L => api('/api/photo/palette', { picture: pictureOf(L.palette) }).catch(() => null)));
      if (seq !== lp.seq) return;
      p.leaps.forEach((L, i) => {
        const cv = document.querySelector(`canvas[data-lp-face="${i}"]`);
        if (!cv) return;
        const out = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
        if (face.ok && palettes[i]) engine.applyLook(out, face, palettes[i], { strength: 0.75, finish: 'natural' });
        cv.getContext('2d').putImageData(out, 0, 0);
        cv.dataset.modelFace = mf.id;
        cv.dataset.painted = face.ok && palettes[i] ? 'look' : 'plain';
      });
      const note = document.getElementById('lpFaceNote');
      const city = p.leaps.some(L => L.destination.portrait) ? ' City portraits are generated sample photos of women, not real people.' : '';
      if (note) note.textContent = `Faces: the ${mf.label} model face, nearest to the tone you picked. ${faces.MODEL_FACE_NOTE}${city}`;
    } catch { /* faces stay blank; the palette details below still read */ }
  }

  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  function renderPlan() {
    const p = lp.plan; const t = p.taste; const F = p.focus;
    $('lpPreview').innerHTML = pathPanel(p) + p.leaps.map((L, i) => facePanel(p, L, i)).join('') + '<p class="lib-note" id="lpFaceNote"></p><p class="photo-try"><button type="button" class="btn btn-primary photo-try-btn" id="lpPhotoTry">Try it on my photo or a model face</button><span>Upload, camera, or pick a model face. Your photo stays on this device.</span></p>';
    paintFaces(p, lp.seq);
    $('lpPhotoTry').addEventListener('click', () => {
      const L = p.leaps[Number(p.choices.focus) || 0] ?? p.leaps[0]; const pal = L.palette;
      window.dispatchEvent(new CustomEvent('mirrr:tryon', { detail: {
        name: `${L.destination.label}: ${L.look.name}`,
        picture: pictureOf(pal),
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
      ${select('lpTone', 'Skin tone (picks the model face)', o.tones, c.tone)}
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
