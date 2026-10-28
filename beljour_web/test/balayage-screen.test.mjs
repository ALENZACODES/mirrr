// W28 acceptance: a real painted map drives first-session pixels, with the
// estimate and colour-history limits visible. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { balayageScreen } from '../dist/js/screens/balayage.js';
import { HairPainter } from '../dist/js/screens/hair-painter.js';

test('balayage refuses an unpainted mask and displays honest session planning', () => {
  const dom = installDOM(), editor = new Editor('crown', new ShellGpuRenderer(null));
  try {
    const section = balayageScreen(editor, () => {});
    assert.equal(buttonNamed(section, 'Preview first session').disabled, true);
    assert.match(section.textContent, /ASSUMED/);
    assert.match(section.textContent, /Local simulation of session 1/);
    assert.match(section.textContent, /not a colour formula/);
  } finally { editor.dispose(); dom.restore(); }
});

test('painted placement creates changed pixels only inside the selected hair', async () => {
  const dom = installDOM(), editor = new Editor('crown', new ShellGpuRenderer(null));
  try {
    const source = editor.source;
    const painter = new HairPainter(source.image.width, source.image.height, source.hair);
    painter.begin(); painter.line(80, 70, 20, 'placement'); painter.line(100, 145, 20, 'placement'); painter.end();
    const masks = painter.masks(); editor.setHair(masks.hair, masks.placement);
    const before = editor.source.image.data.slice();
    const section = balayageScreen(editor, () => {});
    await buttonNamed(section, 'Preview first session').click();
    const preview = editor.rendered();
    assert.notDeepEqual(preview.image.data, before);
    assert.equal(preview.metrics[0].outside_unchanged, true);
    assert.equal(preview.metrics[0].assumed, true);
    assert.ok(preview.metrics[0].session_1_level <= preview.metrics[0].target_level);
    assert.deepEqual(editor.source.image.data, before);
  } finally { editor.dispose(); dom.restore(); }
});

test('placement cannot be painted outside the hair mask', () => {
  const painter = new HairPainter(32, 32);
  painter.begin(); painter.dab(20, 20, 5, 'placement'); painter.end();
  assert.equal(painter.paintedPixels, 0);
  painter.begin(); painter.dab(10, 10, 4, 'hair'); painter.end();
  painter.begin(); painter.dab(10, 10, 12, 'placement'); painter.end();
  for (let i = 0; i < painter.hair.length; i++) assert.ok(painter.placement[i] <= painter.hair[i]);
});
