// Lane D r21d: public-page routing and classic readiness contracts.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  CLIENT_LINKS, GROUP_TITLES, availability, clientPage, currentLink,
  destination, isClientLink, linksIn, validateClientLinks,
} from '../dist/js/layout/client-routes.js';
import {
  START_ROUTE, RouteRevision, parseClassicRoute, resolveClassicRoute,
} from '../dist/js/layout/route-state.js';
import { STEPS } from '../dist/js/ctx.js';

const root = new URL('../', import.meta.url);
const noPhoto = { photo: null, photoSrc: null, consent: false };
const localPhoto = { photo: null, photoSrc: 'blob:synthetic', consent: true };
const remotePhoto = { photo: { photo_id: 'synthetic-only' }, photoSrc: 'blob:synthetic', consent: true };

test('every navigation destination is unique and resolves to a shipped public page', () => {
  assert.deepEqual(validateClientLinks(), []);
  assert.equal(new Set(CLIENT_LINKS.map(l => l.id)).size, CLIENT_LINKS.length);
  assert.equal(new Set(CLIENT_LINKS.map(l => l.href)).size, CLIENT_LINKS.length);
  for (const link of CLIENT_LINKS) {
    const [filename] = link.href.split('#');
    assert.equal(existsSync(new URL(filename, root)), true, `${link.id}: ${filename}`);
    assert.equal(destination(link.id), link);
    assert.equal(isClientLink(link.href), true);
    assert.ok(link.description.length > 5);
    assert.ok(link.label.length > 1);
  }
  assert.equal(destination('missing'), null);
  assert.equal(isClientLink('https://somewhere.example.test/'), false);
});

test('the classic navigation exposes every existing public feature screen', () => {
  const known = new Set(STEPS.map(step => step.route));
  const classic = CLIENT_LINKS.filter(link => link.page === 'classic');
  assert.ok(classic.length >= 11);
  for (const step of STEPS) {
    assert.ok(classic.some(link => link.hash === step.route), step.route);
  }
  for (const link of classic) {
    assert.ok(link.hash === 'privacy' || known.has(link.hash));
    assert.match(link.href, /^index\.html#\//);
  }
  assert.equal(destination('skin').href, 'index.html#/skin');
  assert.equal(destination('hair').href, 'index.html#/hair');
  assert.equal(destination('eyes').href, 'eyes-brows.html');
  assert.equal(destination('filters').href, 'studio.html#cat=Filters');
});

test('a navigation group has a clear name and genuinely owned destinations', () => {
  for (const group of ['local', 'styling', 'information']) {
    assert.ok(GROUP_TITLES[group]);
    assert.ok(linksIn(group).length > 0);
    assert.ok(linksIn(group).every(link => link.group === group));
  }
  assert.equal(linksIn('main').length, 5);
  assert.ok(!linksIn('styling').some(link => link.requirement === 'none'));
});

test('selected feature is computed from the public URL, never from a private engine', () => {
  assert.equal(currentLink('home', ''), 'home');
  assert.equal(currentLink('home', '#looks'), 'looks');
  assert.equal(currentLink('trust', '#wrong'), 'trust');
  assert.equal(currentLink('studio', '#cat=Photo'), 'studio');
  assert.equal(currentLink('classic', '#/skin'), 'skin');
  assert.equal(currentLink('classic', '#/tryon'), 'makeup');
  assert.equal(currentLink('classic', '#/unknown'), 'classic');
  assert.equal(currentLink('classic', 'skin'), 'classic');
  assert.equal(clientPage('home'), 'home');
  assert.equal(clientPage('studio'), 'studio');
  assert.equal(clientPage('trust'), 'trust');
  assert.equal(clientPage('prototype'), 'classic');
  assert.equal(clientPage(undefined), 'classic');
});

test('readiness copy warns without disabling a real link or inventing a result', () => {
  const empty = { hasPhoto: false, hasConsent: false };
  const local = { hasPhoto: true, hasConsent: false };
  const ready = { hasPhoto: true, hasConsent: true };
  assert.equal(availability(destination('home'), empty), null);
  assert.equal(availability(destination('skin'), null), null);
  assert.equal(availability(destination('skin'), empty), 'Open a photo first');
  assert.equal(availability(destination('skin'), local), null);
  assert.equal(availability(destination('hair'), local), 'Visit consent required');
  assert.equal(availability(destination('hair'), ready), null);
  assert.equal(availability(destination('palettes'), empty), null);
});

test('malformed URLs fall back to a known photo route', () => {
  for (const hash of ['', '#', '#/missing', '#/skin?other=1', '#//skin',
    '#/../../trust', 'javascript:alert(1)', '#/%2e%2e', '#/photo#extra']) {
    assert.equal(parseClassicRoute(hash), START_ROUTE, hash);
  }
  for (const step of STEPS) {
    assert.equal(parseClassicRoute(`#/${step.route}`), step.route);
  }
  assert.equal(parseClassicRoute('#/privacy'), 'privacy');
});

test('route choice never bypasses photo or consent guards', () => {
  const blocked = resolveClassicRoute('#/shade', noPhoto);
  assert.equal(blocked.requested, 'shade');
  assert.equal(blocked.destination, 'photo');
  assert.equal(blocked.redirected, true);
  assert.match(blocked.reason, /photo/);
  const local = resolveClassicRoute('#/shade', localPhoto);
  assert.equal(local.destination, 'shade');
  assert.equal(local.redirected, false);
  assert.equal(resolveClassicRoute('#/hair', localPhoto).destination, 'photo');
  assert.equal(resolveClassicRoute('#/hair', remotePhoto).destination, 'hair');
  assert.equal(resolveClassicRoute('#/palettes', noPhoto).destination, 'palettes');
  assert.equal(resolveClassicRoute('#/privacy', noPhoto).destination, 'privacy');
});

test('route revisions prevent older async views taking focus', () => {
  const revision = new RouteRevision();
  assert.equal(revision.isLatest(0), false);
  const first = revision.begin();
  assert.equal(revision.isLatest(first), true);
  const second = revision.begin();
  assert.equal(revision.isLatest(first), false);
  assert.equal(revision.isLatest(second), true);
  revision.stop();
  assert.equal(revision.isLatest(second), false);
  assert.equal(revision.begin(), -1);
});

test('no dependency is needed for internal navigation and features remain separately consented', () => {
  const sources = [
    'src/layout/client-routes.ts',
    'src/layout/route-state.ts',
    'src/ui/shell/client-navigation.ts',
    'src/mobile/disclosure.ts',
  ];
  for (const file of sources) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(/);
    assert.doesNotMatch(source, /\bXMLHttpRequest\b/);
    assert.doesNotMatch(source, /\bYouCam_API_KEY\b/);
    assert.doesNotMatch(source, /\.\.\/\.\.\/engines\//);
  }
});
