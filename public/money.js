/* MIRRR money layer (browser side): named products with outbound links, aggregate counts,
 * referral-coded share links, and the MIRRR Plus founding-member waitlist.
 * No cookies and no IDs. Counts are anonymous event names. The only thing that leaves the device
 * beyond those counts is a waitlist email the person types in herself. */
(function () {
  const SITE = 'https://mirrr-upbn.onrender.com/';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const LS = 'mirrr_plus_prompt';
  const asked = { session: false };
  const pref = () => { try { return localStorage.getItem(LS) || ''; } catch { return ''; } };
  const setPref = v => { try { localStorage.setItem(LS, v); } catch { /* private mode */ } };

  function count(event) {
    try {
      const body = JSON.stringify({ event });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/count', new Blob([body], { type: 'application/json' }));
      else fetch('/api/count', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    } catch { /* counting must never break the app */ }
  }

  // Referral code: names WHAT was shared (surface + look), never who shared it.
  function refCode(surface, lookId) {
    const look = String(lookId || 'mirrr').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'mirrr';
    return `${String(surface || 'card').slice(0, 5)}-${look}`.slice(0, 24);
  }
  function shareUrl(surface, lookId) {
    const u = new URL(SITE);
    u.searchParams.set('ref', refCode(surface, lookId));
    u.searchParams.set('utm_source', 'mirrr');
    u.searchParams.set('utm_medium', 'share');
    u.searchParams.set('utm_campaign', 'qloo2026');
    u.searchParams.set('utm_content', String(surface || 'card'));
    return u.toString();
  }

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return iso; }
  }

  async function fillShop(el, lookId) {
    if (!el || !lookId) return;
    el.innerHTML = '<p class="muted">Loading named products…</p>';
    try {
      const r = await fetch(`/api/shop/${encodeURIComponent(lookId)}`);
      const d = await r.json();
      if (!d.products?.length) {
        el.innerHTML = `<h4 class="shop-title">Shop this look</h4><p class="modal-basis shop-fallback">${esc(d.fallback || 'Product types only for this look, no named product yet.')}</p>`;
        return;
      }
      el.innerHTML = `
        <h4 class="shop-title">Shop this look: named products</h4>
        <p class="modal-basis">${esc(d.basis)} From the <strong>${esc(d.setName)}</strong> list. Prices as of ${esc(fmtDate(d.checkedAt))}, read from each brand&rsquo;s own store; they change, so check the price on the page.</p>
        <div class="shop-list">${d.products.map(p => `
          <div class="shop-item">
            <span class="shop-cat">${esc(String(p.category).replace(/_/g, ' '))}</span>
            <a class="shop-link" href="${esc(p.shop_url)}" target="_blank" rel="noopener" data-product="${esc(p.id)}"><strong>${esc(p.brand)}</strong> · ${esc(p.name)}</a>
            <span class="shop-price">${esc(p.price_text)}${p.price_note ? ` <span class="muted">(${esc(p.price_note)})</span>` : ''}${p.on_sale ? ' <span class="muted">(on sale that day)</span>' : ''} · price as of ${esc(fmtDate(p.checked_at))}</span>
            ${p.ownership ? `<span class="shop-own"><a href="${esc(p.ownership.sources[0])}" target="_blank" rel="noopener" title="${esc(p.ownership.detail)}">${esc(p.ownership.label)}</a></span>` : ''}
          </div>`).join('')}</div>
        <p class="lib-note">Links open the brand&rsquo;s own store. MIRRR earns nothing from them: there is no affiliate deal. Links carry a MIRRR tag so the brand can see the visit came from MIRRR, and MIRRR counts clicks as one anonymous total.</p>`;
      el.querySelectorAll('a.shop-link').forEach(a => a.addEventListener('click', () => count('product_click')));
    } catch {
      el.innerHTML = '<p class="modal-error">Could not load named products.</p>';
    }
  }

  // ---------------------------------------------------------------------------
  // MIRRR Plus: waitlist form (shared by the prompt and the Plus page)
  // ---------------------------------------------------------------------------
  const CONSENT = 'Email me once MIRRR Plus opens. My email is used only for that, never sold or shared, and I can ask for removal any time on the MIRRR Plus page.';
  function formHtml(moment) {
    return `<form class="plus-form" data-moment="${esc(moment)}" novalidate>
      <label class="plus-label">Email<input type="email" name="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></label>
      <label class="plus-consent"><input type="checkbox" name="consent"> ${esc(CONSENT)}</label>
      <div class="plus-actions"><button class="btn btn-primary" type="submit">Join the founding list</button></div>
      <p class="plus-msg" aria-live="polite"></p></form>`;
  }
  function wireForm(root, onDone) {
    const f = root.querySelector('.plus-form');
    f?.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = f.querySelector('.plus-msg');
      const email = f.email.value.trim();
      if (!f.consent.checked) { msg.textContent = 'Please tick the box to agree first.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; return; }
      msg.textContent = 'Joining…';
      try {
        const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, consent: true, moment: f.dataset.moment }) });
        const d = await r.json();
        if (!r.ok) { msg.textContent = d.error || 'Could not join right now.'; return; }
        setPref('joined');
        msg.textContent = d.already ? 'You are already on the list. Thank you!' : 'You are on the founding list. Thank you!';
        f.querySelectorAll('input,button').forEach(x => { x.disabled = true; });
        onDone?.();
      } catch { msg.textContent = 'Could not reach MIRRR. Please try again.'; }
    });
  }

  const MOMENT_COPY = {
    tryon: 'Loved that try-on?',
    plan_save: 'Saved. Nice choice.',
    leap: 'That Leap was a journey.',
  };
  function offer(kind) {
    if (asked.session || pref() === 'joined' || pref() === 'no') return;
    if (document.getElementById('plusPrompt')) return;
    asked.session = true;
    const box = document.createElement('aside');
    box.id = 'plusPrompt';
    box.className = 'plus-prompt';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'MIRRR Plus founding list');
    box.innerHTML = `<button class="plus-x" type="button" aria-label="Close">×</button>
      <p class="plus-head"><strong>${esc(MOMENT_COPY[kind] || 'Enjoying MIRRR?')}</strong> MIRRR Plus is coming later, with unlimited Leaps and try-ons, the full Bridal Countdown and a cloud Vanity. Nothing to buy today.</p>
      ${formHtml(kind)}
      <p class="plus-foot"><button class="linklike" type="button" data-plus-open>What is MIRRR Plus?</button> · <button class="linklike" type="button" data-plus-never>Don&rsquo;t ask again</button></p>`;
    document.body.appendChild(box);
    const close = () => box.remove();
    box.querySelector('.plus-x').addEventListener('click', close);
    box.querySelector('[data-plus-never]').addEventListener('click', () => { setPref('no'); close(); });
    box.querySelector('[data-plus-open]').addEventListener('click', () => { close(); openPlus(); });
    wireForm(box, () => setTimeout(close, 2500));
  }

  function openPlus() {
    let m = document.getElementById('plusPage');
    if (!m) {
      m = document.createElement('div');
      m.id = 'plusPage';
      m.className = 'plus-page';
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      m.setAttribute('aria-labelledby', 'plusTitle');
      m.innerHTML = `<div class="plus-card">
        <button class="plus-x" type="button" aria-label="Close">×</button>
        <h2 id="plusTitle">MIRRR Plus</h2>
        <p class="plus-badge">Coming later. Nothing to buy today.</p>
        <p>Everything in MIRRR stays free. MIRRR Plus is a future option for people who want more:</p>
        <ul class="plus-gates">
          <li><strong>Unlimited Taste Leaps and try-ons</strong>: coming later</li>
          <li><strong>The full Bridal Countdown</strong>, every week from engagement to the day: coming later</li>
          <li><strong>A cloud Vanity</strong>, so your saved looks and plans follow you across devices: coming later</li>
        </ul>
        <h3>Join the founding list</h3>
        ${formHtml('plus_page')}
        <h3>Remove my email</h3>
        <form class="plus-remove" novalidate><label class="plus-label">Email<input type="email" name="email" maxlength="254" required></label>
          <div class="plus-actions"><button class="btn btn-secondary" type="submit">Remove me</button></div><p class="plus-msg" aria-live="polite"></p></form>
        <p class="lib-note">The list lives in a file on the MIRRR server. It is used only to send one note when MIRRR Plus opens. It is never sold or shared. On this free hosting plan the file can be lost when the app is redeployed.</p>
      </div>`;
      document.body.appendChild(m);
      const close = () => { m.classList.add('hidden'); if (location.hash === '#plus') history.replaceState(null, '', location.pathname + location.search); };
      m.querySelector('.plus-x').addEventListener('click', close);
      m.addEventListener('click', e => { if (e.target === m) close(); });
      wireForm(m);
      const rf = m.querySelector('.plus-remove');
      rf.addEventListener('submit', async e => {
        e.preventDefault();
        const msg = rf.querySelector('.plus-msg');
        try {
          const r = await fetch('/api/waitlist/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: rf.email.value.trim() }) });
          const d = await r.json();
          msg.textContent = r.ok ? d.message : (d.error || 'Could not remove right now.');
          if (r.ok) setPref('');
        } catch { msg.textContent = 'Could not reach MIRRR. Please try again.'; }
      });
    }
    m.classList.remove('hidden');
  }

  // Moments of delight raised by the app: count them, then offer the list (never blocking).
  const MOMENT_EVENT = { tryon: 'tryon_complete', plan_save: 'plan_save', leap: 'leap_result' };
  // One count per kind per 5 seconds, so re-renders of the same result are not counted again.
  const last = {};
  window.addEventListener('mirrr:moment', e => {
    const kind = e.detail?.kind;
    if (!MOMENT_EVENT[kind]) return;
    const t = Date.now(); if (t - (last[kind] || 0) < 5000) return; last[kind] = t;
    count(MOMENT_EVENT[kind]);
    setTimeout(() => offer(kind), 1200);
  });

  // Taste runs and Leap results are seen from the app's own successful API calls.
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await origFetch(input, init);
    try {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = (init?.method || 'GET').toUpperCase();
      if (res.ok && method === 'POST') {
        if (/\/api\/(agent\/run|agent\/demo|taste\/demo|taste\/looks)(\?|$)/.test(url)) count('taste_run');
        else if (/\/api\/leap\/plan(\?|$)/.test(url)) window.dispatchEvent(new CustomEvent('mirrr:moment', { detail: { kind: 'leap' } }));
      }
    } catch { /* never break the app */ }
    return res;
  };

  document.addEventListener('click', e => {
    const t = e.target.closest?.('[data-plus-link]');
    if (t) { e.preventDefault(); openPlus(); }
  });
  if (location.hash === '#plus') document.addEventListener('DOMContentLoaded', openPlus);

  window.MirrrMoney = { count, fillShop, shareUrl, refCode, openPlus, offer };
})();
