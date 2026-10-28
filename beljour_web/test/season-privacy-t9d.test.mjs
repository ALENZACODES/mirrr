/** Release safety: no implicit personalization, network or unreviewed data.
 * Author: John Khan.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../src/layout/season-book/', import.meta.url);
const files = readdirSync(root).filter(name => name.endsWith('.ts'));

test('Season Book owns only DOM and typed ports, with no direct network access', () => {
  assert.ok(files.length >= 7);
  for (const name of files) {
    const contents = readFileSync(new URL(name, root), 'utf8');
    assert.doesNotMatch(contents, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
    assert.doesNotMatch(contents, /\b(?:localStorage|sessionStorage|indexedDB)\b/);
    assert.doesNotMatch(contents, /Notification\s*\.\s*requestPermission/);
    assert.doesNotMatch(contents, /\binnerHTML\s*=/);
    assert.doesNotMatch(contents, /\bsetInterval\s*\(/);
  }
});

test('Season Book references Lane F through its public typed contract, not internals', () => {
  for (const name of files) {
    const contents = readFileSync(new URL(name, root), 'utf8');
    assert.doesNotMatch(contents, /from\s+["']\.\.\/\.\.\/engines\/shade\/[^"']+\/private/);
    assert.doesNotMatch(contents, /providers\/youcam|secret|api[_-]key/i);
  }
});

test('front page uses only a lazy opt-in Season Book mount', () => {
  const home = readFileSync(new URL('../home-view.ts', root), 'utf8');
  const entry = readFileSync(new URL('index.ts', root), 'utf8');
  assert.match(home, /mountSeasonBook\(doc, \(\) => store\.list\(\)\)/);
  assert.match(entry, /registerSeasonBookPort/);
  assert.match(entry, /await import\("\.\/surface\.js"\)/);
  assert.doesNotMatch(home, /fetch\s*\(/);
});

test('new seasonal code never embeds invented trend or success percentages', () => {
  for (const name of files) {
    const contents = readFileSync(new URL(name, root), 'utf8');
    assert.doesNotMatch(contents, /(?:95|96|98|100)%\s+(?:passed|verified|matched)/i);
    assert.doesNotMatch(contents, /2026.*top trend|current fashion trend/i);
  }
});
