/**
 * MIRRR Library view: browse the knowledge guides by shelf, read any guide for your community,
 * and search every guide. Reads the community from the saved profile (mirrr.profile.v1), so the
 * guides open on your own traditions first. Nothing here touches photos.
 */

const PROFILE_KEY = 'mirrr.profile.v1';
const HIDDEN_KEYS = new Set(['id', 'icon', 'tags', 'community', 'communities', 'communityId', 'image', 'imageUrl']);
const MAX_DEPTH = 6;

const lib = {
  community: null,      // canonical library community id
  data: null,           // last /api/library response
  openGuide: null,      // guide id open in the reader
  searchTimer: null,
  fromProfile: false,   // community came from the saved profile
  override: null,       // community requested by a landing-page link
};

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const humanize = k => String(k).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

function savedCommunity() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')?.communityId ?? null; } catch { return null; }
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ---- Rendering any guide value -------------------------------------------------------------

function titleOf(obj) {
  for (const k of ['name', 'title', 'label', 'myth', 'ritual', 'step', 'technique', 'festival']) {
    if (typeof obj[k] === 'string' && obj[k].length < 140) return [k, obj[k]];
  }
  return [null, null];
}

function renderValue(value, depth = 0) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return `<p>${esc(value)}</p>`;
  if (typeof value === 'number' || typeof value === 'boolean') return `<p>${esc(value)}</p>`;
  if (depth >= MAX_DEPTH) return '';
  if (Array.isArray(value)) {
    if (value.every(v => typeof v !== 'object' || v === null)) {
      const items = value.filter(v => v != null && v !== '');
      return items.length ? `<ul class="lib-list">${items.map(v => `<li>${esc(v)}</li>`).join('')}</ul>` : '';
    }
    return `<div class="lib-cards">${value.map(v => renderCard(v, depth + 1)).join('')}</div>`;
  }
  const entries = Object.entries(value).filter(([k, v]) => !HIDDEN_KEYS.has(k) && v != null && v !== '');
  return `<dl class="lib-dl">${entries.map(([k, v]) => {
    const inner = renderValue(v, depth + 1);
    return inner ? `<dt>${esc(humanize(k))}</dt><dd>${inner}</dd>` : '';
  }).join('')}</dl>`;
}

function renderCard(obj, depth) {
  if (obj == null || typeof obj !== 'object') return `<div class="lib-card">${renderValue(obj, depth)}</div>`;
  const [tk, title] = titleOf(obj);
  const rest = { ...obj }; if (tk) delete rest[tk];
  const stepNo = typeof obj.step === 'number' ? `<span class="lib-step">${obj.step}</span>` : '';
  if (stepNo) delete rest.step;
  return `<div class="lib-card">${title || stepNo ? `<h5>${stepNo}${esc(title ?? '')}</h5>` : ''}${renderValue(rest, depth)}</div>`;
}

// ---- Views ---------------------------------------------------------------------------------

function renderCommunityPicker() {
  const el = $('libCommunities');
  if (!el || !lib.data) return;
  const why = lib.data.community && lib.fromProfile
    ? `<p class="lib-why">Opened on <strong>${esc(lib.data.community.label)}</strong> because that is the community in your saved profile${lib.data.community.substituted ? ' (the closest community these guides are written for)' : ''}.</p>`
    : '';
  el.innerHTML = `${why}<div class="lib-chips" role="radiogroup" aria-label="Community">${lib.data.communities.map(c =>
    `<button type="button" class="lib-chip${c.id === lib.community ? ' lib-chip--on' : ''}" data-lib-community="${c.id}" role="radio" aria-checked="${c.id === lib.community}">${esc(c.label)}</button>`).join('')}</div>`;
}

function renderShelves() {
  const el = $('libShelves');
  if (!el || !lib.data) return;
  el.innerHTML = lib.data.shelves.map(shelf => `
    <section class="lib-shelf">
      <h3 class="lib-shelf-title">${esc(shelf.title)}</h3>
      <p class="lib-shelf-blurb">${esc(shelf.blurb)}</p>
      ${shelf.id === 'eyes' ? '<button type="button" class="btn btn-secondary lib-open" data-open-studio>Open the Brow &amp; Kohl Studio</button>' : ''}
      ${shelf.id === 'hair' ? '<button type="button" class="btn btn-secondary lib-open" data-open-hairlab>Open the Hair Colour Lab</button>' : ''}
      ${shelf.id === 'growth' ? '<button type="button" class="btn btn-secondary lib-open" data-open-journeys>Plan a Natural Hair Journey</button>' : ''}
      ${shelf.id === 'skin' ? '<button type="button" class="btn btn-secondary lib-open" data-open-skin>Open the Skin Clinic</button>' : ''}
      ${shelf.id === 'complexion' ? '<button type="button" class="btn btn-secondary lib-open" data-open-complexion>Open the Complexion Lab</button>' : ''}
      ${shelf.id === 'colour' ? '<button type="button" class="btn btn-secondary lib-open" data-open-colour>Open the Colour &amp; Lip Studio</button>' : ''}
      ${shelf.id === 'nails' ? '<button type="button" class="btn btn-secondary lib-open" data-open-nails>Open the Nails &amp; Scent Studio</button>' : ''}
      ${shelf.id === 'ageing' ? '<button type="button" class="btn btn-secondary lib-open" data-open-ageing>Open the Ageing Studio</button>' : ''}
      ${shelf.id === 'bodyhair' ? '<button type="button" class="btn btn-secondary lib-open" data-open-hair-removal>Open the Hair Removal Planner</button>' : ''}
      ${shelf.id === 'smile' ? '<button type="button" class="btn btn-secondary lib-open" data-open-smile>Open Smile &amp; Lip Care</button>' : ''}
      ${shelf.id === 'night' ? '<button type="button" class="btn btn-secondary lib-open" data-open-night>Open the Night Routine</button>' : ''}
      ${shelf.id === 'bump' ? '<button type="button" class="btn btn-secondary lib-open" data-open-bump>Open the Pregnancy &amp; Postpartum planner</button>' : ''}
      ${shelf.id === 'ingredients' ? '<button type="button" class="btn btn-secondary lib-open" data-open-mix>Open the Ingredient Checker</button>' : ''}
      ${shelf.id === 'eco' ? '<button type="button" class="btn btn-secondary lib-open" data-open-eco>Open the Eco Beauty planner</button>' : ''}
      ${shelf.id === 'mind' ? '<button type="button" class="btn btn-secondary lib-open" data-open-calm>Open the Calm &amp; Self-Image studio</button>' : ''}
      ${shelf.id === 'looks' ? '<button type="button" class="btn btn-secondary lib-open" data-open-looks>Open the Look Book</button> <button type="button" class="btn btn-secondary lib-open" data-open-leap>Leap a look to another culture</button>' : ''}
      ${shelf.id === 'bridal' ? '<button type="button" class="btn btn-secondary lib-open" data-open-bridal>Open the Bridal Countdown</button>' : ''}
      <div class="lib-guides">${shelf.guides.map(g => `
        <button type="button" class="lib-guide${g.id === lib.openGuide ? ' lib-guide--open' : ''}" data-lib-guide="${g.id}">
          <span class="lib-guide-title">${esc(g.title)}</span>
          ${lib.data.community ? (g.forYou > 0
            ? `<span class="lib-badge lib-badge--yours">Written for ${esc(lib.data.community.label)}</span>`
            : '<span class="lib-badge">General guide</span>') : ''}
        </button>`).join('')}
      </div>
    </section>`).join('');
}

async function openGuide(id) {
  lib.openGuide = id;
  const el = $('libReader');
  if (!el) return;
  el.innerHTML = '<p class="lib-loading">Opening guide…</p>';
  el.classList.remove('hidden');
  try {
    const q = lib.community ? `?community=${encodeURIComponent(lib.community)}` : '';
    const g = await getJSON(`/api/library/guide/${encodeURIComponent(id)}${q}`);
    const own = g.sections.filter(s => s.scope === 'community');
    const uni = g.sections.filter(s => s.scope === 'universal');
    el.innerHTML = `
      <div class="lib-reader-head">
        <h3>${esc(g.title)}</h3>
        <button type="button" class="btn btn-ghost" data-lib-close>Close</button>
      </div>
      ${g.community && !own.length ? `<p class="lib-note">This guide has no section written for ${esc(g.community.label)} yet, so you are reading the general guide.</p>` : ''}
      ${own.map(s => `<article class="lib-section lib-section--yours"><h4>${esc(s.title)} <span class="lib-badge lib-badge--yours">${esc(g.community.label)}</span></h4>${renderValue(s.body)}</article>`).join('')}
      ${uni.map(s => `<details class="lib-section"${own.length ? '' : ' open'}><summary><h4>${esc(s.title)}</h4></summary>${renderValue(s.body)}</details>`).join('')}
      <p class="lib-disclaimer">Cultural knowledge, not medical advice. Patch-test anything new, and see a doctor or dermatologist for skin conditions.</p>`;
    renderShelves();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    el.innerHTML = `<p class="lib-note">Could not open this guide (${esc(e.message)}). Try again.</p>`;
  }
}

async function runSearch(q) {
  const el = $('libResults');
  if (!el) return;
  if (q.trim().length < 2) { el.innerHTML = ''; el.classList.add('hidden'); return; }
  const qs = new URLSearchParams({ q }); if (lib.community) qs.set('community', lib.community);
  try {
    const r = await getJSON(`/api/library/search?${qs}`);
    el.classList.remove('hidden');
    el.innerHTML = r.hits.length
      ? `<p class="lib-results-count">${r.total} passage${r.total === 1 ? '' : 's'} mention “${esc(q)}”${r.total > r.hits.length ? `, showing the best ${r.hits.length}` : ''}.</p>
         <ul class="lib-hits">${r.hits.map(h => `<li><button type="button" class="lib-hit" data-lib-guide="${h.guide}">
           <span class="lib-hit-guide">${esc(h.guideTitle)}</span><span class="lib-hit-path">${esc(h.path)}</span>
           <span class="lib-hit-snippet">${esc(h.snippet)}</span></button></li>`).join('')}</ul>`
      : `<p class="lib-results-count">Nothing in the Library mentions “${esc(q)}” yet.</p>`;
  } catch (e) {
    el.classList.remove('hidden');
    el.innerHTML = `<p class="lib-note">Search failed (${esc(e.message)}).</p>`;
  }
}

async function loadLibrary(community) {
  const q = community ? `?community=${encodeURIComponent(community)}` : '';
  lib.data = await getJSON(`/api/library${q}`);
  lib.community = lib.data.community?.id ?? null;
  renderCommunityPicker();
  renderShelves();
}

async function showLibrary({ community, guide } = {}) {
  const fromProfile = community === undefined;
  const wanted = fromProfile ? savedCommunity() : community;
  lib.fromProfile = fromProfile && !!wanted;
  try {
    await loadLibrary(wanted);
    if (guide) await openGuide(guide);
  } catch (e) {
    const el = $('libShelves');
    if (el) el.innerHTML = `<p class="lib-note">The Library could not load (${esc(e.message)}).</p>`;
  }
}

// ---- Wiring --------------------------------------------------------------------------------

document.addEventListener('click', e => {
  const t = e.target.closest('[data-view="library"], [data-lib-community], [data-lib-guide], [data-lib-close], [data-open-library]');
  if (!t) return;
  if (t.matches('[data-view="library"]')) {
    const override = lib.override; lib.override = null;
    showLibrary(override ? { community: override } : undefined);
    return;
  }
  if (t.dataset.openLibrary !== undefined) {
    lib.override = t.dataset.openLibrary || null;
    document.querySelector('.nav-link[data-view="library"]')?.click();
    return;
  }
  if (t.dataset.libCommunity) {
    lib.fromProfile = false;
    loadLibrary(t.dataset.libCommunity).then(() => { if (lib.openGuide) openGuide(lib.openGuide); });
    const q = $('libSearch')?.value; if (q) runSearch(q);
    return;
  }
  if (t.dataset.libGuide) { openGuide(t.dataset.libGuide); return; }
  if (t.dataset.libClose !== undefined) { lib.openGuide = null; $('libReader')?.classList.add('hidden'); renderShelves(); }
});

document.addEventListener('input', e => {
  if (e.target.id !== 'libSearch') return;
  clearTimeout(lib.searchTimer);
  lib.searchTimer = setTimeout(() => runSearch(e.target.value), 250);
});

// Landing-page community chips: add a link into that community's Library shelf.
document.addEventListener('click', e => {
  const chip = e.target.closest('.community-chip-card[data-community]');
  if (!chip) return;
  setTimeout(() => {
    const panel = $('communityDetailPanel');
    if (!panel || panel.querySelector('[data-open-library]')) return;
    const id = chip.dataset.community.replace(/-/g, '_');
    const name = chip.querySelector('.community-chip-name')?.textContent ?? 'this community';
    panel.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn-secondary lib-open" data-open-library="${esc(id)}">Read the ${esc(name)} Ritual Library</button>`);
  }, 0);
});
