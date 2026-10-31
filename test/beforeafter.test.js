// Jest: the Before & After manifest loader and step builder (pure module).
import { loadManifest, LOOKS, choiceAfter } from '../public/beforeafter-core.js';

describe('Before & After core', () => {
  test('empty or missing manifest keeps the gallery hidden', () => {
    expect(loadManifest(undefined).enabled).toBe(false);
    expect(loadManifest({ enabled: true, models: [] }).enabled).toBe(false);
  });
  test('the finished look includes every layer from its steps', () => {
    for (const look of LOOKS) {
      const fin = choiceAfter(look, look.steps.length - 1);
      look.steps.forEach(s => Object.keys(s.adds).forEach(k => expect(fin).toHaveProperty(k)));
    }
  });
});
