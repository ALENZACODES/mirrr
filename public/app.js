/**
 * MIRRR — Frontend Application
 * Your Taste. Your Looks. Your Style.
 */
import { findFace, applyLook, recolourHair, scaleFace, labToRgb } from './photo-engine.js';
import { detectPlatform, canvasToPhotoFile, savePhotoFile, MAX_CANVAS_PIXELS } from './photo-save.js';
import { measureSkin } from './skin-sample.js';
import { MODEL_FACES } from './model-faces.js';

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
      opt.textContent = String(c.label).replace(/^[^\p{L}\p{N}]+/u, '');
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
  // The logo goes home: close the open view, any open dialog or menu, and scroll to the top.
  document.querySelector('.nav-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    goHome();
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

function goHome() {
  document.querySelectorAll('.modal-overlay.open, .modal-overlay:not(.hidden)').forEach(m => { m.classList.remove('open'); m.classList.add('hidden'); });
  document.body.style.overflow = '';
  const more = document.getElementById('navMore'); if (more) more.open = false;
  document.getElementById('profilePanel')?.classList.add('hidden');
  showView('hero');
  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('nav-link--active'));
  window.scrollTo({ top: 0, behavior: 'auto' });
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
  // The result hero is the community's portrait photo (a signature look of that community), not its icon.
  const topPortrait = topComId ? COMMUNITY_PORTRAITS[slug(topComId)] : null;
  const topComImg = topComId ? COMMUNITY_IMAGES[slug(topComId)] : null;
  const runnerComImg = runnerUpId ? (COMMUNITY_PORTRAITS[slug(runnerUpId)] ?? COMMUNITY_IMAGES[slug(runnerUpId)]) : null;

  resultEl.innerHTML = `
    <div class="dna-result card">
      <div class="dna-hero dna-hero--big">
        ${topPortrait
          ? `<figure class="dna-hero-figure" data-dna-portrait="${esc(slug(topComId))}"><img src="${topPortrait}" alt="${esc(topCom?.label ?? 'Community')} beauty portrait" class="dna-big-photo" width="900" height="900" loading="eager" fetchpriority="high" onerror="this.onerror=null;this.nextElementSibling?.remove();${topComImg ? `this.src='${topComImg}'` : 'this.remove()'}" /><figcaption class="gen-badge">Generated photo, not a real person</figcaption></figure>`
          : topComImg
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

// A dimension no taste tag touched sits at the neutral 0.5 default: say so instead of showing "50%".
function renderAestheticBar(label, value, aes = null, key = null) {
  if (value === undefined || value === null) return '';
  const unset = aes && key && aes.signals && aes.signals[key] === 0 && Math.abs(value - 0.5) < 1e-6 && !(aes.stylistSet ?? []).includes(key);
  if (unset) return `
    <div class="aes-bar-row aes-bar-row--unset" title="None of your taste tags carry a ${label.toLowerCase()} signal, so this stays neutral and does not affect ranking direction.">
      <span class="aes-bar-label">${label}</span>
      <span class="aes-bar-val muted">no signal in your taste (neutral)</span>
    </div>`;
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
    const inputs = [...state.tasteChips];
    const result = await api('/api/agent/run', 'POST', {
      inputs,
      communityId: communityId || undefined,
      dnaAnswers: Object.keys(state.dnaAnswers).length ? state.dnaAnswers : undefined,
      depthTarget: state.depthTarget ?? undefined,
      undertone: state.undertone ?? undefined,
      lengthPref: state.lengthPref ?? undefined,
      texturePref: state.texturePref ?? undefined,
    }, { signal: controller.signal });

    state.aesthetic = result.aesthetic;
    state.communityId = result.communityId;
    state.resultTasteChips = inputs;
    renderTasteResults(result);
  } catch (err) {
    if (err.name === 'AbortError') {
      toast('Qloo took longer than 30 s, so this is demo data', 'warn');
      try {
        // Built-in sample data only (no Qloo call), shown under the demo-data banner.
        const demo = await api('/api/taste/demo', 'POST', { profile: 'afrobeats' });
        demo.meta = { ...(demo.meta ?? {}), qloo_powered: false, qloo_unreachable: true, qloo_error: 'no answer within 30 seconds' };
        state.aesthetic = demo.aesthetic;
        state.communityId = demo.communityId;
        state.resultTasteChips = []; // demo data: not from her taste
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
    state.resultTasteChips = [];
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
  state.currentLookIds = (looks ?? []).map(r => r.look?.id).filter(Boolean);

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
      ${renderAestheticBar('Intensity', aesthetic.intensity, aesthetic, 'intensity')}
      ${renderAestheticBar('Warmth', aesthetic.warmth, aesthetic, 'warmth')}
      ${renderAestheticBar('Boldness', aesthetic.boldness, aesthetic, 'boldness')}
      ${renderAestheticBar('Shine (matte → glass)', aesthetic.texture, aesthetic, 'texture')}
      <div class="aesthetic-tags">
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
        ${looks.map(r => renderLookCard(r.look, r.score, r)).join('')}
      </div>
      ${finishPanelHTML('taste')}
    `;

    looksEl.querySelectorAll('.look-card').forEach(card => {
      card.addEventListener('click', () => openLookModal(card.dataset.lookId));
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

// DNA Quiz result hero: one portrait photo per community, reusing that community's signature look photo
// (generated sample photos of women, not real people). Keyed by community slug.
const COMMUNITY_PORTRAITS = {
  'west-african':     'look-owambe-glam.webp',
  'east-african':     'look-ethiopian-jewel.webp',
  'south-african':    'look-zulu-bridal.webp',
  'black-american':   'looks/hbcu_homecoming.webp',
  'north-african':    'look-moroccan-soiree.webp',
  'arab':             'look-gulf-glam.webp',
  'caribbean':        'look-dancehall-queen.webp',
  'south-asian':      'look-bollywood-bridal.webp',
  'latina':           'look-latina-glam.webp',
  'east-asian':       'look-k-beauty-glass.webp',
  'southeast-asian':  'look-southeast-asian-glow.webp',
  'central-asian':    'look-central-asian-steppe.webp',
  'indigenous':       'look-first-nations-powwow.webp',
  'pacific-islander': 'look-polynesian-warrior.webp',
  'mixed':            'look-mixed-heritage-luminous.webp',
};

// Editorial look images — mapped by look ID
const LOOK_IMAGES = {
  // Batch 1 — updated filenames
  afrobeats_concert:        'looks/afrobeats_concert.webp',
  afropunk_edge:            'look-afropunk-edge.webp',
  amapiano_beat:            'look-amapiano-beat.webp',
  bollywood_bridal:         'look-bollywood-bridal.webp',
  dancehall_queen:          'look-dancehall-queen.webp',
  hip_hop_glam:             'looks/hip_hop_glam.webp',
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
  afro_glam_editorial:      'looks/afro_glam_editorial.webp',
  congolese_sapeur:         'look-congolese-sapeur.webp',
  // Batch 5
  amazigh_berber:           'look-amazigh-berber.webp',
  black_girl_natural:       'look-black-girl-natural.webp',
  hbcu_homecoming:          'looks/hbcu_homecoming.webp',
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

// Signature look portraits (public/looks/) are generated sample photos; say so on the card.
function genBadge(src) {
  return /(^|\/)looks\//.test(String(src ?? '')) ? '<span class="gen-badge">Generated photo, not a real person</span>' : '';
}

function renderLookCard(look, score, row = {}) {
  (state.lookNames ??= {})[look.id] = look.name;
  const scoreBar = Math.round((score ?? 0) * 100);
  const why = row.qlooEvidence != null
    ? `Fit ${scoreBar}: half taste-vector fit (${Math.round((row.fit ?? 0) * 100)}), half Qloo evidence (${Math.round(row.qlooEvidence * 100)}% of Qloo's tag affinity points here)`
    : `Fit ${scoreBar}: taste-vector fit only (no Qloo evidence for this result)`;
  const imgFile  = LOOK_IMAGES[look.id];
  const imgHtml  = imgFile
    ? `<div class="look-card-img-wrap"><img src="${imgFile}" alt="${esc(look.name)}" class="look-card-img" loading="lazy" onerror="this.parentElement.remove()" />${genBadge(imgFile)}</div>`
    : '';
  return `
    <div class="look-card" data-look-id="${look.id}" role="button" tabindex="0" aria-label="View ${look.name} look details">
      ${imgHtml}
      <div class="look-card-header">
        <span class="look-emoji">${look.emoji ?? '✨'}</span>
        <div class="look-score-ring" title="${esc(why)}">
          <span class="look-score-num">${scoreBar}</span>
        </div>
      </div>
      <h3 class="look-name">${look.name}</h3>
      ${row.evidenceTags?.length ? `<p class="look-qloo" data-qloo-evidence>${ico('bolt')} Qloo: ${row.evidenceTags.slice(0, 3).map(esc).join(', ')}</p>` : ''}
      <p class="look-arch">${look.archetype?.replace(/_/g, ' ') ?? ''}</p>
      <p class="look-desc">${look.description ?? ''}</p>
      <div class="look-tags">
        ${(look.tags ?? []).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <span class="look-cta">View Products →</span>
      <button class="become-btn" type="button" data-become="${look.id}">Become this look</button>
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
    const basisText = products.basis === 'curated' ? 'Curated formula for this look.'
      : products.basis === 'archetype' ? `General formula from the ${esc(products.formulaFrom ?? 'same style')} family. Product types, not named brands.`
      : 'Built from this look\'s own spec. Product types, not named brands.';

    content.innerHTML = `
      <div class="modal-look-header">
        <h2 id="modalTitle">${esc(products.label)}</h2>
        <p class="modal-depth-note">Products tuned for: <strong>${depthLabel.replace(/_/g, ' ')}</strong> depth</p>
        <p class="modal-basis" data-basis="${esc(products.basis ?? '')}">${basisText}</p>
      </div>
      ${products.products.some(p => PRODUCT_PHOTOS[p.category]) ? `<p class="modal-basis product-photo-note">${PRODUCT_PHOTO_NOTE}</p>` : ''}
      ${products.namedGuide ? `<div class="modal-named" id="modalNamed"><button class="btn btn-secondary" type="button" id="modalNamedBtn">Named brands &amp; prices: ${esc(products.namedGuide.name)} guide</button></div>` : ''}
      <div class="product-list">
        ${products.products.map(p => `
          <div class="product-item${productPhoto(p.category) ? ' product-item--photo' : ''}">
            ${productPhoto(p.category)}
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
    document.getElementById('modalNamedBtn')?.addEventListener('click', () => loadNamedGuide(products.namedGuide, products.label));
  } catch {
    content.innerHTML = '<p class="modal-error">Could not load product details.</p>';
  }
}

// Named-product list from the closest curated Style Match guide, shown inside the look dialog
// and labelled as borrowed from that guide.
const DEPTH_TO_FITZ = { fair: 'I', light: 'II', light_med: 'III', medium: 'IV', medium_deep: 'IV', deep: 'V', rich_deep: 'VI' };
async function loadNamedGuide(guide, lookName) {
  const box = document.getElementById('modalNamed');
  if (!box || !guide) return;
  box.innerHTML = '<p class="muted">Loading named products…</p>';
  try {
    const fitzpatrick = DEPTH_TO_FITZ[depthTargetToLabel(state.depthTarget)] ?? 'IV';
    const g = await api('/api/style-match/guide', 'POST', { lookId: guide.id, fitzpatrick, undertone: state.undertone || 'neutral' });
    const est = g.shoppingEstimate;
    box.innerHTML = `
      <p class="modal-basis">Named products from the <strong>${esc(guide.name)}</strong> guide, the closest curated brand list for ${esc(lookName)} (same community and style; not written for this exact look). Shades for skin type ${esc(g.fitzpatrickUsed ?? fitzpatrick)}.</p>
      <div class="product-list">${(g.steps ?? []).map(st => `
        <div class="product-item">
          <strong>${esc(st.stepName)}</strong>
          ${Object.entries(st.products ?? {}).map(([k, v]) => `<p class="product-formula">${esc(capitalise(k))}: ${esc(v)}</p>`).join('')}
        </div>`).join('')}</div>
      ${est ? `<p class="modal-basis">Guide budget: ${esc(est.currency)} $${est.low}–${est.high}</p>` : ''}`;
  } catch {
    box.innerHTML = '<p class="modal-error">Could not load the named-product guide.</p>';
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
        <div class="spectrum-dot" style="background:${esc(s.shade.hex)}" title="${esc(s.shade.name)}"></div>
      `).join('')}
    </div>
  `;

  // Shade cards: the swatch is the shade's own colour; the ranking is shown as what it is
  // (depth steps from your pick and whether the undertone matches), not as a percentage.
  cardsEl.innerHTML = `
    <h3 class="section-title">Your Shade Matches</h3>
    <p class="shade-note">Ranked by closeness to the depth you picked and your undertone. Check the top two on your jaw in daylight.</p>
    <div class="shade-cards-inner">
      ${shades.map(({ shade, coverageNote, depthGap, undertoneMatch, math }, i) => `
        <div class="shade-card">
          <div class="shade-swatch-lg" style="background:${esc(shade.hex)}"></div>
          <div class="shade-info">
            <strong class="shade-id">${esc(shade.id)}</strong>
            <span class="shade-label">${esc(shade.name)}</span>
            <div class="shade-undertones">
              ${(shade.undertones ?? []).map(u => `<span class="tag">${esc(u)}</span>`).join('')}
            </div>
            ${coverageNote ? `<p class="shade-note">${esc(coverageNote)}</p>` : ''}
            <p class="shade-note" data-rank="${i + 1}">#${i + 1}${depthGap == null ? '' : ` · ${depthGap === 0 ? 'at your depth' : `${depthGap} depth step${depthGap === 1 ? '' : 's'} from your pick`}`}${undertoneMatch === false ? ' · different undertone' : ''}</p>
            ${math ? `<p class="shade-math" title="Ranking score: 1 − 0.6 × depth gap / 50 − 0.25 if the undertone differs − 0.30 if outside your community's usual depth range. It orders the shades; it is not a match probability.">Rank score ${math.rank.toFixed(2)} = 1 − depth ${math.depth.toFixed(2)} − undertone ${math.undertone.toFixed(2)} − range ${math.range.toFixed(2)}</p>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    ${finishPanelHTML('shade')}
  `;

  resultsEl.classList.remove('hidden');

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

let wigMatchSeq = 0;
function activeChipVal(containerId) {
  const b = document.querySelector(`#${containerId} .chip-btn--active`);
  return b ? (b.dataset.val || null) : null;
}
async function matchWigs() {
  const seq = ++wigMatchSeq;
  const communityId = document.getElementById('wigCommunitySelect')?.value || state.communityId || null;
  // Read the filters from the buttons as they are right now, so results never lag a click behind.
  state.lengthPref = activeChipVal('wigLengthButtons');
  state.texturePref = activeChipVal('wigTextureButtons');

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
    if (seq !== wigMatchSeq) return; // a newer MATCH click is in flight
    renderWigResults(data);
  } catch (err) {
    toast('Wig match error: ' + (err.message ?? ''), 'error');
  }
}

// Wig Match results: a text list of individual wigs, every one inside the selected filters, each
// with its ranking checks spelled out. No composite picture (its labels did not match the styles).
const WIG_POINTS = { hairVibe: 4, community: 2, lookStyle: 1 };
const WIG_CHECK_LABEL = { hairVibe: 'hair vibe', community: 'community', lookStyle: 'look style' };
function wigLabel(kind, id) {
  const list = kind === 'length' ? state.wigLengths : state.wigTextures;
  return (list ?? []).find(x => x.id === id)?.label ?? id;
}
// Style portraits for every wig style in the catalogue (generated sample photos; the hairstyle is the subject).
// A missing file drops back to the text-only card.
const WIG_PORTRAITS = new Set([
  'kinky_coily_afro', 'big_chop_fro', 'twist_out_natural', 'stretched_puff', 'loc_wig',
  'faux_locs', 'butterfly_locs', 'sister_locs', 'knotless_box_braids', 'jumbo_box_braids',
  'senegalese_twists', 'fulani_braids', 'goddess_braids', 'passion_twists', 'spring_twist',
  'bone_straight_long', 'ultra_silky_xl', 'sleek_bob', 'blunt_lob', 'curtain_bang_layers',
  'kpop_idol_straight', 'silk_press_natural', 'pixie_cut', 'indian_remy_wavy',
  'peruvian_body_wave', 'beach_wave_medium', 'loose_deep_wave', 'curly_ombre', 'water_wave',
  'kinky_curly_mix', 'jerry_curl', 'khaleeji_blowout', 'bollywood_blowout', 'slicked_bun',
  'high_pony_sleek', 'coloured_wig', 'highlighted_balayage', 'coloured_wig_silver',
  'afro_editorial', 'box_braids_updo', 'cornrow_sleek', 'jewelled_updo'
]);
function wigPortrait(wig) {
  if (!WIG_PORTRAITS.has(wig.id)) return '';
  return `<figure class="wig-portrait"><img src="/wigs/${esc(wig.id)}.webp" alt="${esc(wig.name)} — hairstyle portrait" width="480" height="600" loading="lazy" decoding="async" data-wig-portrait="${esc(wig.id)}" onerror="this.parentElement.remove()"><figcaption>Generated photo, not a real person</figcaption></figure>`;
}
function wigItemHTML({ wig, criteria = {}, reason }) {
  const pts = Object.entries(WIG_POINTS).reduce((n, [k, p]) => n + (criteria[k] ? p : 0), 0);
  const checks = Object.keys(WIG_POINTS).map(k => `${WIG_CHECK_LABEL[k]} ${criteria[k] ? 'yes' : 'no'} (${criteria[k] ? WIG_POINTS[k] : 0} of ${WIG_POINTS[k]})`).join(' · ');
  const pic = wigPortrait(wig);
  return `<li class="wig-item${pic ? ' wig-item--photo' : ''}">${pic}
    <div class="wig-item-head"><strong class="wig-name">${esc(wig.name)}</strong>
      <span class="wig-item-meta">${esc(wig.texture)} · ${esc(wig.length)} · ${esc(wig.finish ?? '')}</span></div>
    ${wig.description ? `<p class="wig-desc">${esc(wig.description)}</p>` : ''}
    <p class="wig-checks">Rank score ${pts} of 7: ${checks}</p>
    ${reason ? `<p class="wig-reason">${esc(reason)}</p>` : ''}
  </li>`;
}
function renderWigResults(data = {}) {
  const wigs = data.wigs ?? [];
  const fl = data.filters ?? {};
  const resultsEl = document.getElementById('wigResults');
  const cardsEl = document.getElementById('wigCards');
  const chosen = [fl.length ? `length: ${wigLabel('length', fl.length)}` : null, fl.texture ? `texture: ${wigLabel('texture', fl.texture)}` : null].filter(Boolean);
  const filterLine = chosen.length ? `Every wig below is ${chosen.join(' and ')}.` : 'No length or texture filter set, so all styles are ranked.';
  const how = 'Your length and texture filters are applied first. The rest are ranked by three checks: hair vibe (4 points), community (2), look style (1).';
  let body;
  if (wigs.length) {
    body = `<p class="wig-filter-line">${esc(filterLine)}</p><ol class="wig-list">${wigs.map(wigItemHTML).join('')}</ol>`;
  } else {
    const near = (data.nearest ?? []).map(g => `<h4 class="wig-near-title">Keeps your ${esc(g.kept)} (${esc(wigLabel(g.kept, fl[g.kept]))}), not your ${esc(g.dropped)}</h4><ol class="wig-list">${g.wigs.map(wigItemHTML).join('')}</ol>`).join('');
    body = `<p class="wig-filter-line">None of our ${esc(String(data.total ?? 42))} styles is ${esc(chosen.join(' and '))}. ${near ? 'The closest options each keep one of your filters:' : 'Try a different length or texture.'}</p>${near}`;
  }
  cardsEl.innerHTML = `<h3 class="section-title">Your Wig Matches</h3><p class="wig-how">${esc(how)}</p>${body}`;
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

// One unbranded photo per product type (blank packaging, no logos). It illustrates the category
// only; the list beside it keeps its own basis label (curated / archetype / look-spec).
const PRODUCT_PHOTOS = {
  foundation: 'foundation', concealer: 'concealer', eyeshadow: 'eyeshadow', lip: 'lip', mascara: 'mascara',
  lash: 'lash', blush: 'blush', highlight: 'highlight', liner: 'liner', setting: 'setting', brow: 'brow', skincare_base: 'serum',
};
const PRODUCT_PHOTO_NOTE = 'Photos show each product type in blank packaging. They are generated pictures, not any brand\'s product.';
function productPhoto(cat) {
  const f = PRODUCT_PHOTOS[cat];
  return f ? `<img class="product-thumb" src="/products/${f}.webp" alt="${esc(capitalise(String(cat).replace(/_/g, ' ')))}: unbranded product type, blank packaging" width="400" height="400" loading="lazy" decoding="async" onerror="this.remove()">` : '';
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

  // Fixed tab order (the server can return regions in the order its lookups finish).
  const fixed = Object.keys(TRENDING_REGION_LABELS);
  const regions = Object.keys(trendingData).sort((a, b) => (fixed.indexOf(a) + 1 || 999) - (fixed.indexOf(b) + 1 || 999) || a.localeCompare(b));
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
                aria-label="See looks for ${artist.name}. Starts a new taste profile with just ${artist.name}">
          <div class="trending-rank">${i + 1}</div>
          <div class="trending-info">
            <div class="trending-name">${artist.name}
              ${artist.rising ? '<span class="rising-badge">↑ Rising</span>' : ''}
              ${artist.anchor ? '<span class="anchor-badge">⭐</span>' : ''}
            </div>
            <div class="trending-genre">${artist.genre}</div>
            <div class="trending-region-label">${artist.region}</div>
          </div>
          <div class="trending-add" title="See looks for this artist (replaces your current taste)">→</div>
        </button>
      `).join('')}
    </div>
    <p class="trending-cta">Tap an artist to see looks for that artist. This starts a new taste profile and replaces the artists you had; to combine artists, add them in Taste →</p>
  `;

  grid.querySelectorAll('.trending-card').forEach(card => {
    card.addEventListener('click', () => {
      const artistName = decodeURIComponent(card.dataset.artist);
      heroTry(artistName);
    });
  });
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function bootWithTrending() {
  try {
    await boot();
    // Load trending in background after boot
    loadTrending();
    // Wire up new feature modals
    setupTryOn();
    setupStylist();
    setupShare();
    setupStylistPage();
  } finally {
    // Replay any taps made while loading (see the head of index.html).
    window.__mirrrBootReady?.();
  }
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
  userImg: null,     // the photo as loaded (the browser has already turned it upright)
  file: null,        // the original File, kept so its EXIF can be copied into the saved photo
  palette: null,     // the look's colours, from /api/photo/palette or a studio's picture
  hair: null,        // a hair colour (hex), from the Hair Colour Lab
  face: null,        // the face found in the preview copy
  base: null,        // the unedited preview pixels
  seq: 0,
};
// The four finish chips keep their old data-blend values so saved links and tests still match.
const TRYON_FINISH = { multiply: 'natural', 'soft-light': 'soft', overlay: 'bold', screen: 'luminous' };
const TRYON_PREVIEW_MAX = 1000;
const tryonStrength = () => Math.max(0.1, Math.min(1, parseInt(document.getElementById('tryonOpacity')?.value ?? 70, 10) / 100));
const tryonStatus = (msg) => { const el = document.getElementById('tryonStatus'); if (el) el.textContent = msg || ''; };

function setupTryOn() {
  document.getElementById('tryonClose')?.addEventListener('click', closeTryOn);
  document.getElementById('tryonModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTryOn();
  });

  document.getElementById('tryonUploadBtn')?.addEventListener('click', () => {
    document.getElementById('tryonFileInput').click();
    pickerHint('tryonPickerMsg');
  });

  document.getElementById('tryonFileInput')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) loadTryOnPhoto(URL.createObjectURL(file), file);
  });

  // Model faces: the try-on works with no upload. Each face is a same-origin sample photo.
  const grid = document.getElementById('tryonModelFaces');
  if (grid) {
    grid.innerHTML = MODEL_FACES.map(f => `<button type="button" class="tryon-model" data-model-face="${f.id}" aria-label="Try on the ${esc(f.label)} model face"><img src="${f.src}" alt="${esc(f.label)} model face (generated sample photo)" loading="lazy" decoding="async" width="72" height="96"><span>${esc(f.label)}</span></button>`).join('');
    grid.addEventListener('click', e => {
      const b = e.target.closest('[data-model-face]');
      const f = b && MODEL_FACES.find(x => x.id === b.dataset.modelFace);
      if (f) { stopCamera(); loadTryOnPhoto(f.src, null); }
    });
  }

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

  // Studios (Look Book, Taste Leap, Colour & Lip, Hair Colour Lab) open the try-on with their own
  // colours: { name, picture } for makeup, { name, hair: hex } for hair colour.
  window.addEventListener('mirrr:tryon', async (e) => {
    const d = e.detail || {};
    let palette = null;
    if (d.picture) {
      try { palette = await api('/api/photo/palette', 'POST', { picture: d.picture }); } catch { toast('Could not load the colours for this look', 'error'); return; }
    }
    openTryOn(null, d.name || 'your look', { palette, hair: d.hair || null });
  });
  // The 60-Second Transformation hands over a library look by id; the try-on builds its colours for the face.
  window.addEventListener('mirrr:tryon-look', (e) => {
    const d = e.detail || {};
    if (d.lookId) openTryOn(d.lookId, d.name || 'your look');
  });
}

function openTryOn(lookId, lookName, extra = {}) {
  tryonState.lookId = lookId;
  tryonState.lookName = lookName;
  tryonState.lookImg = null;
  tryonState.showingOriginal = false;
  tryonState.palette = extra.palette ?? null;
  tryonState.hair = extra.hair ?? null;
  tryonState.face = null;
  tryonState.base = null;

  const modal = document.getElementById('tryonModal');
  document.getElementById('tryonLookName').textContent = `Try On: ${lookName}`;
  document.getElementById('tryonUploadStep').classList.remove('hidden');
  document.getElementById('tryonPreviewStep').classList.add('hidden');
  document.getElementById('tryonCameraWrap').classList.add('hidden');
  document.getElementById('tryonFileInput').value = '';
  tryonStatus('');

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
      video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1440 } },
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
  // A camera frame has no EXIF, and none is invented for it.
  loadTryOnPhoto(canvas.toDataURL('image/jpeg', 0.92), null);
}

const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That file could not be opened as a photo. If it is HEIC, export it as JPEG first.')); i.src = src; });
const labHex = ([L, a, b]) => { const c = labToRgb(L, a, b); return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`; };

/** The look's colours for this face: the server builds them from the look database. */
async function tryonPalette() {
  if (tryonState.palette || !tryonState.lookId) return tryonState.palette;
  const skin = tryonState.face?.ok ? labHex([tryonState.face.skin.L, tryonState.face.skin.a, tryonState.face.skin.b]) : '';
  try {
    tryonState.palette = await api(`/api/photo/palette?look=${encodeURIComponent(tryonState.lookId)}&skin=${encodeURIComponent(skin.replace('#', ''))}`);
  } catch { tryonState.palette = null; }
  return tryonState.palette;
}

async function loadTryOnPhoto(src, file = null) {
  const seq = ++tryonState.seq;
  let img;
  try { img = await loadImage(src); } catch (err) { toast(err.message, 'error'); return; }
  if (seq !== tryonState.seq) return;
  tryonState.userImg = img;
  tryonState.file = file;
  const canvas = document.getElementById('tryonCanvas');
  const scale = Math.min(1, TRYON_PREVIEW_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  tryonState.base = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const overlay = document.getElementById('tryonOverlay');
  overlay.width = canvas.width;
  overlay.height = canvas.height;
  overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);

  document.getElementById('tryonUploadStep').classList.add('hidden');
  document.getElementById('tryonCameraWrap').classList.add('hidden');
  document.querySelector('.tryon-photo-options')?.classList.remove('hidden');
  document.getElementById('tryonPreviewStep').classList.remove('hidden');

  tryonStatus('Finding your face…');
  await new Promise(r => setTimeout(r, 0));
  tryonState.face = findFace(tryonState.base);
  if (!tryonState.face.ok) { tryonStatus(tryonState.face.reason); return; }
  await tryonPalette();
  if (seq !== tryonState.seq) return;
  tryonStatus('');
  applyOverlay();
}

function editPixels(imageData, face) {
  const opts = { strength: tryonStrength(), finish: TRYON_FINISH[tryonState.blendMode] ?? 'natural' };
  if (tryonState.palette) applyLook(imageData, face, tryonState.palette, opts);
  if (tryonState.hair) recolourHair(imageData, face, tryonState.hair, opts);
}

/** Redraw the preview: the photo as it was, or with the look laid on it. */
function applyOverlay() {
  const canvas = document.getElementById('tryonCanvas');
  const base = tryonState.base;
  if (!canvas || !base) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (tryonState.showingOriginal || !tryonState.face?.ok || (!tryonState.palette && !tryonState.hair)) {
    ctx.putImageData(base, 0, 0);
    return;
  }
  const out = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
  editPixels(out, tryonState.face);
  ctx.putImageData(out, 0, 0);
}

function toggleBeforeAfter() {
  tryonState.showingOriginal = !tryonState.showingOriginal;
  const btn = document.getElementById('tryonBeforeAfterBtn');
  btn.textContent = tryonState.showingOriginal ? 'See With Look' : 'Before / After';
  applyOverlay();
}

/**
 * The full-size edit as a canvas: the photo at its own resolution (upright, as the browser shows
 * it), with the same edit as the preview, worked again at full size so nothing is upscaled.
 */
function fullSizeEdit() {
  const img = tryonState.userImg;
  let w = img.naturalWidth, h = img.naturalHeight, reduced = false;
  if (w * h > MAX_CANVAS_PIXELS) { const k = Math.sqrt(MAX_CANVAS_PIXELS / (w * h)); w = Math.floor(w * k); h = Math.floor(h * k); reduced = true; }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  if (!tryonState.showingOriginal && tryonState.face?.ok && (tryonState.palette || tryonState.hair)) {
    const full = x.getImageData(0, 0, w, h);
    editPixels(full, scaleFace(tryonState.face, w / tryonState.base.width));
    x.putImageData(full, 0, 0);
  }
  return { canvas: c, reduced };
}

async function saveTryOnImage() {
  if (!tryonState.userImg) return;
  const btn = document.getElementById('tryonSaveBtn');
  if (btn) btn.disabled = true;
  tryonStatus('Preparing your full-size photo…');
  try {
    await new Promise(r => setTimeout(r, 0));
    const { canvas, reduced } = fullSizeEdit();
    const platform = detectPlatform(navigator);
    const originalBytes = tryonState.file ? new Uint8Array(await tryonState.file.arrayBuffer()) : null;
    const { file } = await canvasToPhotoFile(canvas, { originalBytes, platform });
    const how = await savePhotoFile(file, { platform });
    tryonStatus(reduced ? 'This photo is larger than this browser can edit at once, so it was saved at the largest size it allows.' : '');
    if (how === 'share') toast(platform === 'ios' ? 'Choose "Save Image" to add it to Photos' : 'Saved through your share sheet', 'info');
    else if (how === 'download') toast(`Saved ${file.name}`, 'info');
  } catch (err) {
    tryonStatus('');
    toast(err?.message || 'Could not save the photo', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Audit and test hook: the same pipeline the modal uses, on a photo given as a URL, never uploaded.
window.mirrrTryon = {
  async renderForAudit(look, src, { strength = 0.7, finish = 'natural', hair = null } = {}) {
    const img = await loadImage(src);
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const data = x.getImageData(0, 0, c.width, c.height);
    const face = findFace(data);
    if (!face.ok) return { ok: false, reason: face.reason, out: c.toDataURL('image/jpeg', 0.92), w: c.width, engine: 'photo-engine' };
    const skin = labHex([face.skin.L, face.skin.a, face.skin.b]).slice(1);
    const palette = typeof look === 'string' ? await api(`/api/photo/palette?look=${encodeURIComponent(look)}&skin=${skin}`) : look ? await api('/api/photo/palette', 'POST', { picture: look }) : null;
    if (palette) applyLook(data, face, palette, { strength, finish });
    if (hair) recolourHair(data, face, hair, { strength, finish });
    x.putImageData(data, 0, 0);
    return { ok: true, out: c.toDataURL('image/jpeg', 0.92), w: c.width, h: c.height, engine: 'photo-engine', palette, confidence: face.confidence };
  },
  /** Run the save pipeline on given JPEG bytes (base64) without sharing; returns what would be saved. */
  async exportForTest(b64, look = 'soft_glam') {
    const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
    const file = new File([bytes], 'original.jpg', { type: 'image/jpeg' });
    openTryOn(look, look);
    await loadTryOnPhoto(URL.createObjectURL(file), file);
    const { canvas } = fullSizeEdit();
    const out = await canvasToPhotoFile(canvas, { originalBytes: bytes, platform: detectPlatform(navigator) });
    const outBytes = new Uint8Array(await out.file.arrayBuffer());
    closeTryOn();
    return { name: out.file.name, size: out.size, exif: out.exif, natural: { w: tryonState.userImg.naturalWidth, h: tryonState.userImg.naturalHeight }, faceOk: !!tryonState.face?.ok, b64: btoa(Array.from(outBytes, b => String.fromCharCode(b)).join('')) };
  },
};

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
      previousLookIds: state.currentLookIds ?? [],
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
      state.resultTasteChips = [...state.tasteChips];
      // The reply above says what changed (or that nothing did); redraw the bars and looks.
      renderTasteResults(result);
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
    : `Hi! I'm your MIRRR stylist. I re-rank looks with live Qloo taste data; my replies are written from templates, not a language model to find looks tailored to you.\n\nLet's start: tell me about an artist, film, or cultural vibe you love, or describe an occasion you're dressing for.`;

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
    // Send the looks on screen so each typed turn compounds on the last and the reply can say
    // plainly when the ranking did not change.
    const result = await api('/api/agent/refine', 'POST', {
      message: msg,
      currentAesthetic: state.aesthetic,
      communityId: state.communityId,
      tasteChips: state.tasteChips,
      previousLookIds: state.stylistPageLookIds ?? state.currentLookIds ?? [],
    });

    const msgs = document.getElementById('stylistPageMessages');
    msgs.removeChild(msgs.lastElementChild);

    appendStylistPageMessage('stylist', result.reply ?? "I've updated your profile!");

    if (result.looks?.length) {
      state.aesthetic = result.aesthetic ?? state.aesthetic;
      state.communityId = result.communityId ?? state.communityId;
      state.stylistPageLookIds = result.looks.map(r => r.look?.id).filter(Boolean);
      state.resultTasteChips = [...state.tasteChips];

      const resultsEl = document.getElementById('stylistPageResults');
      resultsEl.classList.remove('hidden');
      resultsEl.innerHTML = `
        <h3 class="section-title">Your Refined Looks</h3>
        <div class="looks-grid-inner">
          ${result.looks.map(r => renderLookCard(r.look, r.score, r)).join('')}
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
      document.getElementById('stylistSharePageBtn')?.addEventListener('click', () => openShare(getTopLookId(state.stylistPageLookIds)));
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
  canvas.dataset.lookId = effectiveLookId ?? '';

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

function drawShareCardText(ctx, W, startY, lookId) {
  const lookName = lookId ? state.lookNames?.[lookId] : null;
  if (lookName) {
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = '#e8c86a';
    ctx.textAlign = 'center';
    ctx.fillText(`Top look: ${lookName}`, W / 2, startY + 14);
    startY += 30;
  }
  // Aesthetic bars
  const aes = state.aesthetic;
  if (aes) {
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Your Aesthetic DNA', W / 2, startY + 30);

    const bars = [
      { label: 'Intensity', val: aes.intensity },
      { label: 'Warmth', val: aes.warmth },
      { label: 'Boldness', val: aes.boldness },
    ];
    bars.filter(b => Number.isFinite(b.val)).forEach((b, i) => {
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
  ctx.fillText(_lastTaste?.meta?.qloo_powered ? 'mirrr-upbn.onrender.com · Powered by Qloo Taste AI' : 'mirrr-upbn.onrender.com · demo data, not from Qloo', W / 2, footY);
}

function getTopLookId(ids = state.currentLookIds) {
  // The current top look (after any re-ranking) that has a photo; else a community default.
  const top = (ids ?? []).find(id => LOOK_IMAGES[id]);
  if (top) return top;
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
    stylistBtn.textContent = '🪞 Refine with the Stylist';
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
  // Read the filters from inside the Style Match view only. Another studio (Smile & Lip Care)
  // once rendered its own #smCommunity select, and the global lookup picked up its value.
  const view = document.getElementById('view-style-match');
  const pick = (id) => view?.querySelector(`#${id}`)?.value || '';
  const fitzpatrick = pick('smFitzpatrick');
  const community   = pick('smLookCommunity');
  const vibe        = pick('smVibe');

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
        <div class="sm-photo${look.image ? '' : ' sm-photo--none'}">${look.image ? `<img src="${look.image}" alt="${look.name} — ${look.community.replace('-', ' ')} look" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')" onerror="this.parentElement.classList.add('sm-photo--none');this.remove()">${genBadge(look.image)}` : ''}</div>
        <div class="shade-info">
          <div class="shade-name">${look.name}</div>
          <div class="shade-community" style="font-size:0.72rem;color:#c9a96e;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.3rem;">${look.community.replace('-', ' ')}</div>
          <div class="shade-desc">${look.description}</div>
          <div style="margin-top:0.5rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
            ${(look.vibe || []).map(v => `<span style="background:#2a1a2e;border:1px solid #4a2040;border-radius:999px;padding:0.15rem 0.5rem;font-size:0.68rem;color:#c9a96e;">${v}</span>`).join('')}
          </div>
          <button class="btn btn-secondary sm-guide-btn" style="margin-top:0.75rem;font-size:0.78rem;padding:0.4rem 0.9rem;" data-look-id="${look.id}">Get My Guide →</button>
          <button class="become-btn" type="button" data-become="${look.id}" data-community="${look.community}">Become this look</button>
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<p style="color:#e05;text-align:center;padding:2rem;">Could not load looks — ${err.message}</p>`;
    toast('Style match error: ' + err.message, 'error');
  }
}

function flattenStyleProduct(value) {
  if (Array.isArray(value)) return value.map(flattenStyleProduct).filter(Boolean).join(', ');
  if (value && typeof value === 'object') return Object.entries(value).map(([key, v]) => `${key}: ${flattenStyleProduct(v)}`).join('; ');
  return String(value ?? '');
}

async function openStyleGuide(lookId) {
  const drawer = document.getElementById('smGuideDrawer');
  const titleEl = document.getElementById('smGuideTitle');
  const stepsEl = document.getElementById('smGuideSteps');
  const tipsEl  = document.getElementById('smGuideTips');
  if (!drawer) return;

  // Grab current fitzpatrick filter
  // '' means "Any": no skin type chosen, so the server's default (IV) is an assumption, not a selection.
  const selectedType = document.getElementById('smFitzpatrick')?.value || '';
  const fitzpatrick = selectedType || 'IV';
  const undertone   = 'neutral';

  titleEl.textContent = 'Loading guide…';
  stepsEl.innerHTML = '';
  tipsEl.innerHTML  = '';
  drawer.classList.remove('hidden');

  try {
    const data = await api('/api/style-match/guide', 'POST', { lookId, fitzpatrick, undertone });
    titleEl.textContent = data.lookId?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' — Step-by-Step Guide';
    const used = data.fitzpatrickUsed;
    const range = (data.fitzpatrickAvailable || []).join(', ');
    const noticeText = !used ? ''
      : !selectedType ? `Shades shown for Type ${used}. Pick your skin type above to personalise this guide.`
      : used !== selectedType ? `This guide has shades for Types ${range}. Showing Type ${used}, the closest to your Type ${selectedType}.`
      : '';
    const notice = noticeText ? `<p style="color:#c9a96e;margin-bottom:1rem;">${esc(noticeText)}</p>` : '';

    if (data.steps?.length) {
      stepsEl.innerHTML = notice + data.steps.map((step, i) => `
        <div style="margin-bottom:1.2rem;padding:1rem;background:#111;border-radius:0.75rem;border-left:3px solid #c9a96e;">
          <div style="font-size:0.72rem;color:#c9a96e;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.25rem;">Step ${i+1} · ${step.zone || ''}</div>
          <div style="font-weight:600;color:#f0e8da;margin-bottom:0.4rem;">${step.stepName}</div>
          <div style="font-size:0.85rem;color:#aaa;margin-bottom:0.6rem;">${step.technique}</div>
          ${step.products ? `<div style="font-size:0.8rem;color:#c9a96e;">${Object.entries(step.products).map(([k,v]) => `<span style="color:#888;">${esc(k)}:</span> ${esc(flattenStyleProduct(v))}`).join(' · ')}</div>` : ''}
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

/**
 * Provenance for one result: "Powered by Qloo" only when Qloo actually returned data, with the real
 * counts of what it sent and what MIRRR used; otherwise an unmistakable demo-data banner saying why.
 */
function sourceBadgeHtml(meta, narrationSource) {
  const p = meta?.provenance;
  const narr = narrationSource === 'template' ? 'narration: written by a template from these signals (no language model)' : narrationSource ? `narration: ${esc(narrationSource)}` : '';
  if (meta?.qloo_powered === true) {
    const ents = (p?.entities ?? []).map(e => esc(e.name)).join(', ');
    const d = p?.dropped ?? {};
    const used = (p?.used ?? []).map(t => `<span class="tag" title="${esc(t.kind ?? '')}">${esc(t.name)}${t.affinity != null ? ` · ${t.affinity.toFixed(2)}` : ''}</span>`).join('');
    const unres = p?.unresolved?.length ? ` · not on Qloo: ${p.unresolved.map(esc).join(', ')}` : '';
    return `<div class="src-badge src-badge--live" data-qloo="live">${ico('bolt')} <strong>Powered by Qloo · live</strong>${p ? ` · ${ents} → ${p.tags_received} taste tags received (${p.received?.music ?? 0} music genres, ${p.received?.media ?? 0} media themes), <strong>${p.tags_used} used</strong>, ${(d.blocked ?? 0) + (d.irrelevant ?? 0) + (d.duplicates ?? 0)} filtered out (${d.blocked ?? 0} unsafe, ${d.irrelevant ?? 0} not about beauty, ${d.duplicates ?? 0} repeats) · ${p.calls} Qloo calls, ${p.latency_ms} ms${unres}` : ''}${narr ? ` · ${narr}` : ''}
      ${used ? `<div class="entity-chips" aria-label="Qloo tags that shaped this result">${used}</div>` : ''}</div>`;
  }
  if (meta?.no_taste_input) return `<p class="src-badge src-badge--template">${ico('sparkle')} Catalogue only: no artists, films or brands given, so Qloo was not used. Add some to steer this with Qloo.</p>`;
  const why = meta?.qloo_unreachable || meta?.qloo_error
    ? `Qloo could not be reached${meta?.qloo_error ? ` (${esc(meta.qloo_error)})` : ''}.`
    : p?.unresolved?.length && !p?.entities?.length ? `Qloo did not recognise ${p.unresolved.map(esc).join(', ')}.` : 'Qloo returned no taste data for this request.';
  return `<div class="demo-banner" role="status" data-qloo="demo" style="background:#7a1f1f;color:#fff;border-radius:10px;padding:.7rem 1rem;margin:.5rem 0;font-weight:600">DEMO DATA, not from Qloo. ${why} The looks below come from MIRRR's built-in sample data${narr ? `; ${narr}` : ''}.</div>`;
}

// ---- Trace ("How MIRRR got this") -----------------------------------------

function describeTraceStep(t) {
  const bits = [];
  if (t.inputs_count != null) bits.push(`${t.inputs_count} input(s)`);
  if (t.entities_found != null) bits.push(`${t.entities_found} Qloo entities resolved`);
  if (t.tags_found != null) bits.push(`${t.tags_found} taste signals`);
  if (t.communityId) bits.push(`community: ${t.communityId}`);
  if (t.explain) bits.push(t.explain);
  if (t.step === 'reason' && t.dnaResult === 'skipped' && !t.communityId) bits.push('no Cultural DNA answers or community chosen');
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
  const summary = meta.provenance ? `Resolved ${meta.provenance.entities.length} entities · ${meta.provenance.tags_received} Qloo tags received · ${meta.provenance.tags_used} used` : `Resolved ${meta.entities_resolved ?? 0} entities · ${meta.tags_from_qloo ?? 0} Qloo signals`;
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
      face: prev.face ?? null,
      target: prev.target ?? null,
      plan: prev.plan ?? null,
      ...extra,
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch { /* storage unavailable or full: persistence is best-effort */ }
}
function clearProfile() {
  try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
}
function profileIsEmpty(p) {
  return !p || (!(p.chips && p.chips.length) && !p.aesthetic && !(p.savedLooks && p.savedLooks.length) && !p.shades && !p.face && !p.target && !p.plan);
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
  // Start over erases her saved profile, looks, shades and plan on this device: ask first.
  const ok = window.confirm('Start over? This deletes your saved taste, looks, shades and plan from this browser. It cannot be undone.');
  if (!ok) return false;
  clearProfile();
  location.reload();
  return true;
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
       <div class="pp-row"><strong>Transformation plan</strong>${p.target?.lookId ? `${esc(String(p.target.lookId).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}${p.plan?.checked ? ` · ${Object.values(p.plan.checked).filter(Boolean).length} step(s) done` : ''}` : 'none'}</div>
       <div class="pp-row"><strong>Looks you saved</strong>${(p.savedLooks || []).map(l => esc(l.name)).join(', ') || 'none (plans are listed above, not here)'}</div>
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
  // Fields can be strings or objects (e.g. a bridal signature look); always render them as text.
  const ritualHead = flat(plan.ritual?.festival) || (typeof plan.ritual?.tradition === 'string' ? plan.ritual.tradition : '');
  const ritualSig = planList(plan.ritual?.signature ?? (plan.ritual?.tradition && typeof plan.ritual.tradition === 'object'
    ? Object.entries(plan.ritual.tradition).map(([k, v]) => `${k}: ${flat(v)}`) : []));
  const ritualBody = (ritualItems.length || ritualSig.length) ? `${ritualHead ? `<p><strong>${esc(ritualHead)}</strong></p>` : ''}${ritualSig.length ? `<p class="muted">Signature look</p><ul>${ritualSig.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}${ritualItems.length ? `<p class="muted">Rituals</p><ul>${ritualItems.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}` : '';
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
    planCard('wig', 'Finishing — your choice', finishingBody(plan, wigBody)),
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
      finish: loadFinish(),
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
  document.getElementById('helpClearBtn')?.addEventListener('click', () => resetEverything());
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
      <div class="dna-look-item">
        <button class="dna-look-card" data-look="${l.id}">
          <img src="${LOOK_IMAGES[l.id]}" alt="${l.name}" loading="lazy" decoding="async">
          <span class="dna-look-name">${l.name}</span>
        </button>
        <button class="become-btn" type="button" data-become="${l.id}">Become this look</button>
      </div>`).join('');
    grid.querySelectorAll('.dna-look-card').forEach(b => b.addEventListener('click', () => {
      const sel = document.getElementById('communitySelect'); if (sel && communityId) sel.value = communityId;
      showView('taste');
    }));
  } catch { grid.innerHTML = ''; }
}


// Hero: one-step try — type an artist, land on real results
function heroTry(name) {
  const v = String(name || '').trim();
  if (!v) return;
  state.tasteChips = [];
  renderChips();
  addChip(v);
  showView('taste');
  fetchLooks();
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('heroTryForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    heroTry(document.getElementById('heroTryInput')?.value);
  });
  document.querySelectorAll('.hero-try-chip').forEach(b => b.addEventListener('click', () => heroTry(b.dataset.try)));
});


// ===========================================================================
// PHOTO MATCH — sample skin tone from the user's own photo (all in-browser),
// then match shades on the server by colour distance.
// ===========================================================================

// Skin measurement (public/skin-sample.js): white balance and exposure from the eye whites, then five
// face patches with a confidence. Runs on this device; the photo is never uploaded.
function sampleSkin(img) {
  const maxSide = 720, k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const W = Math.max(1, Math.round(img.width * k)), H = Math.max(1, Math.round(img.height * k));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const m = measureSkin(ctx.getImageData(0, 0, W, H));
  if (!m) return null;
  return { ...m.rgb, measure: m };
}

function measureNote(rgb) {
  const m = rgb?.measure; if (!m) return '';
  const conf = m.confidence >= 0.7 ? 'high' : m.confidence >= 0.45 ? 'medium' : 'low';
  return `Measured from ${m.patches.length} skin patch${m.patches.length === 1 ? '' : 'es'}${m.method === 'centre' ? ' in the centre of the frame (no face found)' : ''}; confidence ${conf} (${m.confidence.toFixed(2)})${m.flags.length ? `; ${m.flags.join('; ')}` : ''}.`;
}

async function analyzePhoto(file) {
  const out = document.getElementById('photoResult');
  if (!out || !file) return;
  out.classList.remove('hidden');
  out.innerHTML = '<p class="photo-note">Reading your skin tone…</p>';
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const rgb = sampleSkin(img);
    if (!rgb) { out.innerHTML = '<p class="photo-note">Could not find enough skin in the centre of the photo. Try a front-facing selfie in daylight with your face centred.</p>'; return; }
    const data = await api('/api/shades/match-color', 'POST', { r: rgb.r, g: rgb.g, b: rgb.b, topN: 4 });
    const best = data.matches[0];
    state.undertone = data.undertone;
    state.photoUrl = url;
    out.innerHTML = `
      <div class="photo-row">
        <img class="photo-thumb" src="${url}" alt="Your photo">
        <div class="photo-swatches">
          <div class="photo-sw"><span style="background:rgb(${rgb.r},${rgb.g},${rgb.b})"></span>Your skin (sampled)</div>
          <div class="photo-sw"><span style="background:${esc(best.hex)}"></span>${data.honestMatch === false ? 'Nearest (not a match)' : esc(best.bandLabel ?? 'Best match')}: <strong>${esc(best.name)}</strong></div>
        </div>
      </div>
      <p class="match-band" data-band="${esc(data.band ?? '')}"><strong>${esc(data.message ?? best.name)}</strong> ${esc(data.undertone)} undertone. Next nearest: ${data.matches.slice(1).map(m => `${esc(m.name)} (ΔE ${m.deltaE})`).join(', ')}.</p>
      <p class="photo-note" data-confidence="${esc(rgb.measure?.confidence ?? '')}">${esc(measureNote(rgb))}</p>
      <p class="photo-note">ΔE2000 bands: 3 or less is a match, 3 to 6 is close (check in daylight), above 6 is outside our honest range.</p>
      <p class="photo-note">This is an estimate from your photo. Light, camera and filters change colour, so confirm in daylight or against a swatch. Nothing was uploaded.</p>
      <div class="photo-actions">
        <button class="btn btn-primary" id="photoTryBtn" type="button">Try a look on this photo</button>
        <button class="btn btn-ghost" id="photoShadesBtn" type="button">See all my shade matches</button>
      </div>`;
    document.getElementById('photoTryBtn').addEventListener('click', async () => {
      try {
        const { looks } = await api('/api/looks');
        const pick = state.tasteResult?.looks?.[0]?.look ?? looks[0];
        openTryOn(pick.id, pick.name);
        loadTryOnPhoto(url, file);
      } catch { toast('Could not open try-on', 'error'); }
    });
    document.getElementById('photoShadesBtn').addEventListener('click', () => {
      renderShadeResults(data.matches.map(m => ({ shade: m.shade, coverageNote: `ΔE2000 ${m.deltaE} from your photo · ${m.bandLabel}`, name: m.name, code: m.code, hex: m.hex })));
      showView('shade');
    });
  } catch (err) {
    out.innerHTML = `<p class="photo-note">Could not read that photo — ${esc(err.message ?? 'try another')}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('photoBtn')?.addEventListener('click', () => { document.getElementById('photoInput')?.click(); pickerHint('photoPickerMsg'); });
  document.getElementById('photoInput')?.addEventListener('change', (e) => analyzePhoto(e.target.files?.[0]));
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('heroPhotoBtn')?.addEventListener('click', () => {
    showView('taste');
    setTimeout(() => document.getElementById('photoMatch')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  });
});


// ===========================================================================
// PURPOSE FLOW — My Face -> Become This Look -> Transform (staged plan)
// ===========================================================================

const faceState = { photoUrl: null, photoFile: null, spectrum: null, draft: {}, wired: false };
const faceOf = () => (loadProfile() || {}).face || null;
const targetOf = () => (loadProfile() || {}).target || null;
const planOf = () => (loadProfile() || {}).plan || null;
const normImg = (f) => (f ? String(f).replace(/^\//, '') : '');

// ---- nav "More" menu: close after choosing / clicking away -------------------
document.addEventListener('click', (e) => {
  const more = document.getElementById('navMore');
  if (!more || !more.open) return;
  if (e.target.closest('.nav-more-menu .nav-link') || !e.target.closest('#navMore')) more.open = false;
});

// ---- entry points -------------------------------------------------------------
function startTransformFlow() {
  showView(faceOf()?.shadeId ? 'transform' : 'face');
}

// Style Match signature looks have their own ids. Each one builds its plan on the named library
// look below (same community, closest description). Never a random pick.
const STYLE_MATCH_PLAN_LOOK = {
  desi_baddie: 'desi_everyday_chic',
  persian_queen: 'persian_editorial',
  west_african_glow: 'afro_glam_editorial',
  k_beauty_seoul: 'k_beauty_glass',
  hammam_goddess: 'moroccan_soiree',
  mehndi_bride: 'mehndi_bridal',
  rooibos_glow: 'amapiano_beat',
  loc_journey: 'hip_hop_glam',
};
async function becomeThisLook(lookId, community, { tasteChips, fromName } = {}) {
  if (!lookId) return;
  let mappedNote = '';
  try {
    const looks = await allLooks();
    if (!looks.some(l => l.id === lookId)) {
      const planId = STYLE_MATCH_PLAN_LOOK[lookId];
      if (!planId) { toast('That look has no step-by-step plan yet. Pick another look.', 'warn'); return; }
      const planName = looks.find(l => l.id === planId)?.name ?? planId;
      if (fromName && planName !== fromName) mappedNote = `${fromName} builds on our ${planName} look, the closest step-by-step plan.`;
      lookId = planId;
    }
  } catch { /* keep the id; the plan view will report a clear error */ }
  // The taste that picked this look (Taste results) travels with it, so the plan's
  // "Because you love ..." lines name that taste, not whatever is typed later.
  persist({ target: { lookId, at: new Date().toISOString(), ...(Array.isArray(tasteChips) ? { tasteChips } : {}), ...(mappedNote ? { note: mappedNote } : {}) }, plan: null });
  if (!faceOf()?.shadeId) {
    toast(`${mappedNote ? mappedNote + ' ' : ''}First, tell MIRRR your shade. Then your plan builds automatically.`, 'info');
    showView('face');
    return;
  }
  if (mappedNote) toast(mappedNote, 'info');
  showView('transform');
}

// Capture phase so the card's own click handler (open products) does not also fire.
document.addEventListener('click', (e) => {
  const b = e.target.closest?.('[data-become]');
  if (!b) return;
  e.preventDefault();
  e.stopPropagation();
  const fromTaste = !!b.closest('#tasteLooks, #stylistPageResults');
  const fromName = b.closest('.sm-card')?.querySelector('.shade-name')?.textContent?.trim();
  becomeThisLook(b.dataset.become, b.dataset.community, {
    tasteChips: fromTaste && Array.isArray(state.resultTasteChips) ? [...state.resultTasteChips] : undefined,
    fromName,
  });
}, true);

// Trending artists: add a "Become this look" per artist, mapped to a look in their region's style.
const REGION_ARCH = {
  west_african: ['afro_glam', 'amapiano_beat'], east_african: ['afro_glam'], black_american: ['hip_hop_glam', 'afro_glam'],
  caribbean: ['caribbean_carnival'], south_asian: ['bollywood_bridal'], arab: ['gulf_glam'], latina: ['latina_glam'],
  east_asian: ['k_beauty'], south_african: ['amapiano_beat', 'afro_glam'],
};
let _allLooksCache = null;
async function allLooks() {
  if (!_allLooksCache) _allLooksCache = (await api('/api/looks')).looks || [];
  return _allLooksCache;
}
async function lookForArtist(name, regionKey) {
  const looks = (await allLooks()).filter(l => LOOK_IMAGES[l.id]);
  const archs = REGION_ARCH[regionKey] || ['clean_minimal'];
  const pool = looks.filter(l => archs.includes(l.archetype));
  const list = pool.length ? pool : looks;
  let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}
function decorateTrending() {
  document.querySelectorAll('.trending-card').forEach((card) => {
    if (card.parentElement?.classList.contains('trending-item')) return;
    const wrap = document.createElement('div');
    wrap.className = 'trending-item';
    card.parentNode.insertBefore(wrap, card);
    wrap.appendChild(card);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'become-btn become-btn--trend';
    btn.textContent = 'Become this look';
    btn.setAttribute('aria-label', `Become the look that matches ${decodeURIComponent(card.dataset.artist || '')}`);
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const look = await lookForArtist(decodeURIComponent(card.dataset.artist || ''), activeRegion);
        if (look) becomeThisLook(look.id, undefined, { tasteChips: [] });
      } catch { toast('Could not load looks. Try again.', 'error'); }
    });
    wrap.appendChild(btn);
  });
}
new MutationObserver(() => { if (document.querySelector('.trending-card:not(.trending-item .trending-card)')) decorateTrending(); })
  .observe(document.documentElement, { childList: true, subtree: true });

// ---- MY FACE ------------------------------------------------------------------
async function initFaceView() {
  if (!faceState.wired) {
    faceState.wired = true;
    document.getElementById('facePhotoBtn')?.addEventListener('click', () => { document.getElementById('facePhotoInput')?.click(); pickerHint('facePhotoMsg'); });
    document.getElementById('facePhotoInput')?.addEventListener('change', (e) => analyzeFacePhoto(e.target.files?.[0]));
    document.getElementById('faceSaveBtn')?.addEventListener('click', saveFace);
    document.getElementById('faceClearBtn')?.addEventListener('click', () => {
      persist({ face: null, plan: null });
      faceState.draft = {};
      fillFaceForm();
      toast('Face profile cleared', 'info');
    });
    const fc = document.getElementById('faceCommunity');
    if (fc) state.communities.forEach(c => {
      const o = document.createElement('option'); o.value = c.id; o.textContent = String(c.label).replace(/^[^\p{L}\p{N}]+/u, ''); fc.appendChild(o);
    });
    try {
      const data = await api('/api/shades/spectrum');
      faceState.spectrum = data.spectrum || [];
    } catch { faceState.spectrum = []; toast('Could not load the shade list', 'error'); }
    const box = document.getElementById('faceSpectrum');
    if (box) {
      box.innerHTML = faceState.spectrum.map(sh => `<button type="button" class="face-sw" role="radio" aria-checked="false" data-shade="${esc(sh.id)}" title="${esc(sh.name)}" aria-label="${esc(sh.name)}" style="background:${esc(sh.hex)}"></button>`).join('');
      box.addEventListener('click', (e) => {
        const b = e.target.closest('.face-sw'); if (!b) return;
        faceState.draft.shadeId = b.dataset.shade; refreshFaceShade();
      });
    }
  }
  faceState.draft = { ...(faceOf() || {}) };
  fillFaceForm();
}

function shadeById(id) { return (faceState.spectrum || []).find(s => s.id === id) || null; }

function refreshFaceShade() {
  const sh = shadeById(faceState.draft.shadeId);
  document.querySelectorAll('.face-sw').forEach(b => {
    const on = sh && b.dataset.shade === sh.id;
    b.classList.toggle('face-sw--on', !!on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  const out = document.getElementById('faceChosen');
  if (out) out.innerHTML = sh
    ? `<span class="face-chip" style="background:${esc(sh.hex)}"></span> <strong>${esc(sh.name)}</strong> &middot; ${esc((sh.undertones || []).join(', '))} undertones`
    : 'No shade chosen yet.';
}

function fillFaceForm() {
  const d = faceState.draft || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  set('faceUndertone', d.undertone); set('faceHairTexture', d.hairTexture); set('faceHairLength', d.hairLength); set('faceCommunity', d.communityId);
  refreshFaceShade();
  const box = document.getElementById('facePhotoBox');
  if (box) box.innerHTML = faceState.photoUrl ? `<img src="${esc(faceState.photoUrl)}" alt="Your photo">` : '<span class="face-photo-empty">Your photo (optional)</span>';
}

async function analyzeFacePhoto(file) {
  const msg = document.getElementById('facePhotoMsg');
  if (!file) return;
  if (msg) msg.textContent = 'Reading your skin tone…';
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    faceState.photoUrl = url;
    faceState.photoFile = file;
    const rgb = sampleSkin(img);
    fillFaceForm();
    if (!rgb) { if (msg) msg.textContent = 'Could not find enough skin in the middle of the photo. Use a front-facing selfie in daylight, or pick your shade below.'; return; }
    const data = await api('/api/shades/match-color', 'POST', { r: rgb.r, g: rgb.g, b: rgb.b, topN: 3 });
    const best = data.matches[0];
    faceState.draft.shadeId = best.code;
    if (data.undertone) faceState.draft.undertone = data.undertone;
    fillFaceForm();
    if (msg) msg.textContent = data.honestMatch === false
      ? `${data.message} Pick your shade below; we would rather say so than guess.`
      : `Suggested: ${best.name}, ${data.undertone} undertone (${best.bandLabel}, ΔE2000 ${best.deltaE}). ${measureNote(rgb)} Adjust it if it does not look like you.`;
  } catch (err) {
    if (msg) msg.textContent = 'Could not read that photo. Pick your shade below instead.';
  }
}

function saveFace() {
  const sh = shadeById(faceState.draft.shadeId);
  if (!sh) { toast('Pick your shade first', 'warn'); return; }
  const val = (id) => document.getElementById(id)?.value || '';
  const face = {
    shadeId: sh.id, shadeName: sh.name, hex: sh.hex, depth: sh.depth,
    undertone: val('faceUndertone') || (sh.undertones || [])[0] || '',
    hairTexture: val('faceHairTexture'), hairLength: val('faceHairLength'), communityId: val('faceCommunity'),
  };
  persist({ face });
  if (face.undertone) state.undertone = face.undertone;
  if (face.communityId) state.communityId = face.communityId;
  toast('Face profile saved in this browser', 'info');
  showView('transform');
}

// ---- TRANSFORM ----------------------------------------------------------------
const transformCache = {};

async function renderTransform() {
  const host = document.getElementById('transformBody');
  if (!host) return;
  const face = faceOf();
  const target = targetOf();
  if (!face?.shadeId) {
    host.innerHTML = `<div class="tf-start card"><h3>Step 1: My Face</h3><p>Tell MIRRR your shade and hair so each step is in your colours.</p><button class="btn btn-primary" id="tfToFace" type="button">Set up my face</button></div>`;
    document.getElementById('tfToFace')?.addEventListener('click', () => showView('face'));
    return;
  }
  if (!target?.lookId) { await renderLookPicker(host, face); return; }
  await runTransform(host, face, target.lookId);
}

function faceSummaryHtml(face) {
  return `<span class="face-chip" style="background:${esc(face.hex || '#888')}"></span> <strong>${esc(face.shadeName || face.shadeId)}</strong>${face.undertone ? ` &middot; ${esc(face.undertone)} undertone` : ''}${face.hairTexture ? ` &middot; ${esc(face.hairTexture)} hair` : ''}${face.hairLength ? `, ${esc(face.hairLength)}` : ''}`;
}

async function renderLookPicker(host, face) {
  host.innerHTML = `<div class="tf-face-line">${faceSummaryHtml(face)} <button class="btn btn-ghost tf-link" id="tfEditFace" type="button">Edit</button></div>
    <h3 class="tf-h">Step 2: pick a look you love</h3><div class="tf-picker" id="tfPicker"><p class="photo-note">Loading looks…</p></div>`;
  document.getElementById('tfEditFace')?.addEventListener('click', () => showView('face'));
  try {
    const looks = (await allLooks()).filter(l => LOOK_IMAGES[l.id]);
    document.getElementById('tfPicker').innerHTML = looks.map(l => `
      <div class="tf-pick">
        <img src="${esc(LOOK_IMAGES[l.id])}" alt="${esc(l.name)}" loading="lazy" decoding="async">
        <div class="tf-pick-name">${esc(l.name)}</div>
        <button class="become-btn" type="button" data-become="${esc(l.id)}">Become this look</button>
      </div>`).join('');
  } catch { document.getElementById('tfPicker').innerHTML = '<p class="photo-note">Could not load looks. Check your connection and reopen this page.</p>'; }
}

/** The taste behind the current plan: the one that picked the target look, else the current chips. */
function planTasteChips() {
  const t = targetOf();
  return Array.isArray(t?.tasteChips) ? t.tasteChips : [...state.tasteChips];
}

async function runTransform(host, face, lookId) {
  host.innerHTML = '<div class="modal-loading"><div class="spinner"></div></div><p class="photo-note" style="text-align:center">Building your plan…</p>';
  const planChips = planTasteChips();
  const key = `${lookId}|${face.shadeId}|${face.undertone}|${face.hairTexture}|${face.hairLength}|${planChips.join(',')}|${loadFinish().join(',')}`;
  let data = transformCache[key];
  if (!data) {
    try {
      data = await api('/api/transform', 'POST', {
        face: { shadeId: face.shadeId, depth: face.depth, undertone: face.undertone || undefined, hairTexture: face.hairTexture || undefined, hairLength: face.hairLength || undefined, communityId: face.communityId || undefined },
        targetLookId: lookId,
        tasteChips: planChips,
        finish: loadFinish(),
      });
      transformCache[key] = data;
    } catch (err) {
      host.innerHTML = `<div class="tf-start card"><h3>Could not build your plan</h3><p>${esc(err.message || 'Something went wrong.')}</p>
        <div class="form-actions"><button class="btn btn-primary" id="tfRetry" type="button">Try again</button><button class="btn btn-ghost" id="tfPickOther" type="button">Pick a different look</button></div></div>`;
      document.getElementById('tfRetry')?.addEventListener('click', () => renderTransform());
      document.getElementById('tfPickOther')?.addEventListener('click', () => { persist({ target: null, plan: null }); renderTransform(); });
      return;
    }
  }
  renderPlanResult(host, face, data, lookId);
}

function stepKey(stage, i) { return `${stage.id ?? stage.title}:${i}`; }

function renderPlanResult(host, face, data, lookId) {
  const t = data.target || { id: lookId, name: 'Your look' };
  const img = normImg(t.image || LOOK_IMAGES[t.id]);
  const plan = planOf();
  const checked = (plan && plan.targetLookId === lookId && plan.checked) || {};
  const stages = Array.isArray(data.stages) ? data.stages : [];
  const total = stages.reduce((n, st) => n + (st.steps?.length || 0), 0);
  const because = Array.isArray(data.because) ? data.because.filter(Boolean) : [];

  host.innerHTML = `
    <div class="tf-head card">
      ${img ? `<img class="tf-target-img" src="${esc(img)}" alt="${esc(t.name)}">` : ''}
      <div class="tf-head-body">
        <p class="dna-kicker">Your transformation</p>
        <h3 class="tf-title">${esc(t.name)}</h3>
        ${targetOf()?.note && targetOf()?.lookId === t.id ? `<p class="tf-desc tf-mapped">${esc(targetOf().note)}</p>` : ''}
        ${t.description ? `<p class="tf-desc">${esc(t.description)}</p>` : ''}
        ${because.length ? `<p class="tf-because">${because.map(esc).join(' ')}</p>` : ''}
        <p class="tf-face-line">${faceSummaryHtml(face)}</p>
        <div class="tf-actions">
          ${faceState.photoUrl ? '<button class="btn btn-secondary" id="tfTryOn" type="button">Try on my photo</button>' : ''}
          <button class="btn btn-secondary" id="tfShare" type="button">${ico('download')} Save plan card</button>
          <button class="btn btn-ghost" id="tfChange" type="button">Change look</button>
          <button class="btn btn-ghost" id="tfEdit" type="button">Edit my face</button>
        </div>
      </div>
    </div>
    <div class="tf-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0" aria-label="Steps done"><span class="tf-progress-bar" id="tfBar"></span><span class="tf-progress-text" id="tfBarText"></span></div>
    ${stages.map((st) => `
      <section class="tf-stage card">
        <h3 class="tf-stage-title">${esc(st.title || '')}</h3>
        ${st.subtitle ? `<p class="tf-stage-sub">${esc(st.subtitle)}</p>` : ''}
        <ul class="tf-steps">
          ${(st.steps || []).map((step, i) => {
            const k = stepKey(st, i);
            const sh = step.shade;
            return `<li class="tf-step">
              <label>
                <input type="checkbox" data-key="${esc(k)}" ${checked[k] ? 'checked' : ''}>
                <span class="tf-step-body">
                  <span class="tf-area">${esc(step.area || '')}</span>
                  <strong>${esc(step.title || '')}</strong>
                  ${step.technique ? `<span class="tf-tech">${esc(step.technique)}</span>` : ''}
                  ${sh ? `<span class="tf-shade"><span class="face-chip" style="background:${esc(sh.hex || '#888')}"></span>${esc(sh.name || '')}${sh.code ? ` (${esc(sh.code)})` : ''}</span>` : ''}
                  ${step.wig?.name ? `<span class="tf-shade">Wig: ${esc(step.wig.name)}${step.wig.why ? ` &mdash; ${esc(step.wig.why)}` : ''}</span>` : ''}
                  ${step.product ? `<span class="tf-prod">${esc(typeof step.product === 'string' ? step.product : (step.product.name || step.product.formula || ''))}</span>` : ''}
                  ${step.why ? `<span class="tf-why">${esc(step.why)}</span>` : ''}
                </span>
              </label>
            </li>`;
          }).join('')}
        </ul>
      </section>`).join('')}
    ${stages.length ? '' : '<div class="tf-start card"><p>No steps came back for this look. Try another look.</p></div>'}`;

  const updateBar = () => {
    const done = host.querySelectorAll('.tf-steps input:checked').length;
    const bar = document.getElementById('tfBar'), txt = document.getElementById('tfBarText');
    if (bar) bar.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
    if (txt) txt.textContent = `${done} of ${total} steps done`;
    host.querySelector('.tf-progress')?.setAttribute('aria-valuenow', String(done));
  };
  updateBar();
  host.querySelectorAll('.tf-steps input').forEach(cb => cb.addEventListener('change', () => {
    const map = {};
    host.querySelectorAll('.tf-steps input:checked').forEach(c => { map[c.dataset.key] = true; });
    persist({ plan: { targetLookId: lookId, checked: map, savedAt: new Date().toISOString() } });
    updateBar();
  }));
  if (!plan || plan.targetLookId !== lookId) persist({ plan: { targetLookId: lookId, checked: {}, savedAt: new Date().toISOString() } });

  document.getElementById('tfChange')?.addEventListener('click', () => { persist({ target: null, plan: null }); renderTransform(); });
  document.getElementById('tfEdit')?.addEventListener('click', () => showView('face'));
  document.getElementById('tfTryOn')?.addEventListener('click', () => { openTryOn(t.id, t.name); loadTryOnPhoto(faceState.photoUrl, faceState.photoFile); });
  document.getElementById('tfShare')?.addEventListener('click', () => sharePlanCard(face, data, img));
}

// ---- SHARE CARD (canvas) --------------------------------------------------------
function wrapLines(ctx, text, maxW) {
  const words = String(text).split(/\s+/); const lines = []; let line = '';
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines;
}

async function sharePlanCard(face, data, imgSrc) {
  const W = 1080, H = 1350;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#0b0b0b'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(212,168,71,.6)'; x.lineWidth = 3; x.strokeRect(24, 24, W - 48, H - 48);
  let img = null;
  if (imgSrc) img = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = imgSrc; });
  const IW = 460, IH = 575, IX = 70, IY = 130;
  if (img) {
    const r = Math.max(IW / img.width, IH / img.height); const sw = IW / r, sh = IH / r;
    x.drawImage(img, (img.width - sw) / 2, Math.max(0, (img.height - sh) * 0.2), sw, sh, IX, IY, IW, IH);
  } else { x.fillStyle = '#1b1b1b'; x.fillRect(IX, IY, IW, IH); }
  x.fillStyle = '#d4a847'; x.font = '600 28px Georgia, serif'; x.fillText('MIRRR', 70, 90);
  x.font = '22px sans-serif'; x.fillStyle = '#bbb'; x.fillText('MY TRANSFORMATION', 70 + 150, 88);
  x.fillStyle = '#f5f0e8'; x.font = '700 54px Georgia, serif';
  let y = 170; for (const ln of wrapLines(x, data.target?.name || 'My look', 440)) { x.fillText(ln, 580, y); y += 62; }
  x.font = '24px sans-serif'; x.fillStyle = '#bbb'; x.fillText('My base shade', 580, y + 20);
  x.fillStyle = face.hex || '#888'; x.beginPath(); x.arc(610, y + 75, 32, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 2; x.stroke();
  x.fillStyle = '#f5f0e8'; x.font = '600 30px sans-serif'; x.fillText(face.shadeName || face.shadeId, 660, y + 85);
  const stage1 = data.stages?.[0];
  let ty = 790;
  x.fillStyle = '#d4a847'; x.font = '600 34px Georgia, serif'; x.fillText(stage1?.title || 'Stage 1', 70, ty); ty += 50;
  x.fillStyle = '#f5f0e8'; x.font = '27px sans-serif';
  for (const [i, st] of (stage1?.steps || []).slice(0, 6).entries()) {
    const lines = wrapLines(x, `${i + 1}. ${st.title || ''}`, W - 140);
    for (const ln of lines.slice(0, 2)) { x.fillText(ln, 70, ty); ty += 38; }
    ty += 10;
  }
  x.fillStyle = '#d4a847'; x.font = '24px sans-serif'; x.fillText('Your face. A look you love. Step by step.', 70, H - 70);
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  if (!blob) { toast('Could not create the card', 'error'); return; }
  const file = new File([blob], 'mirrr-transformation.png', { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'My MIRRR transformation' }); return; }
  } catch { /* user cancelled or unsupported: fall through to download */ }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mirrr-transformation.png';
  document.body.appendChild(a); a.click(); a.remove();
  toast('Plan card downloaded as an image. Your plan progress stays in this browser (see Profile).', 'info');
}

// ---- wiring: views, hero, banner, profile panel ---------------------------------
const _showView3 = showView;
showView = function (viewId) {
  _showView3(viewId);
  if (viewId === 'face') initFaceView();
  if (viewId === 'transform') renderTransform();
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('heroTransformBtn')?.addEventListener('click', startTransformFlow);
});

// Resume banner + profile panel additions (override the earlier versions)
showReturnBanner = function () {
  const p = loadProfile();
  const banner = document.getElementById('returnBanner');
  if (!banner || profileIsEmpty(p)) return;
  const arch = archetypeLabel(p.aesthetic);
  const chips = (p.chips || []).slice(0, 3).map(esc).join(', ');
  const resume = p.plan?.targetLookId && p.face?.shadeId;
  banner.innerHTML = `<span>Welcome back${p.face?.shadeName ? ` &mdash; your shade is <strong>${esc(p.face.shadeName)}</strong>` : (arch ? ` &mdash; your saved aesthetic is <strong>${esc(arch)}</strong>` : '')}${chips ? ` (${chips})` : ''}.</span>
    ${resume ? '<button class="btn btn-primary" id="rbResume">Resume your transformation</button>' : ''}
    <button class="btn ${resume ? 'btn-secondary' : 'btn-primary'}" id="rbContinue">Continue</button>
    <button class="btn btn-ghost" id="rbReset">Start over</button>`;
  banner.classList.remove('hidden');
  document.getElementById('rbResume')?.addEventListener('click', () => { restoreProfile(p); persist({ target: { lookId: p.plan.targetLookId, at: new Date().toISOString(), ...(Array.isArray(p.target?.tasteChips) ? { tasteChips: p.target.tasteChips } : {}) } }); banner.classList.add('hidden'); showView('transform'); });
  document.getElementById('rbContinue').addEventListener('click', () => { restoreProfile(p); banner.classList.add('hidden'); });
  document.getElementById('rbReset').addEventListener('click', resetEverything);
};

const _toggleProfilePanel = toggleProfilePanel;
toggleProfilePanel = function () {
  _toggleProfilePanel();
  const panel = document.getElementById('profilePanel');
  const p = loadProfile();
  if (!panel || panel.classList.contains('hidden') || !p || profileIsEmpty(p)) return;
  const f = p.face;
  const rows = `<div class="pp-row"><strong>My Face</strong>${f ? `<span class="face-chip" style="background:${esc(f.hex || '#888')}"></span> ${esc(f.shadeName || f.shadeId)}${f.undertone ? `, ${esc(f.undertone)}` : ''}${f.hairTexture ? `, ${esc(f.hairTexture)} hair` : ''}${f.hairLength ? ` (${esc(f.hairLength)})` : ''}` : 'not set'}</div>
    <div class="pp-row"><strong>Target look</strong>${p.target?.lookId ? esc(String(p.target.lookId).replace(/_/g, ' ')) : 'none'}</div>
    <div class="pp-row"><strong>Transformation</strong>${p.plan ? `${Object.keys(p.plan.checked || {}).length} steps done` : 'none'}</div>`;
  const first = panel.querySelector('.pp-row');
  if (first) first.insertAdjacentHTML('beforebegin', rows);
  const actions = panel.querySelector('.pp-actions');
  if (actions) {
    actions.insertAdjacentHTML('afterbegin', '<button class="btn btn-secondary" id="ppEditFace" type="button">Edit face</button><button class="btn btn-ghost" id="ppClearFace" type="button">Clear face</button>');
    document.getElementById('ppEditFace')?.addEventListener('click', () => { panel.classList.add('hidden'); showView('face'); });
    document.getElementById('ppClearFace')?.addEventListener('click', () => { persist({ face: null, plan: null }); panel.classList.add('hidden'); toast('Face profile cleared', 'info'); });
  }
};


// ── FINISH YOUR LOOK — YOUR CHOICE ─────────────────────────────────────────
// After makeup or shades MIRRR never routes straight to wigs. She picks how to finish, as equals;
// nothing is pre-selected and nothing auto-advances: each option opens only when she taps it.
// Her picks are kept in this browser and steer the planner and the Transform hair stage.
const FINISH_KEY = 'mirrr.finish.v1';
const FINISH_CHOICES = [
  { id: 'wigs', label: 'Wigs', note: 'Match a wig to these looks' },
  { id: 'lashes', label: 'Lashes', note: 'Lash styles and how to wear them' },
  { id: 'brows', label: 'Brows', note: 'Brow & Kohl Studio' },
  { id: 'natural', label: 'My Natural Hair', note: 'Styling and care for your own hair' },
  { id: 'locs', label: 'Locs & Braids', note: 'Locs, braids and protective styles' },
  { id: 'nails', label: 'Nails', note: 'Nails & Scent Studio' },
  { id: 'none', label: 'None — I’m done', note: 'Keep just the makeup' },
];
function loadFinish() {
  try { const v = JSON.parse(localStorage.getItem(FINISH_KEY) || '[]'); return Array.isArray(v) ? v.filter(x => FINISH_CHOICES.some(c => c.id === x)) : []; } catch { return []; }
}
function saveFinishPick(id) {
  let cur = loadFinish();
  cur = id === 'none' ? ['none'] : [...new Set([...cur.filter(x => x !== 'none'), id])];
  try { localStorage.setItem(FINISH_KEY, JSON.stringify(cur)); } catch { /* private mode */ }
  for (const k of Object.keys(transformCache ?? {})) delete transformCache[k];
  return cur;
}
function finishPanelHTML(from) {
  return `<section class="finish-panel" data-finish-from="${esc(from)}" aria-labelledby="finishTitle-${esc(from)}">
    <h3 class="finish-title" id="finishTitle-${esc(from)}">Finish your look — your choice</h3>
    <p class="finish-sub">Pick what you want next, or nothing at all. Each option opens only when you tap it.</p>
    <div class="finish-options" role="group" aria-label="Finishing options">
      ${FINISH_CHOICES.map(c => `<button type="button" class="finish-opt" data-finish="${c.id}" aria-pressed="false"><span class="finish-opt-label">${esc(c.label)}</span><span class="finish-opt-note">${esc(c.note)}</span></button>`).join('')}
    </div>
    <p class="finish-done hidden" role="status"></p>
  </section>`;
}
function finishingBody(plan, wigBody) {
  const f = plan.finishing;
  if (!f) return wigBody;
  const steps = (f.steps ?? []).map(st => `<li><strong>${esc(st.title)}</strong> &mdash; ${esc(st.text)}</li>`).join('');
  return `<p class="muted">${esc(f.basis)}</p>${steps ? `<ul>${steps}</ul>` : '<p>Makeup only.</p>'}<p class="muted">Change these with “Finish your look” after Taste or Shades.</p>`;
}
// The photo picker is the device's own window, so say it opened and what to do if it did not.
function pickerHint(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = 'Your device\'s photo picker is open. Choose a front-facing photo. If no window appeared, check for a blocked pop-up, or use a model face.';
}
function openLibrarySearch(q) {
  if (window.mirrrOpenLibrary) { window.mirrrOpenLibrary({ q }); return; }
  document.querySelector('.nav-link[data-view="library"]')?.click();
}
// Homepage cards: [data-goto-view] opens that view the same way the menu does.
document.addEventListener('click', (e) => {
  const card = e.target.closest?.('[data-goto-view]');
  if (!card) return;
  const nav = document.querySelector(`.nav-link[data-view="${card.dataset.gotoView}"]`);
  if (nav) nav.click(); else showView(card.dataset.gotoView);
});
// Enter or Space on a homepage card works like a click.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest?.('.home-link[role="button"]');
  if (!card || card !== e.target) return;
  e.preventDefault();
  card.click();
});
document.addEventListener('click', (e) => {
  const btn = e.target.closest?.('.finish-opt[data-finish]');
  if (!btn) return;
  const id = btn.dataset.finish;
  saveFinishPick(id);
  const panel = btn.closest('.finish-panel');
  panel?.querySelectorAll('.finish-opt').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  const nav = (view) => document.querySelector(`.nav-link[data-view="${view}"]`)?.click();
  switch (id) {
    case 'wigs': {
      nav('wig');
      const wigSel = document.getElementById('wigCommunitySelect');
      if (wigSel && state.communityId) wigSel.value = state.communityId;
      break;
    }
    case 'lashes': openLibrarySearch('lashes'); break;
    case 'brows': nav('studio'); break;
    case 'natural': openLibrarySearch('natural hair'); break;
    case 'locs': openLibrarySearch('locs'); break;
    case 'nails': nav('nails'); break;
    case 'none': {
      const done = panel?.querySelector('.finish-done');
      if (done) { done.textContent = 'Done. Your look is the makeup alone; your plans will not add hair or lash steps.'; done.classList.remove('hidden'); }
      break;
    }
  }
});
