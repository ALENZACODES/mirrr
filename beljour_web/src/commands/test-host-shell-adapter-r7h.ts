/** Local editor integration regressions without live images or external services.
 * Author: John Khan.
 */
import {
  ExistingPhotoEditor, CurrentHostPhoto, attachProToExistingEditor,
} from './host-shell-adapter.js';
import {
  HostPhotoDescriptor, HostProBridge, HostProBridgeOptions,
} from './host-bridge.js';
import { ProRenderError, PixelFrame } from './runtime.js';

function check(value: unknown, label: string): void {
  if (!value) throw new Error(`host-shell ${label}`);
}

function frame(value = 60): PixelFrame {
  const pixels = new Uint8Array(12 * 14 * 4);
  for (let i = 0; i < 12 * 14; i++) {
    pixels.set([value, (i * 17) % 256, 82, 255], i * 4);
  }
  return { width: 12, height: 14, channels: 4, pixels };
}

function photo(
  id: string, revision: number, decodeLocal: () => Promise<PixelFrame>, consent = true,
): CurrentHostPhoto {
  return { sessionKey: id, revision, decodeLocal, consentToLocalProcessing: consent };
}

function resolved(value = 60): () => Promise<PixelFrame> {
  return async (): Promise<PixelFrame> => frame(value);
}

class Deferred<T> {
  readonly promise: Promise<T>;
  resolve!: (value: T) => void;
  reject!: (error: Error) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

class FakeEditor implements ExistingPhotoEditor {
  current: CurrentHostPhoto | null = null;
  listeners = new Set<(value: CurrentHostPhoto | null) => void>();
  removed = 0;
  duringSubscription: CurrentHostPhoto | null | undefined = undefined;
  throwOnSubscribe = false;
  currentPhoto(): CurrentHostPhoto | null { return this.current; }
  subscribePhoto(listener: (value: CurrentHostPhoto | null) => void): () => void {
    if (this.throwOnSubscribe) throw new Error('Not available');
    this.listeners.add(listener);
    if (this.duringSubscription !== undefined) {
      listener(this.duringSubscription);
    }
    return (): void => {
      this.removed++;
      this.listeners.delete(listener);
    };
  }
  emit(next: CurrentHostPhoto | null): void {
    this.current = next;
    for (const listener of this.listeners) listener(next);
  }
}

class FakeBridge {
  readonly received: HostPhotoDescriptor[] = [];
  readonly revisions: string[] = [];
  disposed = 0;
  wasCleared = false;
  acceptPhoto(data: HostPhotoDescriptor): void {
    this.received.push(data);
    this.wasCleared = false;
    this.revisions.push(`${data.sourceKey}:${data.pixels.pixels[0]}`);
  }
  clearPhoto(): void {
    this.wasCleared = true;
    this.revisions.push('clear');
  }
  dispose(): void { this.disposed++; }
}

function fakeMount(bridge: FakeBridge): (options: HostProBridgeOptions) => HostProBridge {
  return (options: HostProBridgeOptions): HostProBridge => {
    options.events.subscribe(event => {
      if (event.type === 'photo') bridge.acceptPhoto(event.photo);
      else bridge.clearPhoto();
    });
    return bridge as unknown as HostProBridge;
  };
}

function fakeRoot(): HTMLElement {
  return { append(): void {} } as unknown as HTMLElement;
}

function failure(code: string, fn: () => void): void {
  try { fn(); }
  catch (error) {
    if (error instanceof ProRenderError && error.code === code) return;
    throw error;
  }
  throw new Error(`expected ${code}`);
}

export async function testHostShellAdapterR7H(): Promise<number> {
  let count = 0;
  const editor = new FakeEditor();
  const backend = new FakeBridge();
  const errors: string[] = [];
  let decoded = 0;
  editor.current = photo('first-photo', 1, async (): Promise<PixelFrame> => {
    decoded++;
    return frame(78);
  });
  const mount = attachProToExistingEditor({
    root: fakeRoot(), editor, identity: null, mount: fakeMount(backend),
    onError: code => { errors.push(code); },
  });
  await mount.settle();
  check(mount.active, 'mounted');
  check(backend.received.length === 1, 'initial photo delivered');
  check(backend.received[0].sourceKey === 'first-photo', 'opaque source key preserved');
  check(backend.received[0].pixels.pixels[0] === 78, 'local decode delivered');
  check(decoded === 1, 'local decode exactly once');
  count += 5;

  const raw = frame(95);
  editor.emit(photo('first-photo', 2, async (): Promise<PixelFrame> => raw));
  await mount.settle();
  check(backend.received[1].pixels.pixels[0] === 95, 'replacement revision');
  raw.pixels.fill(0);
  check(backend.received[1].pixels.pixels[0] === 95, 'defensive pixel copy');
  check(backend.revisions.at(-2) === 'clear', 'clear before replacing photo');
  count += 3;

  let deniedDecoded = false;
  editor.emit(photo('next-person', 1, async (): Promise<PixelFrame> => {
    deniedDecoded = true;
    return frame();
  }, false));
  await mount.settle();
  check(!deniedDecoded, 'no pixel access before local consent');
  check(backend.wasCleared, 'prior person not retained');
  check(errors.at(-1) === 'local_processing_consent_required', 'consent error is coded');
  count += 3;

  editor.emit(photo('../invalid', 10, resolved()));
  await mount.settle();
  check(errors.at(-1) === 'invalid_editor_photo', 'untrusted source key refused');
  check(backend.wasCleared, 'unsafe key does not reuse earlier photo');
  count += 2;

  editor.emit(photo('good-photo', 3, resolved(31)));
  await mount.settle();
  check(backend.received.at(-1)?.pixels.pixels[0] === 31, 'host can recover');
  editor.emit(photo('good-photo', 3, resolved(50)));
  await mount.settle();
  check(errors.at(-1) === 'stale_editor_revision', 'same-key stale revision refused');
  check(backend.wasCleared, 'stale edit does not keep image');
  count += 3;

  const older = new Deferred<PixelFrame>();
  editor.emit(photo('delayed', 1, (): Promise<PixelFrame> => older.promise));
  editor.emit(photo('fresh', 2, resolved(202)));
  await mount.settle();
  older.resolve(frame(10));
  await Promise.resolve();
  await Promise.resolve();
  check(backend.received.at(-1)?.sourceKey === 'fresh', 'late decoding cannot replace source');
  check(backend.received.at(-1)?.pixels.pixels[0] === 202, 'new source preserved');
  count += 2;

  const rejected = new Deferred<PixelFrame>();
  editor.emit(photo('bad-decoder', 5, (): Promise<PixelFrame> => rejected.promise));
  rejected.reject(new Error('sensitive file path from host'));
  await mount.settle();
  check(errors.at(-1) === 'local_decode_failed', 'raw decoder exception not surfaced');
  check(backend.wasCleared, 'decoder error clears old source');
  count += 2;

  const invalid = new Deferred<PixelFrame>();
  editor.emit(photo('malformed', 1, (): Promise<PixelFrame> => invalid.promise));
  invalid.resolve({ width: 1, height: 1, channels: 3, pixels: new Uint8Array(0) });
  await mount.settle();
  check(errors.at(-1) === 'invalid_frame', 'bad buffer is refused');
  check(backend.wasCleared, 'bad buffer never reaches panel');
  count += 2;

  editor.emit(null);
  await mount.settle();
  check(backend.wasCleared, 'host clear event cleared panel');
  check(mount.lastFailure === null, 'success clears stale failure');
  count += 2;

  const orphan = new Deferred<PixelFrame>();
  editor.emit(photo('pending', 1, (): Promise<PixelFrame> => orphan.promise));
  const delivered = backend.received.length;
  mount.dispose();
  check(!mount.active, 'disposed');
  check(editor.removed === 1 && editor.listeners.size === 0, 'listener disposed');
  check(backend.disposed === 1, 'inner bridge disposed');
  orphan.resolve(frame(255));
  await Promise.resolve();
  check(backend.received.length === delivered, 'pending decode ignored after teardown');
  mount.dispose();
  check(backend.disposed === 1, 'dispose idempotent');
  count += 5;

  // A photo emitted during subscription is newer than the pre-subscription snapshot.
  const eager = new FakeEditor();
  eager.current = photo('stale-snapshot', 1, resolved(80));
  eager.duringSubscription = photo('current-event', 2, resolved(123));
  const eagerBackend = new FakeBridge();
  const eagerMount = attachProToExistingEditor({
    root: fakeRoot(), editor: eager, identity: null, mount: fakeMount(eagerBackend),
  });
  await eagerMount.settle();
  check(eagerBackend.received.length === 1, 'single eager photo');
  check(eagerBackend.received[0].sourceKey === 'current-event', 'event beats stale snapshot');
  eagerMount.dispose();
  count += 2;

  const missing = new FakeEditor();
  missing.throwOnSubscribe = true;
  const cleaned = new FakeBridge();
  failure('invalid_editor_stream', () => attachProToExistingEditor({
    root: fakeRoot(), editor: null as unknown as ExistingPhotoEditor,
    identity: null, mount: fakeMount(cleaned),
  }));
  count++;
  try {
    attachProToExistingEditor({
      root: fakeRoot(), editor: missing, identity: null, mount: fakeMount(cleaned),
    });
    throw new Error('subscription failure was not reported');
  } catch (error) {
    check(error instanceof Error && error.message === 'Not available', 'propagated failed install');
  }
  check(cleaned.disposed === 1, 'failed subscription releases panel');
  count++;

  const reportingEditor = new FakeEditor();
  const reportingBackend = new FakeBridge();
  const reporting = attachProToExistingEditor({
    root: fakeRoot(), editor: reportingEditor, identity: null,
    mount: fakeMount(reportingBackend),
    onError(): void { throw new Error('host logger failed'); },
  });
  reportingEditor.emit(photo('denied', 1, resolved(), false));
  await reporting.settle();
  check(reporting.lastFailure === 'local_processing_consent_required', 'logger failure is isolated');
  reporting.dispose();
  count++;

  return count;
}
