/**
 * Skin Clinic view. Pick a concern, your Fitzpatrick type, community and a skin tone; the server
 * builds the plan from the skin guides and this view draws an illustrated skin patch in that
 * Monk skin tone showing how the concern tends to look on it, and how it changes at the guide's
 * checkpoints. With photographic macro plates (studio-photo.js), each panel shows the same skin area
 * at that stage of the concern (now / weeks / months); with no plate, the drawn patch renders.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const sk = { options: null, plan: null, choices: null, seq: 0 };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const li = s => `<li>${esc(s)}</li>`;
  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  // ---- Colour ---------------------------------------------------------------------------------
  // '#rgb' and '#rrggbb' both work ('#000' used to parse as NaN and drop the outline it coloured)
  const hexRgb = h => { const s = String(h).replace('#', ''); const f = s.length === 3 ? [...s].map(c => c + c).join('') : s; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)); };
  const rgbHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

  /**
   * How each concern is drawn. On deeper skin, inflammation reads purple-brown or grey rather
   * than red (as the guides describe for acne, eczema and rosacea), so the tint depends on the tone.
   */
  function marks(concern, skin) {
    const deep = lum(skin) < 0.12;
    const S = (cx, cy, r, colour, t, extra = '') => ({ cx, cy, r, colour: mix(skin, colour, t), extra });
    const spots = (n, r, colour, t, seed) => Array.from({ length: n }, (_, i) => S(30 + ((i * 53 + seed) % 140), 30 + ((i * 37 + seed * 3) % 110), r + (i % 3), colour, t));
    switch (concern) {
      case 'marks': return spots(9, 5, '#140904', 0.55, 7);
      case 'melasma': return [S(60, 85, 26, '#140904', 0.5, 'blob'), S(140, 85, 26, '#140904', 0.5, 'blob'), S(100, 35, 22, '#140904', 0.45, 'blob'), S(100, 128, 12, '#140904', 0.45, 'blob')];
      case 'sun_damage': return spots(16, 3, '#3a2310', 0.4, 3);
      case 'acne': return [...spots(6, 5, deep ? '#4a1830' : '#c0392b', deep ? 0.45 : 0.5, 11), ...spots(4, 4, '#1f0f06', 0.35, 29)];
      case 'barrier': return spots(10, 9, '#ffffff', 0.22, 5).map(s => ({ ...s, extra: 'flake' }));
      case 'eczema': return [S(65, 90, 30, deep ? '#3a3a3a' : '#d46a6a', deep ? 0.35 : 0.35, 'blob'), S(140, 60, 22, deep ? '#3a3a3a' : '#d46a6a', 0.3, 'blob')];
      case 'rosacea': return [S(60, 90, 30, deep ? '#4a1830' : '#d9534f', deep ? 0.3 : 0.38, 'blob'), S(140, 90, 30, deep ? '#4a1830' : '#d9534f', deep ? 0.3 : 0.38, 'blob'), S(100, 80, 14, deep ? '#4a1830' : '#d9534f', 0.3, 'blob')];
      default: return [];
    }
  }
  function patch(title, note, skin, concern, strength) {
    const shapes = marks(concern, skin).map((m, i) => {
      const fill = mix(skin, m.colour, strength);
      if (m.extra === 'blob') return `<ellipse cx="${m.cx}" cy="${m.cy}" rx="${m.r * 1.3}" ry="${m.r * 0.8}" fill="${fill}" opacity="0.9" filter="url(#skBlur)"/>`;
      if (m.extra === 'flake') return `<path d="M${m.cx - m.r} ${m.cy} l${m.r} -${m.r / 2} l${m.r} ${m.r / 2} l-${m.r} ${m.r / 2}z" fill="${fill}" opacity="0.85"/>`;
      return `<circle cx="${m.cx}" cy="${m.cy}" r="${m.r}" fill="${fill}" filter="url(#skSoft)"/>`;
    }).join('');
    return `<figure class="hl-panel"><svg viewBox="0 0 200 160" role="img" aria-label="${esc(title)}"><defs><filter id="skBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter><filter id="skSoft"><feGaussianBlur stdDeviation="0.8"/></filter></defs><rect width="200" height="160" rx="14" fill="${skin}"/>${shapes}</svg><figcaption><strong>${esc(title)}</strong>${note ? `<span>${esc(note)}</span>` : ''}</figcaption></figure>`;
  }
  // Panel stage -> photo plate id (`<concern>-now|weeks|months`); the drawn patch is the fallback.
  function photoPatch(stage, title, note, skin, concern, strength) {
    const drawn = patch(title, note, skin, concern, strength);
    if (!window.StudioPhoto) return drawn;
    return window.StudioPhoto.panel({ studio: 'skin', id: `${concern}-${stage}`, fallback: drawn, w: 720, h: 720, alt: `${title}: ${concern.replace(/_/g, ' ')} skin close-up`, caption: `<strong>${esc(title)}</strong><span>${esc(note)}</span>` });
  }
  function drawPreview(p) {
    const skin = p.tone.hex;
    const c = p.choices.concern;
    const pts = p.timeline.points;
    const panels = [photoPatch('now', 'Now', p.tone.label, skin, c, 1)];
    // Fade only where the guide gives checkpoints; the strengths are illustrative, not measured.
    pts.slice(0, 2).forEach((pt, i) => panels.push(photoPatch(i === 0 ? 'weeks' : 'months', `After ${pt.text}`, i === 0 ? 'First improvement' : 'Most of the change', skin, c, i === 0 ? 0.6 : 0.25)));
    if (!pts.length) panels.push(photoPatch('weeks', 'With the routine', 'The guide gives no timeline for this', skin, c, 0.6));
    $('skPreview').innerHTML = panels.join('');
  }

  // ---- Controls ---------------------------------------------------------------------------------
  // Nothing is pre-selected: every dropdown opens on a disabled "Choose…" and shows a value only once
  // picked here. Until the first pick the studio shows its neutral base (no tint, no plan); after it,
  // fields still on "Choose…" fall back to a suggested value so the plan never sees undefined.
  const PICKED = new Set(); const OWN = new Set();
  const anyPicked = () => [...OWN].some(id => PICKED.has(id));
  function renderBase() {
    ++sk.seq; sk.plan = null;
    const put = (k, h) => { const el = $('sk' + k); if (el) el.innerHTML = h; };
    put('Preview', '');
    put('Summary', '<p class="lib-note choose-first">Choose your options above to see your plan.</p>');
    put('Plan', '');
  }
  function select(id, label, values, current) {
    OWN.add(id);
    return `<label class="st-field"><span>${esc(label)}</span><select id="${id}"><option value="" disabled${PICKED.has(id) ? '' : ' selected'}>Choose…</option>${values.map(v => `<option value="${esc(v.id)}"${PICKED.has(id) && String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = sk.options; const c = sk.choices;
    $('skControls').innerHTML = `
      ${select('skConcern', 'Concern', o.concerns, c.concern)}
      ${c.concern === 'acne' ? select('skAcne', 'How bad', o.acneLevels, c.acneLevel) : ''}
      ${select('skFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('skCommunity', 'Community', o.communities, c.community)}
      ${select('skTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }

  function renderPlan() {
    const p = sk.plan;
    drawPreview(p);
    const t = p.timeline;
    $('skSummary').innerHTML = `
      <p class="hl-big">${esc(p.title)}</p>
      ${t.text ? `<p><strong>How long:</strong> ${esc(t.text)}${t.source === 'general' ? ' <em>(general guide; your community’s guide has no timeline for this)</em>' : ''}</p>` : '<p>The guides give no timeline for this; judge it by how your skin feels, and see a dermatologist if it is not settling.</p>'}
      <p><strong>Sunscreen for Type ${esc(p.choices.fitzpatrick)}:</strong> ${esc(p.spf.type ?? 'Broad-spectrum SPF 30 or higher')}${p.spf.whiteCastRisk ? ` · White cast: ${esc(p.spf.whiteCastRisk)}` : ''}</p>`;
    const tier = x => `<div class="sk-tier sk-${x.tier}"><strong>${esc(x.label)}</strong><span>${x.items.map(esc).join(' · ')}</span></div>`;
    $('skPlan').innerHTML = `
      ${p.warnings.length ? `<article class="st-card hl-warn"><h4>Before you start</h4><ul>${p.warnings.map(w => `<li><strong>${esc(w.why)}:</strong> ${esc(w.text)}</li>`).join('')}</ul></article>` : ''}
      <article class="st-card"><h4>Morning</h4><ol>${p.routine.am.map(li).join('')}</ol><h4>Night</h4><ol>${p.routine.pm.map(li).join('')}</ol></article>
      ${['marks', 'melasma', 'sun_damage'].includes(p.choices.concern) ? `<article class="st-card"><h4>Ingredients for Type ${esc(p.choices.fitzpatrick)}</h4>${p.tiers.map(tier).join('')}</article>` : ''}
      <article class="st-card"><h4>Sunscreen picks</h4><ul>${p.spf.picks.map(x => `<li><strong>${esc(x.name)}</strong>${x.why ? ` · ${esc(x.why)}` : ''}</li>`).join('')}</ul>
        ${p.spf.visibleLight ? `<p>${esc(p.spf.visibleLight)}</p>` : ''}${p.spf.whiteCast ? `<p>${esc(p.spf.whiteCast)}</p>` : ''}<p>${esc(p.spf.reapply)}</p>${p.spf.melaninNote ? `<p>${esc(p.spf.melaninNote)}</p>` : ''}</article>
      ${p.notes.length ? `<article class="st-card"><h4>Good to know</h4><ul>${p.notes.map(li).join('')}</ul></article>` : ''}
      ${p.seeDerm.length ? `<article class="st-card hl-warn"><h4>See a dermatologist if</h4><ul>${p.seeDerm.map(li).join('')}</ul></article>` : ''}
      <article class="st-card"><h4>${esc(p.community.label)} notes</h4>${p.communityNotes.sensitive ? `<p>${esc(p.communityNotes.sensitive)}</p>` : ''}${p.communityNotes.sun ? `<p>${esc(p.communityNotes.sun)}</p>` : ''}</article>`;
  }

  async function replan() {
    const seq = ++sk.seq;
    try {
      const plan = await api('/api/skin/plan', sk.choices);
      if (seq !== sk.seq) return;
      sk.plan = plan;
      renderPlan();
    } catch (e) {
      $('skPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openClinic() {
    try {
      if (!sk.options) sk.options = await api('/api/skin/options');
      if (!sk.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        // Start from the saved face colour when there is one: the nearest Monk tone by lightness.
        const tone = pr.face?.hex ? sk.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : sk.options.tones[7];
        sk.choices = { concern: 'marks', fitzpatrick: 'V', community: pr.communityId || 'west_african', acneLevel: 'step1', tone: tone.id };
      }
      renderControls();
      if (anyPicked()) await replan(); else renderBase();
    } catch (e) {
      $('skPlan').innerHTML = `<p class="lib-note">The Skin Clinic could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { skConcern: 'concern', skAcne: 'acneLevel', skFitz: 'fitzpatrick', skCommunity: 'community', skTone: 'tone' };
  document.addEventListener('change', e => {
    if (OWN.has(e.target.id) && e.target.value !== '') PICKED.add(e.target.id);
    const k = FIELD[e.target.id];
    if (!k || !sk.choices) return;
    sk.choices[k] = e.target.value;
    if (k === 'concern') renderControls();
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view="skin"], [data-open-skin]');
    if (!t) return;
    if (t.dataset.openSkin !== undefined) { document.querySelector('.nav-link[data-view="skin"]')?.click(); return; }
    openClinic();
  });
})();
