/**
 * Phones: the top bar is one compact row with a Menu button; the links open under it only on a tap
 * and close once she picks one, so the bar never covers photos or faces. Also keeps --nav-h (the
 * bar's real height) current, so the page and every nav jump start below the bar.
 */
(function () {
  function fit() {
    var nav = document.getElementById('nav'); if (!nav) return;
    var inner = nav.querySelector('.nav-inner') || nav;
    document.documentElement.style.setProperty('--nav-h', Math.ceil(inner.getBoundingClientRect().height) + 'px');
  }
  function start() {
    var nav = document.getElementById('nav'); if (!nav) return;
    var links = nav.querySelector('.nav-links'); var inner = nav.querySelector('.nav-inner');
    if (links && inner && !nav.querySelector('.nav-toggle')) {
      links.id = links.id || 'navLinks';
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'nav-toggle'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', links.id);
      b.innerHTML = '<span aria-hidden="true">&#9776;</span> Menu';
      inner.insertBefore(b, links);
      var set = function (open) { nav.classList.toggle('nav--open', open); b.setAttribute('aria-expanded', String(open)); };
      b.addEventListener('click', function () { set(!nav.classList.contains('nav--open')); });
      links.addEventListener('click', function (e) { var l = e.target.closest('.nav-link'); if (l && l.tagName !== 'SUMMARY') set(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(inner || nav);
    window.addEventListener('resize', fit); window.addEventListener('load', fit);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
