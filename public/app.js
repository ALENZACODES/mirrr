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
      opt.textContent = c.label;
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
  // Clear any lingering error/warn toasts so they don't bleed across views
  const toastEl = document.getElementById('toast');
  if (toastEl) { toastEl.classList.remove('show'); toastEl.classList.add('hidden'); }

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
    // Reset button so it's ready if the user retakes the quiz
    btn.disabled = false;
    btn.textContent = 'Reveal My Beauty DNA →';
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

  const slug = (id) => String(id ?? '').replace(/_/g, '-');
  const topComImg = topComId ? COMMUNITY_IMAGES[slug(topComId)] : null;
  const runnerComImg = runnerUpId ? COMMUNITY_IMAGES[slug(runnerUpId)] : null;

  resultEl.innerHTML = `
    <div class="dna-result card">
      <div class="dna-hero dna-hero--big">
        ${topComImg
          ? `<img src="${topComImg}" alt="${topCom?.label ?? 'Community'}" class="dna-big-photo" />`
          : `<div class="dna-emoji">${topCom?.emoji ?? '🌍'}</div>`}
        <p class="dna-kicker">Your Beauty DNA</p>
        <h2 class="dna-title dna-title--big">${topCom?.label ?? 'Your Community'}</h2>
        ${topCom?.subLabel ? `<p class="dna-sub">${topCom.subLabel}</p>` : ''}
        ${runnerCom ? `<p class="dna-runner">
          ${runnerComImg ? `<img src="${runnerComImg}" alt="${runnerCom.label}" class="dna-runner-icon" />` : runnerCom.emoji}
          With a touch of ${runnerCom.label}
        </p>` : ''}
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

      <div class="dna-looks">
        <h3 class="bars-title">Looks made for you</h3>
        <div class="dna-looks-grid" id="dnaLooksGrid"><p class="dna-looks-loading">Finding your looks…</p></div>
      </div>

      <div class="dna-actions">
        <button class="btn btn-primary" id="dnaToTasteBtn">Get My Looks →</button>
        <button class="btn btn-secondary" id="dnaToShadeBtn">Find My Shades →</button>
        <button class="btn btn-ghost" id="dnaRetakeBtn">Retake Quiz</button>
      </div>
    </div>
  `;

  loadDnaLooks(topComId);

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
    // Toggle the preset selector visibility
    state.showDemoSelect = !state.showDemoSelect;
    demoSel.classList.toggle('hidden', !state.showDemoSelect);
    if (!state.showDemoSelect) {
      // Hide = user dismissed; run whatever is selected
      runDemo(demoSel.value || 'afrobeats');
    } else {
      // Show the selector with a label
      demoBtn.textContent = 'Run Demo →';
    }
  });

  demoSel?.addEventListener('change', () => {
    // Run immediately on selection
    runDemo(demoSel.value);
    demoSel.classList.add('hidden');
    state.showDemoSelect = false;
    demoBtn.textContent = 'Try a Demo';
  });
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

  // 30-second timeout: if live Qloo path hangs, abort and fall back to demo
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

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
    }, { signal: controller.signal });

    state.aesthetic = result.aesthetic;
    state.communityId = result.communityId;
    renderTasteResults(result);
  } catch (err) {
    if (err.name === 'AbortError') {
      toast('Taking too long — loading demo results instead', 'warn');
      const communityId = document.getElementById('communitySelect')?.value || 'afrobeats';
      try {
        const demo = await api('/api/agent/demo', 'POST', { profile: communityId || 'afrobeats' });
        state.aesthetic = demo.aesthetic;
        state.communityId = demo.communityId;
        renderTasteResults(demo);
      } catch (demoErr) {
        toast('Demo error: ' + (demoErr.message ?? ''), 'error');
      }
    } else {
      toast('Error: ' + (err.message ?? 'Something went wrong'), 'error');
    }
  } finally {
    clearTimeout(timeoutId);
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
      ${sourceBadgeHtml(meta, narration_source)}
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
    const tasteComImg = state.communityId ? COMMUNITY_IMAGES[state.communityId] : null;
    const tasteComData = state.communities.find(c => c.id === state.communityId);
    aesEl.innerHTML = `
      ${tasteComImg ? `<div class="taste-community-row">
        <img src="${tasteComImg}" alt="${tasteComData?.label ?? 'Community'}" class="dna-community-icon taste-com-icon" />
        <span class="taste-com-label">${tasteComData?.label ?? ''}</span>
      </div>` : ''}
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

// Community portrait icons — mapped by community slug
const COMMUNITY_IMAGES = {
  'black-american':    'community-black-american.webp',
  'east-african':      'community-east-african.webp',
  'north-african':     'community-north-african.webp',
  'south-african':     'community-south-african.webp',
  'west-african':      'community-west-african.webp',
  'arab':              'community-arab.webp',
  'caribbean':         'community-caribbean.webp',
  'central-asian':     'community-central-asian.webp',
  'east-asian':        'community-east-asian.webp',
  'indigenous':        'community-indigenous.webp',
  'latina':            'community-latina.webp',
  'mixed':             'community-mixed.webp',
  'pacific-islander':  'community-pacific-islander.webp',
  'south-asian':       'community-south-asian.webp',
  'southeast-asian':   'community-southeast-asian.webp',
};

// Editorial look images — mapped by look ID
const LOOK_IMAGES = {
  // Batch 1 — updated filenames
  afrobeats_concert:        'look-afrobeats-concert.webp',
  afropunk_edge:            'look-afropunk-edge.webp',
  amapiano_beat:            'look-amapiano-beat.webp',
  bollywood_bridal:         'look-bollywood-bridal.webp',
  dancehall_queen:          'look-dancehall-queen.webp',
  hip_hop_glam:             'look-hip-hop-glam.webp',
  gulf_glam:                'look-gulf-glam.webp',
  k_beauty_glass:           'look-k-beauty-glass.webp',
  latina_glam:              'look-latina-glam.webp',
  caribbean_carnival:       'look-caribbean-carnival.webp',
  // Batch 2 — updated filenames
  polynesian_warrior:       'look-polynesian-warrior.webp',
  persian_editorial:        'look-persian-editorial.webp',
  j_beauty:                 'look-j-beauty.webp',
  ethiopian_jewel:          'look-ethiopian-jewel.webp',
  desi_everyday_chic:       'look-desi-everyday-chic.webp',
  brazilian_carnival:       'look-brazilian-carnival.webp',
  afrofuturist_editorial:   'look-afrofuturist-editorial.webp',
  haitian_vodou_editorial:  'look-haitian-vodou-editorial.webp',
  // Batch 3
  black_tie_gala:           'look-black-tie-gala.webp',
  chinese_new_year:         'look-chinese-new-year.webp',
  moroccan_soiree:          'look-moroccan-soiree.webp',
  nollywood_red_carpet:     'look-nollywood-red-carpet.webp',
  nubian_queen:             'look-nubian-queen.webp',
  owambe_glam:              'look-owambe-glam.webp',
  soft_glam:                'look-soft-glam.webp',
  southeast_asian_glow:     'look-southeast-asian-glow.webp',
  thai_celestial:           'look-thai-celestial.webp',
  zulu_bridal:              'look-zulu-bridal.webp',
  // Batch 4
  date_night_drama:         'look-date-night-drama.webp',
  ghanaian_kente_glam:      'look-ghanaian-kente-glam.webp',
  xhosa_glam:               'look-xhosa-glam.webp',
  afro_glam_editorial:      'look-afro-glam-editorial.webp',
  congolese_sapeur:         'look-congolese-sapeur.webp',
  // Batch 5
  amazigh_berber:           'look-amazigh-berber.webp',
  black_girl_natural:       'look-black-girl-natural.webp',
  hbcu_homecoming:          'look-hbcu-homecoming.webp',
  kenyan_nairobi_chic:      'look-kenyan-nairobi-chic.webp',
  somali_glam:              'look-somali-glam.webp',
  y2k_revival:              'look-y2k-revival.webp',
  // Batch 6
  arab_chic:                'look-arab-chic.webp',
  diwali_festive:           'look-diwali-festive.webp',
  eid_glam:                 'look-eid-glam.webp',
  mehndi_bridal:            'look-mehndi-bridal.webp',
  tamil_classical:          'look-tamil-classical.webp',
  turkish_glam:             'look-turkish-glam.webp',
  // Batch 7
  afro_latina:              'look-afro-latina.webp',
  filipina_glam:            'look-filipina-glam.webp',
  hawaiian_aloha:           'look-hawaiian-aloha.webp',
  indigenous_latina:        'look-indigenous-latina.webp',
  japanese_gyaru:           'look-japanese-gyaru.webp',
  // Batch 8
  blasian_editorial:        'look-blasian-editorial.webp',
  central_asian_steppe:     'look-central-asian-steppe.webp',
  clean_minimal:            'look-clean-minimal.webp',
  festival_glitter:         'look-festival-glitter.webp',
  first_nations_powwow:     'look-first-nations-powwow.webp',
  graduation_glow:          'look-graduation-glow.webp',
  indo_arabian_fusion:      'look-indo-arabian-fusion.webp',
  mixed_heritage_luminous:  'look-mixed-heritage-luminous.webp',
  office_power:             'look-office-power.webp',
  wedding_guest_universal:  'look-wedding-guest-universal.webp',
};

// Shade swatch images — mapped by shade ID
const SHADE_IMAGES = {
  // Fair
  F01: 'shade-F01.webp',
  F02: 'shade-F02.webp',
  F03: 'shade-F03.webp',
  F04: 'shade-F04.webp',
  F05: 'shade-F05.webp',
  F06: 'shade-F06.webp',
  // Light
  L07: 'shade-L07.webp',
  L08: 'shade-L08.webp',
  L09: 'shade-L09.webp',
  L10: 'shade-L10.webp',
  L11: 'shade-L11.webp',
  L12: 'shade-L12.webp',
  L13: 'shade-L13.webp',
  // Light-Medium
  LM14: 'shade-LM14.webp',
  LM15: 'shade-LM15.webp',
  LM16: 'shade-LM16.webp',
  LM17: 'shade-LM17.webp',
  LM18: 'shade-LM18.webp',
  LM19: 'shade-LM19.webp',
  LM20: 'shade-LM20.webp',
  // Medium
  M21: 'shade-M21.webp',
  M22: 'shade-M22.webp',
  M23: 'shade-M23.webp',
  M24: 'shade-M24.webp',
  M25: 'shade-M25.webp',
  M26: 'shade-M26.webp',
  M27: 'shade-M27.webp',
  M28: 'shade-M28.webp',
  // Medium-Deep
  MD29: 'shade-MD29.webp',
  MD30: 'shade-MD30.webp',
  MD31: 'shade-MD31.webp',
  MD32: 'shade-MD32.webp',
  MD33: 'shade-MD33.webp',
  MD34: 'shade-MD34.webp',
  MD35: 'shade-MD35.webp',
  MD36: 'shade-MD36.webp',
  // Deep
  D37: 'shade-D37.webp',
  D38: 'shade-D38.webp',
  D39: 'shade-D39.webp',
  D40: 'shade-D40.webp',
  D41: 'shade-D41.webp',
  D42: 'shade-D42.webp',
  D43: 'shade-D43.webp',
  D44: 'shade-D44.webp',
  D45: 'shade-D45.webp',
  // Rich Deep
  RD46: 'shade-RD46.webp',
  RD47: 'shade-RD47.webp',
  RD48: 'shade-RD48.webp',
  RD49: 'shade-RD49.webp',
  RD50: 'shade-RD50.webp',
  // Mixed / Olive
  MX51: 'shade-MX51.webp',
  MX52: 'shade-MX52.webp',
  MX53: 'shade-MX53.webp',
  MX54: 'shade-MX54.webp',
  MX55: 'shade-MX55.webp',
  MX56: 'shade-MX56.webp',
  MX57: 'shade-MX57.webp',
  MX58: 'shade-MX58.webp',
  MX59: 'shade-MX59.webp',
  MX60: 'shade-MX60.webp',
};

// Wig portrait images — mapped by wig style ID
const WIG_IMAGES = {
  kinky_coily_afro:    'wig-kinky_coily_afro.webp',
  big_chop_fro:        'wig-big_chop_fro.webp',
  twist_out_natural:   'wig-twist_out_natural.webp',
  faux_locs:           'wig-faux_locs.webp',
  butterfly_locs:      'wig-butterfly_locs.webp',
  loc_wig:             'wig-loc_wig.webp',
  sister_locs:         'wig-sisterlocks.webp',
  knotless_box_braids: 'wig-knotless_box_braids.webp',
  goddess_braids:      'wig-goddess_braids.webp',
  senegalese_twists:   'wig-senegalese_twists.webp',
  // Batch 10
  bone_straight_long:  'wig-bone_straight_long.webp',
  silk_press_natural:  'wig-silk_press_natural.webp',
  high_pony_sleek:     'wig-high_pony_sleek.webp',
  curly_ombre:         'wig-curly_ombre.webp',
  kinky_curly_mix:     'wig-kinky_curly_mix.webp',
  water_wave:          'wig-water_wave.webp',
  indian_remy_wavy:    'wig-indian_remy_wavy.webp',
  bollywood_blowout:   'wig-bollywood_blowout.webp',
  slicked_bun:         'wig-slicked_bun.webp',
  coloured_wig:        'wig-coloured_wig.webp',
  // Batch 11
  beach_wave_medium:   'wig-beach_wave_medium.webp',
  blunt_lob:           'wig-blunt_lob.webp',
  curtain_bang_layers: 'wig-curtain_bang_layers.webp',
  highlighted_balayage:'wig-highlighted_balayage.webp',
  khaleeji_blowout:    'wig-khaleeji_blowout.webp',
  kpop_idol_straight:  'wig-kpop_idol_straight.webp',
  loose_deep_wave:     'wig-loose_deep_wave.webp',
  peruvian_body_wave:  'wig-peruvian_body_wave.webp',
  sleek_bob:           'wig-sleek_bob.webp',
  ultra_silky_xl:      'wig-ultra_silky_xl.webp',
  // Batch 12
  coloured_wig_silver: 'wig-coloured_wig_silver.webp',
  afro_editorial:      'wig-afro_editorial.webp',
  box_braids_updo:     'wig-box_braids_updo.webp',
  cornrow_sleek:       'wig-cornrow_sleek.webp',
  jewelled_updo:       'wig-jewelled_updo.webp',
};

function renderLookCard(look, score) {
  const scoreBar = Math.round((score ?? 0) * 100);
  const imgFile  = LOOK_IMAGES[look.id];
  const imgHtml  = imgFile
    ? `<div class="look-card-img-wrap"><img src="${imgFile}" alt="${look.name}" class="look-card-img" loading="lazy" /></div>`
    : '';
  return `
    <div class="look-card" data-look-id="${look.id}" role="button" tabindex="0" aria-label="View ${look.name} look details">
      ${imgHtml}
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
  modal.classList.add('open');
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
  const modal = document.getElementById('lookModal');
  if (modal) {
    modal.classList.remove('open');
    modal.classList.add('hidden');
  }
  document.body.style.overflow = '';
}

// ---------------------------------------------------------------------------
// Shade Finder view
// ---------------------------------------------------------------------------

function renderDepthButtons() {
  const container = document.getElementById('depthButtons');
  if (!container) return;
  container.innerHTML = state.depths.map(d => `
    <button class="depth-btn" data-depth="${d.id}" data-target="${d.depth}" title="${d.label}">
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
      ${shades.map(({ shade, score, coverageNote }) => {
        const swatchImg = SHADE_IMAGES[shade.id];
        const swatchHtml = swatchImg
          ? `<div class="shade-swatch-lg shade-swatch-img"><img src="${swatchImg}" alt="${shade.label}" loading="lazy" /></div>`
          : `<div class="shade-swatch-lg" style="background:${shade.hex}"></div>`;
        return `
        <div class="shade-card">
          ${swatchHtml}
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
      `}).join('')}
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
  // getWigLengths() already returns { id:'any', label:'Any length' } as first item — no hardcoded dupe
  container.innerHTML = (state.wigLengths ?? []).map((l, i) => `
    <button class="chip-btn${i === 0 ? ' chip-btn--active' : ''}" data-val="${l.id === 'any' ? '' : l.id}">${l.label}</button>
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
  // getWigTextures() already returns { id:'any', label:'Any texture' } as first item — no hardcoded dupe
  container.innerHTML = (state.wigTextures ?? []).map((t, i) => `
    <button class="chip-btn${i === 0 ? ' chip-btn--active' : ''}" data-val="${t.id === 'any' ? '' : t.id}">${t.label}</button>
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
      ${wigs.map(({ wig, score, reason }) => {
        const wigImgFile = WIG_IMAGES[wig.id];
        const wigImgHtml = wigImgFile
          ? `<div class="wig-card-img-wrap"><img src="${wigImgFile}" alt="${wig.name}" class="wig-card-img" loading="lazy" /></div>`
          : '';
        return `
        <div class="wig-card">
          ${wigImgHtml}
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
      `;
      }).join('')}
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
  el.className = `toast toast--${type} show`;
  setTimeout(() => {
    el.classList.remove('show');
    el.classList.add('hidden');
  }, 3500);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function api(path, method = 'GET', body, { signal } = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  if (signal) opts.signal = signal;
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
// Trending Artists
// ---------------------------------------------------------------------------

const TRENDING_REGION_LABELS = {
  west_african:   { label: 'West Africa', emoji: '🌍' },
  east_african:   { label: 'East Africa', emoji: '🦁' },
  black_american: { label: 'Black America', emoji: '✊🏾' },
  caribbean:      { label: 'Caribbean', emoji: '🌴' },
  south_asian:    { label: 'South Asian', emoji: '🌺' },
  arab:           { label: 'Arab World', emoji: '🌙' },
  latina:         { label: 'Latina', emoji: '🌹' },
  east_asian:     { label: 'East Asian', emoji: '✨' },
  south_african:  { label: 'South Africa', emoji: '🦅' },
};

let trendingData = null;
let activeRegion = 'west_african';

async function loadTrending() {
  try {
    const data = await api('/api/trending');
    trendingData = data.trending;
    renderTrendingTabs();
    renderTrendingGrid(activeRegion);
  } catch (err) {
    const grid = document.getElementById('trendingGrid');
    if (grid) grid.innerHTML = '<p class="trending-error">Could not load trending artists.</p>';
  }
}

function renderTrendingTabs() {
  const tabsEl = document.getElementById('trendingTabs');
  if (!tabsEl || !trendingData) return;

  const regions = Object.keys(trendingData);
  tabsEl.innerHTML = regions.map(r => {
    const meta = TRENDING_REGION_LABELS[r] ?? { label: r, emoji: '🌐' };
    return `
      <button class="trending-tab ${r === activeRegion ? 'trending-tab--active' : ''}"
              data-region="${r}" aria-label="${meta.label}">
        <span>${meta.emoji}</span>
        <span class="trending-tab-label">${meta.label}</span>
      </button>
    `;
  }).join('');

  tabsEl.querySelectorAll('.trending-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeRegion = btn.dataset.region;
      tabsEl.querySelectorAll('.trending-tab').forEach(b =>
        b.classList.toggle('trending-tab--active', b.dataset.region === activeRegion)
      );
      renderTrendingGrid(activeRegion);
    });
  });
}

function renderTrendingGrid(regionKey) {
  const grid = document.getElementById('trendingGrid');
  if (!grid || !trendingData) return;

  const region = trendingData[regionKey];
  if (!region) { grid.innerHTML = '<p class="trending-error">No data for this region.</p>'; return; }

  const { artists, qlooUsed, sourcesCount } = region;

  grid.innerHTML = `
    <div class="trending-meta">
      <span class="trending-source-badge ${qlooUsed ? 'badge--qloo' : 'badge--curated'}">
        ${qlooUsed ? '⚡ Qloo-Powered' : '📋 Curated'} · ${sourcesCount} source${sourcesCount > 1 ? 's' : ''} verified
      </span>
    </div>
    <div class="trending-cards">
      ${artists.map((artist, i) => `
        <button class="trending-card ${artist.anchor ? 'trending-card--anchor' : ''}"
                data-artist="${encodeURIComponent(artist.name)}"
                aria-label="Add ${artist.name} to your taste profile">
          <div class="trending-rank">${i + 1}</div>
          <div class="trending-info">
            <div class="trending-name">${artist.name}
              ${artist.rising ? '<span class="rising-badge">↑ Rising</span>' : ''}
              ${artist.anchor ? '<span class="anchor-badge">⭐</span>' : ''}
            </div>
            <div class="trending-genre">${artist.genre}</div>
            <div class="trending-region-label">${artist.region}</div>
          </div>
          <div class="trending-add" title="Add to taste profile">+</div>
        </button>
      `).join('')}
    </div>
    <p class="trending-cta">Tap an artist to add to your taste profile →</p>
  `;

  grid.querySelectorAll('.trending-card').forEach(card => {
    card.addEventListener('click', () => {
      const artistName = decodeURIComponent(card.dataset.artist);
      addChip(artistName);
      showView('taste');
      toast(`Added ${artistName} to your taste profile ✓`, 'info');
      card.classList.add('trending-card--added');
      card.querySelector('.trending-add').textContent = '✓';
    });
  });
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function bootWithTrending() {
  await boot();
  // Load trending in background after boot
  loadTrending();
  // Wire up new feature modals
  setupTryOn();
  setupStylist();
  setupShare();
  setupStylistPage();
}

// ===========================================================================
// FEATURE 1 — LOOK TRY-ON (camera / photo upload + canvas blend overlay)
// ===========================================================================

const tryonState = {
  lookId: null,
  lookName: null,
  lookImg: null,
  stream: null,
  showingOriginal: false,
  blendMode: 'multiply',
};

function setupTryOn() {
  document.getElementById('tryonClose')?.addEventListener('click', closeTryOn);
  document.getElementById('tryonModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTryOn();
  });

  document.getElementById('tryonUploadBtn')?.addEventListener('click', () => {
    document.getElementById('tryonFileInput').click();
  });

  document.getElementById('tryonFileInput')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) loadTryOnPhoto(URL.createObjectURL(file));
  });

  document.getElementById('tryonCameraBtn')?.addEventListener('click', startCamera);
  document.getElementById('tryonCaptureBtn')?.addEventListener('click', captureCamera);

  document.getElementById('tryonOpacity')?.addEventListener('input', e => {
    document.getElementById('tryonOpacityVal').textContent = e.target.value + '%';
    applyOverlay();
  });

  document.querySelectorAll('.tryon-blend-btns .chip-btn')?.forEach(btn => {
    btn?.addEventListener('click', () => {
      document.querySelectorAll('.tryon-blend-btns .chip-btn').forEach(b =>
        b.classList.remove('chip-btn--active'));
      btn.classList.add('chip-btn--active');
      tryonState.blendMode = btn.dataset.blend;
      applyOverlay();
    });
  });

  document.getElementById('tryonBeforeAfterBtn')?.addEventListener('click', toggleBeforeAfter);
  document.getElementById('tryonSaveBtn')?.addEventListener('click', saveTryOnImage);
  document.getElementById('tryonRetakeBtn')?.addEventListener('click', () => {
    stopCamera();
    document.getElementById('tryonPreviewStep').classList.add('hidden');
    document.getElementById('tryonUploadStep').classList.remove('hidden');
    document.getElementById('tryonFileInput').value = '';
  });
}

function openTryOn(lookId, lookName) {
  tryonState.lookId = lookId;
  tryonState.lookName = lookName;
  tryonState.lookImg = null;
  tryonState.showingOriginal = false;

  const modal = document.getElementById('tryonModal');
  document.getElementById('tryonLookName').textContent = `Try On: ${lookName}`;
  document.getElementById('tryonUploadStep').classList.remove('hidden');
  document.getElementById('tryonPreviewStep').classList.add('hidden');
  document.getElementById('tryonCameraWrap').classList.add('hidden');
  document.getElementById('tryonFileInput').value = '';

  modal.classList.remove('hidden');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTryOn() {
  stopCamera();
  const modal = document.getElementById('tryonModal');
  modal.classList.remove('open');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

async function startCamera() {
  try {
    tryonState.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    });
    const video = document.getElementById('tryonVideo');
    video.srcObject = tryonState.stream;
    document.getElementById('tryonCameraWrap').classList.remove('hidden');
    document.querySelector('.tryon-photo-options').classList.add('hidden');
  } catch {
    toast('Camera access denied — please upload a photo instead', 'warn');
  }
}

function stopCamera() {
  tryonState.stream?.getTracks().forEach(t => t.stop());
  tryonState.stream = null;
  const video = document.getElementById('tryonVideo');
  if (video) video.srcObject = null;
}

function captureCamera() {
  const video = document.getElementById('tryonVideo');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  stopCamera();
  loadTryOnPhoto(canvas.toDataURL('image/jpeg', 0.92));
}

function loadTryOnPhoto(src) {
  const img = new Image();
  img.onload = () => {
    tryonState.userImg = img;
    const canvas = document.getElementById('tryonCanvas');
    const maxW = Math.min(500, window.innerWidth - 48);
    const scale = maxW / img.width;
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

    // Size overlay canvas to match
    const overlay = document.getElementById('tryonOverlay');
    overlay.width = canvas.width;
    overlay.height = canvas.height;

    document.getElementById('tryonUploadStep').classList.add('hidden');
    document.getElementById('tryonCameraWrap').classList.add('hidden');
    document.querySelector('.tryon-photo-options')?.classList.remove('hidden');
    document.getElementById('tryonPreviewStep').classList.remove('hidden');

    loadLookOverlay();
  };
  img.src = src;
}

function loadLookOverlay() {
  const imgFile = LOOK_IMAGES[tryonState.lookId];
  if (!imgFile) { applyOverlay(); return; }

  const lookImg = new Image();
  lookImg.onload = () => {
    tryonState.lookImg = lookImg;
    applyOverlay();
  };
  lookImg.onerror = () => applyOverlay();
  lookImg.src = imgFile;
}

function applyOverlay() {
  const canvas = document.getElementById('tryonCanvas');
  const overlay = document.getElementById('tryonOverlay');
  if (!canvas || !overlay || !tryonState.userImg) return;

  const ctx = canvas.getContext('2d');
  // Redraw base photo
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tryonState.userImg, 0, 0, canvas.width, canvas.height);

  if (tryonState.showingOriginal || !tryonState.lookImg) return;

  const opacity = parseInt(document.getElementById('tryonOpacity')?.value ?? 40) / 100;

  // Draw look overlay with blend mode on the overlay canvas
  const octx = overlay.getContext('2d');
  octx.clearRect(0, 0, overlay.width, overlay.height);
  octx.globalAlpha = opacity;
  octx.globalCompositeOperation = tryonState.blendMode === 'multiply' ? 'multiply' :
    tryonState.blendMode === 'soft-light' ? 'soft-light' :
    tryonState.blendMode === 'overlay' ? 'overlay' : 'screen';
  octx.drawImage(tryonState.lookImg, 0, 0, overlay.width, overlay.height);
}

function toggleBeforeAfter() {
  tryonState.showingOriginal = !tryonState.showingOriginal;
  const btn = document.getElementById('tryonBeforeAfterBtn');
  btn.textContent = tryonState.showingOriginal ? '✨ See With Look' : '⟷ Before / After';
  applyOverlay();
}

function saveTryOnImage() {
  // Composite canvas + overlay into one download
  const base = document.getElementById('tryonCanvas');
  const overlay = document.getElementById('tryonOverlay');
  const out = document.createElement('canvas');
  out.width = base.width;
  out.height = base.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(base, 0, 0);
  ctx.drawImage(overlay, 0, 0);

  // Add MIRRR watermark
  ctx.font = `bold ${Math.round(base.width / 20)}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('🪞 MIRRR', 12, base.height - 12);

  const link = document.createElement('a');
  link.download = `mirrr-${tryonState.lookId ?? 'look'}.jpg`;
  link.href = out.toDataURL('image/jpeg', 0.92);
  link.click();
  toast('Look saved!', 'info');
}

// ===========================================================================
// FEATURE 2 — BEFORE / AFTER on look cards (inline, no modal)
// ===========================================================================
// Wired via renderLookCard — each card gets a "Try On" button
// The before/after toggle is handled inside the tryon modal (Feature 1)

// ===========================================================================
// FEATURE 3 — AGENTIC STYLIST MODAL (multi-turn conversational refinement)
// ===========================================================================

const stylistState = {
  history: [],
  currentProfile: null,
  refinementCount: 0,
};

const STYLIST_OPENERS = [
  "What occasion are you dressing for?",
  "How bold do you want to go?",
  "Any colours you love right now?",
  "Should we lean more natural or editorial?",
];

const STYLIST_QUICK_PROMPTS = [
  "Make it more dramatic",
  "Show me something for a wedding",
  "Go more natural",
  "I want brighter colours",
  "Something for everyday",
  "More bold and editorial",
];

function setupStylist() {
  document.getElementById('stylistClose')?.addEventListener('click', closeStylist);
  document.getElementById('stylistModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeStylist();
  });
  document.getElementById('stylistSendBtn')?.addEventListener('click', sendStylistMessage);
  document.getElementById('stylistInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendStylistMessage();
  });
}

function openStylist(profile) {
  stylistState.history = [];
  stylistState.refinementCount = 0;
  stylistState.currentProfile = profile ?? state;

  const modal = document.getElementById('stylistModal');
  const msgsEl = document.getElementById('stylistMessages');
  msgsEl.innerHTML = '';
  document.getElementById('stylistInput').value = '';

  // Opening message
  const opener = STYLIST_OPENERS[Math.floor(Math.random() * STYLIST_OPENERS.length)];
  appendStylistMessage('stylist', `Hi! I'm your MIRRR stylist, powered by Qloo taste data. I can see your current look profile — let me refine it.\n\n${opener}`);

  // Quick prompt chips
  renderStylistQuickChips();

  modal.classList.remove('hidden');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeStylist() {
  const modal = document.getElementById('stylistModal');
  modal.classList.remove('open');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function appendStylistMessage(role, text) {
  const msgsEl = document.getElementById('stylistMessages');
  const div = document.createElement('div');
  div.className = `stylist-msg stylist-msg--${role}`;
  div.innerHTML = `<span class="stylist-msg-text">${text.replace(/\n/g, '<br>')}</span>`;
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function renderStylistQuickChips() {
  const chipsEl = document.getElementById('stylistQuickChips');
  if (!chipsEl) return;
  chipsEl.innerHTML = STYLIST_QUICK_PROMPTS.map(p =>
    `<button class="chip stylist-quick-chip" data-prompt="${p}">${p}</button>`
  ).join('');
  chipsEl.querySelectorAll('.stylist-quick-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('stylistInput').value = btn.dataset.prompt;
      sendStylistMessage();
    });
  });
}

async function sendStylistMessage() {
  const input = document.getElementById('stylistInput');
  const msg = input?.value?.trim();
  if (!msg) return;
  input.value = '';

  appendStylistMessage('user', msg);
  stylistState.history.push({ role: 'user', content: msg });
  stylistState.refinementCount++;

  const sendBtn = document.getElementById('stylistSendBtn');
  sendBtn.disabled = true;
  sendBtn.textContent = '…';

  appendStylistMessage('stylist', 'Refining your looks…');

  try {
    const result = await api('/api/agent/refine', 'POST', {
      message: msg,
      history: stylistState.history.slice(-6),
      currentAesthetic: state.aesthetic,
      communityId: state.communityId,
      tasteChips: state.tasteChips,
      refinementCount: stylistState.refinementCount,
    });

    // Remove the "thinking…" bubble
    const msgs = document.getElementById('stylistMessages');
    msgs.removeChild(msgs.lastElementChild);

    const reply = result.reply ?? "I've updated your look profile!";
    appendStylistMessage('stylist', reply);
    stylistState.history.push({ role: 'assistant', content: reply });

    if (result.looks?.length) {
      // Update the main results
      state.aesthetic = result.aesthetic ?? state.aesthetic;
      state.communityId = result.communityId ?? state.communityId;
      renderTasteResults(result);

      appendStylistMessage('stylist', `✨ I've refreshed your looks above — ${result.looks.length} new recommendations based on what you just told me.`);
    }
  } catch (err) {
    const msgs = document.getElementById('stylistMessages');
    if (msgs.lastElementChild?.textContent?.includes('Refining your looks')) {
      msgs.removeChild(msgs.lastElementChild);
    }
    // Graceful fallback with contextual response
    const fallbackReply = generateStylistFallback(msg, stylistState.refinementCount);
    appendStylistMessage('stylist', fallbackReply);
    stylistState.history.push({ role: 'assistant', content: fallbackReply });
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = '→';
  }
}

function generateStylistFallback(msg, turn) {
  const lc = msg.toLowerCase();
  if (lc.includes('wedding') || lc.includes('bridal'))
    return `For a wedding, I'd point you toward our Bollywood Bridal, Mehndi Bridal, or Zulu Bridal looks — all stunning for a ceremony. Try those from the Taste Profile → then come back and I'll refine further.`;
  if (lc.includes('dramatic') || lc.includes('bold'))
    return `Bold it is! Add "Nicki Minaj" or "Cardi B" to your taste chips — that'll push the algorithm toward high-drama, editorial energy. Then hit Get My Looks.`;
  if (lc.includes('natural') || lc.includes('everyday'))
    return `For a natural everyday look, try adding "Lupita Nyong'o" or "Yara Shahidi" as taste signals — they anchor the algorithm toward clean, skin-forward aesthetics.`;
  if (lc.includes('colour') || lc.includes('color') || lc.includes('bright'))
    return `For colour-rich looks, try Diwali Festive, Brazilian Carnival, or Caribbean Carnival — they're built around maximalist pigment. Add "Anitta" or "Lizzo" as taste chips too.`;
  if (turn === 1)
    return `Great direction! To refine further, add 1-2 more taste signals in the Taste Profile — the Qloo engine picks up on combinations. Then tell me what else to tweak.`;
  return `Noted — I've logged that preference (turn ${turn}). The more signals you give me, the sharper Qloo can tune your profile. What else?`;
}

// ===========================================================================
// FEATURE 4 — AGENTIC STYLIST PAGE VIEW (full page multi-step refinement)
// ===========================================================================

function setupStylistPage() {
  document.getElementById('stylistPageSendBtn')?.addEventListener('click', sendStylistPageMessage);
  document.getElementById('stylistPageInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendStylistPageMessage();
  });
}

function initStylistPage() {
  const msgsEl = document.getElementById('stylistPageMessages');
  if (msgsEl.dataset.init) return;
  msgsEl.dataset.init = '1';

  const hasTaste = state.aesthetic !== null || state.tasteChips.length > 0;
  const opener = hasTaste
    ? `Welcome back! I can see your current taste profile. Tell me what to refine — occasion, mood, colour direction, or anything else.`
    : `Hi! I'm your MIRRR AI Stylist. I use Qloo cultural taste data to find looks tailored to you.\n\nLet's start: tell me about an artist, film, or cultural vibe you love, or describe an occasion you're dressing for.`;

  appendStylistPageMessage('stylist', opener);
  renderStylistPageQuickChips();
}

function appendStylistPageMessage(role, text) {
  const msgsEl = document.getElementById('stylistPageMessages');
  const div = document.createElement('div');
  div.className = `stylist-msg stylist-msg--${role}`;
  div.innerHTML = `<span class="stylist-msg-text">${text.replace(/\n/g, '<br>')}</span>`;
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function renderStylistPageQuickChips() {
  const pageChips = [
    "I'm going to a wedding", "Give me something bold", "Natural everyday look",
    "Festival / concert vibes", "Professional / office", "Date night glam",
  ];
  const existing = document.querySelector('.stylist-page-quick-chips');
  if (existing) existing.remove();

  const wrap = document.createElement('div');
  wrap.className = 'stylist-page-quick-chips';
  wrap.innerHTML = pageChips.map(p =>
    `<button class="chip stylist-quick-chip" data-prompt="${p}">${p}</button>`
  ).join('');
  document.querySelector('.stylist-page-form')?.after(wrap);
  wrap.querySelectorAll('.stylist-quick-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('stylistPageInput').value = btn.dataset.prompt;
      sendStylistPageMessage();
    });
  });
}

async function sendStylistPageMessage() {
  const input = document.getElementById('stylistPageInput');
  const msg = input?.value?.trim();
  if (!msg) return;
  input.value = '';

  appendStylistPageMessage('user', msg);

  const sendBtn = document.getElementById('stylistPageSendBtn');
  sendBtn.disabled = true;
  sendBtn.textContent = '…';
  appendStylistPageMessage('stylist', '🔍 Checking Qloo for your refined profile…');

  try {
    const result = await api('/api/agent/refine', 'POST', {
      message: msg,
      currentAesthetic: state.aesthetic,
      communityId: state.communityId,
      tasteChips: state.tasteChips,
    });

    const msgs = document.getElementById('stylistPageMessages');
    msgs.removeChild(msgs.lastElementChild);

    appendStylistPageMessage('stylist', result.reply ?? "I've updated your profile!");

    if (result.looks?.length) {
      state.aesthetic = result.aesthetic ?? state.aesthetic;
      state.communityId = result.communityId ?? state.communityId;

      const resultsEl = document.getElementById('stylistPageResults');
      resultsEl.classList.remove('hidden');
      resultsEl.innerHTML = `
        <h3 class="section-title">Your Refined Looks</h3>
        <div class="looks-grid-inner">
          ${result.looks.map(({ look, score }) => renderLookCard(look, score)).join('')}
        </div>
        <div class="stylist-page-cta">
          <button class="btn btn-secondary" id="stylistToTasteBtn">See Full Profile →</button>
          <button class="btn btn-ghost" id="stylistSharePageBtn">Share This Look 📤</button>
        </div>
      `;
      resultsEl.querySelectorAll('.look-card').forEach(card => {
        card.addEventListener('click', () => openLookModal(card.dataset.lookId));
      });
      document.getElementById('stylistToTasteBtn')?.addEventListener('click', () => showView('taste'));
      document.getElementById('stylistSharePageBtn')?.addEventListener('click', () => openShare());
    }
  } catch {
    const msgs = document.getElementById('stylistPageMessages');
    if (msgs.lastElementChild?.textContent?.includes('Checking Qloo')) {
      msgs.removeChild(msgs.lastElementChild);
    }
    appendStylistPageMessage('stylist', generateStylistFallback(msg, 1));
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Refine →';
  }
}

// ===========================================================================
// FEATURE 5 — SHARE CARD GENERATOR (canvas-drawn result card)
// ===========================================================================

function setupShare() {
  document.getElementById('shareClose')?.addEventListener('click', closeShare);
  document.getElementById('shareModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeShare();
  });
  document.getElementById('shareDownloadBtn')?.addEventListener('click', downloadShareCard);
  document.getElementById('shareCopyBtn')?.addEventListener('click', copyShareLink);
}

function openShare(lookId) {
  const modal = document.getElementById('shareModal');
  modal.classList.remove('hidden');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  drawShareCard(lookId);
}

function closeShare() {
  const modal = document.getElementById('shareModal');
  modal.classList.remove('open');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function drawShareCard(lookId) {
  const canvas = document.getElementById('shareCanvas');
  const ctx = canvas.getContext('2d');
  const W = 540, H = 960;
  canvas.width = W;
  canvas.height = H;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1a0533');
  grad.addColorStop(0.5, '#3d0f5e');
  grad.addColorStop(1, '#0d1a3a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Gold accent strip
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, 0, W, 4);
  ctx.fillRect(0, H - 4, W, 4);

  // MIRRR wordmark
  ctx.font = 'bold 52px Inter, sans-serif';
  ctx.fillStyle = '#c9a227';
  ctx.textAlign = 'center';
  ctx.fillText('🪞 MIRRR', W / 2, 72);

  ctx.font = '16px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('Your Taste. Your Looks. Your Style.', W / 2, 98);

  // Community badge
  const com = state.communityId
    ? state.communities.find(c => c.id === state.communityId)
    : null;

  if (com) {
    ctx.fillStyle = 'rgba(201,162,39,0.15)';
    roundRect(ctx, W / 2 - 110, 114, 220, 38, 19);
    ctx.fill();
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillStyle = '#c9a227';
    ctx.fillText(`${com.emoji} ${com.label}`, W / 2, 138);
  }

  // Look image
  const effectiveLookId = lookId ?? (state.aesthetic ? getTopLookId() : null);
  const imgFile = effectiveLookId ? LOOK_IMAGES[effectiveLookId] : null;

  if (imgFile) {
    const lookImg = new Image();
    lookImg.onload = () => {
      const imgY = 166, imgH = 380;
      // Rounded rect clip
      ctx.save();
      roundRect(ctx, 40, imgY, W - 80, imgH, 20);
      ctx.clip();
      ctx.drawImage(lookImg, 40, imgY, W - 80, imgH);
      ctx.restore();

      // Glass border
      ctx.strokeStyle = 'rgba(201,162,39,0.4)';
      ctx.lineWidth = 2;
      ctx.save();
      roundRect(ctx, 40, imgY, W - 80, imgH, 20);
      ctx.stroke();
      ctx.restore();

      drawShareCardText(ctx, W, imgY + imgH + 20, effectiveLookId);
    };
    lookImg.onerror = () => drawShareCardText(ctx, W, 200, null);
    lookImg.src = imgFile;
  } else {
    drawShareCardText(ctx, W, 200, null);
  }
}

function drawShareCardText(ctx, W, startY) {
  // Aesthetic bars
  const aes = state.aesthetic;
  if (aes) {
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Your Aesthetic DNA', W / 2, startY + 30);

    const bars = [
      { label: 'Intensity', val: aes.intensity ?? 0.5 },
      { label: 'Warmth', val: aes.warmth ?? 0.5 },
      { label: 'Boldness', val: aes.boldness ?? 0.5 },
    ];
    bars.forEach((b, i) => {
      const y = startY + 60 + i * 42;
      const barX = 80, barW = W - 160;

      ctx.font = '14px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(b.label, barX, y);

      // Track
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundRect(ctx, barX, y + 8, barW, 10, 5);
      ctx.fill();

      // Fill
      const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      fillGrad.addColorStop(0, '#c9a227');
      fillGrad.addColorStop(1, '#e8c86a');
      ctx.fillStyle = fillGrad;
      roundRect(ctx, barX, y + 8, Math.round(barW * b.val), 10, 5);
      ctx.fill();

      // Pct
      ctx.font = '13px Inter, sans-serif';
      ctx.fillStyle = '#c9a227';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(b.val * 100)}%`, W - barX, y);
    });

    // Archetype tags
    const archs = (aes.archetypes ?? []).slice(0, 3);
    if (archs.length) {
      const tagY = startY + 60 + 3 * 42 + 16;
      ctx.textAlign = 'center';
      let tagX = W / 2 - ((archs.length - 1) * 90) / 2;
      archs.forEach(arch => {
        ctx.fillStyle = 'rgba(201,162,39,0.18)';
        roundRect(ctx, tagX - 60, tagY, 120, 26, 13);
        ctx.fill();
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#c9a227';
        ctx.fillText(arch.replace(/_/g, ' '), tagX, tagY + 17);
        tagX += 130;
      });
    }
  }

  // Footer
  const footY = 910;
  ctx.font = '13px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('mirrr-upbn.onrender.com · Powered by Qloo Taste AI', W / 2, footY);
}

function getTopLookId() {
  // Return first look in LOOK_IMAGES that matches current community
  const comId = state.communityId;
  if (!comId) return Object.keys(LOOK_IMAGES)[0];
  const communityLookMap = {
    'west-african': 'afrobeats_concert',
    'black-american': 'hip_hop_glam',
    'caribbean': 'caribbean_carnival',
    'south-asian': 'bollywood_bridal',
    'arab': 'gulf_glam',
    'latina': 'latina_glam',
    'east-asian': 'k_beauty_glass',
    'east-african': 'ethiopian_jewel',
    'south-african': 'zulu_bridal',
  };
  return communityLookMap[comId] ?? Object.keys(LOOK_IMAGES)[0];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function downloadShareCard() {
  const canvas = document.getElementById('shareCanvas');
  const link = document.createElement('a');
  link.download = 'mirrr-look-profile.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('Card saved!', 'info');
}

function copyShareLink() {
  navigator.clipboard?.writeText('https://mirrr-upbn.onrender.com')
    .then(() => toast('Link copied!', 'info'))
    .catch(() => toast('https://mirrr-upbn.onrender.com', 'info'));
}

// ===========================================================================
// Wire "Try On" + "Share" buttons into existing look cards
// ===========================================================================

// Override renderLookCard to include Try On + Share buttons
const _origRenderLookCard = renderLookCard;
// (already defined above — we patch renderTasteResults to add buttons after render)

const _origRenderTasteResults = renderTasteResults;
renderTasteResults = function(result) {
  _origRenderTasteResults(result);

  // Add "Refine with Stylist" and "Share" to looks-actions
  const actionsEl = document.querySelector('.looks-actions');
  if (actionsEl && !actionsEl.querySelector('#openStylistBtn')) {
    const stylistBtn = document.createElement('button');
    stylistBtn.className = 'btn btn-secondary';
    stylistBtn.id = 'openStylistBtn';
    stylistBtn.textContent = '🪞 Refine with AI Stylist';
    stylistBtn.addEventListener('click', () => openStylist(state));
    actionsEl.appendChild(stylistBtn);

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn btn-ghost';
    shareBtn.id = 'openShareBtn';
    shareBtn.textContent = '📤 Share My Look';
    shareBtn.addEventListener('click', () => openShare());
    actionsEl.appendChild(shareBtn);
  }

  // Add "Try On" button to each look card
  document.querySelectorAll('.look-card').forEach(card => {
    if (card.querySelector('.tryon-btn')) return; // already added
    const lookId = card.dataset.lookId;
    const lookName = card.querySelector('.look-name')?.textContent ?? 'this look';
    const tryBtn = document.createElement('button');
    tryBtn.className = 'btn btn-primary tryon-btn';
    tryBtn.textContent = '📸 Try On';
    tryBtn.addEventListener('click', e => {
      e.stopPropagation();
      openTryOn(lookId, lookName);
    });
    card.appendChild(tryBtn);
  });
};

// Wire blend mode buttons after DOM loads
window.addEventListener('load', () => {
  document.querySelectorAll('.tryon-blend-btns .chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tryon-blend-btns .chip-btn').forEach(b =>
        b.classList.remove('chip-btn--active'));
      btn.classList.add('chip-btn--active');
      tryonState.blendMode = btn.dataset.blend;
      applyOverlay();
    });
  });
});

// Patch showView to init stylist page and style-match when navigated to
const _origShowView = showView;
showView = function(viewId) {
  _origShowView(viewId);
  if (viewId === 'stylist') initStylistPage();
  if (viewId === 'style-match') initStyleMatch();
};

// ── STYLE MATCH ────────────────────────────────────────────────────────────

let _smLoaded = false;

async function initStyleMatch() {
  if (_smLoaded) return;
  _smLoaded = true;
  await loadStyleMatchLooks();

  document.getElementById('smFilterBtn')?.addEventListener('click', loadStyleMatchLooks);
}

async function loadStyleMatchLooks() {
  const fitzpatrick = document.getElementById('smFitzpatrick')?.value || '';
  const community   = document.getElementById('smCommunity')?.value || '';
  const vibe        = document.getElementById('smVibe')?.value || '';

  const params = new URLSearchParams();
  if (fitzpatrick) params.set('fitzpatrick', fitzpatrick);
  if (community)   params.set('community', community);
  if (vibe)        params.set('vibe', vibe);

  const container = document.getElementById('smResults');
  if (!container) return;
  container.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;">Loading looks…</p>';

  try {
    const qs = params.toString();
    const data = await api(`/api/style-match/looks${qs ? '?' + qs : ''}`);
    const looks = data.looks || [];

    if (!looks.length) {
      container.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;">No looks matched those filters — try broadening your search.</p>';
      return;
    }

    container.className = 'sm-grid';
    container.innerHTML = looks.map(look => `
      <div class="shade-card sm-card" style="cursor:pointer;" data-look-id="${look.id}">
        <div class="sm-photo">${look.image ? `<img src="${look.image}" alt="${look.name} — ${look.community.replace('-', ' ')} look" loading="lazy" decoding="async" onerror="this.remove()">` : ''}</div>
        <div class="shade-info">
          <div class="shade-name">${look.name}</div>
          <div class="shade-community" style="font-size:0.72rem;color:#c9a96e;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.3rem;">${look.community.replace('-', ' ')}</div>
          <div class="shade-desc">${look.description}</div>
          <div style="margin-top:0.5rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
            ${(look.vibe || []).map(v => `<span style="background:#2a1a2e;border:1px solid #4a2040;border-radius:999px;padding:0.15rem 0.5rem;font-size:0.68rem;color:#c9a96e;">${v}</span>`).join('')}
          </div>
          <button class="btn btn-secondary sm-guide-btn" style="margin-top:0.75rem;font-size:0.78rem;padding:0.4rem 0.9rem;" data-look-id="${look.id}">Get My Guide →</button>
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<p style="color:#e05;text-align:center;padding:2rem;">Could not load looks — ${err.message}</p>`;
    toast('Style match error: ' + err.message, 'error');
  }
}

async function openStyleGuide(lookId) {
  const drawer = document.getElementById('smGuideDrawer');
  const titleEl = document.getElementById('smGuideTitle');
  const stepsEl = document.getElementById('smGuideSteps');
  const tipsEl  = document.getElementById('smGuideTips');
  if (!drawer) return;

  // Grab current fitzpatrick filter
  const fitzpatrick = document.getElementById('smFitzpatrick')?.value || 'IV';
  const undertone   = 'neutral';

  titleEl.textContent = 'Loading guide…';
  stepsEl.innerHTML = '';
  tipsEl.innerHTML  = '';
  drawer.classList.remove('hidden');

  try {
    const data = await api('/api/style-match/guide', 'POST', { lookId, fitzpatrick, undertone });
    titleEl.textContent = data.lookId?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' — Step-by-Step Guide';

    if (data.steps?.length) {
      stepsEl.innerHTML = data.steps.map((step, i) => `
        <div style="margin-bottom:1.2rem;padding:1rem;background:#111;border-radius:0.75rem;border-left:3px solid #c9a96e;">
          <div style="font-size:0.72rem;color:#c9a96e;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.25rem;">Step ${i+1} · ${step.zone || ''}</div>
          <div style="font-weight:600;color:#f0e8da;margin-bottom:0.4rem;">${step.stepName}</div>
          <div style="font-size:0.85rem;color:#aaa;margin-bottom:0.6rem;">${step.technique}</div>
          ${step.products ? `<div style="font-size:0.8rem;color:#c9a96e;">${Object.entries(step.products).map(([k,v]) => `<span style="color:#888;">${k}:</span> ${v}`).join(' · ')}</div>` : ''}
        </div>
      `).join('');
    } else {
      stepsEl.innerHTML = `<p style="color:#888;padding:1rem;">Full step-by-step guide for this look coming soon.</p>`;
    }

    if (data.proTips?.length) {
      tipsEl.innerHTML = `<div style="font-size:0.72rem;color:#c9a96e;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Pro Tips</div>` +
        data.proTips.map(tip => `<div style="font-size:0.83rem;color:#ccc;margin-bottom:0.4rem;">✦ ${tip}</div>`).join('');
    }

    if (data.shoppingEstimate) {
      tipsEl.innerHTML += `<div style="margin-top:0.75rem;font-size:0.8rem;color:#888;">Estimated budget: ${data.shoppingEstimate.currency} $${data.shoppingEstimate.low}–$${data.shoppingEstimate.high}</div>`;
    }

  } catch (err) {
    stepsEl.innerHTML = `<p style="color:#e05;">Guide unavailable — ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', bootWithTrending);


// ===========================================================================
// Honest source badge, agent trace, persistence, planner, help
// ===========================================================================

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
const ico = (name, cls) => (window.MirrrIcons ? window.MirrrIcons.svg(name, cls) : '');

/** "Powered by Qloo" only when Qloo actually returned data for this result. */
function sourceBadgeHtml(meta, narrationSource) {
  const live = meta?.qloo_powered === true;
  const via = narrationSource ? ` · narration: ${esc(narrationSource)}` : '';
  const err = meta?.qloo_error ? `<p class="src-error">Qloo error: ${esc(meta.qloo_error)}</p>` : '';
  return live
    ? `<p class="src-badge src-badge--live">${ico('bolt')} Powered by Qloo · live${via}</p>${err}`
    : `<p class="src-badge src-badge--template">${ico('sparkle')} Template mode · Qloo not used for this result${via}</p>${err}`;
}

// ---- Trace ("How MIRRR got this") -----------------------------------------

function describeTraceStep(t) {
  const bits = [];
  if (t.inputs_count != null) bits.push(`${t.inputs_count} input(s)`);
  if (t.entities_found != null) bits.push(`${t.entities_found} Qloo entities resolved`);
  if (t.tags_found != null) bits.push(`${t.tags_found} taste signals`);
  if (t.communityId) bits.push(`community: ${t.communityId}`);
  if (t.top_look) bits.push(`top look: ${String(t.top_look).replace(/_/g, ' ')}`);
  if (t.looks_count != null) bits.push(`${t.looks_count} looks scored`);
  if (t.shades_count) bits.push(`${t.shades_count} shades`);
  if (t.wigs_count != null) bits.push(`${t.wigs_count} wigs`);
  if (t.source) bits.push(`source: ${t.source}`);
  if (t.aesthetic) bits.push('aesthetic vector built');
  return bits.join(' · ');
}

function renderTrace(result) {
  const host = document.getElementById('tasteNarration');
  if (!host) return;
  host.querySelector('.trace-box')?.remove();
  const meta = result?.meta;
  if (!meta) return;
  const trace = Array.isArray(meta.trace) ? meta.trace : [];
  const aff = Array.isArray(meta.top_affinities) ? meta.top_affinities : [];
  if (!trace.length && !aff.length && meta.entities_resolved == null) return;

  const maxA = Math.max(0.0001, ...aff.map(a => Number(a.affinity ?? a.score ?? 0)));
  const stepsHtml = trace.length ? `<ul class="trace-steps">${trace.map(t => `
      <li><span class="t-step">${esc(t.step)}</span><span>${esc(describeTraceStep(t)) || '&mdash;'}</span></li>`).join('')}</ul>` : '';
  const affHtml = aff.length ? `<div><strong>Top affinities</strong>${aff.slice(0, 8).map(a => {
      const v = Number(a.affinity ?? a.score ?? 0);
      return `<div class="aff-row"><span>${esc(a.name ?? a.id)}</span><div class="aff-bar"><div class="aff-fill" style="width:${Math.round((v / maxA) * 100)}%"></div></div><span>${v <= 1 ? Math.round(v * 100) + '%' : v.toFixed(1)}</span></div>`;
    }).join('')}</div>` : '';
  const summary = `Resolved ${meta.entities_resolved ?? 0} entities · ${meta.tags_from_qloo ?? 0} Qloo signals`;
  const box = document.createElement('details');
  box.className = 'trace-box';
  box.innerHTML = `<summary>${ico('search')} How MIRRR got this <span style="opacity:.7">· ${esc(summary)}</span></summary><div class="trace-body">${stepsHtml}${affHtml}</div>`;
  host.appendChild(box);
}

// ---- Persistence (localStorage only, always try/catch) --------------------

const STORE_KEY = 'mirrr.profile.v1';
let _lastTaste = null;
let _lastShades = null;

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
}
function persist(extra = {}) {
  try {
    const prev = loadProfile() || {};
    const data = {
      v: 1,
      savedAt: new Date().toISOString(),
      chips: state.tasteChips,
      aesthetic: state.aesthetic,
      communityId: state.communityId,
      depthTarget: state.depthTarget,
      undertone: state.undertone,
      lastTaste: _lastTaste ?? prev.lastTaste ?? null,
      shades: _lastShades ?? prev.shades ?? null,
      savedLooks: prev.savedLooks ?? [],
      ...extra,
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch { /* storage unavailable or full: persistence is best-effort */ }
}
function clearProfile() {
  try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
}
function profileIsEmpty(p) {
  return !p || (!(p.chips && p.chips.length) && !p.aesthetic && !(p.savedLooks && p.savedLooks.length) && !p.shades);
}
function archetypeLabel(aes) {
  const a = aes?.archetypes?.[0];
  return a ? String(a).replace(/_/g, ' ') : null;
}

// Wrap render functions so every result is saved
const _renderTasteResults = renderTasteResults;
renderTasteResults = function (result) {
  _renderTasteResults(result);
  try { renderTrace(result); } catch { /* non-fatal */ }
  _lastTaste = { aesthetic: result.aesthetic, looks: result.looks, narration: result.narration, narration_source: result.narration_source, entities: (result.entities ?? []).map(e => ({ name: e.name ?? e.input })), tags: result.tags, communityId: result.communityId, meta: result.meta ? { qloo_powered: result.meta.qloo_powered, qloo_error: result.meta.qloo_error, entities_resolved: result.meta.entities_resolved, tags_from_qloo: result.meta.tags_from_qloo, top_affinities: result.meta.top_affinities } : undefined };
  persist();
};
const _renderShadeResults = renderShadeResults;
renderShadeResults = function (shades) {
  _renderShadeResults(shades);
  _lastShades = shades;
  persist();
};
const _addChip = addChip;
addChip = function (text) { _addChip(text); persist(); };
const _removeChip = removeChip;
removeChip = function (text) { _removeChip(text); persist(); };

// Save-a-look button inside the look modal
const _openLookModal = openLookModal;
openLookModal = async function (lookId) {
  await _openLookModal(lookId);
  const content = document.getElementById('modalContent');
  const title = document.getElementById('modalTitle');
  if (!content || !title) return;
  const p = loadProfile() || {};
  const already = (p.savedLooks || []).some(l => l.id === lookId);
  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary';
  btn.style.marginTop = '1rem';
  btn.innerHTML = `${ico('bookmark')} ${already ? 'Saved' : 'Save this look'}`;
  btn.disabled = already;
  btn.addEventListener('click', () => {
    const cur = loadProfile() || {};
    const list = cur.savedLooks || [];
    if (!list.some(l => l.id === lookId)) list.push({ id: lookId, name: title.textContent });
    persist({ savedLooks: list });
    btn.disabled = true;
    btn.innerHTML = `${ico('check')} Saved`;
    toast('Look saved in this browser', 'info');
  });
  content.appendChild(btn);
};

function restoreProfile(p) {
  state.tasteChips = Array.isArray(p.chips) ? p.chips.slice(0, 20) : [];
  state.communityId = p.communityId ?? null;
  state.depthTarget = p.depthTarget ?? null;
  state.undertone = p.undertone ?? null;
  state.aesthetic = p.aesthetic ?? null;
  renderChips();
  const fetchBtn = document.getElementById('fetchLooksBtn');
  if (fetchBtn) fetchBtn.disabled = state.tasteChips.length === 0;
  const sel = document.getElementById('communitySelect');
  if (sel && state.communityId) sel.value = state.communityId;
  if (p.lastTaste?.looks?.length) { renderTasteResults(p.lastTaste); showView('taste'); }
  if (Array.isArray(p.shades) && p.shades.length) { try { renderShadeResults(p.shades); } catch { /* ignore */ } }
}

function resetEverything() {
  clearProfile();
  location.reload();
}

function showReturnBanner() {
  const p = loadProfile();
  const banner = document.getElementById('returnBanner');
  if (!banner || profileIsEmpty(p)) return;
  const arch = archetypeLabel(p.aesthetic);
  const chips = (p.chips || []).slice(0, 3).map(esc).join(', ');
  banner.innerHTML = `<span>Welcome back${arch ? ` &mdash; your saved aesthetic is <strong>${esc(arch)}</strong>` : ''}${chips ? ` (${chips})` : ''}.</span>
    <button class="btn btn-primary" id="rbContinue">Continue</button>
    <button class="btn btn-ghost" id="rbReset">Start over</button>`;
  banner.classList.remove('hidden');
  document.getElementById('rbContinue').addEventListener('click', () => { restoreProfile(p); banner.classList.add('hidden'); });
  document.getElementById('rbReset').addEventListener('click', resetEverything);
}

function toggleProfilePanel() {
  const panel = document.getElementById('profilePanel');
  if (!panel) return;
  if (!panel.classList.contains('hidden')) { panel.classList.add('hidden'); return; }
  const p = loadProfile();
  const empty = profileIsEmpty(p);
  const arch = archetypeLabel(p?.aesthetic);
  panel.innerHTML = empty
    ? `<h3>Your saved profile</h3><p>Nothing saved yet. Build a taste profile or save a look and it will appear here. Everything stays in this browser.</p>
       <div class="pp-actions"><button class="btn btn-ghost" id="ppClose">Close</button></div>`
    : `<h3>Your saved profile</h3>
       <div class="pp-row"><strong>Taste signals</strong>${(p.chips || []).map(esc).join(', ') || 'none'}</div>
       <div class="pp-row"><strong>Aesthetic</strong>${esc(arch || 'not built yet')}</div>
       <div class="pp-row"><strong>Community</strong>${esc(p.communityId || 'not set')}</div>
       <div class="pp-row"><strong>Shade result</strong>${p.shades?.[0]?.shade ? esc(p.shades[0].shade.label || p.shades[0].shade.id) : 'none'}</div>
       <div class="pp-row"><strong>Saved looks</strong>${(p.savedLooks || []).map(l => esc(l.name)).join(', ') || 'none'}</div>
       <div class="pp-row" style="opacity:.75">Saved ${esc(new Date(p.savedAt).toLocaleString())}. Stored only in this browser.</div>
       <div class="pp-actions"><button class="btn btn-primary" id="ppRestore">Restore</button><button class="btn btn-secondary" id="ppClear">Clear my data</button><button class="btn btn-ghost" id="ppClose">Close</button></div>`;
  panel.classList.remove('hidden');
  document.getElementById('ppClose')?.addEventListener('click', () => panel.classList.add('hidden'));
  document.getElementById('ppClear')?.addEventListener('click', resetEverything);
  document.getElementById('ppRestore')?.addEventListener('click', () => { restoreProfile(p); panel.classList.add('hidden'); });
}

// ---- Occasion Planner ------------------------------------------------------

function flat(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(flat).filter(Boolean).join(', ');
  return v.name ?? v.label ?? v.title ?? v.description ?? v.text ?? '';
}
function planList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(flat).filter(Boolean);
  if (typeof v === 'object') return Object.values(v).map(flat).filter(Boolean);
  return [String(v)];
}
function planCard(iconName, title, bodyHtml) {
  if (!bodyHtml) return '';
  return `<div class="plan-card"><h3>${ico(iconName)} ${esc(title)}</h3>${bodyHtml}</div>`;
}

function renderPlan(plan) {
  const out = document.getElementById('plannerResult');
  if (!out) return;
  const look = plan.look;
  const lookBody = look ? `<p><strong>${esc(flat(look))}</strong>${look.description ? ` &mdash; ${esc(look.description)}` : ''}</p>${(look.whyChosen || look.why) ? `<p>${esc(look.whyChosen || look.why)}</p>` : ''}${look.image ? `<img class="plan-look-img" src="${esc(look.image)}" alt="${esc(look.name || '')}" style="width:100%;max-width:240px;border-radius:12px;margin:.5rem 0" onerror="this.remove()">` : ''}${look.alternatives?.length ? `<p class="plan-alt">Also consider: ${look.alternatives.map(a => esc(a.name)).join(', ')}</p>` : ''}` : '';
  const sh = plan.shade;
  const shadeBody = sh ? `<p><strong>${esc(flat(sh))}</strong>${sh.undertone ? ` &middot; ${esc(sh.undertone)} undertone` : ''}${sh.hex ? ` <span style="display:inline-block;width:1em;height:1em;border-radius:50%;background:${esc(sh.hex)};vertical-align:-0.15em"></span>` : ''}</p>${sh.note ? `<p>${esc(sh.note)}</p>` : ''}` : '';
  const wg = plan.wig;
  const wigBody = wg ? `<p><strong>${esc(flat(wg))}</strong>${(wg.why || wg.description) ? ` &mdash; ${esc(wg.why || wg.description)}` : ''}</p>` : '';
  const ritualItems = planList(plan.ritual?.rituals ?? plan.ritual?.steps ?? []).concat(plan.ritual?.skincareTip ? [plan.ritual.skincareTip] : []);
  const ritualBody = ritualItems.length ? `${(plan.ritual?.festival || plan.ritual?.tradition) ? `<p><strong>${esc(plan.ritual.festival || plan.ritual.tradition)}</strong></p>` : ''}<ul>${ritualItems.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : '';
  const tl = Array.isArray(plan.timeline) ? plan.timeline : [];
  const tlBody = tl.length ? `<ul class="plan-timeline">${tl.map(t => `<li><span class="tl-when">${esc(t.when ?? t.time ?? '')}</span><span>${esc(t.step ?? t.text ?? flat(t))}</span></li>`).join('')}</ul>` : '';
  const cons = planList(plan.constraints);
  const consBody = cons.length ? `<div class="plan-chips">${cons.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div>` : '';
  const summary = plan.summary || plan.narration ? `<p>${esc(plan.summary || plan.narration)}</p>` : '';
  const html = [
    plan.meta ? `<div>${sourceBadgeHtml(plan.meta, null)}</div>` : '',
    planCard('sparkle', 'Your plan', summary),
    planCard('chat', 'Constraints it respected', consBody),
    planCard('mirror', 'The look', lookBody),
    planCard('drop', 'Your shade', shadeBody),
    planCard('wig', 'Wig pairing', wigBody),
    planCard('leaf', 'Ritual & prep', ritualBody),
    planCard('calendar', 'Timeline', tlBody),
  ].join('');
  out.innerHTML = html || '<div class="plan-error">The planner returned no plan for that request. Try describing the occasion in more detail.</div>';
  out.classList.remove('hidden');
}

async function buildPlan() {
  const occasion = document.getElementById('plannerOccasion')?.value.trim();
  const out = document.getElementById('plannerResult');
  const btn = document.getElementById('plannerBtn');
  if (!occasion) { toast('Describe the occasion first', 'warn'); return; }
  btn.disabled = true;
  const label = btn.textContent;
  btn.textContent = 'Planning…';
  out.classList.remove('hidden');
  out.innerHTML = '<div class="plan-card"><p>Building your plan…</p></div>';
  try {
    const plan = await api('/api/plan', 'POST', {
      occasion,
      communityId: document.getElementById('plannerCommunity')?.value || state.communityId || undefined,
      fitzpatrick: document.getElementById('plannerFitz')?.value || undefined,
      undertone: document.getElementById('plannerUndertone')?.value || state.undertone || undefined,
      tasteChips: state.tasteChips,
    });
    renderPlan(plan);
    persist({ lastPlan: { occasion, at: new Date().toISOString() } });
  } catch (err) {
    out.innerHTML = `<div class="plan-error">The planner could not build a plan: ${esc(err.message || 'server error')}. Nothing was saved. Please try again.</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

function initPlannerView() {
  const sel = document.getElementById('plannerCommunity');
  if (sel && sel.options.length <= 1) {
    state.communities.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.label;
      sel.appendChild(o);
    });
  }
  if (sel && state.communityId) sel.value = state.communityId;
  const note = document.getElementById('plannerTasteNote');
  if (note) note.textContent = state.tasteChips.length
    ? `Using your taste signals: ${state.tasteChips.slice(0, 6).join(', ')}.`
    : 'Tip: add taste signals in Taste Profile and the plan will use them.';
}

// ---- Wiring ---------------------------------------------------------------

const _showView2 = showView;
showView = function (viewId) {
  _showView2(viewId);
  if (viewId === 'planner') initPlannerView();
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('plannerBtn')?.addEventListener('click', buildPlan);
  document.getElementById('profileBtn')?.addEventListener('click', toggleProfilePanel);
  document.getElementById('helpClearBtn')?.addEventListener('click', () => {
    if (confirm('Clear all MIRRR data saved in this browser?')) resetEverything();
  });
  showReturnBanner();
});


// Style Match: delegated clicks (module scope can't be reached by inline onclick)
document.addEventListener('click', (e) => {
  const t = e.target.closest?.('[data-look-id]');
  if (t && t.closest('#smResults')) { e.stopPropagation(); openStyleGuide(t.dataset.lookId); }
  if (e.target.closest?.('#smGuideClose') || e.target.id === 'smGuideDrawer') {
    document.getElementById('smGuideDrawer')?.classList.add('hidden');
  }
});
window.openStyleGuide = (id) => openStyleGuide(id);


// Quiz result -> real looks for the matched community, with photos
const COMMUNITY_ARCHETYPES = {
  west_african: ['afro_glam', 'amapiano_beat'], east_african: ['afro_glam'], black_american: ['hip_hop_glam', 'afro_glam'],
  caribbean: ['caribbean_carnival'], south_asian: ['bollywood_bridal'], arab: ['gulf_glam'], latina: ['latina_glam'],
  east_asian: ['k_beauty'], southeast_asian: ['k_beauty', 'clean_minimal'], mixed: ['clean_minimal'],
};
async function loadDnaLooks(communityId) {
  const grid = document.getElementById('dnaLooksGrid');
  if (!grid) return;
  try {
    const key = String(communityId ?? '').replace(/-/g, '_');
    const archs = COMMUNITY_ARCHETYPES[key] ?? ['clean_minimal'];
    const { looks } = await api('/api/looks');
    const picks = looks.filter(l => archs.includes(l.archetype) && LOOK_IMAGES[l.id]).slice(0, 6);
    if (!picks.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = picks.map(l => `
      <button class="dna-look-card" data-look="${l.id}">
        <img src="${LOOK_IMAGES[l.id]}" alt="${l.name}" loading="lazy" decoding="async">
        <span class="dna-look-name">${l.name}</span>
      </button>`).join('');
    grid.querySelectorAll('.dna-look-card').forEach(b => b.addEventListener('click', () => {
      const sel = document.getElementById('communitySelect'); if (sel && communityId) sel.value = communityId;
      showView('taste');
    }));
  } catch { grid.innerHTML = ''; }
}
