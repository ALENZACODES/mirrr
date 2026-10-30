import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan } from '../src/pipeline/plan.js';
import { getCommunities } from '../src/cultural_dna.js';

test('plan ritual fields are text, never raw objects (no "[object Object]")', async () => {
  for (const c of getCommunities()) {
    for (const occasion of ['my sister\'s wedding next month', 'Eid festival', 'an outdoor festival']) {
      const p = await buildPlan({ occasion, communityId: c.id, fitzpatrick: 'IV', undertone: 'warm' });
      const r = p.ritual;
      if (!r) continue;
      for (const k of ['festival', 'tradition', 'skincareTip']) assert.ok(r[k] == null || typeof r[k] === 'string', `${c.id}/${occasion}: ${k} is ${typeof r[k]}`);
      for (const k of ['rituals', 'signature']) for (const x of r[k] ?? []) assert.equal(typeof x, 'string', `${c.id}/${occasion}: ${k}`);
      assert.doesNotMatch(JSON.stringify(r), /\[object Object\]/);
    }
  }
});
