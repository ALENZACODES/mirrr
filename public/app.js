/**
 * MIRRR — Frontend app
 * Your Taste. Your Looks. Your Style.
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  selected: new Set(), // user-selected cultural inputs
  loading: false,
};

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const btnDiscover = $('#btn-discover');
const btnAdd = $('#btn-add');
const btnReset = $('#btn-reset');
const btnDemo = $('#btn-demo');
const freeInput = $('#free-input');
const selectedContainer = $('#selected-inputs');
const resultsSection = $('#results-section');
const narrationBlock = $('#narration-block');
const aestheticBlock = $('#aesthetic-block');
const aestheticBars = $('#aesthetic-bars');
const archetypeList = $('#archetypes');
const looksBlock = $('#looks-block');
const looksGrid = $('#looks-grid');
const archetypesGrid = $('#archetypes-grid');

// ---------------------------------------------------------------------------
// Archetype config (emoji + sample tags shown in showcase)
// ---------------------------------------------------------------------------

const ARCHETYPE_META = {
  afro_glam:          { emoji: '🪙', tags: 'Afrobeats · Lagos · Ankara · Editorial' },
  hip_hop_glam:       { emoji: '🎤', tags: 'Hip Hop · R&B · Urban · Streetwear' },
  caribbean_carnival: { emoji: '🌺', tags: 'Dancehall · Soca · Carnival · Glitter' },
  desi_glam:          { emoji: '💎', tags: 'Bollywood · Bridal · Jewel Tones · Kohl' },
  gulf_glam:          { emoji: '✨', tags: 'Khaleeji · Dubai · Kohl · Pearl' },
  latina_glam:        { emoji: '🔥', tags: 'Reggaeton · Salsa · Bronze · Bold Lip' },
  k_beauty:           { emoji: '🪷', tags: 'K-pop · Glass Skin · Dewy · Seoul' },
  clean_minimal:      { emoji: '🌿', tags: 'Natural · No-Makeup · Effortless' },
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function showToast(msg, durationMs = 2500) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), durationMs);
}

function addInput(value) {
  const clean = value.trim();
  if (!clean) return;
  if (state.selected.size >= 20) { showToast('Max 20 inputs reached.'); return; }
  state.selected.add(clean);
  renderSelectedTags();
}

function removeInput(value) {
  state.selected.delete(value);
  renderSelectedTags();
  // deactivate chip if present
  $$('.chip').forEach((c) => {
    if (c.dataset.value === value) c.classList.remove('active');
  });
}

function renderSelectedTags() {
  selectedContainer.innerHTML = '';
  state.selected.forEach((val) => {
    const span = document.createElement('span');
    span.className = 'selected-tag';
    span.innerHTML = `${val} <button aria-label="Remove ${val}" data-remove="${val}">×</button>`;
    selectedContainer.appendChild(span);
  });
}

// ---------------------------------------------------------------------------
// Archetype showcase
// ---------------------------------------------------------------------------

async function loadArchetypes() {
  try {
    const resp = await fetch('/api/archetypes');
    if (!resp.ok) throw new Error('fetch failed');
    const { archetypes } = await resp.json();
    archetypesGrid.innerHTML = archetypes.map((a) => {
      const meta = ARCHETYPE_META[a.id] ?? { emoji: '💄', tags: '' };
      return `
        <div class="arch-card" data-archetype="${a.id}" role="button" tabindex="0"
             aria-label="Select ${a.label} aesthetic">
          <div class="arch-emoji">${meta.emoji}</div>
          <div class="arch-name">${a.label}</div>
          <div class="arch-tags">${meta.tags}</div>
        </div>
      `;
    }).join('');

    // click → add archetype keywords to inputs
    $$('.arch-card').forEach((card) => {
      card.addEventListener('click', () => {
        const archId = card.dataset.archetype;
        const arch = archetypes.find((a) => a.id === archId);
        if (!arch) return;
        // add top 3 keywords
        arch.keywords.slice(0, 3).forEach(addInput);
        document.querySelector('#discover')?.scrollIntoView({ behavior: 'smooth' });
        showToast(`Added "${arch.label}" signals`);
      });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') card.click(); });
    });
  } catch {
    archetypesGrid.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;">Archetypes unavailable.</p>';
  }
}

// ---------------------------------------------------------------------------
// Render results
// ---------------------------------------------------------------------------

function renderAesthetic(aesthetic) {
  const dims = ['intensity', 'warmth', 'boldness', 'texture'];
  aestheticBars.innerHTML = dims.map((d) => {
    const val = aesthetic[d] ?? 0.5;
    const pct = Math.round(val * 100);
    return `
      <div class="dim-row">
        <span class="dim-label">${d}</span>
        <div class="dim-track">
          <div class="dim-fill" style="width:${pct}%"></div>
        </div>
        <span class="dim-val">${pct}</span>
      </div>
    `;
  }).join('');

  const archs = aesthetic.archetypes ?? [];
  archetypeList.innerHTML = archs.map((a) => {
    const label = a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return `<span class="archetype-pill">${label}</span>`;
  }).join('');
}

function renderLooks(looks) {
  looksGrid.innerHTML = looks.map(({ look, score, wigStyle }, i) => {
    const rankLabel = i === 0 ? '#1 Match' : i === 1 ? '#2 Match' : '#3 Match';
    const tags = (look.tags ?? []).map((t) => `<span class="look-tag">${t}</span>`).join('');
    const wigHtml = wigStyle ? `
      <div class="wig-rec">
        <div class="wig-label">Recommended Wig</div>
        <div class="wig-name">${wigStyle.name}</div>
        <div class="wig-meta">${wigStyle.texture} · ${wigStyle.length} · ${wigStyle.colour}</div>
      </div>
    ` : '';
    return `
      <div class="look-card">
        <div class="look-card-header">
          <div class="look-rank">${rankLabel}</div>
          <div class="look-name">${look.name}</div>
          <div class="look-archetype">${(look.archetype ?? '').replace(/_/g, ' ')}</div>
        </div>
        <div class="look-score-bar">
          <div class="look-score-fill" style="width:${Math.round(score * 100)}%"></div>
        </div>
        <div class="look-card-body">
          <p class="look-description">${look.description}</p>
          <div class="look-tags">${tags}</div>
          ${wigHtml}
        </div>
      </div>
    `;
  }).join('');
}

function showResults(data) {
  const { aesthetic, looks, narration } = data;

  // Narration
  if (narration) {
    narrationBlock.innerHTML = narration.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    narrationBlock.hidden = false;
  }

  // Aesthetic vector
  if (aesthetic) {
    renderAesthetic(aesthetic);
    aestheticBlock.hidden = false;
  }

  // Looks
  if (looks?.length) {
    renderLooks(looks);
    looksBlock.hidden = false;
  }

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function resetResults() {
  narrationBlock.hidden = true;
  aestheticBlock.hidden = true;
  looksBlock.hidden = true;
  resultsSection.hidden = true;
  narrationBlock.innerHTML = '';
  aestheticBars.innerHTML = '';
  archetypeList.innerHTML = '';
  looksGrid.innerHTML = '';
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function fetchLooks(inputs, freeText = []) {
  const resp = await fetch('/api/taste/looks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs, freeText, topN: 3 }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error ?? 'Request failed');
  }
  return resp.json();
}

async function fetchDemo(profile = 'afrobeats') {
  const resp = await fetch('/api/taste/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  });
  if (!resp.ok) throw new Error('Demo failed');
  return resp.json();
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

// Chip toggles
$$('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const val = chip.dataset.value;
    if (chip.classList.contains('active')) {
      chip.classList.remove('active');
      removeInput(val);
    } else {
      chip.classList.add('active');
      addInput(val);
    }
  });
});

// Add button / Enter key on input
function addFreeInput() {
  const val = freeInput.value.trim();
  if (val) {
    addInput(val);
    freeInput.value = '';
  }
}
btnAdd.addEventListener('click', addFreeInput);
freeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addFreeInput(); } });

// Remove selected tag
selectedContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove]');
  if (btn) removeInput(btn.dataset.remove);
});

// Submit
$('#taste-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (state.loading) return;

  const inputs = [...state.selected];
  if (!inputs.length) {
    showToast('Pick at least one cultural influence first.');
    return;
  }

  state.loading = true;
  btnDiscover.classList.add('loading');
  btnDiscover.disabled = true;
  resetResults();

  try {
    const data = await fetchLooks(inputs);
    showResults(data);
  } catch (err) {
    showToast(err.message ?? 'Something went wrong. Try demo mode.');
  } finally {
    state.loading = false;
    btnDiscover.classList.remove('loading');
    btnDiscover.disabled = false;
  }
});

// Demo mode
btnDemo.addEventListener('click', async () => {
  if (state.loading) return;
  state.loading = true;
  btnDiscover.classList.add('loading');
  resetResults();
  // pick demo profile based on selected or default afrobeats
  const profiles = ['afrobeats', 'hiphop', 'bollywood', 'gulf', 'caribbean', 'latina', 'kbeauty'];
  const profile = profiles[Math.floor(Math.random() * profiles.length)];
  try {
    const data = await fetchDemo(profile);
    showResults(data);
    showToast(`Showing demo: ${profile}`);
  } catch (err) {
    showToast('Demo failed. Check server.');
  } finally {
    state.loading = false;
    btnDiscover.classList.remove('loading');
  }
});

// Reset
btnReset.addEventListener('click', () => {
  state.selected.clear();
  renderSelectedTags();
  $$('.chip').forEach((c) => c.classList.remove('active'));
  resetResults();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

loadArchetypes();
