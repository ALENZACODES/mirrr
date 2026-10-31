import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCompletedRun } from '../public/sixty-core.js';

test('the committed completed run is a full, real live run (or the button stays hidden)', () => {
  const c = JSON.parse(readFileSync(new URL('../public/completed-run.json', import.meta.url), 'utf8'));
  assert.ok(isCompletedRun(c));
  assert.ok(!Number.isNaN(Date.parse(c.at)));
  assert.equal(c.outcome.live, true);
  assert.equal(c.run.meta.qloo_powered, true);
});
