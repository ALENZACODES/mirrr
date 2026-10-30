import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTransform } from '../src/pipeline/transform.js';
import { LOOKS } from '../src/look_engine.js';

test('finishing steps never repeat their title as the technique ("Finish: setting / setting")', async () => {
  for (const l of LOOKS) {
    const r = await buildTransform({ targetLookId: l.id, fitzpatrick: 'V', undertone: 'warm' });
    for (const st of r.stages ?? []) for (const x of st.steps ?? []) {
      if (!x.title?.startsWith('Finish: ')) continue;
      const t = x.title.slice(8).toLowerCase(), first = x.technique.split('.')[0].toLowerCase().trim();
      assert.notEqual(first, t, `${l.id}: ${x.title} / ${x.technique}`);
    }
  }
});
