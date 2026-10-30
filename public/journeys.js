/**
 * Natural Hair Journeys, the second tab of the Hair Lab. Pick a journey (protective-style
 * rotation, locs, relaxed to natural, silk press, keeping length) and the details that matter
 * for it; the server lays the journey out over time from the hair guides, and this view draws
 * it as a timeline with a marker for where you are now.
 */
(() => {
  const PROFILE_KEY = 'mirrr.profile.v1';
  const hj = { options: null, plan: null, choices: null, seq: 0 };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const li = s => `<li>${esc(s)}</li>`;

  async function api(path, body) {
    const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  // Which controls change which journey; a control that would do nothing is not shown.
  const CONTROLS = {
    protective_rotation: ['hjTexture', 'hjHours', 'hjMonths'],
    locs: ['hjMethod', 'hjMonths'],
    transition: ['hjRelaxed', 'hjMonths'],
    silk_press: ['hjStrand'],
    length_retention: ['hjGoal', 'hjMonths'],
  };
  const MONTHS = { protective_rotation: [0, 1, 2, 3, 4, 5, 6], locs: [0, 3, 6, 9, 12, 18, 24, 30], transition: [0, 3, 6, 9, 12, 18, 24], length_retention: [0, 3, 6, 9, 12, 18, 24] };
  const LENGTHS = [5, 10, 15, 20, 30];

  function select(id, label, values, current) {
    return `<label class="st-field"><span>${esc(label)}</span><select id="${id}">${values.map(v => `<option value="${esc(v.id)}"${String(v.id) === String(current) ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>`;
  }
  function renderControls() {
    const o = hj.options; const c = hj.choices; const show = CONTROLS[c.journey];
    const opt = {
      hjTexture: () => select('hjTexture', 'Texture', o.textures, c.texture),
      hjHours: () => select('hjHours', 'Hours you can sit for an install', o.installHours.map(h => ({ id: h, label: `${h} hours or less` })), c.installHours),
      hjMethod: () => select('hjMethod', 'How you start them', o.locMethods, c.locMethod),
      hjRelaxed: () => select('hjRelaxed', 'Relaxed length still on', LENGTHS.map(n => ({ id: n, label: `${n} cm` })), c.relaxedCm),
      hjStrand: () => select('hjStrand', 'Your strands', o.strands, c.strand),
      hjGoal: () => select('hjGoal', 'Length you want to gain', LENGTHS.map(n => ({ id: n, label: `${n} cm` })), c.goalCm),
      hjMonths: () => select('hjMonths', c.journey === 'protective_rotation' ? 'Months into the rotation' : c.journey === 'locs' ? 'Months since you started' : 'Months in', MONTHS[c.journey].map(m => ({ id: m, label: `${m} month${m === 1 ? '' : 's'}` })), c.months),
    };
    $('hjControls').innerHTML = `
      ${select('hjJourney', 'Journey', o.journeys, c.journey)}
      ${select('hjCommunity', 'Community', o.communities, c.community)}
      ${show.map(k => opt[k]()).join('')}
      ${select('hjEdges', 'Edges', o.edges.map(e => ({ id: e, label: e === 'full' ? 'Full' : 'Thinning or tender' })), c.edges)}
      ${select('hjScalp', 'Scalp', o.scalp, c.scalp)}`;
  }

  // ---- Timeline ------------------------------------------------------------------------------
  const KIND = { style: '#c8a24a', break: '#4f7f6a', stage: '#8a6bb8', option: '#b5aea5', step: '#5a7fa8' };
  function drawTimeline(p) {
    const W = 640; const left = 10; const right = W - 10; const rowH = 30; const top = 24;
    const x = v => left + (right - left) * (v / p.total);
    const rows = p.timeline.map((t, i) => {
      const y = top + i * rowH; const x0 = x(t.from); const w = Math.max(4, x(t.to) - x0);
      const active = i === p.currentIndex;
      // Label inside the bar when it fits; otherwise beside it, in light text on the dark panel.
      const textW = t.label.length * 7 + 12;
      const inside = w >= textW;
      const after = x0 + w + 6 + textW <= right;
      const lx = inside ? x0 + 6 : after ? x0 + w + 6 : x0 - 6;
      return `<g><rect x="${x0.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="20" rx="6" fill="${KIND[t.kind] ?? '#888'}" opacity="${active ? 1 : 0.55}"${active ? ' stroke="#fff" stroke-width="2"' : ''}/>
        <text x="${lx.toFixed(1)}" y="${y + 14}" font-size="12" fill="${inside ? '#111' : '#e8e1d9'}"${!inside && !after ? ' text-anchor="end"' : ''}>${esc(t.label)}</text></g>`;
    });
    const unit = p.unit === 'steps' ? '' : ` ${p.unit}`;
    const ticks = p.unit === 'steps' ? '' : [0, Math.round(p.total / 2), p.total].map(v => `<text x="${x(v).toFixed(1)}" y="14" font-size="11" fill="#cfc6bd" text-anchor="${v === 0 ? 'start' : v === p.total ? 'end' : 'middle'}">${v}${unit}</text>`).join('');
    const h = top + p.timeline.length * rowH + 6;
    const now = p.now == null ? '' : `<line x1="${x(Math.min(p.now, p.total)).toFixed(1)}" x2="${x(Math.min(p.now, p.total)).toFixed(1)}" y1="18" y2="${h - 4}" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="4 3"/><text x="${Math.min(right - 30, x(Math.min(p.now, p.total)) + 4).toFixed(1)}" y="${h}" font-size="11" fill="#ff6b6b">you</text>`;
    $('hjTimeline').innerHTML = `<svg viewBox="0 0 ${W} ${h + 6}" role="img" aria-label="${esc(p.title)} timeline">${ticks}${rows.join('')}${now}</svg>`;
  }

  // ---- Plan ----------------------------------------------------------------------------------
  function summary(p) {
    switch (p.choices.journey) {
      case 'protective_rotation': return p.styles.length
        ? `<p class="hl-big">${p.styles.map(s => esc(s.name)).join(' → ')}</p><p>${p.total} weeks, with a break of at least ${hj.options.minBreakWeeks} weeks between installs.${p.current ? ` Now: <strong>${esc(p.current.label)}</strong>.` : ''}</p>${p.excluded.length ? `<p class="st-avoid">Left out while your edges recover: ${p.excluded.map(esc).join(', ')}</p>` : ''}`
        : `<p class="hl-big">No braided or twisted style fits</p><p>${esc(p.noStyles)}</p>`;
      case 'locs': return `<p class="hl-big">${esc(p.current.label)} stage · ${esc(p.method.name)}</p><p>${esc(p.current.note)}</p>${p.next ? `<p>Next: <strong>${esc(p.next.label)}</strong> in about ${p.next.inMonths} month${p.next.inMonths === 1 ? '' : 's'}.</p>` : ''}`;
      case 'transition': return `<p class="hl-big">${p.remainingMonths === 0 ? 'Relaxed ends grown out' : `About ${p.remainingMonths} more month${p.remainingMonths === 1 ? '' : 's'} to fully natural`}</p><p>${p.choices.months} months in ≈ ${p.grownCm} cm of new growth; ${p.choices.relaxedCm} cm of relaxed hair takes about ${p.monthsToAllNatural} months to grow past at about ${hj.options.cmPerMonth} cm a month.</p>`;
      case 'silk_press': return `<p class="hl-big">Max heat for you: ${esc(p.temperatures.yours.match(/\d[\d-]*°C \([^)]*\)/)?.[0] ?? p.temperatures.yours)}</p><p>${esc(p.temperatures.yours)}</p><p class="st-avoid">${esc(p.temperatures.danger)}</p>`;
      case 'length_retention': return `<p class="hl-big">About ${p.monthsToGoal} months to gain ${p.choices.goalCm} cm</p>${p.choices.months ? `<p>${p.choices.months} months in: about ${(p.choices.months * hj.options.cmPerMonth).toFixed(1)} cm grown if none broke off; ${p.choices.months >= p.monthsToGoal ? 'goal reached' : `about ${p.monthsToGoal - p.choices.months} months to go`}.</p>` : ''}<p>${esc(p.insight)}</p>`;
      default: return '';
    }
  }
  function renderPlan() {
    const p = hj.plan;
    drawTimeline(p);
    $('hjSummary').innerHTML = summary(p);
    const extra = p.choices.journey === 'protective_rotation'
      ? `${p.styles.length ? `<article class="st-card"><h4>Your styles</h4><ul>${p.styles.map(s => `<li><strong>${esc(s.name)}:</strong> install ${esc(s.install)}; keep in ${esc(s.longevity)}${s.mistakes.length ? `. Avoid: ${s.mistakes.map(esc).join('; ')}` : ''}</li>`).join('')}</ul></article>` : ''}
        <article class="st-card"><h4>Your hair under the styles · ${esc(p.texture.label)}</h4><p>${esc(p.texture.description)}</p>${p.texture.tips.length ? `<ul>${p.texture.tips.map(li).join('')}</ul>` : ''}</article>`
      : p.choices.journey === 'locs' ? `<article class="st-card"><h4>${esc(p.method.name)}</h4><p>${esc(p.method.description)}</p>${p.method.timeTo ? `<p><strong>Time to lock:</strong> ${esc(p.method.timeTo)}</p>` : ''}${p.method.maintenance ? `<p><strong>Upkeep:</strong> ${esc(p.method.maintenance)}</p>` : ''}<p>${esc(p.context)}</p></article>`
      : p.choices.journey === 'silk_press' ? `<article class="st-card"><h4>Signs of heat damage</h4><ul>${p.signs.map(li).join('')}</ul></article>`
      : p.choices.journey === 'length_retention' ? `<article class="st-card"><h4>What breaks length off</h4><ul>${[].concat(p.killers).slice(0, 6).map(k => li(typeof k === 'string' ? k : Object.values(k).join(': '))).join('')}</ul><p>${esc(p.shedding)}</p></article>`
      : '';
    $('hjPlan').innerHTML = `
      ${p.warnings.length ? `<article class="st-card hl-warn"><h4>Before you start</h4><ul>${p.warnings.map(w => `<li><strong>${esc(w.why)}:</strong> ${esc(w.text)}</li>`).join('')}</ul></article>` : ''}
      <article class="st-card"><h4>Timeline</h4><ol>${p.timeline.map(t => `<li><strong>${esc(t.label)}</strong>${p.unit === 'steps' ? '' : ` (${t.from}–${t.to} ${esc(p.unit)})`}: ${esc(t.note)}</li>`).join('')}</ol></article>
      ${extra}
      <article class="st-card"><h4>What to do</h4><ul>${[].concat(p.actions).slice(0, 8).map(a => li(typeof a === 'string' ? a : Object.values(a).join(': '))).join('')}</ul></article>
      <article class="st-card${p.scalp.seeDoctor ? ' hl-warn' : ''}"><h4>Scalp · ${esc(p.scalp.title)}</h4><ul>${p.scalp.points.map(li).join('')}</ul></article>
      <article class="st-card"><h4>${esc(p.community.label)} notes</h4>
        ${p.communityNotes.growth ? `<p>${esc(p.communityNotes.growth)}</p>` : ''}
        ${p.communityNotes.routine ? `<p>${esc(p.communityNotes.routine)}</p>` : ''}
        ${p.communityNotes.extensions ? `<p>${esc(p.communityNotes.extensions)}</p>` : ''}</article>`;
  }

  async function replan() {
    const seq = ++hj.seq;
    try {
      const plan = await api('/api/hairlab/journey', hj.choices);
      if (seq !== hj.seq) return;
      hj.plan = plan;
      renderPlan();
    } catch (e) {
      $('hjPlan').innerHTML = `<p class="lib-note">Could not build the journey (${esc(e.message)}).</p>`;
    }
  }

  async function openJourneys() {
    try {
      if (!hj.options) hj.options = await api('/api/hairlab/journey-options');
      if (!hj.choices) {
        let pr = {};
        try { pr = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { /* no saved profile */ }
        hj.choices = { journey: 'protective_rotation', community: pr.communityId || 'west_african', texture: 'type_4a', installHours: 4, months: 0, edges: 'full', scalp: 'none', locMethod: 'starter', strand: 'medium', relaxedCm: 15, goalCm: 10 };
      }
      renderControls();
      await replan();
    } catch (e) {
      $('hjPlan').innerHTML = `<p class="lib-note">Natural Hair Journeys could not load (${esc(e.message)}).</p>`;
    }
  }

  function showTab(tab) {
    document.querySelectorAll('[data-hl-tab]').forEach(b => { const on = b.dataset.hlTab === tab; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
    $('hlColourPane').classList.toggle('hidden', tab !== 'colour');
    $('hlJourneyPane').classList.toggle('hidden', tab !== 'journeys');
    if (tab === 'journeys') openJourneys();
  }

  const FIELD = { hjJourney: 'journey', hjCommunity: 'community', hjTexture: 'texture', hjHours: 'installHours', hjMonths: 'months', hjEdges: 'edges', hjScalp: 'scalp', hjMethod: 'locMethod', hjStrand: 'strand', hjRelaxed: 'relaxedCm', hjGoal: 'goalCm' };
  const NUMERIC = new Set(['installHours', 'months', 'relaxedCm', 'goalCm']);
  document.addEventListener('change', e => {
    const k = FIELD[e.target.id];
    if (!k || !hj.choices) return;
    hj.choices[k] = NUMERIC.has(k) ? Number(e.target.value) : e.target.value;
    if (k === 'journey') {
      if (!MONTHS[hj.choices.journey]?.includes(hj.choices.months)) hj.choices.months = 0;
      renderControls();
    }
    replan();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-hl-tab], [data-open-journeys]');
    if (!t) return;
    if (t.dataset.openJourneys !== undefined) {
      document.querySelector('.nav-link[data-view="hairlab"]')?.click();
      showTab('journeys');
      return;
    }
    showTab(t.dataset.hlTab);
  });
})();
