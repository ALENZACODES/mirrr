import { describe, it, expect } from '@jest/globals';
import { buildPlan, parseOccasion } from '../src/pipeline/plan.js';

describe('occasion planner', () => {
  it('propagates the outdoor constraint into the timeline', async () => {
    const p = await buildPlan({ occasion: 'Desi wedding, outdoors', communityId: 'south-asian', fitzpatrick: 'IV', undertone: 'warm' });
    expect(p.look.community).toBe('south-asian');
    expect(p.shade).toBeTruthy();
    expect(p.timeline.some(t => /SPF/.test(t.step))).toBe(true);
    expect(p.constraints.join(' ')).toMatch(/outdoor/);
  });
  it('detects occasion keys', () => {
    expect(parseOccasion('Eid dinner').keys).toContain('eid');
  });
  it('still returns a complete plan with no community', async () => {
    const p = await buildPlan({ occasion: 'office interview' });
    expect(p.look.name).toBeTruthy();
    expect(p.timeline.length).toBeGreaterThan(3);
  });
});
