/** Native local-panel recipe actions tested without browser persistence.
 * Synthetic input and a captured URL factory protect the file boundary.
 * Author: John Khan.
 */
import { levelFromTenths } from './levels.js';
import { createProPlan, userIdentityOverride } from './plan.js';
import { exportPortableProRecipe } from './portable-recipe.js';
import { R3HBrowserSession } from './r3h-session.js';
import { IdentityOutcome, IdentityPort, PixelFrame } from './runtime.js';
import { ProWorkbenchModel } from './workbench-model.js';
import { mountProWorkbench } from './workbench-view.js';
import { LocalPhotoCodec } from './frame-io.js';

function check(value: unknown, reason: string): void {
  if (!value) throw new Error(`recipe panel: ${reason}`);
}

class NativeNode {
  children: NativeNode[] = [];
  attributes = new Map<string, string>();
  listeners = new Map<string, Array<() => void>>();
  textContent = '';
  className = '';
  type = '';
  accept = '';
  disabled = false;
  value = '';
  checked = false;
  width = 0;
  height = 0;
  files: FileList | null = null;

  constructor(readonly ownerDocument: NativeDocument, readonly tag: string) {}
  append(...nodes: NativeNode[]): void { this.children.push(...nodes); }
  replaceChildren(...nodes: NativeNode[]): void { this.children = [...nodes]; }
  remove(): void { this.children.length = 0; }
  setAttribute(key: string, value: string): void { this.attributes.set(key, value); }
  addEventListener(type: string, callback: () => void): void {
    const group = this.listeners.get(type) ?? [];
    group.push(callback);
    this.listeners.set(type, group);
  }
  fire(type: string): void {
    for (const callback of this.listeners.get(type) ?? []) callback();
  }
  click(): void { this.fire('click'); }
  getContext(): { putImageData: () => void } {
    return { putImageData: (): void => { this.ownerDocument.paint++; } };
  }
}

class NativeDocument {
  paint = 0;
  downloaded: Array<{ name: string; href: string }> = [];
  createElement(tag: string): NativeNode {
    const node = new NativeNode(this, tag);
    if (tag === 'a') {
      node.click = (): void => {
        this.downloaded.push({ name: node.attributes.get('download') ??
          (node as unknown as { download: string }).download,
        href: (node as unknown as { href: string }).href });
      };
    }
    return node;
  }
}

class HarmlessGuard implements IdentityPort {
  readonly modelEvidenceKey = 'synthetic-panel-only';
  async enforce(_original: PixelFrame, edited: PixelFrame): Promise<IdentityOutcome> {
    return { frame: edited, identityMatch: 100, status: 'kept', syntheticOnly: true };
  }
}

function portrait(): PixelFrame {
  const pixels = new Uint8Array(16 * 16 * 4);
  for (let index = 0; index < 256; index++) {
    pixels[index * 4] = 88;
    pixels[index * 4 + 1] = 98;
    pixels[index * 4 + 2] = 125;
    pixels[index * 4 + 3] = 255;
  }
  return { width: 16, height: 16, channels: 4, pixels };
}

function locate(root: NativeNode, predicate: (node: NativeNode) => boolean): NativeNode | null {
  if (predicate(root)) return root;
  for (const child of root.children) {
    const found = locate(child, predicate);
    if (found !== null) return found;
  }
  return null;
}

async function settled(): Promise<void> {
  for (let index = 0; index < 4; index++) {
    await new Promise<void>(resolve => { setTimeout(resolve, 0); });
  }
}

export async function testRecipePanelR6H(): Promise<number> {
  let count = 0;
  const documentBefore = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const imageDataBefore = Object.getOwnPropertyDescriptor(globalThis, 'ImageData');
  const createBefore = URL.createObjectURL;
  const revokeBefore = URL.revokeObjectURL;
  const doc = new NativeDocument();
  const allocations: string[] = [];
  const revocations: string[] = [];
  Object.defineProperty(globalThis, 'document', { configurable: true, value: doc });
  Object.defineProperty(globalThis, 'ImageData', {
    configurable: true,
    value: class DummyImageData {
      constructor(readonly pixels: Uint8ClampedArray, readonly width: number,
        readonly height: number) {}
    },
  });
  URL.createObjectURL = (_blob: Blob): string => {
    const id = `blob:receipt-${allocations.length + 1}`;
    allocations.push(id);
    return id;
  };
  URL.revokeObjectURL = (value: string): void => { revocations.push(value); };
  try {
    const model = new ProWorkbenchModel(new R3HBrowserSession(new HarmlessGuard()), true);
    const root = doc.createElement('div');
    const codec: LocalPhotoCodec = {
      decode: async () => portrait(),
      encodePng: async () => new Blob([new Uint8Array([1])], { type: 'image/png' }),
    };
    const view = mountProWorkbench(root as unknown as HTMLElement, model, codec);
    const recipeInput = locate(root, node => node.attributes.get('aria-label') ===
      'Load a local settings-only Pro recipe');
    check(recipeInput !== null, 'recipe import input installed');
    check(recipeInput?.accept === '.json,application/json', 'JSON only accepted');
    count += 2;
    model.openPhoto({ pixels: portrait(), sourceKey: 'test-panel' });
    const save = locate(root, node => node.textContent === 'Save command recipe');
    check(save !== null && !save.disabled, 'recipe export control enabled');
    save?.fire('click');
    await settled();
    check(allocations.length === 1, 'export creates one URL');
    check(revocations.length === 1, 'export revokes URL');
    check(doc.downloaded.length === 1, 'one user download');
    check(doc.downloaded[0].name === 'beljour-pro-recipe.json', 'safe filename');
    count += 5;
    const plan = createProPlan([
      { index: 0, name: 'identitylock', level: levelFromTenths(10), scale: 2 },
      { index: 1, name: 'cleanup', level: levelFromTenths(28), scale: 2 },
      { index: 2, name: 'studioquality', level: levelFromTenths(31), scale: 2 },
    ]);
    const content = await exportPortableProRecipe(plan);
    const file = {
      size: new TextEncoder().encode(content).length,
      type: 'application/json',
      text: async () => content,
    };
    if (recipeInput !== null) {
      recipeInput.files = [file] as unknown as FileList;
      recipeInput.fire('change');
    }
    await settled();
    check(model.state.plan?.steps.length === 3, 'import replaces full chain');
    check(model.state.identityEnabled, 'identity stays enabled');
    check(model.state.canUndo, 'import adds one undoable action');
    check(model.undoPlan(), 'import undone');
    check(model.state.plan?.steps.length === 1, 'undo restores original recipe');
    count += 5;
    const weak = createProPlan(plan.steps, userIdentityOverride(false));
    const unsafeText = await exportPortableProRecipe(weak);
    if (recipeInput !== null) {
      recipeInput.files = [{
        size: new TextEncoder().encode(unsafeText).length,
        type: 'application/json', text: async () => unsafeText,
      }] as unknown as FileList;
      recipeInput.fire('change');
    }
    await settled();
    const alert = locate(root, node => node.attributes.get('role') === 'alert');
    check(alert?.textContent.includes('new local user choice'), 'weakening refusal explained');
    check(model.state.identityEnabled, 'weak imported identity not activated');
    check(model.state.plan?.steps.length === 1, 'failed import leaves chain untouched');
    count += 3;
    check(doc.paint > 0, 'image preview uses canvas');
    count++;
    view.destroy();
    check(!model.state.photoOpen, 'destroy cleans source frame');
    count++;
  } finally {
    URL.createObjectURL = createBefore;
    URL.revokeObjectURL = revokeBefore;
    if (documentBefore === undefined) delete (globalThis as { document?: unknown }).document;
    else Object.defineProperty(globalThis, 'document', documentBefore);
    if (imageDataBefore === undefined) delete (globalThis as { ImageData?: unknown }).ImageData;
    else Object.defineProperty(globalThis, 'ImageData', imageDataBefore);
  }
  return count;
}
