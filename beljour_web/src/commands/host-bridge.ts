/** Explicit host-editor attachment for the five local Pro Commands.
 * The host remains the owner of navigation, photo selection and user consent.
 * This bridge never sends pixels to a server or persists them across sessions.
 * It can be mounted without an embedding model but keeps all guarded edits off.
 * Author: John Khan.
 */
import { CheckedSpot } from './cpu-cleanup.js';
import { LocalPhotoCodec } from './frame-io.js';
import { ProPlan, RenderQuality } from './plan.js';
import { CheckedPose } from './pose-only.js';
import { RegionSupplier, R3HBrowserSession } from './r3h-session.js';
import { IdentityPort, PixelFrame, ProRenderError, RunSummary, checkedFrame } from './runtime.js';
import { OpenWorkbenchPhoto, ProWorkbenchModel, WorkbenchState } from './workbench-model.js';
import { exportPortableProRecipe, importPortableProRecipe } from './portable-recipe.js';
import { exportProShareFragment, importProShareFragment } from './share-fragment.js';
import { MountedWorkbench, mountProWorkbench } from './workbench-view.js';

export interface HostPhotoDescriptor extends OpenWorkbenchPhoto {
  readonly consentToLocalProcessing: boolean;
}

export type HostPhotoEvent =
  | { readonly type: 'photo'; readonly photo: HostPhotoDescriptor }
  | { readonly type: 'clear' }
  | { readonly type: 'reset' };

export interface HostPhotoEvents {
  subscribe(listener: (event: HostPhotoEvent) => void): () => void;
}

export interface HostProBridgeOptions {
  readonly root: HTMLElement;
  readonly events: HostPhotoEvents;
  readonly identity: IdentityPort | null;
  readonly codec?: LocalPhotoCodec;
  readonly onError?: (code: string) => void;
}

export interface HostProBridge {
  readonly model: ProWorkbenchModel;
  readonly mounted: MountedWorkbench;
  readonly active: boolean;
  readonly state: WorkbenchState;
  acceptPhoto(photo: HostPhotoDescriptor): void;
  clearPhoto(): void;
  preview(signal?: AbortSignal): Promise<RunSummary>;
  exportImage(signal?: AbortSignal): Promise<RunSummary>;
  changePlan(plan: ProPlan): void;
  exportRecipe(): Promise<string>;
  importRecipe(recipe: string, confirmWeakenedIdentity?: boolean): Promise<void>;
  exportShareFragment(): Promise<string>;
  importShareFragment(fragment: string, confirmWeakenedIdentity?: boolean): Promise<void>;
  dispose(): void;
}

const INSTALLED = new WeakSet<HTMLElement>();

function validateHostPhoto(photo: HostPhotoDescriptor): void {
  if (photo === null || typeof photo !== 'object') {
    throw new ProRenderError('invalid_host_photo', 'A local photo is required.');
  }
  if (photo.consentToLocalProcessing !== true) {
    throw new ProRenderError('local_processing_consent_required',
      'The host must confirm local processing consent.');
  }
  checkedFrame(photo.pixels);
  if (typeof photo.sourceKey !== 'string' ||
      photo.sourceKey.length < 1 || photo.sourceKey.length > 128 ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(photo.sourceKey)) {
    throw new ProRenderError('invalid_photo_key', 'A safe session-scoped photo key is required.');
  }
  if (photo.regions !== undefined && photo.regions !== null &&
      typeof photo.regions !== 'function') {
    throw new ProRenderError('invalid_host_regions', 'Region supplier must be callable.');
  }
  if (photo.spots !== undefined && (!Array.isArray(photo.spots) || photo.spots.length > 512)) {
    throw new ProRenderError('invalid_host_spots', 'Checked photo hints are not bounded.');
  }
}

function cloneHostPhoto(photo: HostPhotoDescriptor): OpenWorkbenchPhoto {
  validateHostPhoto(photo);
  const snapshot = checkedFrame(photo.pixels);
  const copied: PixelFrame = {
    width: snapshot.width, height: snapshot.height, channels: snapshot.channels,
    pixels: new Uint8Array(snapshot.pixels),
  };
  const supplier = photo.regions;
  const wrapped: RegionSupplier | null = supplier === null || supplier === undefined ? null :
    (image: PixelFrame): ReturnType<RegionSupplier> => supplier(image);
  return {
    pixels: copied, sourceKey: photo.sourceKey, regions: wrapped,
    spots: photo.spots === undefined ? [] : [...photo.spots] as CheckedSpot[],
    pose: photo.pose as CheckedPose | null | undefined,
  };
}

/** Deliberately installed by the owning host, not by scanning the whole DOM. */
export function mountHostProCommands(options: HostProBridgeOptions): HostProBridge {
  if (options === null || typeof options !== 'object' ||
      typeof options.root?.append !== 'function' ||
      typeof options.events?.subscribe !== 'function' ||
      (options.onError !== undefined && typeof options.onError !== 'function')) {
    throw new ProRenderError('invalid_host_bridge', 'A local host and event source are required.');
  }
  if (INSTALLED.has(options.root)) {
    throw new ProRenderError('host_already_mounted', 'The Pro panel is already mounted here.');
  }
  const session = new R3HBrowserSession(options.identity);
  const model = new ProWorkbenchModel(session, options.identity !== null);
  let panel: MountedWorkbench | null = null;
  let unsubscribe: (() => void) | null = null;
  let active = true;
  let generation = 0;
  try {
    panel = mountProWorkbench(options.root, model, options.codec);
    INSTALLED.add(options.root);
    const notify = (code: string): void => {
      try { options.onError?.(code); }
      catch { /* Host error reporting cannot break local photo processing. */ }
    };
    const acceptPhoto = (photo: HostPhotoDescriptor): void => {
      if (!active) throw new ProRenderError('host_unmounted', 'Pro panel is not mounted.');
      generation++;
      // A rejected replacement must never leave another person's photo active.
      model.closePhoto();
      const prepared = cloneHostPhoto(photo);
      model.openPhoto(prepared);
    };
    const clearPhoto = (): void => {
      if (!active) return;
      generation++;
      model.closePhoto();
    };
    unsubscribe = options.events.subscribe((event): void => {
      if (!active) return;
      try {
        if (event.type === 'photo') acceptPhoto(event.photo);
        else if (event.type === 'clear' || event.type === 'reset') clearPhoto();
        else notify('unknown_host_event');
      } catch (error) {
        notify(error instanceof ProRenderError ? error.code : 'host_photo_failed');
      }
    });
    const run = async (quality: RenderQuality, signal?: AbortSignal): Promise<RunSummary> => {
      if (!active) throw new ProRenderError('host_unmounted', 'Pro panel is not mounted.');
      if (signal?.aborted) throw new ProRenderError('host_cancelled', 'Host request was cancelled.');
      const ticket = generation;
      const result = await model.run(quality, signal);
      if (!active || ticket !== generation || signal?.aborted) {
        throw new ProRenderError('host_stale_result', 'A newer photo replaced this edit.');
      }
      return result;
    };
    const changePlan = (plan: ProPlan): void => {
      if (!active || model.state.plan === null) {
        throw new ProRenderError('host_photo_missing', 'Open a photo before changing commands.');
      }
      // Validation and a single history commit are owned by the workbench.
      // Never replace steps sequentially: a late invalid step must not leave
      // a partial recipe or repeated undo entries on the user's photograph.
      model.replacePlan(plan);
    };
    const currentRecipeContext = (): { readonly revision: number; readonly plan: ProPlan } => {
      if (!active || model.state.plan === null) {
        throw new ProRenderError('host_photo_missing', 'Open a photo before editing a recipe.');
      }
      return { revision: model.state.revision, plan: model.state.plan };
    };
    const acceptIfCurrent = (expectedRevision: number, ticket: number): void => {
      if (!active || ticket !== generation || model.state.revision !== expectedRevision) {
        throw new ProRenderError('host_stale_recipe', 'The recipe request was superseded.');
      }
    };
    const exportRecipe = async (): Promise<string> => {
      const before = currentRecipeContext();
      const ticket = generation;
      const recipe = await exportPortableProRecipe(before.plan);
      acceptIfCurrent(before.revision, ticket);
      return recipe;
    };
    const exportShareFragment = async (): Promise<string> => {
      const before = currentRecipeContext();
      const ticket = generation;
      const link = await exportProShareFragment(before.plan);
      acceptIfCurrent(before.revision, ticket);
      return link;
    };
    const importRecipe = async (recipe: string, confirmWeakenedIdentity = false): Promise<void> => {
      const before = currentRecipeContext();
      const ticket = generation;
      const record = await importPortableProRecipe(recipe, { confirmWeakenedIdentity });
      acceptIfCurrent(before.revision, ticket);
      model.replacePlan(record.plan);
    };
    const importShareFragment = async (fragment: string,
      confirmWeakenedIdentity = false): Promise<void> => {
      const before = currentRecipeContext();
      const ticket = generation;
      const record = await importProShareFragment(fragment, { confirmWeakenedIdentity });
      acceptIfCurrent(before.revision, ticket);
      model.replacePlan(record.plan);
    };
    const mountedPanel = panel;
    return {
      model, mounted: mountedPanel,
      get active(): boolean { return active; },
      get state(): WorkbenchState { return model.state; },
      acceptPhoto, clearPhoto,
      preview: async (signal?: AbortSignal): Promise<RunSummary> => run('preview', signal),
      exportImage: async (signal?: AbortSignal): Promise<RunSummary> => run('export', signal),
      changePlan, exportRecipe, importRecipe, exportShareFragment, importShareFragment,
      dispose(): void {
        if (!active) return;
        active = false;
        generation++;
        unsubscribe?.();
        mountedPanel.destroy();
        INSTALLED.delete(options.root);
      },
    };
  } catch (error) {
    active = false;
    unsubscribe?.();
    panel?.destroy();
    INSTALLED.delete(options.root);
    throw error;
  }
}
