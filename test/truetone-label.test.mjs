import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SIXTY_STEPS } from '../public/sixty-core.js';

test('step 3 of the 60-Second Transformation is labelled TrueTone', () => {
  assert.equal(SIXTY_STEPS.find(s => s.id === 'shade').label, 'Your TrueTone shade');
});

test('TrueTone is named honestly as the shade finder ranking wherever the finder shows a result', () => {
  const sixty = readFileSync(new URL('../public/sixty.js', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(sixty, /'Your TrueTone shade' : 'Your pick'/);
  assert.match(sixty, /\$\{tt\}: \$\{esc\(top\.name\)\} \(\$\{esc\(top\.code\)\}\)/);
  assert.match(sixty, /it is a ranking, not a skin scan/i);
  assert.match(app, /Your TrueTone shade: \$\{esc\(shades\[0\]\.shade\.name\)\}/);
  assert.match(app, /planCard\('drop', 'Your TrueTone shade'/);
});

test('Style Match descriptions no longer claim lips the portraits do not show', async () => {
  const { INSPIRATION_LOOKS } = await import('../src/style_match_engine.js');
  assert.doesNotMatch(INSPIRATION_LOOKS.persian_queen.description, /berry/i);
  assert.doesNotMatch(INSPIRATION_LOOKS.loc_journey.description, /jewel lip/i);
  const server = readFileSync(new URL('../src/server.js', import.meta.url), 'utf8');
  for (const l of Object.values(INSPIRATION_LOOKS).filter(x => x.image)) {
    if (server.includes(`${l.id}: { id: '${l.id}'`)) assert.ok(server.includes(`description: '${l.description}'`), l.id);
  }
});
