/** Progressive enhancement for the owned local Pro Studio controls.
 * The fixture recorder remains independent and unchanged.
 */
import { cropMaskMapping, defaultCurves, defaultRecipe, drawSplitView,
  exportPhotoPro, EXPORT_PRESETS, makeCropGeometry, planSplitView, previewGeometry, previewPhoto,
  ProInputError, RecipeHistory, threePointCurve,
  type Aspect, type Channel, type LocalMask, type MaskPoint, type PixelSource,
  type PresetName, type ProRecipe } from "./index.js";

const MAX_FILE_BYTES = 40 * 1024 * 1024;
const CHANNELS: readonly Channel[] = ["master", "red", "green", "blue"];

function control<T extends HTMLElement>(host: HTMLElement, name: string): T {
  const found = host.querySelector<T>(`#pro-${name}`);
  if (!found) throw new ProInputError(`Pro control ${name} is missing`, "PRO_PANEL_INCOMPLETE");
  return found;
}

function numberInput(host: HTMLElement, id: string): number {
  const element = control<HTMLInputElement>(host, id);
  const result = element.valueAsNumber;
  if (!Number.isFinite(result)) throw new ProInputError(`Enter a valid value for ${id}`);
  return result;
}

function recipeFromControls(host: HTMLElement, masks: readonly LocalMask[]): ProRecipe {
  const base = defaultRecipe();
  const channels: Record<Channel, ReturnType<typeof threePointCurve>> = {
    master: threePointCurve(0.5),
    red: threePointCurve(0.5),
    green: threePointCurve(0.5),
    blue: threePointCurve(0.5),
  };
  for (const channel of CHANNELS) {
    const midpoint = numberInput(host, `curve-${channel}`) / 100;
    channels[channel] = threePointCurve(midpoint);
  }
  const percent = (id: string) => numberInput(host, id) / 100;
  return {
    ...base,
    curves: channels,
    masks,
    crop: {
      x: percent("crop-x"),
      y: percent("crop-y"),
      width: percent("crop-width"),
      height: percent("crop-height"),
      aspect: control<HTMLSelectElement>(host, "aspect").value as Aspect,
      rotation: numberInput(host, "rotate"),
    },
    export: control<HTMLSelectElement>(host, "preset").value as PresetName,
    simulationLabel: control<HTMLInputElement>(host, "label").checked,
  };
}

function prettyError(error: unknown): string {
  if (error instanceof ProInputError) return error.message;
  if (error instanceof Error && error.name === "AbortError") return "The operation was cancelled";
  return "The edit could not be completed on this device. The original is unchanged.";
}

function installPresetOptions(host: HTMLElement): void {
  const select = control<HTMLSelectElement>(host, "preset");
  select.replaceChildren();
  for (const value of Object.values(EXPORT_PRESETS)) {
    const opt = document.createElement("option");
    opt.value = value.id;
    opt.textContent = value.label;
    select.append(opt);
  }
}

export interface ProPanelHandle {
  readonly ready: boolean;
  dispose(): void;
}

export function mountProPanel(host: HTMLElement): ProPanelHandle {
  installPresetOptions(host);
  const fileInput = control<HTMLInputElement>(host, "file");
  const previewTarget = control<HTMLElement>(host, "preview");
  const status = control<HTMLElement>(host, "status");
  const exportButton = control<HTMLButtonElement>(host, "export");
  const resetButton = control<HTMLButtonElement>(host, "reset");
  const undoButton = control<HTMLButtonElement>(host, "undo");
  const redoButton = control<HTMLButtonElement>(host, "redo");
  const history = new RecipeHistory();
  const maskKind = control<HTMLSelectElement>(host, "mask-kind");
  const addMask = control<HTMLButtonElement>(host, "mask-add");
  const clearMasks = control<HTMLButtonElement>(host, "mask-clear");
  const splitEnabled = control<HTMLInputElement>(host, "split-enable");
  const splitPosition = control<HTMLInputElement>(host, "split-position");
  let activeMasks: LocalMask[] = [];
  let paintingIndex: number | null = null;
  let pointerId: number | null = null;
  let source: PixelSource | null = null;
  let bitmap: ImageBitmap | null = null;
  let revision = 0;
  let disposed = false;
  let scheduled = false;
  let exporting = false;
  let fileStem = "look";

  const announce = (text: string): void => {
    status.textContent = text;
  };

  const render = (): void => {
    if (disposed || !source) return;
    try {
      const recipe = recipeFromControls(host, activeMasks);
      const result = previewPhoto(source, recipe);
      const canvas = result.surface.canvas;
      if (!canvas) throw new ProInputError("Preview surface is unavailable");
      // Reuse the visible canvas so a brush pointer capture survives each preview.
      const visual = previewTarget.querySelector<HTMLCanvasElement>("canvas")
        ?? document.createElement("canvas");
      if (visual.width !== result.width) visual.width = result.width;
      if (visual.height !== result.height) visual.height = result.height;
      visual.setAttribute("role", "img");
      visual.setAttribute("aria-label", "Locally edited photo preview");
      const context = visual.getContext("2d");
      if (!context) throw new ProInputError("Canvas preview is unavailable");
      if (splitEnabled.checked) {
        const original = previewPhoto(source, { ...recipe, curves: defaultCurves(),
          masks: [], simulationLabel: false });
        if (!original.surface.canvas) throw new ProInputError("Original preview surface missing");
        drawSplitView(context, original.surface.canvas, canvas,
          planSplitView(result.width, result.height, Number(splitPosition.value) / 100));
      } else {
        context.drawImage(canvas, 0, 0);
      }
      visual.setAttribute("aria-label", maskKind.value === "brush"
        ? "Photo preview. Drag a pointer to paint a tone-curve mask." : "Locally edited photo preview");
      if (disposed) return;
      if (!previewTarget.contains(visual)) previewTarget.replaceChildren(visual);
      announce(`Local preview: ${result.width} × ${result.height}. ${Math.round(result.elapsedMs)} ms.`
        + (result.overBudget ? " Preview exceeded the 100 ms target on this device." : ""));
    } catch (error) {
      announce(prettyError(error));
    }
  };

  const syncHistoryButtons = (): void => {
    undoButton.disabled = !history.state.canUndo;
    redoButton.disabled = !history.state.canRedo;
  };

  const schedulePreview = (): void => {
    try {
      history.commit(recipeFromControls(host, activeMasks));
      syncHistoryButtons();
    } catch {
      // Invalid intermediate input is reported by render(), not added to undo history.
    }
    revision++;
    if (scheduled) return;
    scheduled = true;
    const currentRevision = revision;
    requestAnimationFrame(() => {
      scheduled = false;
      if (disposed) return;
      if (currentRevision !== revision) {
        schedulePreview();
        return;
      }
      render();
    });
  };

  const onFile = async (): Promise<void> => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_FILE_BYTES) {
      announce("Choose a JPEG, PNG or WebP at most 40 MB. The original was not replaced.");
      return;
    }
    const myRevision = ++revision;
    announce("Decoding the photo on this device…");
    try {
      const next = await createImageBitmap(file, { imageOrientation: "from-image" });
      if (disposed || myRevision !== revision) {
        next.close();
        return;
      }
      if (next.width * next.height > 12_000_000 || next.width > 16384 || next.height > 16384) {
        next.close();
        announce("This editor accepts images up to 12 megapixels and 16384 pixels per edge.");
        return;
      }
      bitmap?.close();
      bitmap = next;
      source = { image: next, width: next.width, height: next.height };
      fileStem = file.name.replace(/\.[^.]+$/, "");
      exportButton.disabled = false;
      // A new photo must not silently inherit another photo's source-space masks,
      // edit history or a previous user's opt-out of the default Simulation label.
      history.reset();
      onReset();
    } catch {
      announce("The photo could not be decoded. Your previous image is unchanged.");
    }
  };

  const onExport = async (): Promise<void> => {
    if (disposed || !source || exporting) return;
    exporting = true;
    exportButton.disabled = true;
    announce("Encoding locally. Keep this tab open during export.");
    try {
      const result = await exportPhotoPro(source, recipeFromControls(host, activeMasks), fileStem);
      if (disposed) return;
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.name;
      document.body.append(a);
      try {
        a.click();
      } finally {
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
      announce(`${result.width} × ${result.height} ${result.mime} saved locally in ${Math.round(result.elapsedMs)} ms.`
        + (result.overBudget ? " Export exceeded the 2-second target on this device." : "")
        + (result.label ? " Simulation label included." : ""));
    } catch (error) {
      announce(prettyError(error));
    } finally {
      exporting = false;
      exportButton.disabled = !source || disposed;
    }
  };

  const restoreRecipe = (recipe: ProRecipe): void => {
    activeMasks = [...recipe.masks];
    for (const channel of CHANNELS) {
      const channelCurve = recipe.curves[channel];
      const middle = channelCurve.find((point) => point.x === 0.5);
      control<HTMLInputElement>(host, `curve-${channel}`).value = String((middle?.y ?? 0.5) * 100);
    }
    control<HTMLInputElement>(host, "crop-x").value = String(recipe.crop.x * 100);
    control<HTMLInputElement>(host, "crop-y").value = String(recipe.crop.y * 100);
    control<HTMLInputElement>(host, "crop-width").value = String(recipe.crop.width * 100);
    control<HTMLInputElement>(host, "crop-height").value = String(recipe.crop.height * 100);
    control<HTMLInputElement>(host, "rotate").value = String(recipe.crop.rotation);
    control<HTMLSelectElement>(host, "aspect").value = recipe.crop.aspect;
    control<HTMLSelectElement>(host, "preset").value = recipe.export;
    control<HTMLInputElement>(host, "label").checked = recipe.simulationLabel;
    syncHistoryButtons();
    schedulePreview();
  };

  const onUndo = (): void => restoreRecipe(history.undo());
  const onRedo = (): void => restoreRecipe(history.redo());

  const onReset = (): void => {
    activeMasks = [];
    for (const channel of CHANNELS) control<HTMLInputElement>(host, `curve-${channel}`).value = "50";
    control<HTMLInputElement>(host, "crop-x").value = "0";
    control<HTMLInputElement>(host, "crop-y").value = "0";
    control<HTMLInputElement>(host, "crop-width").value = "100";
    control<HTMLInputElement>(host, "crop-height").value = "100";
    control<HTMLInputElement>(host, "rotate").value = "0";
    control<HTMLSelectElement>(host, "aspect").value = "original";
    control<HTMLSelectElement>(host, "preset").value = "original";
    control<HTMLInputElement>(host, "label").checked = true;
    schedulePreview();
  };

  const fraction = (name: string): number => numberInput(host, name) / 100;

  const onAddMask = (): void => {
    try {
      if (maskKind.value === "global" || maskKind.value === "brush") {
        announce("Choose a gradient tool, or select Brush and drag on the photo.");
        return;
      }
      const x = fraction("mask-x");
      const y = fraction("mask-y");
      const radius = fraction("mask-size");
      const opacity = fraction("mask-opacity");
      const feather = fraction("mask-feather");
      let shape: LocalMask;
      if (maskKind.value === "radial") {
        shape = { kind: "radial", center: { x, y }, radiusX: radius,
          radiusY: radius, opacity, feather, mode: "add" };
      } else {
        shape = { kind: "linear", start: { x: Math.max(0, x - radius), y },
          end: { x: Math.min(1, x + radius), y }, opacity, feather, mode: "add" };
      }
      if (activeMasks.length >= 16) throw new ProInputError("Only sixteen masks can be saved");
      activeMasks = [...activeMasks, shape];
      schedulePreview();
    } catch (error) {
      announce(prettyError(error));
    }
  };

  const onClearMasks = (): void => {
    activeMasks = [];
    paintingIndex = null;
    pointerId = null;
    schedulePreview();
  };

  const sourcePoint = (event: PointerEvent): MaskPoint | null => {
    if (!source || !(event.target instanceof HTMLCanvasElement)) return null;
    const canvas = event.target;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;
    const crop = recipeFromControls(host, activeMasks).crop;
    const geometry = previewGeometry(makeCropGeometry(source.width, source.height, crop));
    const mapping = cropMaskMapping(geometry, source.width, source.height);
    const x = (event.clientX - bounds.left) * geometry.width / bounds.width;
    const y = (event.clientY - bounds.top) * geometry.height / bounds.height;
    const nx = mapping.xx * (x + 0.5) + mapping.xy * (y + 0.5) + mapping.xo;
    const ny = mapping.yx * (x + 0.5) + mapping.yy * (y + 0.5) + mapping.yo;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
    return { x: nx, y: ny };
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (disposed || maskKind.value !== "brush" || paintingIndex !== null || !source) return;
    try {
      const point = sourcePoint(event);
      if (!point) return;
      if (activeMasks.length >= 16) throw new ProInputError("Only sixteen masks can be saved");
      activeMasks = [...activeMasks, { kind: "brush", mode: "add",
        opacity: fraction("mask-opacity"), radius: fraction("mask-size"),
        hardness: 1 - fraction("mask-feather"), points: [point] }];
      paintingIndex = activeMasks.length - 1;
      pointerId = event.pointerId;
      if (event.target instanceof HTMLCanvasElement) event.target.setPointerCapture(event.pointerId);
      schedulePreview();
    } catch (error) {
      announce(prettyError(error));
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId || paintingIndex === null) return;
    const point = sourcePoint(event);
    if (!point) return;
    const stroke = activeMasks[paintingIndex];
    if (stroke.kind !== "brush" || stroke.points.length >= 48) return;
    const previous = stroke.points[stroke.points.length - 1];
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 0.003) return;
    activeMasks = activeMasks.map((mask, index) => index === paintingIndex
      ? { ...stroke, points: [...stroke.points, point] } : mask);
    schedulePreview();
  };

  const onPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) return;
    paintingIndex = null;
    pointerId = null;
  };

  fileInput.addEventListener("change", onFile);
  exportButton.addEventListener("click", onExport);
  resetButton.addEventListener("click", onReset);
  addMask.addEventListener("click", onAddMask);
  clearMasks.addEventListener("click", onClearMasks);
  splitEnabled.addEventListener("change", schedulePreview);
  splitPosition.addEventListener("input", schedulePreview);
  previewTarget.addEventListener("pointerdown", onPointerDown);
  previewTarget.addEventListener("pointermove", onPointerMove);
  previewTarget.addEventListener("pointerup", onPointerEnd);
  previewTarget.addEventListener("pointercancel", onPointerEnd);
  undoButton.addEventListener("click", onUndo);
  redoButton.addEventListener("click", onRedo);
  const editable = Array.from(host.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-pro-edit]"));
  editable.forEach((control) => control.addEventListener("input", schedulePreview));
  exportButton.disabled = true;
  syncHistoryButtons();
  announce("Choose a local photo to edit. Nothing is uploaded.");

  return {
    ready: true,
    dispose(): void {
      if (disposed) return;
      disposed = true;
      bitmap?.close();
      bitmap = null;
      source = null;
      fileInput.removeEventListener("change", onFile);
      exportButton.removeEventListener("click", onExport);
      resetButton.removeEventListener("click", onReset);
      addMask.removeEventListener("click", onAddMask);
      clearMasks.removeEventListener("click", onClearMasks);
      splitEnabled.removeEventListener("change", schedulePreview);
      splitPosition.removeEventListener("input", schedulePreview);
      previewTarget.removeEventListener("pointerdown", onPointerDown);
      previewTarget.removeEventListener("pointermove", onPointerMove);
      previewTarget.removeEventListener("pointerup", onPointerEnd);
      previewTarget.removeEventListener("pointercancel", onPointerEnd);
      activeMasks = [];
      undoButton.removeEventListener("click", onUndo);
      redoButton.removeEventListener("click", onRedo);
      editable.forEach((control) => control.removeEventListener("input", schedulePreview));
      previewTarget.replaceChildren();
    },
  };
}
