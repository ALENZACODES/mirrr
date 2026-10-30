// Rotating quotes on the home page: enough cultures, original script with English, RTL marked, wired into the page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

await import('../public/quotes.js');
const Q = globalThis.MIRRR_QUOTES;
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const src = readFileSync(new URL('../public/quotes.js', import.meta.url), 'utf8');

test('about 30 quotes, from at least 20 languages, each with text and attribution', () => {
  assert.ok(Q.length >= 28, `only ${Q.length}`);
  assert.ok(new Set(Q.map(q => q.lang)).size >= 20);
  for (const q of Q) { assert.ok(q.text.trim() && q.by.trim() && q.lang, JSON.stringify(q)); }
  assert.equal(new Set(Q.map(q => q.text)).size, Q.length, 'no duplicates');
});

test('every non-English quote carries an English translation; English ones do not repeat themselves', () => {
  for (const q of Q) {
    if (q.lang === 'en') assert.equal(q.en, '');
    else assert.ok(q.en && /[a-z]/i.test(q.en), q.by);
  }
});

test('Arabic, Persian, Urdu and Hebrew are right-to-left and written in their own script; others are left-to-right', () => {
  for (const q of Q) {
    const rtl = ['ar', 'fa', 'ur', 'he'].includes(q.lang);
    assert.equal(q.dir, rtl ? 'rtl' : 'ltr', q.by);
    if (rtl) assert.match(q.text, /[\u0590-\u06FF]/, q.by);
  }
  assert.ok(Q.some(q => q.by.startsWith('Audre Lorde')), 'Audre Lorde kept');
});

test('rotates every 60s from a random start, fades unless reduced motion, pauses on hover/focus, announced politely', () => {
  assert.equal(globalThis.MIRRR_QUOTES_ROTATE_MS, 60000);
  assert.match(src, /Math\.random\(\) \* QUOTES\.length/);
  assert.match(src, /prefers-reduced-motion: reduce/);
  for (const ev of ['mouseenter', 'mouseleave', 'focusin', 'focusout']) assert.ok(src.includes(`'${ev}'`), ev);
  assert.match(html, /<script src="quotes\.js" defer><\/script>/);
  assert.match(html, /class="manifesto-live" aria-live="polite"/);
  assert.match(html, /class="manifesto-en"/);
  assert.match(html, /prefers-reduced-motion: reduce\) \{ \.manifesto-live \{ transition: none/);
});
