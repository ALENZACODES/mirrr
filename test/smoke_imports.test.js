import { describe, it, expect } from '@jest/globals';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../src');
// server.js starts listening on import; it is syntax-checked separately.
function walk(dir, prefix = '') {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full, `${prefix}${name}/`) : [`${prefix}${name}`];
  });
}
const files = walk(SRC).filter(f => f.endsWith('.js') && f !== 'server.js');

describe('every src module imports cleanly', () => {
  it.each(files)('%s', async (f) => {
    await expect(import(pathToFileURL(join(SRC, f)).href)).resolves.toBeDefined();
  });
});
