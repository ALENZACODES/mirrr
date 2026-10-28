// Settings recovery runs entirely on synthetic images and in-memory storage.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RecipeRecovery, recoveryDraft, RECOVERY_KEY, RECOVERY_TTL_MS, RECOVERY_MAX_BYTES } from '../dist/js/save/recovery.js';
import { editorDraft, restoreDraft, mountSessionTools } from '../dist/js/ui/session-tools.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { validateStep } from '../dist/js/save/validate.js';

function memory() {
  const values = new Map(); let writes = 0;
  return { values, get writes() { return writes; }, getItem: key => values.get(key) ?? null,
    setItem(key, value) { values.set(key, value); writes++; }, removeItem(key) { values.delete(key); } };
}
function draft() { return recoveryDraft([{ tool: 'lighting', strength: 40, settings: { mode: 'office' }, provider: 'local' }], [{ enabled: false, opacity: .4 }]); }
function editor() { return new Editor('portrait', new ShellGpuRenderer(null)); }

test('settings recovery round-trips layer enable and opacity without mutable aliases', () => {
  const storage = memory(), recovery = new RecipeRecovery(storage, () => 1000), input = draft();
  assert.equal(recovery.save(input), 'saved'); input.layers[0].opacity = 1;
  const read = recovery.read(); assert.equal(read.status, 'ready'); assert.equal(read.draft.layers[0].opacity, .4);
  read.draft.recipe.versions[0].steps[0].settings.mode = 'changed';
  assert.equal(recovery.read().draft.recipe.versions[0].steps[0].settings.mode, 'office');
  assert.equal(recovery.save(draft()), 'unchanged'); assert.equal(storage.writes, 1);
});
test('corrupt, old, future and unknown envelope shapes are removed', () => {
  const storage = memory(), recovery = new RecipeRecovery(storage, () => 100);
  for (const text of ['{', 'null', '[]', '{"format":"beljour-recovery/1"}', '{"format":"beljour-recovery/999"}']) {
    storage.setItem(RECOVERY_KEY, text); assert.equal(recovery.read().status, 'invalid'); assert.equal(storage.getItem(RECOVERY_KEY), null);
  }
  recovery.save(draft()); const raw = JSON.parse(storage.getItem(RECOVERY_KEY)); raw.photo = 'secret';
  storage.setItem(RECOVERY_KEY, JSON.stringify(raw)); assert.equal(recovery.read().status, 'invalid');
});
test('recovery expires after twelve hours and rejects a timestamp from the future', () => {
  const storage = memory(); let now = 1000; const recovery = new RecipeRecovery(storage, () => now);
  recovery.save(draft()); now += RECOVERY_TTL_MS; assert.equal(recovery.read().status, 'ready');
  now++; assert.equal(recovery.read().status, 'expired'); assert.equal(storage.getItem(RECOVERY_KEY), null);
  recovery.save(draft()); now -= 60_001; assert.equal(recovery.read().status, 'expired');
});
test('storage denial, eviction and quota errors do not throw into the editor', () => {
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('denied'); } };
  const recovery = new RecipeRecovery(denied); assert.equal(recovery.save(draft()), 'unavailable');
  assert.equal(recovery.read().status, 'unavailable'); assert.equal(recovery.clear(), false);
  assert.equal(new RecipeRecovery(null).read().status, 'unavailable');
  const storage = memory(), enabled = new RecipeRecovery(storage); enabled.save(draft()); storage.values.clear();
  assert.equal(enabled.read().status, 'empty');
  assert.equal(enabled.save(draft()), 'saved', 'same settings are persisted again after eviction');
});
test('recovery rejects biometrics, bytes, links and provider results at the settings boundary', () => {
  const storage = memory(), recovery = new RecipeRecovery(storage);
  for (const settings of [{ photo: 'a' }, { mesh: [1, 2] }, { pixels: new Uint8Array(4) }, { mode: 'https://secret.example/photo' }, { mode: 'data:image/png;secret' }]) {
    const input = draft(); input.recipe.versions[0].steps[0].settings = settings;
    assert.equal(recovery.save(input), 'invalid');
  }
  const remote = draft(); remote.recipe.versions[0].steps[0] = { tool: 'makeup', provider: 'youcam', strength: 20, settings: {} };
  assert.equal(recovery.save(remote), 'invalid'); assert.equal(storage.values.size, 0);
});
test('oversized and mismatched layer data fail closed', () => {
  const storage = memory(), recovery = new RecipeRecovery(storage);
  storage.setItem(RECOVERY_KEY, ' '.repeat(RECOVERY_MAX_BYTES + 1)); assert.equal(recovery.read().status, 'invalid');
  for (const layers of [[], [{ enabled: true, opacity: NaN }], [{ enabled: true, opacity: 2 }], [{ enabled: true, opacity: .5, image: 'secret' }]]) {
    assert.equal(recovery.save({ ...draft(), layers }), 'invalid');
  }
});
test('a recovered recipe reproduces actual pixels and keeps the original unchanged', () => {
  const a = editor(), b = editor();
  try {
    const original = a.source.image.data.slice();
    const layer = a.add('lighting', { mode: 'office' }, 55); a.update(layer.id, { opacity: .3, enabled: true });
    const captured = editorDraft(a); const serialized = JSON.stringify(captured);
    assert.doesNotMatch(serialized, /landmark|"image"|"face"|sourceId|"data"|"width"|"height"/i);
    assert.deepEqual(restoreDraft(b, captured), { applied: 1, reasons: [] });
    assert.deepEqual(b.rendered().image.data, a.rendered().image.data);
    assert.deepEqual(b.source.image.data, original);
  } finally { a.dispose(); b.dispose(); }
});
test('recovery never borrows a sample face for an uploaded photo or mixes current edits', () => {
  const a = editor(), b = editor();
  try {
    a.add('beard'); const captured = editorDraft(a);
    b.load({ ...b.source, kind: 'uploaded', face: undefined }, 'beard');
    const missing = restoreDraft(b, captured); assert.equal(missing.applied, 0); assert.match(missing.reasons.join(' '), /face|record/i);
    b.add('lighting'); assert.match(restoreDraft(b, draft()).reasons[0], /Reset/); assert.equal(b.document.layers.length, 1);
  } finally { a.dispose(); b.dispose(); }
});
test('editor subscriptions notify changes and stop after unsubscribe and disposal', () => {
  const a = editor(); let seen = 0; const stop = a.subscribe(() => seen++);
  a.add('lighting'); a.undo(); a.redo(); a.selectStudio('filters'); assert.equal(seen, 4);
  stop(); a.resetLayers(); assert.equal(seen, 4);
  a.subscribe(() => seen++); a.dispose(); a.resetLayers(); assert.equal(seen, 4);
});
test('recipe validator refuses inherited object property names as tool IDs', () => {
  for (const tool of ['constructor', 'toString', '__proto__']) assert.throws(() => validateStep({ tool, strength: 10, settings: {} }, 'step'), /not a tool/);
});

test('source changes expose the previous settings and resetting restored edits clears recovery', async () => {
  const dom = installDOM(), a = editor(), storage = memory(), recovery = new RecipeRecovery(storage);
  const host = new Element('div'); host.className = 'shell-nav-footer'; dom.root.append(host);
  let stop = () => {};
  try {
    stop = mountSessionTools(a, () => {}, recovery, dom.document);
    a.add('lighting', { mode: 'office' }); assert.equal(recovery.read().status, 'ready');
    a.load({ ...a.source, id: 'uploaded-new', kind: 'uploaded', face: undefined });
    const restore = buttonNamed(host, 'Restore settings on this photo'); assert.equal(restore.disabled, false);
    assert.equal(a.document.layers.length, 0, 'choosing a photo never auto-applies a recipe');
    await restore.click(); assert.equal(a.document.layers.length, 1);
    a.resetLayers(); assert.equal(recovery.read().status, 'empty', 'Reset also discards a restored draft');
    stop(); stop(); assert.equal(host.children.length, 0);
  } finally { stop(); a.dispose(); dom.restore(); }
});

test('recoverable settings stay visible but cannot apply to a drawn sample without a photo choice', async () => {
  const dom = installDOM(), a = editor(), recovery = new RecipeRecovery(memory()); recovery.save(draft());
  const host = new Element('div'); host.className = 'shell-nav-footer'; dom.root.append(host);
  const stop = mountSessionTools(a, () => {}, recovery, dom.document);
  try {
    const restore = buttonNamed(host, 'Restore settings on this photo'); assert.equal(restore.disabled, true);
    await restore.click(); assert.equal(a.document.layers.length, 0);
    await buttonNamed(host, 'Discard recovered settings').click(); assert.equal(recovery.read().status, 'empty');
  } finally { stop(); a.dispose(); dom.restore(); }
});
