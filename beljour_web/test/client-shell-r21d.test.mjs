// Lane D r21d: DOM integration without a browser, third-party assets or live requests.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Element, installDOM } from './helpers/dom.mjs';
import { CLIENT_LINKS } from '../dist/js/layout/client-routes.js';
import { mountClientShell } from '../dist/js/layout/client-shell.js';
import { mountClientNavigation, navigationCoverage } from '../dist/js/ui/shell/client-navigation.js';

function fakeBrowser() {
  const listeners = new Map();
  const media = new Set();
  let compact = false;
  return { location: { hash: '#/photo' }, navigator: { onLine: true }, listeners,
    innerWidth: 1000,
    matchMedia() { return { matches: compact,
      addEventListener(_kind, fn) { media.add(fn); },
      removeEventListener(_kind, fn) { media.delete(fn); } }; },
    addEventListener(name, fn) { const row = listeners.get(name) ?? new Set(); row.add(fn); listeners.set(name, row); },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
    fire(name) { for (const fn of [...(listeners.get(name) ?? [])]) fn({ type: name }); },
    setCompact(value) { compact = value; for (const fn of media) fn({ matches: value }); },
  };
}
function setup() {
  const dom = installDOM();
  const previous = globalThis.Element;
  globalThis.Element = Element;
  const mount = new Element('div');
  mount.id = 'lg-client-root';
  dom.root.append(mount);
  return { dom, mount, restore() {
    if (previous === undefined) delete globalThis.Element;
    else globalThis.Element = previous;
    dom.restore();
  } };
}

test('nav creates exactly one anchor for each public link and preserves real hrefs', () => {
  const app = setup();
  try {
    const browser = fakeBrowser();
    const nav = mountClientNavigation(app.dom.document, browser, 'classic', '#/photo');
    app.mount.append(nav.element);
    const anchors = nav.element.querySelectorAll('a');
    assert.equal(anchors.length, CLIENT_LINKS.length);
    assert.deepEqual(new Set(anchors.map(a => a.href)), new Set(CLIENT_LINKS.map(l => l.href)));
    assert.equal(anchors.filter(a => a.getAttribute('aria-current') !== null).length, 1);
    assert.equal(nav.element.querySelectorAll('nav').length, 1);
    assert.equal(nav.element.querySelectorAll('button').length, 2);
    assert.deepEqual(navigationCoverage(['main', 'local', 'styling', 'information']), []);
    nav.destroy();
    assert.equal(app.mount.children.length, 0);
  } finally { app.restore(); }
});

test('hash changes, photo readiness and styling consent change only labels', () => {
  const app = setup();
  try {
    const browser = fakeBrowser();
    const nav = mountClientNavigation(app.dom.document, browser, 'classic', '#/skin');
    app.mount.append(nav.element);
    const anchor = id => nav.element.querySelectorAll('a').find(a => a.dataset.clientLink === id);
    nav.update('classic', '#/skin', { hasPhoto: false, hasConsent: false });
    assert.equal(anchor('skin').getAttribute('aria-current'), 'page');
    assert.equal(anchor('skin').dataset.requirementLabel, 'Open a photo first');
    assert.match(anchor('skin').getAttribute('aria-label'), /Open a photo first/);
    assert.equal(anchor('hair').getAttribute('aria-label'), 'Hair styling. Visit consent required');
    assert.equal(anchor('classic').dataset.active, 'true');
    assert.equal(anchor('skin').href, 'index.html#/skin');
    nav.update('classic', '#/hair', { hasPhoto: true, hasConsent: true });
    assert.equal(anchor('hair').getAttribute('aria-current'), 'page');
    assert.equal(anchor('skin').getAttribute('aria-current'), null);
    assert.equal(anchor('hair').getAttribute('aria-label'), null);
    assert.equal(anchor('hair').dataset.requirement, undefined);
    nav.update('home', '#looks');
    assert.equal(anchor('looks').getAttribute('aria-current'), 'location');
    nav.destroy();
  } finally { app.restore(); }
});

test('shell owns its three surfaces and removes listeners on teardown', () => {
  const app = setup();
  try {
    const browser = fakeBrowser();
    const shell = mountClientShell(app.dom.document, browser, { page: 'classic' });
    assert.ok(shell.navigation);
    assert.ok(shell.connection);
    assert.ok(shell.errors);
    assert.equal(app.mount.children.length, 3);
    assert.equal(app.mount.dataset.clientMounted, 'true');
    assert.equal(mountClientShell(app.dom.document, browser).navigation, null, 'double mount is rejected');
    shell.update('classic', '#/shade', { hasPhoto: false, hasConsent: false });
    const anchor = app.mount.querySelectorAll('a').find(a => a.dataset.clientLink === 'shade');
    assert.equal(anchor.getAttribute('aria-current'), 'page');
    assert.equal(anchor.dataset.requirementLabel, 'Open a photo first');
    shell.errors.showViewError();
    assert.equal(shell.errors.element.hidden, false);
    shell.destroy();
    assert.equal(app.mount.children.length, 0);
    assert.equal(app.mount.dataset.clientMounted, undefined);
    for (const name of ['pagehide', 'hashchange', 'online', 'offline', 'error', 'unhandledrejection']) {
      assert.equal(browser.listeners.get(name).size, 0, name);
    }
    shell.destroy();
  } finally { app.restore(); }
});

test('pagehide cleans up without resetting a photograph or navigating automatically', () => {
  const app = setup();
  try {
    const browser = fakeBrowser();
    mountClientShell(app.dom.document, browser, { page: 'studio' });
    browser.fire('pagehide');
    assert.equal(app.mount.children.length, 0);
    assert.equal(browser.location.hash, '#/photo');
    const second = mountClientShell(app.dom.document, browser, { page: 'trust' });
    assert.ok(second.navigation);
    second.destroy();
  } finally { app.restore(); }
});

test('app still works when the static mount point is missing', () => {
  const dom = installDOM();
  try {
    const client = mountClientShell(dom.document, fakeBrowser());
    assert.equal(client.navigation, null);
    client.update('home', '');
    client.destroy();
  } finally { dom.restore(); }
});

test('all four static pages include the enhancement root and include the shared stylesheet', () => {
  for (const page of ['index.html', 'home.html', 'studio.html', 'trust.html']) {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.equal([...html.matchAll(/id="lg-client-root"/g)].length, 1, page);
    assert.ok(html.indexOf('id="lg-client-root"') > html.indexOf('</header>'), page);
    assert.match(html, /href="theme\.css"/);
    assert.match(html, /href="trust\.html"/);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  }
});

test('responsive CSS has declared breakpoints, focus rings and no red text', () => {
  const css = readFileSync(new URL('../theme.css', import.meta.url), 'utf8');
  const added = css.slice(css.indexOf('/* Lane D r21d'));
  assert.match(added, /--client-blue:\s*#000091/);
  assert.match(added, /--client-red:\s*#E1000F/);
  assert.match(added, /@media \(max-width:\s*760px\)/);
  assert.match(added, /@media \(max-width:\s*480px\)/);
  assert.match(added, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(added, /\.lg-client-link\s*\{/);
  assert.match(added, /\.lg-client-menu\s*\{/);
  assert.match(added, /\.lg-client-root a:focus-visible/);
  assert.match(added, /min-height:\s*44px/);
  assert.doesNotMatch(added, /(?<![\w-])color:\s*(?:var\(--client-red\)|#E1000F)/i,
    'red is reserved for an outline/border, never client body text');
  assert.match(added, /border-left-color:\s*var\(--client-red\)/);
});
