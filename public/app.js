/**
 * MIRRR — Frontend Application
 * Your Taste. Your Looks. Your Style.
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  currentView: null,
  tasteChips: [],
  dnaAnswers: {},
  dnaResult: null,
  aesthetic: null,
  communityId: null,
  depthTarget: null,
  undertone: null,
  lengthPref: null,
  texturePref: null,
  communities: [],
  quizQuestions: [],
  depths: [],
  undertones: [],
  wigLengths: [],
  wigTextures: [],
  showDemoSelect: false,
};

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function boot() {
  await Promise.all([
    loadCommunities(),
    loadQuiz(),
    loadShadeOptions(),
    loadWigOptions(),
  ]);

  setupNav();
  setupHero();
  setupTasteForm();
  setupShadeForm();
  setupWigForm();

  showView('hero');
}

// ---------------------------------------------------------------------------
// Data loaders
// ---------------------------------------------------------------------------

async function loadCommunities() {
  try {
    const data = await api('/api/communities');
    state.communities = data.communities ?? [];
    populateCommunitySelects();
  } catch { /* non-fatal */ }
}

async function loadQuiz() {
  try {
    const data = await api('/api/quiz');
    state.quizQuestions = data.questions ?? [];
  } catch { /* non-fatal */ }
}

async function loadShadeOptions() {
  try {
    const data = await api('/api/shades/spectrum');
    state.depths = data.depth_labels ?? [];
    state.undertones = data.undertone_options ?? [];
    renderDepthButtons();
    renderUndertoneButtons();
  } catch { /* non-fatal */ }
}

async function loadWigOptions() {
  try {
    const data = await api('/api/wigs/catalogue');
    state.wigLengths = data.lengths ?? [];
    state.wigTextures = data.textures ?? [];
    renderWigLengthButtons();
    renderWigTextureButtons();
  } catch { /* non-fatal */ }
}

function populateCommunitySelects() {
  const selects = document.querySelectorAll(
    '#communitySelect, #shadeCommunitySelect, #wigCommunitySelect'
  );
  selects.forEach(sel => {
    const existing = sel.querySelector('option[value=""]');
    sel.innerHTML = '';
    if (existing) sel.appendChild(existing.cloneNode(true));
    else {
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '— Any —';
      sel.appendChild(blank);
    }
    state.communities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.emoji} ${c.label}`;
      sel.appendChild(opt);
    });
  });
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

function setupNav() {
  document.querySelectorAll('.nav-link[data-view]').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  // Scroll-based nav shadow
  window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('nav--scrolled', window.scrollY > 20);
  });
}

function setupHero() {
  document.getElementById('heroQuizBtn').addEventListener('click', () => showView('quiz'));
  document.getElementById('heroTasteBtn').addEventListener('click', () => showView('taste'));
}

function showView(viewId) {
  // Hide all views + hero
  document.querySelectorAll('.view, #hero').forEach(el => el.classList.add('hidden'));

  if (viewId === 'hero') {
    document.getElementById('hero').classList.remove('hidden');
    state.currentView = 'hero';
    return;
  }

  const el = document.getElementById(`view-${viewId}`);
  if (!el) return;
  el.classList.remove('hidden');
  state.currentView = viewId;

  // Lazy render quiz
  if (viewId === 'quiz' && state.quizQuestions.length) {
    renderQuiz();
  }

  // Mark nav active
  document.querySelectorAll('.nav-link').forEach(b => {
    b.classList.toggle('nav-link--active', b.dataset.view === viewId);
  });

  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------------------------------------------------------------------------
// Quiz view
// ---------------------------------------------------------------------------

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  if (container.dataset.rendered) return;
  container.dataset.rendered = '1';

  // Store option communities keyed by qid+optIdx for answer collection
  const optionCommunities = {};

  state.quizQuestions.forEach((q, qi) => {
    const div = document.createElement('div');
    div.className = 'quiz-question card';
    div.innerHTML = `
      <p class="quiz-q-label">Question ${qi + 1} of ${state.quizQuestions.length}</p>
      <h3 class="quiz-q-text">${q.prompt ?? q.question ?? ''}</h3>
      <div class="quiz-options" data-qid="${q.id}">
        ${q.options.map((opt, oi) => {
          const key = `${q.id}:${oi}`;
          optionCommunities[key] = opt.communities ?? [];
          return `
          <button class="quiz-option" data-qid="${q.id}" data-okey="${key}">
            ${q.emoji ? `<span class="opt-emoji">${q.emoji}</span>` : ''}
            <span class="opt-label">${opt.label}</span>
          </button>`;
        }).join('')}
      </div>
    `;
    container.appendChild(div);
  });

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary quiz-submit';
  submitBtn.id = 'quizSubmitBtn';
  submitBtn.textContent = 'Reveal My Beauty DNA →';
  submitBtn.disabled = true;
  container.appendChild(submitBtn);

  // Option click handler — answers are arrays of community IDs for scoreDNA
  container.addEventListener('click', e => {
    const btn = e.target.closest('.quiz-option');
    if (!btn) return;
    const qid = btn.dataset.qid;
    const okey = btn.dataset.okey;

    // Deselect siblings
    container.querySelectorAll(`.quiz-option[data-qid="${qid}"]`).forEach(b =>
      b.classList.remove('quiz-option--selected')
    );
    btn.classList.add('quiz-option--selected');
    state.dnaAnswers[qid] = optionCommunities[okey] ?? [];

    // Enable submit when all answered
    submitBtn.disabled = Object.keys(state.dnaAnswers).length < state.quizQuestions.length;
  });

  submitBtn.addEventListener('click', submitQuiz);
}

async function submitQuiz() {
  const btn = document.getElementById('quizSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Reading your DNA…';

  try {
    const result = await api('/api/dna/score', 'POST', { answers: state.dnaAnswers });
    state.dnaResult = result;
    state.communityId = result.topCommunity?.id ?? null;
    renderQuizResult(result);
  } catch (err) {
    toast('Could not score quiz — ' + (err.message ?? 'Unknown error'), 'error');
    btn.disabled = false;
    btn.textContent = 'Reveal My Beauty DNA →';
  }
}

function renderQuizResult(result) {
  const container = document.getElementById('quizContainer');
  const resultEl = document.getElementById('quizResult');

  container.classList.add('hidden');
  resultEl.classList.remove('hidden');

  const topComId = result.topCommunity?.id ?? result.topCommunity;
  const runnerUpId = result.runnerUp?.id ?? result.runnerUp;
  const topCom = state.communities.find(c => c.id === topComId) ?? result.topCommunity;
  const runnerCom = runnerUpId
    ? (state.communities.find(c => c.id === runnerUpId) ?? result.runnerUp)
    : null;

  const seed = result.seedAesthetic ?? {};

  resultEl.innerHTML = `
    <div class="dna-result card">
      <div class="dna-hero">
        <div class="dna-emoji">${topCom?.emoji ?? '🌍'}</div>
        <h2 class="dna-title">${topCom?.label ?? 'Your Community'}</h2>
        ${topCom?.subLabel ? `<p class="dna-sub">${topCom.subLabel}</p>` : ''}
        ${runnerCom ? `<p class="dna-runner">With a touch of ${runnerCom.emoji} ${runnerCom.label}</p>` : ''}
      </div>

      <div class="aesthetic-bars">
        <h3 class="bars-title">Your Aesthetic DNA</h3>
        ${renderAestheticBar('Intensity', seed.intensity)}
        ${renderAestheticBar('Warmth', seed.warmth)}
        ${renderAestheticBar('Boldness', seed.boldness)}
        <div class="aesthetic-tags">
          ${seed.texture ? `<span class="tag">${seed.texture}</span>` : ''}
          ${seed.colour_palette ? `<span class="tag">${seed.colour_palette}</span>` : ''}
          ${seed.hair_vibe ? `<span class="tag">${seed.hair_vibe}</span>` : ''}
        </div>
      </div>

      <div class="dna-actions">
        <button class="btn btn-primary" id="dnaToTasteBtn">Get My Looks →</button>
        <button class="btn btn-secondary" id="dnaToShadeBtn">Find My Shades →</button>
        <button class="btn btn-ghost" id="dnaRetakeBtn">Retake Quiz</button>
      </div>
    </div>
  `;

  document.getElementById('dnaToTasteBtn').addEventListener('click', () => {
    showView('taste');
    // Pre-fill community
    const sel = document.getElementById('communitySelect');
    if (sel && topComId) sel.value = topComId;
  });

  document.getElementById('dnaToShadeBtn').addEventListener('click', () => showView('shade'));

  document.getElementById('dnaRetakeBtn').addEventListener('click', () => {
    state.dnaAnswers = {};
    state.dnaResult = null;
    resultEl.classList.add('hidden');
    container.classList.remove('hidden');
    container.removeAttribute('data-rendered');
    container.innerHTML = '';
    renderQuiz();
  });
}

function renderAestheticBar(label, value) {
  if (value === undefined || value === null) return '';
  const pct = Math.round((value ?? 0) * 100);
  return `
    <div class="aes-bar-row">
      <span class="aes-bar-label">${label}</span>
      <div class="aes-bar-track">
        <div class="aes-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="aes-bar-val">${pct}%</span>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Taste Profile view
// ---------------------------------------------------------------------------

function setupTasteForm() {
  const input = document.getElementById('tasteInput');
  const fetchBtn = document.getElementById('fetchLooksBtn');
  const demoBtn = document.getElementById('demoBtn');
  const demoSel = document.getElementById('demoSelect');

  // Chip input
  input?.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
      e.preventDefault();
      addChip(input.value.trim());
      input.value = '';
    }
  });

  fetchBtn?.addEventListener('click', fetchLooks);

  demoBtn?.addEventListener('click', () => {
    state.showDemoSelect = !state.showDemoSelect;
    demoSel.classList.toggle('hidden', !state.showDemoSelect);
    if (!state.showDemoSelect) {
      runDemo(demoSel.value || 'afrobeats');
    }
  });

  demoSel?.addEventListener('change', () => runDemo(demoSel.value));
}

function addChip(text) {
  if (state.tasteChips.includes(text)) return;
  if (state.tasteChips.length >= 20) {
    toast('Maximum 20 taste signals', 'warn');
    return;
  }
  state.tasteChips.push(text);
  renderChips();
  document.getElementById('fetchLooksBtn').disabled = false;
}

function removeChip(text) {
  state.tasteChips = state.tasteChips.filter(c => c !== text);
  renderChips();
  document.getElementById('fetchLooksBtn').disabled = state.tasteChips.length === 0;
}

function renderChips() {
  const container = document.getElementById('tasteChips');
  if (!container) return;
  container.innerHTML = state.tasteChips.map(c => `
    <span class="chip">
      ${c}
      <button class="chip-remove" data-chip="${c}" aria-label="Remove ${c}">✕</button>
    </span>
  `).join('');
  container.querySelectorAll('.chip-remove').forEach(btn =>
    btn.addEventListener('click', () => removeChip(btn.dataset.chip))
  );
}

async function fetchLooks() {
  if (state.tasteChips.length === 0) return;

  showTasteLoader(true);

  try {
    const communityId = document.getElementById('communitySelect')?.value || null;
    const result = await api('/api/agent/run', 'POST', {
      inputs: state.tasteChips,
      communityId: communityId || undefined,
      dnaAnswers: Object.keys(state.dnaAnswers).length ? state.dnaAnswers : undefined,
      depthTarget: state.depthTarget ?? undefined,
      undertone: state.undertone ?? undefined,
      lengthPref: state.lengthPref ?? undefined,
      texturePref: state.texturePref ?? undefined,
    });

    state.aesthetic = result.aesthetic;
    state.communityId = result.communityId;
    renderTasteResults(result);
  } catch (err) {
    toast('Error: ' + (err.message ?? 'Something went wrong'), 'error');
  } finally {
    showTasteLoader(false);
  }
}

async function runDemo(profile) {
  showTasteLoader(true);
  try {
    const result = await api('/api/agent/demo', 'POST', { profile });
    state.aesthetic = result.aesthetic;
    state.communityId = result.communityId;
    renderTasteResults(result);
  } catch (err) {
    toast('Demo error: ' + (err.message ?? ''), 'error');
  } finally {
    showTasteLoader(false);
    document.getElementById('demoSelect')?.classList.add('hidden');
    state.showDemoSelect = false;
  }
}

function showTasteLoader(show) {
  document.getElementById('tasteLoader')?.classList.toggle('hidden', !show);
  document.getElementById('tasteResults')?.classList.toggle('hidden', show);
}

function renderTasteResults(result) {
  const { aesthetic, looks, narration, narration_source, entities, tags, meta } = result;

  // Narration
  const narEl = document.getElementById('tasteNarration');
  if (narEl && narration) {
    narEl.innerHTML = `
      <p class="narration-badge">${meta?.qloo_powered ? '⚡ Qloo-Powered' : '✨ Demo Mode'} · via ${narration_source ?? 'template'}</p>
      <p class="narration-text">${narration}</p>
      ${entities?.length ? `
        <div class="entity-chips">
          ${entities.slice(0, 8).map(e => `<span class="tag">${e.name}</span>`).join('')}
        </div>
      ` : ''}
    `;
  }

  // Aesthetic bars
  const aesEl = document.getElementById('tasteAesthetic');
  if (aesEl && aesthetic) {
    aesEl.innerHTML = `
      <h3 class="bars-title">Your Aesthetic Profile</h3>
      ${renderAestheticBar('Intensity', aesthetic.intensity)}
      ${renderAestheticBar('Warmth', aesthetic.warmth)}
      ${renderAestheticBar('Boldness', aesthetic.boldness)}
      <div class="aesthetic-tags">
        ${aesthetic.texture ? `<span class="tag">${aesthetic.texture}</span>` : ''}
        ${aesthetic.colour_palette ? `<span class="tag">${aesthetic.colour_palette}</span>` : ''}
        ${aesthetic.hair_vibe ? `<span class="tag">${aesthetic.hair_vibe}</span>` : ''}
        ${(aesthetic.archetypes ?? []).map(a => `<span class="tag tag--arch">${a.replace(/_/g, ' ')}</span>`).join('')}
      </div>
    `;
  }

  // Looks grid
  const looksEl = document.getElementById('tasteLooks');
  if (looksEl && looks?.length) {
    looksEl.innerHTML = `
      <h2 class="section-title">Your Looks</h2>
      <div class="looks-grid-inner">
        ${looks.map(({ look, score }) => renderLookCard(look, score)).join('')}
      </div>
      <div class="looks-actions">
        <button class="btn btn-secondary" id="toLooksWigBtn">Match Wigs for These Looks →</button>
      </div>
    `;

    looksEl.querySelectorAll('.look-card').forEach(card => {
      card.addEventListener('click', () => openLookModal(card.dataset.lookId));
    });

    document.getElementById('toLooksWigBtn')?.addEventListener('click', () => {
      showView('wig');
      // Pre-populate wig form with current aesthetic context
      const wigSel = document.getElementById('wigCommunitySelect');
      if (wigSel && state.communityId) wigSel.value = state.communityId;
    });
  }

  document.getElementById('tasteResults')?.classList.remove('hidden');
}

function renderLookCard(look, score) {
  const scoreBar = Math.round((score ?? 0) * 100);
  return `
    <div class="look-card" data-look-id="${look.id}" role="button" tabindex="0" aria-label="View ${look.name} look details">
      <div class="look-card-header">
        <span class="look-emoji">${look.emoji ?? '✨'}</span>
        <div class="look-score-ring" title="${scoreBar}% match">
          <span class="look-score-num">${scoreBar}%</span>
        </div>
      </div>
      <h3 class="look-name">${look.name}</h3>
      <p class="look-arch">${look.archetype?.replace(/_/g, ' ') ?? ''}</p>
      <p class="look-desc">${look.description ?? ''}</p>
      <div class="look-tags">
        ${(look.tags ?? []).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <span class="look-cta">View Products →</span>
    </div>
  `;
}

async function openLookModal(lookId) {
  const modal = document.getElementById('lookModal');
  const content = document.getElementById('modalContent');
  if (!modal || !content) return;

  content.innerHTML = '<div class="modal-loading"><div class="spinner"></div></div>';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  try {
    const depthLabel = depthTargetToLabel(state.depthTarget);
    const data = await api(`/api/products/look/${lookId}?depth=${depthLabel}`);
    const products = data.products;

    content.innerHTML = `
      <div class="modal-look-header">
        <h2 id="modalTitle">${products.label}</h2>
        <p class="modal-depth-note">Products tuned for: <strong>${depthLabel.replace(/_/g, ' ')}</strong> depth</p>
      </div>
      <div class="product-list">
        ${products.products.map(p => `
          <div class="product-item">
            <div class="product-cat">
              <span class="product-cat-emoji">${getCategoryEmoji(p.category)}</span>
              <strong>${capitalise(p.category)}</strong>
            </div>
            <p class="product-formula">${p.formula}</p>
            ${p.shade_guidance ? `<p class="product-shade">🎨 Shade: <em>${p.shade_guidance}</em></p>` : ''}
            <p class="product-finish">Finish: ${p.finish}</p>
            ${p.tip ? `<p class="product-tip">💡 ${p.tip}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } catch {
    content.innerHTML = '<p class="modal-error">Could not load product details.</p>';
  }
}

function closeModal() {
  document.getElementById('lookModal')?.classList.add('hidden');
  document.body.style.overflow = '';
}

// ---------------------------------------------------------------------------
// Shade Finder view
// ---------------------------------------------------------------------------

function renderDepthButtons() {
  const container = document.getElementById('depthButtons');
  if (!container) return;
  container.innerHTML = state.depths.map(d => `
    <button class="depth-btn" data-depth="${d.id}" data-target="${d.depth_target}" title="${d.label}">
      <span class="depth-swatch" style="background:${d.hex ?? '#888'}"></span>
      <span class="depth-label">${d.label}</span>
    </button>
  `).join('');

  container.addEventListener('click', e => {
    const btn = e.target.closest('.depth-btn');
    if (!btn) return;
    container.querySelectorAll('.depth-btn').forEach(b => b.classList.remove('depth-btn--active'));
    btn.classList.add('depth-btn--active');
    state.depthTarget = parseInt(btn.dataset.target, 10);
  });
}

function renderUndertoneButtons() {
  const container = document.getElementById('undertoneButtons');
  if (!container) return;
  container.innerHTML = state.undertones.map(u => `
    <button class="chip-btn" data-val="${u.id}">${u.label}</button>
  `).join('');
  container.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    container.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('chip-btn--active'));
    btn.classList.add('chip-btn--active');
    state.undertone = btn.dataset.val;
  });
}

function setupShadeForm() {
  document.getElementById('findShadesBtn')?.addEventListener('click', findShades);
}

async function findShades() {
  if (!state.depthTarget) {
    toast('Please select your skin depth first', 'warn');
    return;
  }

  const communityId = document.getElementById('shadeCommunitySelect')?.value || null;

  try {
    const data = await api('/api/shades/find', 'POST', {
      depthTarget: state.depthTarget,
      undertone: state.undertone ?? undefined,
      communityId: communityId || undefined,
      topN: 6,
    });

    renderShadeResults(data.shades);
  } catch (err) {
    toast('Shade finder error: ' + (err.message ?? ''), 'error');
  }
}

function renderShadeResults(shades) {
  const resultsEl = document.getElementById('shadeResults');
  const spectrumEl = document.getElementById('shadeSpectrum');
  const cardsEl = document.getElementById('shadeCards');

  // Mini spectrum bar with depth markers
  spectrumEl.innerHTML = `
    <div class="spectrum-bar">
      ${shades.map(s => `
        <div class="spectrum-dot" style="background:${s.shade.hex}" title="${s.shade.label}"></div>
      `).join('')}
    </div>
  `;

  // Shade cards
  cardsEl.innerHTML = `
    <h3 class="section-title">Your Shade Matches</h3>
    <div class="shade-cards-inner">
      ${shades.map(({ shade, score, coverageNote }) => `
        <div class="shade-card">
          <div class="shade-swatch-lg" style="background:${shade.hex}"></div>
          <div class="shade-info">
            <strong class="shade-id">${shade.id}</strong>
            <span class="shade-label">${shade.label}</span>
            <div class="shade-undertones">
              ${(shade.undertones ?? []).map(u => `<span class="tag">${u}</span>`).join('')}
            </div>
            ${coverageNote ? `<p class="shade-note">${coverageNote}</p>` : ''}
            <div class="shade-match-bar">
              <div class="shade-match-fill" style="width:${Math.round(score * 100)}%"></div>
              <span class="shade-match-pct">${Math.round(score * 100)}% match</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="shade-cta-row">
      <button class="btn btn-secondary" id="shadeToWigBtn">Now Match Your Wig →</button>
    </div>
  `;

  resultsEl.classList.remove('hidden');

  document.getElementById('shadeToWigBtn')?.addEventListener('click', () => showView('wig'));
}

// ---------------------------------------------------------------------------
// Wig Matchmaker view
// ---------------------------------------------------------------------------

function renderWigLengthButtons() {
  const container = document.getElementById('wigLengthButtons');
  if (!container) return;
  container.innerHTML = `<button class="chip-btn chip-btn--active" data-val="">Any Length</button>` +
    (state.wigLengths ?? []).map(l => `
      <button class="chip-btn" data-val="${l.id}">${l.label}</button>
    `).join('');
  container.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    container.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('chip-btn--active'));
    btn.classList.add('chip-btn--active');
    state.lengthPref = btn.dataset.val || null;
  });
}

function renderWigTextureButtons() {
  const container = document.getElementById('wigTextureButtons');
  if (!container) return;
  container.innerHTML = `<button class="chip-btn chip-btn--active" data-val="">Any Texture</button>` +
    (state.wigTextures ?? []).map(t => `
      <button class="chip-btn" data-val="${t.id}">${t.label}</button>
    `).join('');
  container.addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    container.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('chip-btn--active'));
    btn.classList.add('chip-btn--active');
    state.texturePref = btn.dataset.val || null;
  });
}

function setupWigForm() {
  document.getElementById('matchWigsBtn')?.addEventListener('click', matchWigs);
}

async function matchWigs() {
  const communityId = document.getElementById('wigCommunitySelect')?.value || state.communityId || null;

  // Build aesthetic fallback
  const aesthetic = state.aesthetic ?? {
    intensity: 0.6, warmth: 0.6, boldness: 0.5,
    texture: 'shimmer', colour_palette: 'rich-earth',
    hair_vibe: 'natural-afro', archetypes: [],
  };

  try {
    const data = await api('/api/wigs/match', 'POST', {
      aesthetic,
      communityId: communityId || undefined,
      lengthPref: state.lengthPref ?? undefined,
      texturePref: state.texturePref ?? undefined,
      topN: 5,
    });
    renderWigResults(data.wigs);
  } catch (err) {
    toast('Wig match error: ' + (err.message ?? ''), 'error');
  }
}

function renderWigResults(wigs) {
  const resultsEl = document.getElementById('wigResults');
  const cardsEl = document.getElementById('wigCards');

  cardsEl.innerHTML = `
    <h3 class="section-title">Your Wig Matches</h3>
    <div class="wig-cards-inner">
      ${wigs.map(({ wig, score, reason }) => `
        <div class="wig-card">
          <div class="wig-card-top">
            <span class="wig-emoji">💇🏾</span>
            <div class="wig-match-pct">${Math.round(score * 100)}%</div>
          </div>
          <h3 class="wig-name">${wig.name}</h3>
          <p class="wig-desc">${wig.description ?? ''}</p>
          <div class="wig-meta">
            <span class="tag">${wig.texture}</span>
            <span class="tag">${wig.length}</span>
            <span class="tag">${wig.finish}</span>
          </div>
          <p class="wig-reason">✨ ${reason}</p>
          <div class="wig-colours">
            ${(wig.colours ?? []).map(c => `<span class="colour-dot" title="${c}" style="background:${colourToHex(c)}"></span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  resultsEl.classList.remove('hidden');
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('lookModal')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast toast--${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3500);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function api(path, method = 'GET', body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCategoryEmoji(cat) {
  const map = {
    foundation: '✨', concealer: '🌿', eyeshadow: '👁️', liner: '🖋️',
    lash: '🦋', contour: '🌑', highlight: '⭐', blush: '🌸', lip: '💋', setting: '🌟',
  };
  return map[cat] ?? '•';
}

function depthTargetToLabel(target) {
  if (!target) return 'medium';
  if (target <= 3)  return 'fair';
  if (target <= 8)  return 'light';
  if (target <= 13) return 'light_med';
  if (target <= 18) return 'medium';
  if (target <= 23) return 'medium_deep';
  if (target <= 27) return 'deep';
  return 'rich_deep';
}

function colourToHex(name) {
  const map = {
    black: '#111', brown: '#6B3A2A', 'dark-brown': '#3D1F0F',
    blonde: '#D4A843', auburn: '#8B2500', red: '#C0392B',
    burgundy: '#6B0F1A', platinum: '#E8E3D5', copper: '#B87333',
    ombre: '#8B5523', silver: '#A8A9AD', white: '#F5F0EB',
    natural: '#C68642', 'honey-blonde': '#D4956A',
  };
  return map[name?.toLowerCase()] ?? '#888';
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', boot);
