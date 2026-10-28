/** Small native-DOM acceptance double for the real five-command panel.
 * This does not replace a mobile-browser accessibility qualification.
 * Author: John Khan.
 */
import { mountProWorkbench } from './workbench-view.js';
import { ProWorkbenchModel } from './workbench-model.js';
import { R3HBrowserSession } from './r3h-session.js';
import { IdentityPort, IdentityOutcome, PixelFrame } from './runtime.js';

function check(condition: unknown, label: string): void {
  if (!condition) throw new Error(`workbench DOM ${label}`);
}

type Handler = () => void;

class FakeNode {
  readonly events = new Map<string, Handler[]>();
  readonly children: FakeNode[] = [];
  readonly attributes = new Map<string, string>();
  className = '';
  textContent = '';
  value = '';
  type = '';
  accept = '';
  href = '';
  download = '';
  disabled = false;
  checked = false;
  width = 0;
  height = 0;
  removed = false;
  files: FileList | null = null;

  constructor(readonly ownerDocument: FakeDocument, readonly tagName: string) {}

  append(...items: FakeNode[]): void {
    for (const item of items) this.children.push(item);
  }

  remove(): void {
    this.removed = true;
  }

  replaceChildren(...items: FakeNode[]): void {
    this.children.splice(0, this.children.length, ...items);
  }

  addEventListener(name: string, listener: Handler): void {
    const existing = this.events.get(name) ?? [];
    existing.push(listener);
    this.events.set(name, existing);
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  trigger(name: string): void {
    if (this.disabled) return;
    for (const listener of this.events.get(name) ?? []) listener();
  }

  click(): void {
    this.trigger('click');
  }

  getContext(): { putImageData: () => void } {
    return { putImageData: (): void => { this.ownerDocument.drawCount++; } };
  }

  findTag(name: string): FakeNode[] {
    return [...(this.tagName === name ? [this] : []),
      ...this.children.flatMap(item => item.findTag(name))];
  }
}

class FakeDocument {
  drawCount = 0;
  createElement(name: string): FakeNode {
    return new FakeNode(this, name.toUpperCase());
  }
}

class SyntheticGuard implements IdentityPort {
  readonly modelEvidenceKey = 'test-only';
  async enforce(_original: PixelFrame, edited: PixelFrame): Promise<IdentityOutcome> {
    return { frame: edited, identityMatch: 98, status: 'kept', syntheticOnly: true };
  }
}

function photo(): PixelFrame {
  const pixels = new Uint8Array(32 * 32 * 4);
  for (let pixel = 0; pixel < 32 * 32; pixel++) {
    const offset = pixel * 4;
    pixels.set([pixel % 255, pixel % 127, 78, 255], offset);
  }
  return { width: 32, height: 32, channels: 4, pixels };
}

function button(root: FakeNode, caption: string): FakeNode {
  const result = root.findTag('BUTTON').find(item => item.textContent === caption);
  if (result === undefined) throw new Error(`Missing button ${caption}`);
  return result;
}

export async function testWorkbenchViewR4H(): Promise<number> {
  let count = 0;
  const originalImageData = Object.getOwnPropertyDescriptor(globalThis, 'ImageData');
  Object.defineProperty(globalThis, 'ImageData', {
    configurable: true,
    value: class SyntheticImageData {
      constructor(readonly rgba: Uint8ClampedArray, readonly width: number,
        readonly height: number) {}
    },
  });
  const doc = new FakeDocument();
  const root = doc.createElement('div');
  const model = new ProWorkbenchModel(new R3HBrowserSession(new SyntheticGuard()), true);
  const mounted = mountProWorkbench(root as unknown as HTMLElement, model);
  check(root.findTag('SECTION').length === 1, 'panel mounted');
  check(root.findTag('STYLE').length === 1, 'scoped styling exists');
  check(root.findTag('INPUT').some(input => input.type === 'file'), 'local photo input');
  check(root.findTag('P').some(node => node.getAttribute('role') === 'status'), 'live status');
  check(root.findTag('P').some(node => node.getAttribute('role') === 'alert'), 'alert accessible');
  count += 5;
  check(root.findTag('BUTTON').length === 0, 'no dead photo controls');
  count++;
  model.openPhoto({ pixels: photo(), sourceKey: 'drawn-original' });
  check(button(root, 'Preview').disabled === false, 'preview ready');
  check(button(root, 'Undo settings').disabled, 'undo starts disabled');
  check(root.findTag('INPUT').some(input => input.type === 'checkbox' && input.checked),
    'identity defaults on');
  check(root.findTag('INPUT').some(input => input.type === 'range' &&
    input.getAttribute('aria-label') === 'Level for Cleanup'),
    'labelled decimal strength');
  count += 4;
  button(root, 'Add command').click();
  check(model.state.activeCommandCount === 2, 'add works');
  check(!button(root, 'Undo settings').disabled, 'undo enabled');
  count += 2;
  const ranges = root.findTag('INPUT').filter(input => input.type === 'range');
  check(ranges.length === 2 && ranges[0].value === '3.0', 'decimal input initial state');
  count++;
  const firstSelect = root.findTag('SELECT').find(select =>
    select.getAttribute('aria-label') === 'Command for step 1');
  check(firstSelect !== undefined, 'command selector exists');
  if (firstSelect !== undefined) {
    firstSelect.value = 'upscale';
    firstSelect.trigger('change');
  }
  check(model.state.plan?.steps[0]?.name === 'upscale', 'selector wired to plan');
  count += 2;
  button(root, 'Undo settings').click();
  check(model.state.plan?.steps[0]?.name === 'cleanup', 'undo is functional');
  count++;
  const checkbox = root.findTag('INPUT').find(input => input.type === 'checkbox');
  check(checkbox !== undefined, 'identity toggle present');
  if (checkbox !== undefined) {
    checkbox.checked = false;
    checkbox.trigger('change');
  }
  check(model.state.plan?.identity.explicit_user_override === true &&
    !model.state.identityEnabled, 'deliberate opt-out recorded');
  count++;
  button(root, 'Clear photo').click();
  check(!model.state.photoOpen, 'clear local source');
  check(root.findTag('BUTTON').length === 0, 'controls removed on clear');
  check(doc.drawCount > 0, 'photo painted locally in a bounded preview');
  count += 3;
  mounted.destroy();
  check(root.findTag('SECTION')[0]?.removed, 'explicit teardown');
  count++;
  if (originalImageData === undefined) delete (globalThis as { ImageData?: unknown }).ImageData;
  else Object.defineProperty(globalThis, 'ImageData', originalImageData);
  return count;
}
