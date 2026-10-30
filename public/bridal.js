/**
 * Bridal Countdown view. Pick the time left, Fitzpatrick type, hair type and wedding hair style,
 * community and a tone; the server builds the plan from the bridal guides and this view draws
 * the countdown with where you are, and a bride with your hair type and style and a three-stripe
 * foundation test on the jaw (too light, match, too dark). No photo is used.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const br = { options: null, plan: null, choices: null, seq: 0 };
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
  const SHORT = ['12m', '9m', '6m', '3m', '1m', '1w', 'Day'];

  // ---- Countdown: where you are, what is done, what is too late ----------------------------------
  function countdownPanel(p) {
    const c = p.countdown; const cx = 120; const cy = 120; const r = 80;
    const dots = SHORT.map((s, i) => {
      const a = -Math.PI / 2 + (i / (c.steps - 1)) * Math.PI * 1.5;
      const x = cx + r * Math.cos(a); const y = cy + r * Math.sin(a); const here = i === c.step;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${here ? 15 : 10}" fill="${i < c.step ? '#555' : here ? '#e0b354' : '#2a9d8f'}" stroke="${here ? '#fff' : 'none'}" stroke-width="3"/><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="${here ? 10 : 8}" fill="#141414" font-weight="700">${s}</text>`;
    }).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Countdown">
      <rect width="240" height="300" rx="14" fill="#1a1420"/>
      <path d="M${cx},${cy - r} A${r},${r} 0 1 1 ${cx - r},${cy}" stroke="#3a3040" stroke-width="4" fill="none"/>
      ${dots}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="26" font-weight="700" fill="#f5f5f5">${c.now.length}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10" fill="#f5f5f5">tasks now</text>
      <text x="120" y="236" text-anchor="middle" font-size="11" fill="${c.tooLate.length ? '#e76f51' : '#8d99ae'}">${c.tooLate.length} too late to start</text>
      <text x="120" y="254" text-anchor="middle" font-size="11" fill="${c.catchUp.length ? '#e9c46a' : '#8d99ae'}">${c.catchUp.length} to catch up on</text>
      <text x="120" y="280" text-anchor="middle" font-size="11" fill="#f5f5f5">${esc(p.timeLeft)}</text></svg>
      <figcaption><strong>${esc(c.phase)}</strong><span>${esc(p.community.label)} timeline</span></figcaption></figure>`;
  }

  // ---- Bride: hair type and style, foundation stripes on the jaw ----------------------------------
  function bridePanel(p) {
    const skin = p.tone.hex; const deep = lum(skin) < 0.18; const h = p.hair;
    const ink = deep ? mix(skin, '#ffffff', 0.72) : mix(skin, '#000000', 0.5);
    const hairCol = '#1d1412'; const halo = '#f5f5f5';
    const coil = { straight: 0, 2: 3, '3A': 5, '3B': 6, '3C': 7, '4A': 8, '4B': 9, '4C': 10 }[h.type];
    const updo = /Updo/.test(h.style); const out = /Out|Wash/.test(h.style); const long = /Weave|Fusion|Clip/.test(h.style);
    const curls = (cx0, cy0, n, rad) => [...Array(n)].map((_, i) => { const a = (i / n) * Math.PI * 2; const x = cx0 + rad * Math.cos(a); const y = cy0 + rad * 0.8 * Math.sin(a); return coil ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(11 - coil * 0.6).toFixed(1)}" fill="none" stroke="${halo}" stroke-width="0.7" opacity="0.7"/>` : ''; }).join('');
    const mass = updo
      ? `<ellipse cx="120" cy="40" rx="${30 + coil}" ry="${24 + coil}" fill="${hairCol}"/><path d="M84,92 Q84,48 120,46 Q156,48 156,92" fill="${hairCol}"/>${curls(120, 40, 10, 18)}`
      : out
        ? `<ellipse cx="120" cy="${84 - coil}" rx="${52 + coil * 3}" ry="${50 + coil * 2.4}" fill="${hairCol}"/>${curls(120, 84 - coil, 18, 40 + coil * 2)}`
        : `<path d="M80,${long ? 200 : 150} Q72,40 120,36 Q168,40 160,${long ? 200 : 150} Z" fill="${hairCol}"/>${coil ? [0, 1, 2, 3].map(i => `<path d="M${84 + i * 2},${70 + i * 30} q${coil},8 0,16 M${156 - i * 2},${70 + i * 30} q${-coil},8 0,16" stroke="${halo}" stroke-width="0.8" fill="none" opacity="0.7"/>`).join('') : ''}`;
    const stripes = [['too light', mix(skin, '#ffffff', 0.25)], ['match', skin], ['too dark', mix(skin, '#000000', 0.3)]]
      .map(([, col], i) => `<rect x="${131 + i * 7}" y="${100 + i * 2}" width="6" height="20" rx="2" fill="${col}" stroke="${ink}" stroke-width="1"/>`).join('');
    return `<figure class="hl-panel cx-panel"><svg viewBox="0 0 240 300" role="img" aria-label="Bride">
      <rect width="240" height="300" rx="14" fill="#3a3346"/>
      ${mass}
      <ellipse cx="120" cy="96" rx="34" ry="42" fill="${skin}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M104,90 q5,-4 10,0 M126,90 q5,-4 10,0" stroke="${ink}" stroke-width="2" fill="none"/><path d="M110,118 q10,5 20,0" stroke="#9b2335" stroke-width="3" fill="none"/>
      <path d="M100,${updo ? 70 : 64} q20,-10 40,0" stroke="#e0b354" stroke-width="2.5" fill="none"/>
      <rect x="108" y="136" width="24" height="20" fill="${skin}"/><path d="M60,300 Q60,170 120,160 Q180,170 180,300 Z" fill="#f4efe6"/>
      ${stripes}</svg>
      <figcaption><strong>${esc(h.style)}</strong><span>${esc(h.type === 'straight' ? 'Straight' : `Type ${h.type}`)} hair · ${esc(h.suited ? 'suits it' : 'not named for it')} · skin Type ${esc(p.skin.type)} · jaw test: the middle stripe matches</span></figcaption></figure>`;
  }

  function select(id, text, values, current) {
    return `<label class="st-field"><span>${esc(text)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = br.options; const c = br.choices;
    $('brControls').innerHTML = `
      ${select('brTime', 'Time until the wedding', o.time, c.time)}
      ${select('brFitz', 'Fitzpatrick type', o.fitzpatrick.map(f => ({ id: f, label: `Type ${f}` })), c.fitzpatrick)}
      ${select('brHairType', 'Hair type', o.hairTypes, c.hairType)}
      ${select('brStyle', 'Wedding hair', o.styles.map(s => ({ id: s.id, label: `${s.label}${s.kind === 'extensions' ? ' (extensions)' : ''}` })), c.style)}
      ${select('brCommunity', 'Community', o.communities, c.community)}
      ${select('brTone', 'Skin tone for the picture', o.tones, c.tone)}`;
  }
  const card = (title, body, cls = '') => (body ? `<article class="st-card${cls}"><h4>${esc(title)}</h4>${body}</article>` : '');
  function renderPlan() {
    const p = br.plan; const c = p.countdown; const s = p.skin; const h = p.hair; const cn = p.communityNotes;
    $('brPreview').innerHTML = countdownPanel(p) + bridePanel(p);
    $('brSummary').innerHTML = `<p class="hl-big">${esc(c.phase)}: ${c.now.length} things to do now${c.tooLate.length ? `, ${c.tooLate.length} too late to start` : ''}</p>${s.noActives ? '<p>Final stretch: no new products or actives.</p>' : ''}`;
    $('brPlan').innerHTML = [
      card(`Now (${c.phase})`, `${ul(c.now)}${cn.timeline ? `<p><strong>${esc(p.community.label)} timeline: ${esc(cn.timeline.label)}</strong></p>${ul(cn.timeline.tasks)}` : `<p class="lib-note">The ${esc(p.community.label)} guide has no separate list for this stage; the general list above applies.</p>`}${c.next ? `<details><summary>Next: ${esc(c.next.title)}</summary>${ul(c.next.tasks)}</details>` : ''}`),
      c.tooLate.length || c.catchUp.length ? card('Too late, or catch up', `${c.tooLate.length ? `<p><strong>Too late to start now</strong></p>${ul(c.tooLate)}` : ''}${c.catchUp.length ? `<p><strong>If not done yet, do it this week</strong></p>${ul(c.catchUp)}` : ''}`, c.tooLate.length ? ' hl-warn' : '') : '',
      card(`Skin: ${s.group} (Type ${s.type})`, `<p><strong>Morning</strong></p>${ul(s.am)}<p><strong>Evening</strong></p>${ul(s.pm)}${s.weekly.length ? `<p><strong>Weekly</strong></p>${ul(s.weekly)}` : ''}${s.monthlyPro.length ? `<p><strong>With a professional</strong></p>${ul(s.monthlyPro)}` : ''}${s.note ? `<p class="lib-note">${esc(s.note)}</p>` : ''}<p><strong>Laser hair removal for your type:</strong> safe ${esc(s.safeLasers.join(', '))}${s.unsafeLasers.length ? `; not safe ${esc(s.unsafeLasers.join(', '))}` : ''}</p><details><summary>Watch for, and foundation matching</summary>${ul(s.challenges)}${ul(s.foundationTips)}</details>`),
      card(`Hair: ${h.style}`, `<p>${esc(h.description)}</p><p>${esc(h.how)}</p>${h.suitableTypes ? `<p><strong>Named for:</strong> ${esc(h.suitableTypes.join(', '))}${h.suited ? '' : ` (not ${esc(h.type)})`}</p>` : ''}${h.alternatives.length ? `<p><strong>Also named for your hair:</strong> ${esc(h.alternatives.join(', '))}</p>` : ''}${h.accessories ? `<p><strong>Accessories:</strong> ${esc(h.accessories)}</p>` : ''}${h.prep ? `<details><summary>Natural hair prep</summary>${h.prep.map(x => `<p><strong>${esc(x.timing)}</strong></p>${ul(x.tasks)}`).join('')}</details>` : ''}`, h.suited ? '' : ' hl-warn'),
      card('Touch-up kit', `${ul(p.kit.general.map(x => `${x.item}: ${x.use}`))}<p><strong>${esc(p.community.label)} additions</strong></p>${ul(cn.kit.essential)}${cn.kit.extras.map(x => `<p><strong>For ${esc(x.for)}</strong></p>${ul(x.items)}`).join('')}<p class="lib-note">${esc(p.kit.carrier)}</p>`),
      card(`${p.community.label} wedding traditions`, `<p>${esc(cn.makeup)}</p><p><strong>Wedding styles:</strong> ${esc(cn.styles.join(', '))}</p><details><summary>Rituals, signature looks, hair, scent and choosing an artist</summary>${cn.rituals.map(r => `<p><strong>${esc(r.name)}</strong>${r.timing ? ` (${esc(r.timing)})` : ''}${r.description ? `<br>${esc(r.description)}` : ''}${r.caution ? `<br><em>${esc(r.caution)}</em>` : ''}</p>`).join('')}${ul(cn.signature)}${cn.hair.map(x => `<p><strong>${esc(x.style)}</strong>${x.description ? `<br>${esc(x.description)}` : ''}</p>`).join('')}${cn.perfume ? `<p><strong>Scent:</strong> ${esc(cn.perfume.scents.join(', '))}. ${esc(cn.perfume.apply)}</p>` : ''}${cn.ceremonies ? cn.ceremonies.map(x => `<p><strong>${esc(x.name)}</strong>${x.what ? `: ${esc(x.what)}` : ''}</p>`).join('') : ''}<p><strong>Choosing a makeup artist</strong></p>${ul([...p.artist, ...cn.artist])}</details>`),
    ].join('');
  }

  async function replan() {
    const seq = ++br.seq;
    try {
      const plan = await api('/api/bridal/plan', br.choices);
      if (seq !== br.seq) return;
      br.plan = plan;
      renderPlan();
    } catch (e) {
      $('brPlan').innerHTML = `<p class="lib-note">Could not build the plan (${esc(e.message)}).</p>`;
    }
  }
  async function openStudio() {
    try {
      if (!br.options) br.options = await api('/api/bridal/options');
      if (!br.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        const tone = pr.face?.hex ? br.options.tones.reduce((best, t) => (Math.abs(lum(t.hex) - lum(pr.face.hex)) < Math.abs(lum(best.hex) - lum(pr.face.hex)) ? t : best)) : br.options.tones[6];
        br.choices = { time: '6m', fitzpatrick: 'V', hairType: '4B', style: 'twist-out-braid-out', community: pr.communityId || 'west_african', tone: tone.id };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('brPlan').innerHTML = `<p class="lib-note">The Bridal Countdown could not load (${esc(e.message)}).</p>`;
    }
  }

  const FIELD = { brTime: 'time', brFitz: 'fitzpatrick', brHairType: 'hairType', brStyle: 'style', brCommunity: 'community', brTone: 'tone' };
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !br.choices) return;
    br.choices[k] = e.target.value;
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view="bridal"], [data-open-bridal]');
    if (!t) return;
    if (t.dataset.openBridal !== undefined) { document.querySelector('.nav-link[data-view="bridal"]')?.click(); return; }
    openStudio();
  });
})();
