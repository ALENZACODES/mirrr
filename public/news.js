/* MIRRR Beauty News (#news): headlines about beauty brands that serve Black, Latina, South Asian,
 * East & Southeast Asian, Middle Eastern & North African, Indigenous and other communities.
 * Shows only the headline, source, date, a one-line snippet and a link out. No images or articles
 * are copied (a neutral initial tile stands in). Filters start unselected, so all news shows.
 * "Get the news" sign-up: email, optional interests (none ticked), consent box unticked. */
(function () {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fmtDate = iso => { try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };
  const fmtTime = iso => { try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }); } catch { return iso; } };
  const INTEREST_LABELS = { launches: 'New launches', hair: 'Hair', skin: 'Skin', makeup: 'Makeup' };
  let data = null, meta = null, timer = null;
  const picked = { communities: new Set(), brand: '' };

  function shell() {
    let m = document.getElementById('newsPage');
    if (!m) {
      m = document.createElement('div');
      m.id = 'newsPage'; m.className = 'plus-page earn-page news-page';
      m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'newsTitle');
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.plus-x')) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !m.classList.contains('hidden')) close(); });
    }
    return m;
  }
  function close() {
    const m = document.getElementById('newsPage');
    m?.classList.add('hidden');
    clearInterval(timer); timer = null;
    if (location.hash === '#news') history.replaceState(null, '', location.pathname + location.search);
  }

  async function load() {
    const [n, s] = await Promise.all([
      fetch('/api/news').then(r => r.json()),
      meta ? Promise.resolve(meta) : fetch('/api/news/sources').then(r => r.json()),
    ]);
    data = n; meta = s;
  }

  function visible() {
    return (data?.items ?? []).filter(i =>
      (!picked.communities.size || i.communities?.some(c => picked.communities.has(c))) &&
      (!picked.brand || i.brands?.includes(picked.brand)));
  }

  function renderList(m) {
    const list = m.querySelector('.news-list');
    const items = visible();
    m.querySelector('.news-count').textContent = `${items.length} of ${data.items.length} headlines`;
    if (!items.length) { list.innerHTML = '<li class="news-empty">No headlines match these filters right now. Clear a filter to see more.</li>'; return; }
    list.innerHTML = items.map(i => {
      const initial = (i.brands?.[0] || i.source || '?').replace(/^the\s+/i, '').trim().charAt(0).toUpperCase();
      return `<li class="news-item">
        <span class="news-tile" aria-hidden="true">${esc(initial)}</span>
        <div class="news-body">
          <a class="news-head" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.title)}<span class="sr-only"> (opens the original on ${esc(i.source)})</span></a>
          <p class="news-meta">${esc(i.source)}${i.date ? ` · <time datetime="${esc(i.date)}">${esc(fmtDate(i.date))}</time>` : ''}${i.brands?.length ? ` · ${i.brands.map(esc).join(', ')}` : ''}${i.via === 'google' ? ' · via Google News' : ''}</p>
          ${i.snippet ? `<p class="news-snip">${esc(i.snippet)}</p>` : ''}
        </div></li>`;
    }).join('');
  }

  function render() {
    const m = shell();
    const comms = meta.communities ?? [];
    const brandsWithNews = [...new Set(data.items.flatMap(i => i.brands ?? []))].sort((a, b) => a.localeCompare(b));
    const s = data.sources;
    m.innerHTML = `<div class="plus-card earn-card news-card"><button class="plus-x" type="button" aria-label="Close">×</button>
      <h2 id="newsTitle">Beauty News</h2>
      <p class="news-sub">The first source of beauty news to you, from the brands that make beauty for Black, Latina, South Asian, East &amp; Southeast Asian, Middle Eastern &amp; North African and Indigenous women, and every woman of colour.</p>
      <p class="news-status" role="status"><span class="news-dot news-dot-${data.layer === 'C' ? 'snap' : 'live'}" aria-hidden="true"></span>
        Updated ${data.updated_at ? `<time datetime="${esc(data.updated_at)}">${esc(fmtTime(data.updated_at))}</time>` : 'not yet'} · Served from: <strong>${esc(data.layer_label)}</strong>${s ? ` · ${s.ok} of ${s.tried} sources answered` : ''} · Checks for news every ${esc(data.refresh_minutes)} minutes.</p>
      <fieldset class="news-filters"><legend>Filter (optional, nothing selected shows everything)</legend>
        <div class="news-chips">${comms.map(c => `<label class="news-chip"><input type="checkbox" name="community" value="${esc(c.id)}"${picked.communities.has(c.id) ? ' checked' : ''}> ${esc(c.label)}</label>`).join('')}</div>
        <label class="plus-label news-brand">Brand<select name="brand"><option value="">All brands</option>${brandsWithNews.map(b => `<option value="${esc(b)}"${picked.brand === b ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label>
        <p class="news-count" aria-live="polite"></p>
      </fieldset>
      <ul class="news-list"></ul>
      <p class="lib-note">MIRRR shows only the headline, source, date and a one-line snippet from each publisher&rsquo;s own feed, and links to the original. No articles or images are copied. Men&rsquo;s grooming, slurs, colourist &ldquo;whitening&rdquo; products and off-topic stories are filtered out. Three layers keep news showing: direct feeds from ${meta.feeds?.length ?? 0} publications and brand blogs, Google News searches for ${meta.brands?.length ?? 0} brands and ${meta.google_topics?.length ?? 0} community topics, and a saved last-known-good snapshot. MIRRR is made for women, and a woman is anyone who identifies as one. Trans women are welcome here, always. <a href="/api/news/sources" target="_blank" rel="noopener">See every source</a>.</p>
      <section class="news-signup" aria-labelledby="newsSignupTitle">
        <h3 id="newsSignupTitle">Get the news</h3>
        <form class="plus-form news-form" novalidate>
          <label class="plus-label">Email<input type="email" name="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></label>
          <fieldset class="news-interests"><legend>Interests (optional)</legend>
            ${(meta.interests ?? []).map(k => `<label class="news-chip"><input type="checkbox" name="interest" value="${esc(k)}"> ${esc(INTEREST_LABELS[k] ?? comms.find(c => c.id === k)?.label ?? k)}</label>`).join('')}
          </fieldset>
          <label class="plus-consent"><input type="checkbox" name="consent"> Email me MIRRR Beauty News. My email is used only for that, never sold or shared, and I can remove it any time below.</label>
          <p class="lib-note">Email digests start soon; we&rsquo;ll only email you if you tick consent. Nothing is sent today.</p>
          <div class="plus-actions"><button class="btn btn-primary" type="submit">Get the news</button></div>
          <p class="plus-msg" aria-live="polite"></p>
        </form>
        <form class="news-remove" novalidate>
          <label class="plus-label">Remove my email<input type="email" name="email" autocomplete="email" maxlength="254" placeholder="you@example.com"></label>
          <button class="btn" type="submit">Remove</button>
          <p class="plus-msg" aria-live="polite"></p>
        </form>
      </section>
    </div>`;
    m.classList.remove('hidden');
    renderList(m);
    m.querySelectorAll('input[name="community"]').forEach(cb => cb.addEventListener('change', () => { cb.checked ? picked.communities.add(cb.value) : picked.communities.delete(cb.value); renderList(m); }));
    m.querySelector('select[name="brand"]').addEventListener('change', e => { picked.brand = e.target.value; renderList(m); });
    const f = m.querySelector('.news-form');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = f.querySelector('.plus-msg');
      if (!f.consent.checked) { msg.textContent = 'Please tick the box to agree first.'; return; }
      const email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; return; }
      const interests = [...f.querySelectorAll('input[name="interest"]:checked')].map(x => x.value);
      try {
        const r = await fetch('/api/news/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, consent: true, interests }) });
        const d = await r.json();
        msg.textContent = r.ok ? (d.already ? 'You are already on the Beauty News list. Thank you!' : 'You are on the Beauty News list. Email digests start soon.') : (d.error || 'Could not sign up right now.');
        if (r.ok) f.querySelectorAll('input,button').forEach(x => { x.disabled = true; });
      } catch { msg.textContent = 'Could not reach MIRRR. Please try again.'; }
    });
    const rf = m.querySelector('.news-remove');
    rf.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = rf.querySelector('.plus-msg');
      const email = rf.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; return; }
      try {
        const r = await fetch('/api/news/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        const d = await r.json();
        msg.textContent = r.ok ? d.message : (d.error || 'Could not remove right now.');
      } catch { msg.textContent = 'Could not reach MIRRR. Please try again.'; }
    });
    m.querySelector('.plus-x')?.focus();
  }

  async function openNews({ signup = false } = {}) {
    const m = shell();
    m.innerHTML = '<div class="plus-card earn-card news-card"><button class="plus-x" type="button" aria-label="Close">×</button><h2 id="newsTitle">Beauty News</h2><p class="muted">Loading the latest headlines…</p></div>';
    m.classList.remove('hidden');
    try {
      await load(); render();
      if (signup) { const box = m.querySelector('.news-signup'); box?.scrollIntoView({ block: 'start' }); box?.querySelector('input[name="email"]')?.focus(); }
    } catch {
      m.querySelector('.muted').textContent = 'Could not load news right now. Please try again in a moment.';
    }
    clearInterval(timer);
    // While the page is open, pick up the server's 30-minute refreshes without a reload.
    timer = setInterval(async () => {
      const before = data?.updated_at;
      try { await load(); if (data.updated_at !== before && !document.getElementById('newsPage').classList.contains('hidden')) render(); } catch { /* keep what is shown */ }
    }, 5 * 60_000);
  }

  // Home band: the four newest headlines, straight from /api/news (links out, no images).
  async function homeBand() {
    const ul = document.getElementById('newsHomeList');
    if (!ul) return;
    try {
      const d = await fetch('/api/news').then(r => r.json());
      const top = (d.items ?? []).slice(0, 4);
      if (!top.length) { ul.innerHTML = ''; return; }
      ul.innerHTML = top.map(i => `<li><a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.title)}</a> <span>${esc(i.source)}${i.date ? ` · ${esc(fmtDate(i.date))}` : ''}</span></li>`).join('')
        + `<li class="news-home-updated">Updated ${d.updated_at ? esc(fmtTime(d.updated_at)) : 'not yet'} · ${esc(d.layer_label ?? '')}</li>`;
    } catch { ul.innerHTML = ''; }
  }

  function route() { if (location.hash === '#news') openNews(); }
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a[href="#news"]');
    if (!a) return;
    e.preventDefault();
    history.replaceState(null, '', '#news');
    document.querySelectorAll('.earn-page').forEach(p => p.classList.add('hidden'));
    openNews({ signup: a.hasAttribute('data-news-signup') });
  });
  window.addEventListener('hashchange', route);
  const boot = () => { route(); homeBand(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.MirrrNews = { openNews, _tz: TZ };
})();
