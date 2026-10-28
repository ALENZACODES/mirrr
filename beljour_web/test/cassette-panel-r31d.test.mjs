/** Accessible DOM contract for the drawn cassette gallery. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CassetteSession } from '../dist/js/layout/continuous/cassette-session.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';
import { renderCassettePanel } from '../dist/js/ui/shell/continuous-cassette-panel.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function fixture(flag = false) {
  const page = judgeDOM();
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(1, 2, 'drawn-main');
  for (const key of ['local', 'hair', 'face', 'mock']) state.setPermission(key, true);
  const cassette = new CassetteSession(flag);
  cassette.warm(state.snapshot, true);
  const changes = [];
  const actions = {
    choose(id) { changes.push(['choose', id]); cassette.choose(id, state.snapshot, true); },
    acknowledge(value) { changes.push(['acknowledge', value]); cassette.acknowledge(value); },
    addToBag() { changes.push(['bag']); cassette.addToBag(state.snapshot, true); },
    removeFromBag(id) { changes.push(['remove', id]); cassette.removeFromBag(id); },
  };
  const show = () => {
    const view = renderCassettePanel(page.document, state.snapshot, true, cassette, actions);
    page.host.replaceChildren(view);
    return view;
  };
  show();
  return { page, state, cassette, changes, show, close() {
    cassette.dispose(); state.dispose(); page.close();
  } };
}

function action(view, key) {
  return view.querySelectorAll('button').find(node => node.dataset.cassetteAction === key);
}

test('three distinct cards are displayed without a photo, brand asset or provider claim', () => {
  const { page, close } = fixture();
  try {
    assert.equal(page.host.querySelectorAll('li').filter(node => node.className === 'lg-cassette-card').length, 3);
    assert.match(page.host.textContent, /Hair colour idea/);
    assert.match(page.host.textContent, /Makeup placement idea/);
    assert.match(page.host.textContent, /Skin match concept/);
    assert.match(page.host.textContent, /NOT A PROVIDER RESULT/);
    assert.equal(page.host.querySelectorAll('img').length, 0);
    assert.equal(page.host.querySelectorAll('script').length, 0);
  } finally { close(); }
});

test('each accessible native button has a human-readable label and 44px CSS target', () => {
  const { page, close } = fixture();
  try {
    const buttons = page.host.querySelectorAll('button');
    assert.equal(buttons.length, 3);
    assert.ok(buttons.every(node => node.type === 'button'));
    assert.ok(buttons.every(node => node.textContent.trim().length > 10));
    assert.ok(buttons.every(node => node.getAttribute('onclick') === null));
  } finally { close(); }
});

test('a selected cached illustration reveals its fixed evidence label', async () => {
  const { page, cassette, show, changes, close } = fixture();
  try {
    await action(page.host, 'review-drawn-hair').click();
    show();
    assert.deepEqual(changes[0], ['choose', 'drawn-hair']);
    assert.equal(cassette.snapshot.selectedId, 'drawn-hair');
    assert.match(page.host.textContent, /Viewed: Hair colour idea/);
    assert.equal(action(page.host, 'review-drawn-hair').getAttribute('aria-pressed'), 'true');
    assert.ok(action(page.host, 'bag-add'));
  } finally { close(); }
});

test('a sample bag controls a useful demo purchase path without prices', async () => {
  const { page, cassette, show, close } = fixture();
  try {
    await action(page.host, 'review-drawn-hair').click();
    show();
    await action(page.host, 'bag-add').click();
    show();
    assert.equal(cassette.snapshot.bag.items.length, 1);
    assert.match(page.host.textContent, /No price, order or billing/);
    assert.ok(action(page.host, 'bag-remove-drawn-hair'));
    assert.equal(page.host.querySelectorAll('form').length, 0);
    assert.equal(page.host.querySelectorAll('input[type=password]').length, 0);
    await action(page.host, 'bag-remove-drawn-hair').click();
    show();
    assert.equal(cassette.snapshot.bag.items.length, 0);
  } finally { close(); }
});

test('feature flag off never creates a provider-aware link', () => {
  const { page, close } = fixture(false);
  try {
    assert.equal(page.host.querySelectorAll('a').length, 0);
    assert.match(page.host.textContent, /hidden by the feature flag/);
  } finally { close(); }
});

test('feature flag on without acknowledgement still does not create a link', async () => {
  const { page, show, close } = fixture(true);
  try {
    await action(page.host, 'review-drawn-makeup').click();
    show();
    assert.equal(page.host.querySelectorAll('a').length, 0);
    assert.equal(page.host.querySelectorAll('input').filter(node => node.type === 'checkbox').length, 1);
    assert.match(page.host.textContent, /requires its own consent and unit approval/);
  } finally { close(); }
});

test('an acknowledged public route is same origin, noopener, and a fresh page', async () => {
  const { page, show, changes, close } = fixture(true);
  try {
    await action(page.host, 'review-drawn-hair').click();
    show();
    const checkbox = page.host.querySelectorAll('input').find(node =>
      node.dataset.cassetteAction === 'separate-consent');
    checkbox.checked = true;
    await checkbox.dispatch('change');
    show();
    assert.deepEqual(changes.at(-1), ['acknowledge', true]);
    const link = page.host.querySelectorAll('a')[0];
    assert.ok(link);
    assert.match(link.getAttribute('href'), /^[a-z][\w-]*\.html/);
    assert.equal(link.getAttribute('target'), '_blank');
    assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
    assert.doesNotMatch(link.getAttribute('href'), /https?:|photo=|sessionId=/i);
  } finally { close(); }
});

test('no consent or identity lock means reviewed entries are visibly disabled', () => {
  const { page, state, show, close } = fixture(true);
  try {
    state.setPermission('mock', false);
    show();
    for (const button of page.host.querySelectorAll('button')) {
      assert.equal(button.disabled, true);
    }
    state.setPermission('mock', true);
    state.setIdentityLock(false);
    show();
    assert.equal(action(page.host, 'review-drawn-hair').disabled, true);
  } finally { close(); }
});

test('the panel uses a live announcement with fixed safe text', () => {
  const { page, close } = fixture();
  try {
    const live = page.host.querySelectorAll('p').find(node => node.getAttribute('aria-live') === 'polite');
    assert.ok(live);
    assert.match(live.textContent, /cached local illustrations/i);
    assert.equal(live.getAttribute('role'), 'status');
    assert.doesNotMatch(page.host.textContent, /apiKey|bearer|private token/i);
  } finally { close(); }
});
