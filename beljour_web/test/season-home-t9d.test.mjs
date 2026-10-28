/** Staging-isolated Home rail and lazy activation tests. Author: John Khan. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { installDOM } from './helpers/dom.mjs';
import {
  mountSeasonBook, registerSeasonBookPort, unregisterSeasonBookPort,
} from '../dist/js/layout/season-book/index.js';
import { exampleLook, mockPort } from './helpers/season-book-fixtures.mjs';

const root = new URL('../', import.meta.url);
const tick = async () => {
  await new Promise(resolve => setImmediate(resolve));
  await Promise.resolve();
};

async function awaitActivation(predicate) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail('Season Book source did not activate');
}

function page() {
  const dom = installDOM();
  const rail = dom.document.createElement('section');
  rail.setAttribute('id', 'lg-editorial-calendar-rail');
  rail.hidden = true;
  const holiday = dom.document.createElement('section');
  holiday.setAttribute('id', 'lg-holiday-engine-slot');
  holiday.hidden = true;
  const season = dom.document.createElement('section');
  season.setAttribute('id', 'lg-season-book-root');
  season.hidden = true;
  rail.append(holiday, season);
  dom.root.append(rail);
  return { ...dom, rail, season, close() {
    unregisterSeasonBookPort();
    dom.restore();
  } };
}

test('Home reserves adjacent holiday and season slots without showing a dead feature', () => {
  const html = readFileSync(new URL('home.html', root), 'utf8');
  assert.match(html, /id="lg-editorial-calendar-rail"[^>]*hidden/);
  assert.match(html, /id="lg-holiday-engine-slot"[^>]*hidden/);
  assert.match(html, /id="lg-season-book-root"[^>]*hidden/);
  assert.ok(html.indexOf('lg-holiday-engine-slot') < html.indexOf('lg-season-book-root'));
  assert.match(html, /BELJOUR — FULL BEAUTY STUDIO/);
});

test('absence of a source keeps Home and personal data untouched', async () => {
  const fixture = page();
  try {
    mountSeasonBook(fixture.document, () => {
      throw Error('Saved looks should not be read without a user action');
    });
    await tick();
    assert.equal(fixture.rail.hidden, true);
    assert.equal(fixture.season.hidden, true);
    assert.equal(fixture.season.textContent, '');
  } finally {
    fixture.close();
  }
});

test('late public source activation paints only reviewed catalogue', async () => {
  const fixture = page();
  try {
    const port = mockPort();
    mountSeasonBook(fixture.document, () => [exampleLook()]);
    registerSeasonBookPort(port);
    await awaitActivation(() => port.calls.length > 0 && !fixture.season.hidden);
    assert.equal(fixture.rail.hidden, false);
    assert.equal(fixture.season.hidden, false);
    assert.match(fixture.season.textContent, /The Season Book/);
    assert.deepEqual(port.calls, ['load']);
    unregisterSeasonBookPort();
    assert.equal(fixture.season.hidden, true);
    assert.equal(fixture.season.textContent, '');
  } finally {
    fixture.close();
  }
});

test('overlapping source activation cannot restore a retired source', async () => {
  const fixture = page();
  try {
    mountSeasonBook(fixture.document, () => []);
    registerSeasonBookPort(mockPort());
    unregisterSeasonBookPort();
    await tick();
    await tick();
    assert.equal(fixture.rail.hidden, true);
    assert.equal(fixture.season.textContent, '');
  } finally {
    fixture.close();
  }
});

test('styles keep editorial whitespace and 12px minimum functional text', () => {
  const css = readFileSync(new URL('layout.css', root), 'utf8');
  const newRules = css.split('/* Season Book, source-driven editorial rail.')[1];
  assert.ok(newRules);
  assert.match(newRules, /grid-template-columns: repeat\(2/);
  assert.match(newRules, /max-width: 750px/);
  assert.match(newRules, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(newRules, /font-size:\s*0\.(?:[0-6]\d*|7[0-4])rem/);
  assert.doesNotMatch(newRules, /#e1000f/i);
});
