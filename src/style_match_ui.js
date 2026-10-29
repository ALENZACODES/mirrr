/**
 * MIRRR Style Match UI Module
 * Renders the Style Match feature: pick a look, get exact product breakdown
 * for your skin tone — eyeshadow, foundation shade, liner, lip colour, contour
 */

import {
  getAllLookPreviews,
  getPersonalisedLook,
  getShoppingList,
  buildStyleGuide,
  getLooksForFitzpatrick,
  searchLooks,
  FITZPATRICK_GUIDE,
  UNDERTONE_GUIDE,
  STYLE_MATCH_STATS,
} from './style_match_engine.js';

// ─── SKIN TONE SELECTOR UI ───────────────────────────────────────────────────

export function renderSkinToneSelector() {
  return `
<section class="skin-tone-selector" aria-label="Select your skin tone">
  <div class="selector-header">
    <h2 class="selector-title">What's your skin tone?</h2>
    <p class="selector-sub">We'll personalise every product recommendation to you</p>
  </div>

  <div class="fitzpatrick-grid" role="radiogroup" aria-label="Fitzpatrick skin tone scale">
    ${Object.entries(FITZPATRICK_GUIDE).map(([scale, info]) => `
    <button
      class="tone-swatch"
      role="radio"
      aria-checked="false"
      data-fitzpatrick="${scale}"
      data-undertones="${info.undertones.join(',')}"
      title="${info.label}: ${info.description}"
      style="--swatch-color: ${info.hex}"
    >
      <span class="swatch-circle" style="background-color: ${info.hex}"></span>
      <span class="swatch-label">${info.label}</span>
      <span class="swatch-scale">Type ${scale}</span>
    </button>
    `).join('')}
  </div>

  <div class="undertone-selector hidden" id="undertone-selector">
    <h3 class="undertone-title">What's your undertone?</h3>
    <p class="undertone-hint">Check the inside of your wrist — what colour are your veins?</p>
    <div class="undertone-options">
      <button class="undertone-btn" data-undertone="cool">
        <span class="undertone-icon">💙</span>
        <span class="undertone-name">Cool</span>
        <span class="undertone-desc">Blue/purple veins. Silver jewellery suits you.</span>
      </button>
      <button class="undertone-btn" data-undertone="warm">
        <span class="undertone-icon">💛</span>
        <span class="undertone-name">Warm</span>
        <span class="undertone-desc">Green veins. Gold jewellery suits you.</span>
      </button>
      <button class="undertone-btn" data-undertone="neutral">
        <span class="undertone-icon">🤍</span>
        <span class="undertone-name">Neutral</span>
        <span class="undertone-desc">Mix of both. You suit silver and gold equally.</span>
      </button>
      <button class="undertone-btn" data-undertone="olive">
        <span class="undertone-icon">💚</span>
        <span class="undertone-name">Olive</span>
        <span class="undertone-desc">Green-yellow cast in skin. Yellow-gold works best.</span>
      </button>
    </div>
  </div>

  <button class="cta-btn skin-done-btn hidden" id="skin-done-btn">
    Show me looks for my skin tone →
  </button>
</section>
`;
}

// ─── LOOK GALLERY UI ─────────────────────────────────────────────────────────

export function renderLookGallery(fitzpatrick, undertone, filterCommunity = null) {
  const looks = getAllLookPreviews().filter(l => {
    const toneMatch = !fitzpatrick || l.fitzpatrickRange.includes(fitzpatrick);
    const commMatch = !filterCommunity || l.community === filterCommunity;
    return toneMatch && commMatch;
  });

  const matchCount = looks.filter(l => fitzpatrick && l.fitzpatrickRange.includes(fitzpatrick)).length;

  return `
<section class="look-gallery-section" aria-label="Choose your inspiration look">
  <div class="gallery-header">
    <h2 class="gallery-title">Pick your inspiration look</h2>
    ${fitzpatrick ? `
    <p class="gallery-sub">
      <span class="match-badge">${matchCount} looks matched for your skin tone (Type ${fitzpatrick})</span>
    </p>
    ` : `
    <p class="gallery-sub">We'll show you exactly what products to use on your skin tone</p>
    `}
  </div>

  <div class="gallery-filters">
    <div class="filter-chips" role="group" aria-label="Filter by community">
      <button class="filter-chip active" data-filter="all">All Looks</button>
      <button class="filter-chip" data-filter="south-asian">South Asian</button>
      <button class="filter-chip" data-filter="arab">Arab/Middle Eastern</button>
      <button class="filter-chip" data-filter="west-african">West African</button>
      <button class="filter-chip" data-filter="east-asian">East Asian</button>
      <button class="filter-chip" data-filter="black-american">Black American</button>
      <button class="filter-chip" data-filter="south-african">South African</button>
    </div>
    <div class="search-row">
      <input
        type="search"
        class="look-search-input"
        placeholder="Search looks... (e.g. 'bridal', 'bold', 'natural')"
        aria-label="Search looks"
        id="look-search"
      />
    </div>
  </div>

  <div class="looks-grid" id="looks-grid" role="list">
    ${looks.map(look => renderLookCard(look, fitzpatrick)).join('')}
  </div>

  ${looks.length === 0 ? `
  <div class="no-results">
    <p>No looks found for this combination. Try removing a filter.</p>
  </div>
  ` : ''}
</section>
`;
}

export function renderLookCard(look, userFitzpatrick) {
  const isMatch = !userFitzpatrick || look.fitzpatrickRange.includes(userFitzpatrick);
  const vibeTag = look.vibe[0];
  const occasionTag = look.occasion[0];

  return `
<article
  class="look-card ${isMatch ? 'look-card--matched' : 'look-card--adaptable'}"
  data-look-id="${look.id}"
  data-community="${look.community}"
  role="listitem"
  aria-label="${look.name} look"
>
  <div class="look-card__image-wrap">
    <img
      src="${look.image}"
      alt="${look.name} beauty look"
      class="look-card__image"
      loading="lazy"
      onerror="this.src='/placeholder-look.png'"
    />
    ${isMatch ? `<span class="look-card__match-badge">✓ Your skin tone</span>` : `<span class="look-card__adapt-badge">Adaptable</span>`}
  </div>

  <div class="look-card__body">
    <div class="look-card__meta">
      <span class="look-card__community">${formatCommunity(look.community)}</span>
      <span class="look-card__vibe">${vibeTag}</span>
    </div>

    <h3 class="look-card__name">${look.name}</h3>
    <p class="look-card__desc">${look.description}</p>

    <div class="look-card__tags">
      <span class="tag tag--occasion">${formatOccasion(occasionTag)}</span>
      ${look.tags.slice(0, 2).map(t => `<span class="tag tag--detail">${t}</span>`).join('')}
    </div>

    <button
      class="look-card__cta"
      data-look-id="${look.id}"
      aria-label="Get products to recreate ${look.name}"
    >
      Get my exact products →
    </button>
  </div>
</article>
`;
}

// ─── PRODUCT BREAKDOWN UI ────────────────────────────────────────────────────

export function renderStyleGuide(lookId, fitzpatrick, undertone) {
  const guide = buildStyleGuide(lookId, fitzpatrick);
  if (!guide) {
    return `<div class="error-state"><p>Look not found. Please choose another.</p></div>`;
  }

  return `
<div class="style-guide" aria-label="Style guide for ${guide.title}">

  <!-- Guide Header -->
  <header class="style-guide__header">
    <button class="back-btn" aria-label="Back to look gallery">
      ← Back to looks
    </button>
    <div class="style-guide__title-row">
      <h1 class="style-guide__title">${guide.title}</h1>
      <div class="style-guide__meta">
        <span class="meta-chip">⏱ ${guide.totalTime}</span>
        <span class="meta-chip meta-chip--level">${guide.difficultyLevel.level}</span>
      </div>
    </div>
    <p class="style-guide__overview">${guide.overview}</p>
    ${guide.difficultyLevel.level !== 'Beginner-Friendly' ? `
    <div class="difficulty-note">
      <span class="difficulty-icon">💡</span>
      <span>${guide.difficultyLevel.description}</span>
    </div>
    ` : ''}
    ${guide.matchInfo ? `
    <div class="match-quality match-quality--${guide.matchInfo.score >= 80 ? 'great' : guide.matchInfo.score >= 60 ? 'good' : 'adapt'}">
      <span class="match-icon">${guide.matchInfo.score >= 80 ? '✓' : guide.matchInfo.score >= 60 ? '~' : '!'}</span>
      <span>${guide.matchInfo.message}</span>
    </div>
    ` : ''}
  </header>

  <!-- Skin Tone Context Banner -->
  ${fitzpatrick ? `
  <div class="tone-banner">
    <span class="tone-dot" style="background-color: ${FITZPATRICK_GUIDE[fitzpatrick]?.hex || '#D4956A'}"></span>
    <span class="tone-text">
      All products below are selected for <strong>Fitzpatrick Type ${fitzpatrick}</strong>
      ${undertone ? `(${undertone} undertone)` : ''}
    </span>
    <button class="tone-change-btn" aria-label="Change skin tone selection">Change</button>
  </div>
  ` : ''}

  <!-- Steps -->
  <div class="steps-container">
    ${guide.steps.map((step, i) => renderStep(step, i + 1, fitzpatrick)).join('')}
  </div>

  <!-- Pro Tips -->
  ${guide.proTips && guide.proTips.length > 0 ? `
  <section class="pro-tips-section">
    <h2 class="pro-tips-title">💄 Pro Tips</h2>
    <ul class="pro-tips-list">
      ${guide.proTips.map(tip => `<li class="pro-tip">${tip}</li>`).join('')}
    </ul>
  </section>
  ` : ''}

  <!-- Shopping List -->
  ${guide.shoppingList ? renderShoppingList(guide.shoppingList) : ''}

  <!-- Similar Looks -->
  ${guide.similarLooks && guide.similarLooks.length > 0 ? `
  <section class="similar-looks-section">
    <h2 class="similar-title">You might also love</h2>
    <div class="similar-looks-row">
      ${guide.similarLooks.map(l => `
      <button class="similar-look-btn" data-look-id="${l.id}">
        <span class="similar-name">${l.name}</span>
        <span class="similar-vibe">${l.vibe}</span>
      </button>
      `).join('')}
    </div>
  </section>
  ` : ''}

</div>
`;
}

function renderStep(step, stepNum, fitzpatrick) {
  const zoneEmojis = {
    skin: '✨', eyes: '👁', brows: '🖤', lips: '💋', contour: '🔺', glow: '🌟',
    skin_glow: '💫', glow: '✨', contour: '🌑',
  };
  const emoji = zoneEmojis[step.zone] || '💄';

  return `
<article class="style-step" id="step-${stepNum}">
  <div class="step-number-row">
    <span class="step-number">Step ${stepNum}</span>
    <span class="step-zone">${emoji} ${formatZone(step.zone)}</span>
  </div>

  <h3 class="step-title">${step.title}</h3>
  <p class="step-technique">${step.instruction}</p>

  ${step.personalNote ? `
  <div class="personal-note">
    <span class="personal-note-icon">👤</span>
    <span class="personal-note-text">${step.personalNote}</span>
  </div>
  ` : ''}

  <div class="step-products">
    <h4 class="products-heading">What you need:</h4>
    ${renderProductList(step.products)}
  </div>
</article>
`;
}

function renderProductList(products) {
  if (!products || typeof products !== 'object') return '';

  const items = [];

  Object.entries(products).forEach(([key, value]) => {
    if (!value) return;

    // Direct product object
    if (value.name) {
      items.push(renderProductItem(key, value));
    }
    // Nested options (option_a, option_b)
    else if (typeof value === 'object') {
      Object.entries(value).forEach(([optKey, opt]) => {
        if (opt && opt.name) {
          items.push(renderProductItem(optKey, opt, key.includes('option') || optKey.includes('option')));
        }
      });
    }
  });

  return `<ul class="product-list">${items.join('')}</ul>`;
}

function renderProductItem(key, product, isOption = false) {
  const keyLabel = formatProductKey(key);

  return `
<li class="product-item ${isOption ? 'product-item--option' : ''}">
  <div class="product-item__header">
    <span class="product-key">${keyLabel}</span>
    ${isOption ? '<span class="option-badge">option</span>' : ''}
  </div>
  <div class="product-item__name">${product.name}</div>
  ${product.shade ? `<div class="product-item__shade">Shade: <strong>${product.shade}</strong></div>` : ''}
  ${product.tip ? `<div class="product-item__tip">💡 ${product.tip}</div>` : ''}
</li>
`;
}

function renderShoppingList(list) {
  return `
<section class="shopping-list-section">
  <div class="shopping-header">
    <h2 class="shopping-title">🛍 Your Shopping List</h2>
    <div class="shopping-estimate">
      Estimated total: <strong>$${list.estimate.low}–$${list.estimate.high} ${list.estimate.currency}</strong>
    </div>
  </div>

  ${list.budgetSwaps && list.budgetSwaps.length > 0 ? `
  <div class="budget-swaps">
    <h3 class="budget-swaps-title">💰 Budget Swaps (same look, less spend):</h3>
    <ul class="budget-swap-list">
      ${list.budgetSwaps.map(swap => `
      <li class="budget-swap">
        <span class="swap-out">${swap.expensive}</span>
        <span class="swap-arrow">→</span>
        <span class="swap-in">${swap.budget}</span>
        <span class="swap-saving">Save $${swap.saving}</span>
      </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="where-to-buy">
    <h3 class="where-title">Where to buy:</h3>
    <div class="store-chips">
      ${(list.whereToBuy || ['Sephora', 'Shoppers Drug Mart Beauty', 'MAC Cosmetics', 'Amazon.ca']).map(store => `
      <span class="store-chip">${store}</span>
      `).join('')}
    </div>
  </div>

  <button class="copy-list-btn" aria-label="Copy shopping list">
    📋 Copy full list
  </button>
</section>
`;
}

// ─── STYLE MATCH CONTROLLER ──────────────────────────────────────────────────

export function initStyleMatch(container) {
  if (!container) return;

  let state = {
    phase: 'tone', // 'tone' | 'gallery' | 'guide'
    fitzpatrick: null,
    undertone: null,
    selectedLookId: null,
    filterCommunity: null,
    searchQuery: '',
  };

  function render() {
    if (state.phase === 'tone') {
      container.innerHTML = renderSkinToneSelector();
      bindToneSelector();
    } else if (state.phase === 'gallery') {
      container.innerHTML = renderLookGallery(state.fitzpatrick, state.undertone, state.filterCommunity);
      bindGallery();
    } else if (state.phase === 'guide') {
      container.innerHTML = renderStyleGuide(state.selectedLookId, state.fitzpatrick, state.undertone);
      bindGuide();
    }
  }

  function bindToneSelector() {
    const swatches = container.querySelectorAll('.tone-swatch');
    const undertoneSection = container.querySelector('#undertone-selector');
    const doneBtn = container.querySelector('#skin-done-btn');

    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => { s.setAttribute('aria-checked', 'false'); s.classList.remove('selected'); });
        swatch.setAttribute('aria-checked', 'true');
        swatch.classList.add('selected');
        state.fitzpatrick = swatch.dataset.fitzpatrick;
        undertoneSection.classList.remove('hidden');
        doneBtn.classList.remove('hidden');
      });
    });

    const undertoneButtons = container.querySelectorAll('.undertone-btn');
    undertoneButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        undertoneButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.undertone = btn.dataset.undertone;
      });
    });

    doneBtn?.addEventListener('click', () => {
      if (!state.fitzpatrick) return;
      state.phase = 'gallery';
      render();
    });
  }

  function bindGallery() {
    // Filter chips
    const filterChips = container.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.filterCommunity = chip.dataset.filter === 'all' ? null : chip.dataset.filter;
        refreshGalleryGrid();
      });
    });

    // Search
    const searchInput = container.querySelector('#look-search');
    searchInput?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      refreshGalleryGrid();
    });

    // Look cards
    bindLookCards();
  }

  function refreshGalleryGrid() {
    const grid = container.querySelector('#looks-grid');
    if (!grid) return;

    let looks = getAllLookPreviews();

    if (state.fitzpatrick) {
      looks = looks.filter(l => l.fitzpatrickRange.includes(state.fitzpatrick));
    }

    if (state.filterCommunity) {
      looks = looks.filter(l => l.community === state.filterCommunity);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      looks = looks.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some(t => t.includes(q)) ||
        l.vibe.some(v => v.includes(q))
      );
    }

    grid.innerHTML = looks.map(look => renderLookCard(look, state.fitzpatrick)).join('');
    bindLookCards();
  }

  function bindLookCards() {
    const cards = container.querySelectorAll('.look-card__cta');
    cards.forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedLookId = btn.dataset.lookId;
        state.phase = 'guide';
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function bindGuide() {
    // Back button
    const backBtn = container.querySelector('.back-btn');
    backBtn?.addEventListener('click', () => {
      state.phase = 'gallery';
      render();
    });

    // Change tone button
    const changeToneBtn = container.querySelector('.tone-change-btn');
    changeToneBtn?.addEventListener('click', () => {
      state.phase = 'tone';
      state.fitzpatrick = null;
      state.undertone = null;
      render();
    });

    // Similar looks
    const similarBtns = container.querySelectorAll('.similar-look-btn');
    similarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedLookId = btn.dataset.lookId;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Copy shopping list
    const copyBtn = container.querySelector('.copy-list-btn');
    copyBtn?.addEventListener('click', async () => {
      const shoppingList = buildCopyableList(state.selectedLookId, state.fitzpatrick);
      try {
        await navigator.clipboard.writeText(shoppingList);
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy full list'; }, 2500);
      } catch {
        copyBtn.textContent = 'Enable clipboard access';
      }
    });
  }

  // Initial render
  render();

  // Return public API
  return {
    goToTone: () => { state.phase = 'tone'; render(); },
    goToGallery: (fitz, undertone) => {
      if (fitz) state.fitzpatrick = fitz;
      if (undertone) state.undertone = undertone;
      state.phase = 'gallery';
      render();
    },
    openLook: (lookId) => {
      state.selectedLookId = lookId;
      state.phase = 'guide';
      render();
    },
    getState: () => ({ ...state }),
  };
}

// ─── COPY LIST BUILDER ───────────────────────────────────────────────────────

function buildCopyableList(lookId, fitzpatrick) {
  const list = getShoppingList(lookId, fitzpatrick);
  if (!list) return '';

  const lines = [
    `MIRRR — ${list.lookName} Shopping List`,
    `Skin Tone: Fitzpatrick Type ${fitzpatrick}`,
    `Estimated: $${list.estimate.low}–$${list.estimate.high} ${list.estimate.currency}`,
    '',
    '--- PRODUCTS ---',
    ...list.items.map(item => `${formatZone(item.zone).toUpperCase()}: ${item.name}${item.shade ? ` (${item.shade})` : ''}`),
    '',
  ];

  if (list.budgetSwaps.length > 0) {
    lines.push('--- BUDGET SWAPS ---');
    list.budgetSwaps.forEach(swap => {
      lines.push(`${swap.expensive} → ${swap.budget} (save $${swap.saving})`);
    });
    lines.push('');
  }

  lines.push('--- WHERE TO BUY ---');
  (list.whereToBuy || ['Sephora', 'MAC Cosmetics', 'Amazon.ca']).forEach(store => lines.push(store));
  lines.push('');
  lines.push('Found on MIRRR — mirrr-upbn.onrender.com');

  return lines.join('\n');
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatCommunity(id) {
  const map = {
    'south-asian': 'South Asian',
    'arab': 'Arab / Middle Eastern',
    'west-african': 'West African',
    'east-asian': 'East Asian',
    'caribbean': 'Caribbean',
    'latina': 'Latina',
    'east-african': 'East African',
    'south-african': 'South African',
    'black-american': 'Black American',
  };
  return map[id] || id;
}

function formatOccasion(occ) {
  const map = {
    'night-out': 'Night Out', 'wedding-guest': 'Wedding Guest', 'photoshoot': 'Photoshoot',
    'evening': 'Evening', 'celebration': 'Celebration', 'eid': 'Eid', 'everyday': 'Everyday',
    'daytime': 'Daytime', 'brunch': 'Brunch', 'casual-date': 'Casual Date',
    'beach': 'Beach', 'travel': 'Travel', 'summer': 'Summer', 'casual-glam': 'Casual Glam',
    'wedding': 'Wedding', 'mehndi-night': 'Mehndi Night', 'diwali': 'Diwali',
    'sangeet': 'Sangeet', 'owambe': 'Owambe', 'outdoor': 'Outdoor', 'casual': 'Casual',
    'editorial': 'Editorial', 'photoshoot': 'Photoshoot', 'art-event': 'Art Event',
    'statement-look': 'Statement Look',
  };
  return map[occ] || occ;
}

function formatZone(zone) {
  const map = {
    skin: 'Skin Base', eyes: 'Eye Look', brows: 'Brows', lips: 'Lips',
    contour: 'Contour & Highlight', glow: 'Glow', skin_glow: 'Inner Glow',
  };
  return map[zone] || zone;
}

function formatProductKey(key) {
  const map = {
    foundation: 'Foundation', concealer: 'Concealer', powder: 'Setting Powder',
    primer: 'Primer', eyePrimer: 'Eye Primer', contour: 'Contour', bronze: 'Bronzer',
    blush: 'Blush', highlight: 'Highlighter', creamHighlight: 'Cream Highlight',
    powderHighlight: 'Powder Highlight', liquidHighlight: 'Liquid Highlight',
    lidShade: 'Lid Shade', crease: 'Crease Shade', innerCorner: 'Inner Corner',
    lidGloss: 'Lid Gloss', shimmerShadow: 'Shimmer Shadow', glitter: 'Glitter',
    graphicLiner: 'Graphic Liner', liner: 'Eyeliner', lowerLiner: 'Lower Liner',
    lowerLashSmudge: 'Lower Lash Smudge', goldKohl: 'Gold Kohl', mascara: 'Mascara',
    lashes: 'False Lashes', pencil: 'Brow Pencil', pomade: 'Brow Pomade',
    gel: 'Brow Gel', microblading: 'Micro Pencil', soap: 'Brow Soap',
    setting: 'Brow Setting', lipstick: 'Lipstick', liner: 'Lip Liner',
    gloss: 'Lip Gloss', lipTint: 'Lip Tint', lipBalm: 'Lip Balm',
    alternative: 'Alternative Option', skinPrep: 'Skin Prep', spf: 'SPF',
    foundation: 'Foundation', cushion: 'BB Cushion', luminousDrops: 'Luminous Drops',
    body: 'Body Highlight', lidWash: 'Lid Wash', lidJewel: 'Jewel Shadow',
    innerCornerGlitter: 'Inner Corner Glitter',
    option_a: 'Option A', option_b: 'Option B', option_c: 'Option C',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export { STYLE_MATCH_STATS };
