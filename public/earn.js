/* MIRRR business pages and entry points (browser side).
 * How MIRRR makes money (#money), Shop by look (#shop), For brands (#brands), For stylists & salons
 * (#pros), Digital guides (#guides), plus "complete the routine" strips in the studios.
 * Rules: nothing is sold here, nothing is pre-selected, every consent box starts unticked, every
 * label says what is built, what is ready, and what is only planned. No cookies, no IDs. */
(function () {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const count = e => window.MirrrMoney?.count?.(e);
  const money = n => Object.entries(n || {}).map(([c, v]) => `$${Number(v).toFixed(2)} ${c}`).join(' + ');

  const STREAMS = [
    ['Named products from brands\u2019 own stores', 'Built today', '64 real products from 14 brands, on 50 of 60 looks and all 8 Style Match guides. Links carry a MIRRR tag so brands can see the visits. No affiliate deal yet, so MIRRR earns nothing from them today.', 'Any look \u2192 Shop this look', '#shop'],
    ['Shop-by-look bundles', 'Built today', '14 ready-made bundles with the item count and the total at listed prices.', 'Shop by look', '#shop'],
    ['Complete the routine (studios)', 'Built today', 'Lips, Brow & Kohl, Skin Clinic and Complexion end with real products for that routine. Nails, Hair Colour and Wig Match say plainly there are no named products yet.', 'Bottom of each studio', null],
    ['MIRRR Plus founding list', 'Built today (no charge)', 'Offered only after a moment she chose (Save, a finished try-on, a Leap). Box unticked, closable, never blocking.', 'Footer \u2192 MIRRR Plus', '#plus'],
    ['Digital guides waitlist', 'Built today (no charge)', 'Bridal beauty plan, Look book and Routine card as future paid downloads. Today: a founding list only.', 'Digital guides', '#guides'],
    ['Referral codes on shares', 'Built today', 'Shared links carry a code that names the look, never the person. Landings are counted as totals.', '/api/stats', '/api/stats'],
    ['For brands: taste trends + interest list', 'Built today', 'Live counts of the Qloo taste tags and top looks from taste runs, and an email-only interest form.', 'For brands', '#brands'],
    ['For stylists & salons: interest list', 'Built today', 'An email-only interest form for braiders, wig installers, colourists, makeup artists and salons.', 'For stylists & salons', '#pros'],
    ['Beauty News sign-up list', 'Built today (no charge)', 'Beauty News pulls headlines from brands that make beauty for Black, Latina, South Asian, East & Southeast Asian, MENA and Indigenous women. Its \u201cGet the news\u201d list (email only, consent unticked) is an audience asset. No emails are sent yet.', 'Beauty News', '#news'],
    ['Affiliate commission on product links', 'Ready to switch on', 'The links already carry tags. Turning on commission needs a signed agreement with a brand or network. None exists today.', 'Any product link', null],
    ['Sponsored placement slots', 'Ready to switch on', 'One clearly marked slot on Shop by look. It shows \u201cavailable, not yet sold\u201d. Nothing is sponsored today.', 'Shop by look', '#shop'],
    ['Brand taste-insight reports', 'Ready to switch on', 'The trends feed exists. A paid report needs a first brand customer. None exists today.', 'For brands', '#brands'],
    ['MIRRR Plus subscription', 'Planned', 'Unlimited Leaps and try-ons, the full Bridal Countdown and a cloud Vanity. No price set; no checkout exists.', 'MIRRR Plus', '#plus'],
    ['Paid digital guides', 'Planned', 'One-off downloads of the bridal plan and look book. No checkout exists.', 'Digital guides', '#guides'],
    ['Stylist listings and booking referrals', 'Planned', 'A directory of braiders, wig installers, colourists and bridal artists, with a referral fee per booking. Not built beyond the interest form.', 'For stylists & salons', '#pros'],
    ['Sponsored Beauty News newsletter slot', 'Planned', 'One clearly marked sponsor slot in the future email digest. No digest is sent and no sponsor exists today.', 'Beauty News', '#news'],
  ];

  function shell(id, title, inner) {
    let m = document.getElementById(id);
    if (!m) {
      m = document.createElement('div');
      m.id = id; m.className = 'plus-page earn-page';
      m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', `${id}Title`);
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.plus-x')) close(m); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !m.classList.contains('hidden')) close(m); });
    }
    m.innerHTML = `<div class="plus-card earn-card"><button class="plus-x" type="button" aria-label="Close">×</button><h2 id="${id}Title">${esc(title)}</h2>${inner}</div>`;
    m.classList.remove('hidden');
    m.querySelector('.plus-x')?.focus();
    return m;
  }
  function close(m) {
    m.classList.add('hidden');
    if (/^#(money|shop|brands|pros|guides)$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  }
  const nav = `<p class="earn-nav"><a href="#money">How MIRRR makes money</a> · <a href="#shop">Shop by look</a> · <a href="#brands">For brands</a> · <a href="#pros">For stylists &amp; salons</a> · <a href="#guides">Digital guides</a> · <a href="#plus" data-plus-link>MIRRR Plus</a></p>`;

  function openMoney() {
    const badge = s => `<span class="earn-status earn-${s.startsWith('Built') ? 'built' : s.startsWith('Ready') ? 'ready' : 'planned'}">${esc(s)}</span>`;
    shell('earnMoney', 'How MIRRR makes money', `${nav}
      <p>MIRRR stays free. Below is every way it can earn, and the honest status of each. <strong>No revenue has been earned yet</strong>, there is no paywall, and nothing is sponsored.</p>
      <div class="earn-table-wrap"><table class="earn-table"><thead><tr><th>Stream</th><th>Status</th><th>What it is</th><th>Where to see it</th></tr></thead><tbody>
      ${STREAMS.map(([n, s, w, where, href]) => `<tr><td><strong>${esc(n)}</strong></td><td>${badge(s)}</td><td>${esc(w)}</td><td>${href ? `<a href="${esc(href)}"${href.startsWith('/api') ? ' target="_blank" rel="noopener"' : ''}${href === '#plus' ? ' data-plus-link' : ''}>${esc(where)}</a>` : esc(where)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="lib-note"><strong>Built today</strong> means live in this app now. <strong>Ready to switch on</strong> means the app side exists but it needs an agreement or a first customer that MIRRR does not have yet. <strong>Planned</strong> means not built. Privacy stays the same for all of them: photos stay on her device, and MIRRR keeps anonymous totals only (<a href="/api/stats" target="_blank" rel="noopener">/api/stats</a>).</p>`);
  }

  async function openShop() {
    const m = shell('earnShop', 'Shop by look', `${nav}<p class="muted">Loading bundles…</p>`);
    try {
      const d = await (await fetch('/api/shop/bundles')).json();
      const card = b => `<article class="earn-bundle"><h3>${esc(b.name)}</h3>
        <p class="earn-meta">${b.count} products · ${esc(money(b.totals))} at listed prices${b.owned_by_label.length ? ` · includes ${esc(b.owned_by_label.join(', '))} brands` : ''}</p>
        <ul>${b.products.map(p => `<li><a class="shop-link" href="${esc(p.shop_url)}" target="_blank" rel="noopener" data-product="${esc(p.id)}"><strong>${esc(p.brand)}</strong> · ${esc(p.name)}</a> <span class="muted">${esc(String(p.category).replace(/_/g, ' '))} · ${esc(p.price_text)}${p.ownership ? ` · ${esc(p.ownership)}` : ''}</span></li>`).join('')}</ul></article>`;
      m.querySelector('.earn-card').innerHTML = `<button class="plus-x" type="button" aria-label="Close">×</button><h2 id="earnShopTitle">Shop by look</h2>${nav}
        <p>${esc(d.note)} Prices as of ${esc(new Date(d.checked_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }))}; they change, so check the brand&rsquo;s page. Pick any item, or none.</p>
        <aside class="earn-slot"><strong>Sponsored placement</strong> · <em>available, not yet sold.</em> Nothing here is sponsored. Brands: <a href="#brands">see For brands</a>.</aside>
        <div class="earn-bundles">${d.bundles.map(card).join('')}</div>`;
      m.querySelectorAll('a.shop-link').forEach(a => a.addEventListener('click', () => count('product_click')));
    } catch { m.querySelector('.muted').textContent = 'Could not load bundles.'; }
  }

  function interestForm(kind, types, consent) {
    return `<form class="earn-form" data-kind="${kind}" novalidate>
      <label class="plus-label">Work email<input type="email" name="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></label>
      <label class="plus-label">${kind === 'brand' ? 'About your brand (optional)' : 'What you do (optional)'}<select name="type"><option value="">Choose one (optional)</option>${types.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></label>
      <label class="plus-consent"><input type="checkbox" name="consent"> ${esc(consent)}</label>
      <div class="plus-actions"><button class="btn btn-primary" type="submit">Send</button></div>
      <p class="plus-msg" aria-live="polite"></p></form>
      <form class="earn-remove" novalidate><label class="plus-label">Remove my email<input type="email" name="email" maxlength="254"></label><div class="plus-actions"><button class="btn btn-secondary" type="submit">Remove me</button></div><p class="plus-msg" aria-live="polite"></p></form>`;
  }
  function wireInterest(m) {
    const f = m.querySelector('.earn-form');
    f?.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = f.querySelector('.plus-msg');
      if (!f.consent.checked) { msg.textContent = 'Please tick the box to agree first.'; return; }
      const email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; return; }
      msg.textContent = 'Sending…';
      try {
        const r = await fetch('/api/interest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: f.dataset.kind, email, consent: true, type: f.type.value }) });
        const d = await r.json();
        msg.textContent = r.ok ? (d.already ? 'You are already on the list. Thank you!' : 'Thank you. We will write once, when this opens.') : (d.error || 'Could not send right now.');
        if (r.ok) f.querySelectorAll('input,select,button').forEach(x => { x.disabled = true; });
      } catch { msg.textContent = 'Could not reach MIRRR. Please try again.'; }
    });
    const rf = m.querySelector('.earn-remove');
    rf?.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = rf.querySelector('.plus-msg');
      try {
        const r = await fetch('/api/interest/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: rf.email.value.trim() }) });
        const d = await r.json(); msg.textContent = r.ok ? d.message : (d.error || 'Could not remove right now.');
      } catch { msg.textContent = 'Could not reach MIRRR. Please try again.'; }
    });
  }
  const STORE_NOTE = '<p class="lib-note">Your email is used only to reply about this, never sold or shared. It sits in a file on the MIRRR server; on this free hosting plan the file is wiped whenever the server restarts, so you may need to send it again.</p>';

  async function openBrands() {
    const m = shell('earnBrands', 'For brands', `${nav}
      <p>MIRRR sees what women of colour actually love, through Qloo&rsquo;s taste graph, and which looks that taste leads to. That is useful to indie and Black-owned beauty brands deciding what to make and where to show it.</p>
      <h3>What MIRRR can offer brands</h3>
      <ul class="plus-gates">
        <li><strong>Taste trends</strong>: which Qloo taste tags and looks are rising on MIRRR. <em>Live below, free to view.</em></li>
        <li><strong>Product listing</strong> on the looks your products suit, linked to your own store. <em>Built: 14 brands are listed today, unpaid, picked by MIRRR.</em></li>
        <li><strong>Sponsored placement</strong>: one clearly marked slot on Shop by look. <em>Available, not yet sold.</em></li>
        <li><strong>Taste-insight reports</strong> by community and look. <em>Ready to switch on; no brand customer yet.</em></li>
      </ul>
      <h3>Live taste trends on MIRRR</h3><div class="earn-trends"><p class="muted">Loading…</p></div>
      <h3>Interested? Leave an email</h3>
      ${interestForm('brand', [['black_owned', 'Black-owned brand'], ['women_of_colour_owned', 'Owned by women of colour'], ['indigenous_owned', 'Indigenous-owned brand'], ['indie', 'Indie brand'], ['other', 'Other']], 'Email me about brand listings and taste reports on MIRRR. Used only for that, never sold or shared; I can remove it below any time.')}
      ${STORE_NOTE}`);
    wireInterest(m);
    try {
      const t = await (await fetch('/api/brands/trends')).json();
      const list = a => a.length ? `<ol>${a.map(x => `<li>${esc(x.name.replace(/_/g, ' '))} <span class="muted">· ${x.count}</span></li>`).join('')}</ol>` : '<p class="muted">None yet since the last restart.</p>';
      m.querySelector('.earn-trends').innerHTML = `<p class="earn-meta">${t.live_qloo_taste_runs} live Qloo taste runs since ${esc(new Date(t.counting_since).toLocaleString('en-CA'))}.</p>
        <div class="earn-two"><div><h4>Top Qloo taste tags</h4>${list(t.top_qloo_tags)}</div><div><h4>Top looks</h4>${list(t.top_looks)}</div></div><p class="lib-note">${esc(t.what_this_is)}</p>`;
    } catch { m.querySelector('.earn-trends').innerHTML = '<p class="muted">Could not load trends.</p>'; }
  }

  function openPros() {
    const m = shell('earnPros', 'For stylists & salons', `${nav}
      <p>Wigs, braids, locs, bridal looks and hair colour often end in a salon chair. MIRRR plans to connect a woman who has chosen her look with a stylist who does it well.</p>
      <ul class="plus-gates">
        <li><strong>Pro listing</strong>: your work shown next to the looks you specialise in. <em>Planned.</em></li>
        <li><strong>Booking referrals</strong>: she picks a look, sees stylists near her, books with you. <em>Planned; a referral fee per booking is the model.</em></li>
        <li><strong>Today</strong>: an interest list only. <em>Built.</em> Nothing is charged and no stylist is listed yet.</li>
      </ul>
      <h3>Interested? Leave an email</h3>
      ${interestForm('pro', [['braider', 'Braider / locs'], ['wig_install', 'Wig install'], ['colourist', 'Hair colourist'], ['makeup_artist', 'Makeup artist'], ['bridal', 'Bridal beauty'], ['stylist', 'Hair stylist'], ['salon', 'Salon owner']], 'Email me when MIRRR opens pro listings. Used only for that, never sold or shared; I can remove it below any time.')}
      ${STORE_NOTE}`);
    wireInterest(m);
  }

  function openGuides() {
    const m = shell('earnGuides', 'Digital guides', `${nav}
      <p>Future paid downloads, made from what she already builds in MIRRR. <strong>Nothing to buy today</strong>: join the founding list and get one note when they open.</p>
      <ul class="plus-gates">
        <li><strong>Bridal beauty plan</strong>: the Bridal Countdown as a printable week-by-week plan. <em>Planned.</em></li>
        <li><strong>Look book</strong>: her saved looks with shades, steps and products in one file. <em>Planned.</em></li>
        <li><strong>Routine card</strong>: her morning and night routine on one page. <em>Planned.</em></li>
      </ul>
      <div class="earn-plusform"></div>`);
    const holder = m.querySelector('.earn-plusform');
    holder.innerHTML = `<form class="plus-form" data-moment="guide_lookbook" novalidate>
      <label class="plus-label">Which guide interests you most? (optional)<select name="guide"><option value="">Choose one (optional)</option><option value="guide_bridal">Bridal beauty plan</option><option value="guide_lookbook">Look book</option><option value="guide_routine">Routine card</option></select></label>
      <label class="plus-label">Email<input type="email" name="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></label>
      <label class="plus-consent"><input type="checkbox" name="consent"> Email me once MIRRR guides or MIRRR Plus open. My email is used only for that, never sold or shared, and I can ask for removal any time on the MIRRR Plus page.</label>
      <div class="plus-actions"><button class="btn btn-primary" type="submit">Join the founding list</button></div><p class="plus-msg" aria-live="polite"></p></form>`;
    const f = holder.querySelector('form');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = f.querySelector('.plus-msg');
      if (!f.consent.checked) { msg.textContent = 'Please tick the box to agree first.'; return; }
      const email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; return; }
      try {
        const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, consent: true, moment: f.guide.value || 'plus_page' }) });
        const d = await r.json();
        msg.textContent = r.ok ? (d.already ? 'You are already on the list. Thank you!' : 'You are on the founding list. Thank you!') : (d.error || 'Could not join right now.');
        if (r.ok) f.querySelectorAll('input,select,button').forEach(x => { x.disabled = true; });
      } catch { msg.textContent = 'Could not reach MIRRR. Please try again.'; }
    });
  }

  // "Complete the routine" strips at the end of each studio: real products where they exist, an honest note where not.
  const STUDIO_STRIPS = {
    'view-colour': { routine: 'lips', title: 'Complete the lip routine' },
    'view-smile': { routine: 'lips', title: 'Complete the lip routine' },
    'view-studio': { routine: 'brow_kohl', title: 'Complete the brow & kohl routine' },
    'view-skin': { routine: 'skin', title: 'Complete the skin routine' },
    'view-complexion': { routine: 'complexion', title: 'Complete the complexion routine' },
    'view-nails': { none: 'nails', title: 'Nails: no named products yet', pro: 'Nail techs and salons' },
    'view-hairlab': { none: 'hair colour', title: 'Hair colour: no named products yet', pro: 'Colourists' },
    'view-wig': { none: 'wigs', title: 'Wigs: no named products yet', pro: 'Braiders and wig installers' },
    'view-bridal': { guide: 'guide_bridal', title: 'Take your Bridal Countdown with you' },
    'view-looks': { guide: 'guide_lookbook', title: 'Your Look Book as a download' },
  };
  async function fillStrip(el, cfg) {
    if (cfg.routine) {
      try {
        const d = await (await fetch(`/api/shop/routine/${cfg.routine}`)).json();
        if (!d.products?.length) { el.remove(); return; }
        el.innerHTML = `<h4>${esc(cfg.title)}</h4><p class="earn-meta">Real products from brands&rsquo; own stores, if you want them. Pick any, or none.</p>
          <div class="earn-xs">${d.products.map(p => `<a class="shop-link earn-chip" href="${esc(p.shop_url)}" target="_blank" rel="noopener" data-product="${esc(p.id)}"><strong>${esc(p.brand)}</strong> ${esc(p.name)}<span>${esc(String(p.category))} · ${esc(p.price_text)}${p.ownership ? ` · ${esc(p.ownership)}` : ''}</span></a>`).join('')}</div>
          <p class="lib-note">Prices as listed on the brand&rsquo;s store on Oct 30, 2026. No affiliate deal: MIRRR earns nothing from these links today. <a href="#money">How MIRRR makes money</a></p>`;
        el.querySelectorAll('a.shop-link').forEach(a => a.addEventListener('click', () => count('product_click')));
      } catch { el.remove(); }
    } else if (cfg.none) {
      el.innerHTML = `<h4>${esc(cfg.title)}</h4><p class="earn-meta">MIRRR has not sourced named products for ${esc(cfg.none)} yet, so it shows none rather than guess. ${esc(cfg.pro)}: <a href="#pros">join the stylists &amp; salons list</a>. Brands: <a href="#brands">see For brands</a>.</p>`;
    } else if (cfg.guide) {
      el.innerHTML = `<h4>${esc(cfg.title)}</h4><p class="earn-meta">A downloadable version is planned as a future paid guide. Nothing to buy today. <a href="#guides">See digital guides and join the founding list</a>.</p>`;
    }
  }
  function addStrips() {
    for (const [id, cfg] of Object.entries(STUDIO_STRIPS)) {
      const v = document.getElementById(id);
      if (!v || v.querySelector('.earn-strip')) continue;
      const el = document.createElement('aside');
      el.className = 'earn-strip';
      el.setAttribute('aria-label', cfg.title);
      v.appendChild(el);
      fillStrip(el, cfg);
    }
  }

  const ROUTES = { '#money': openMoney, '#shop': openShop, '#brands': openBrands, '#pros': openPros, '#guides': openGuides };
  function route() { const f = ROUTES[location.hash]; if (f) f(); }
  document.addEventListener('click', e => {
    if (e.target.closest?.('[data-view]')) setTimeout(addStrips, 400);
    const a = e.target.closest?.('a[href^="#"]');
    if (!a) return;
    if (a.hasAttribute('data-plus-link')) { document.querySelectorAll('.earn-page').forEach(p => p.classList.add('hidden')); return; }
    const f = ROUTES[a.getAttribute('href')];
    if (!f) return;
    e.preventDefault();
    history.replaceState(null, '', a.getAttribute('href'));
    document.querySelectorAll('.earn-page').forEach(p => p.classList.add('hidden'));
    f();
  });
  window.addEventListener('hashchange', route);
  const boot = () => { addStrips(); route(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.MirrrEarn = { STREAMS, openMoney, openShop, openBrands, openPros, openGuides };
})();
