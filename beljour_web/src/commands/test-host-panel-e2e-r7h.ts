/** Full local editor -> Pro panel -> five-command preview/export smoke.
 * Uses constructed pixels and a test-only identity port; no live model or service.
 * Author: John Khan.
 */
import {
  ExistingPhotoEditor, CurrentHostPhoto, attachProToExistingEditor,
} from './host-shell-adapter.js';
import { levelFromTenths } from './levels.js';
import { createProPlan } from './plan.js';
import { IdentityOutcome, IdentityPort, PixelFrame, ProRenderError } from './runtime.js';

function check(value: unknown, label: string): void {
  if (!value) throw new Error(`host-panel end to end ${label}`);
}

class FixtureNode {
  readonly children: FixtureNode[] = [];
  readonly attributes = new Map<string, string>();
  readonly handlers = new Map<string, Array<() => void>>();
  className = '';
  textContent = '';
  value = '';
  disabled = false;
  checked = false;
  type = '';
  accept = '';
  width = 0;
  height = 0;
  files: FileList | null = null;
  removed = false;

  constructor(readonly ownerDocument: FixtureDocument, readonly tagName: string) {}
  append(...nodes: FixtureNode[]): void { this.children.push(...nodes); }
  replaceChildren(...nodes: FixtureNode[]): void {
    this.children.splice(0, this.children.length, ...nodes);
  }
  remove(): void { this.removed = true; }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  addEventListener(name: string, handler: () => void): void {
    const handlers = this.handlers.get(name) ?? [];
    handlers.push(handler);
    this.handlers.set(name, handlers);
  }
  click(): void { for (const action of this.handlers.get('click') ?? []) action(); }
  getContext(): { putImageData: () => void } {
    return { putImageData: (): void => { this.ownerDocument.draws++; } };
  }
  descendants(tagName: string): FixtureNode[] {
    const local = this.tagName === tagName ? [this] : [];
    return [...local, ...this.children.flatMap(child => child.descendants(tagName))];
  }
}

class FixtureDocument {
  draws = 0;
  createElement(tag: string): FixtureNode { return new FixtureNode(this, tag.toUpperCase()); }
}

class FixturePhotoEditor implements ExistingPhotoEditor {
  private readonly handlers = new Set<(photo: CurrentHostPhoto | null) => void>();
  photo: CurrentHostPhoto | null = null;
  removed = 0;
  currentPhoto(): CurrentHostPhoto | null { return this.photo; }
  subscribePhoto(handler: (photo: CurrentHostPhoto | null) => void): () => void {
    this.handlers.add(handler);
    return (): void => {
      this.handlers.delete(handler);
      this.removed++;
    };
  }
  select(photo: CurrentHostPhoto | null): void {
    this.photo = photo;
    for (const handler of this.handlers) handler(photo);
  }
  get listeners(): number { return this.handlers.size; }
}

class SyntheticIdentity implements IdentityPort {
  readonly modelEvidenceKey = 'synthetic-contract-only';
  checks = 0;
  async enforce(_original: PixelFrame, edited: PixelFrame): Promise<IdentityOutcome> {
    this.checks++;
    return { frame: edited, identityMatch: 100, status: 'kept', syntheticOnly: true };
  }
}

function testImage(value: number): PixelFrame {
  const pixels = new Uint8Array(16 * 16 * 4);
  for (let index = 0; index < 16 * 16; index++) {
    pixels.set([value, (index * 5) % 256, 113, 255], index * 4);
  }
  return { width: 16, height: 16, channels: 4, pixels };
}

function selected(value = 70, revision = 1): CurrentHostPhoto {
  return {
    sessionKey: 'checked-host-portrait',
    revision,
    consentToLocalProcessing: true,
    decodeLocal: async (): Promise<PixelFrame> => testImage(value),
  };
}

export async function testHostPanelE2ER7H(): Promise<number> {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'ImageData');
  Object.defineProperty(globalThis, 'ImageData', {
    configurable: true,
    value: class ExampleImageData {
      constructor(readonly data: Uint8ClampedArray, readonly width: number,
        readonly height: number) {}
    },
  });
  let count = 0;
  try {
    const doc = new FixtureDocument();
    const root = doc.createElement('main');
    const editor = new FixturePhotoEditor();
    const guard = new SyntheticIdentity();
    const errors: string[] = [];
    const mounted = attachProToExistingEditor({
      root: root as unknown as HTMLElement, editor, identity: guard,
      onError: code => { errors.push(code); },
    });
    check(root.descendants('SECTION').length === 1, 'workbench mounted in host root');
    check(root.descendants('CANVAS').length === 1, 'local preview canvas mounted');
    check(editor.listeners === 1, 'host owns one photo subscription');
    check(!mounted.bridge.state.photoOpen, 'starts without an inferred photo');
    count += 4;

    editor.select(selected());
    await mounted.settle();
    check(mounted.bridge.state.photoOpen, 'host photo opened');
    check(mounted.bridge.state.identityEnabled, 'identity lock defaults on');
    check(doc.draws > 0, 'host frame painted without network');
    count += 3;

    const plan = createProPlan([
      'identitylock', 'cleanup', 'studioquality', 'poseonly', 'upscale',
    ].map((name, index) => ({
      name: name as 'identitylock' | 'cleanup' | 'studioquality' | 'poseonly' | 'upscale',
      index, level: levelFromTenths(10), scale: 2 as const,
    })));
    mounted.bridge.changePlan(plan);
    check(mounted.bridge.state.activeCommandCount === 5, 'five-step chain accepted');
    check(mounted.bridge.state.canUndo, 'chain is one undoable action');
    count += 2;

    const preview = await mounted.bridge.preview();
    const rendered = await mounted.bridge.exportImage();
    check(preview.steps.length === 5 && rendered.steps.length === 5,
      'all five commands ran twice');
    check(guard.checks === 10, 'every step through the identity guard');
    check(preview.originalUnchanged && rendered.originalUnchanged,
      'host source immutable');
    check(rendered.image.width === 32 && rendered.image.height === 32,
      'local upscale changed dimensions');
    check(rendered.image.channels === 4, 'RGBA preserved');
    count += 5;

    const recipe = await mounted.bridge.exportRecipe();
    check(recipe.includes('beljour-pro-recipe/1'), 'settings-only recipe can export');
    check(!recipe.includes('checked-host-portrait') && !recipe.includes('pixels'),
      'source identifiers and pixels absent from recipe');
    count += 2;

    editor.select({ ...selected(80, 2), consentToLocalProcessing: false });
    await mounted.settle();
    check(errors.includes('local_processing_consent_required'), 'host consent denied');
    check(!mounted.bridge.state.photoOpen, 'old photo cleared on refusal');
    count += 2;

    editor.select(selected(95, 3));
    await mounted.settle();
    check(mounted.bridge.state.photoOpen, 'later permitted photo loads');
    check(mounted.bridge.state.activeCommandCount === 1, 'new photo resets old recipe');
    editor.select(null);
    await mounted.settle();
    check(!mounted.bridge.state.photoOpen, 'host reset deletes local photo');
    count += 3;

    mounted.dispose();
    check(editor.listeners === 0 && editor.removed === 1, 'host observer released');
    check(root.descendants('SECTION')[0]?.removed, 'panel disposed');
    mounted.dispose();
    check(editor.removed === 1, 'disposal is idempotent');
    count += 3;

    if (!mounted.bridge.active) {
      try { await mounted.bridge.preview(); }
      catch (error) {
        check(error instanceof ProRenderError && error.code === 'host_unmounted',
          'disposed panel cannot render');
        count++;
      }
    }
  } finally {
    if (previous === undefined) delete (globalThis as { ImageData?: unknown }).ImageData;
    else Object.defineProperty(globalThis, 'ImageData', previous);
  }
  return count;
}
