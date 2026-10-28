// Usability 4.6 (round 2 plan): Rouge Marianne #E1000F only for Delete, warnings and
// the monogram; no red stripe under every top bar. Parses every web/*.css file.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
const RED = /var\(--(rouge|red|hair-red)\)|#e1000f/i;
const ALLOWED = /delete|warn|error|danger|monogram|alert|destroy|remove|brand-mark|shell-flag|li\.fix|\.over\b|fit-tight/i;

function rules(css) {
  const out = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) out.push({ selector: m[1].trim(), body: m[2] });
  return out;
}

test('red is used only on delete, warning and monogram rules', () => {
  const offenders = [];
  for (const file of files) {
    for (const { selector, body } of rules(readFileSync(new URL(file, dir), 'utf8'))) {
      for (const decl of body.split(';')) {
        const d = decl.trim();
        if (!d || d.startsWith('--') || !RED.test(d)) continue;
        if (!ALLOWED.test(selector)) offenders.push(`${file}: ${selector} { ${d} }`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test('the Rouge Marianne token itself is unchanged', () => {
  const theme = readFileSync(new URL('theme.css', dir), 'utf8');
  assert.match(theme, /--rouge:\s*#E1000F/);
  assert.match(theme, /--bleu:\s*#000091/);
});

test('no tricolour stripe under the top bars', () => {
  for (const file of files) {
    const css = readFileSync(new URL(file, dir), 'utf8');
    for (const { selector, body } of rules(css)) {
      if (/tricolore|lg-rule/.test(selector)) assert.doesNotMatch(body, RED, `${file}: ${selector}`);
    }
  }
});
