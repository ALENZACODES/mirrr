import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLIENT_LINKS, destination } from '../dist/js/layout/client-routes.js';
import { realDemoRoute, realDemoRoutes, validateRealDemoRoutes } from '../dist/js/layout/judge-live-routes.js';

const expected = ['photo', 'studio', 'hair', 'makeup', 'shade', 'commerce', 'trust'];

function validateOne(route) {
  assert.match(route.href, /^[a-z][a-z-]*\.html(?:#(?:\/)?[\w=/-]+)?$/);
  assert.equal(route.href.startsWith('http'), false);
  assert.equal(route.href.includes('..'), false);
  assert.equal(route.href.includes('?'), false);
  assert.equal(route.carriesPhoto, false);
  assert.equal(route.carriesConsent, false);
  assert.equal(route.liveVerified, false);
  assert.ok(route.title.length > 6);
  assert.ok(route.purpose.length > 15);
  assert.ok(route.prerequisite.length > 10);
  assert.ok(route.confirmation.length > 10);
  assert.ok(route.fallback.length > 10);
}

test('the seven entry routes are unique and use only known public page paths', () => {
  assert.deepEqual(validateRealDemoRoutes(), []);
  const routes = realDemoRoutes();
  assert.deepEqual(routes.map(route => route.id), expected);
  assert.equal(new Set(routes.map(route => route.href)).size, routes.length);
  for (const route of routes) validateOne(route);
});

test('each existing browser route reuses the public client navigation contract', () => {
  const ids = new Map([
    ['photo', 'classic'],
    ['studio', 'studio'],
    ['hair', 'hair'],
    ['makeup', 'makeup'],
    ['shade', 'shade'],
    ['trust', 'trust'],
  ]);
  for (const [routeId, navId] of ids) {
    const link = destination(navId);
    assert.ok(link);
    assert.equal(realDemoRoute(routeId).href, link.href);
  }
  assert.equal(realDemoRoute('commerce').href, 'commerce.html');
  assert.ok(CLIENT_LINKS.length >= 15);
});

test('provider-aware paths explicitly require a fresh consent and quote', () => {
  for (const id of ['hair', 'makeup']) {
    const route = realDemoRoute(id);
    assert.equal(route.boundary, 'requires-consent');
    assert.match(route.prerequisite, /consent|permission/i);
    assert.match(route.fallback, /refusal|fail/i);
    assert.equal(route.carriesConsent, false);
  }
});

test('the commerce destination is distinct from the mock and is not a purchase claim', () => {
  const route = realDemoRoute('commerce');
  assert.equal(route.boundary, 'third-party-page');
  assert.match(route.prerequisite, /own entry flow/);
  assert.match(route.confirmation, /non-billable/);
  assert.match(route.fallback, /unavailable/);
});

test('invalid route IDs are rejected, never interpreted as arbitrary URLs', () => {
  for (const value of [undefined, null, '', 'https://example.com', '../admin', 'photo?key=test']) {
    assert.throws(() => realDemoRoute(value), RangeError);
  }
  assert.deepEqual(realDemoRoutes(), realDemoRoutes());
});

test('the real-product handoff does not promise face transfer or live task execution', () => {
  for (const route of realDemoRoutes()) {
    const disclosure = [route.purpose, route.prerequisite, route.confirmation, route.fallback].join(' ');
    assert.doesNotMatch(disclosure, /automatically transferred|already authorized|guaranteed/i);
    assert.equal(route.liveVerified, false);
  }
});
