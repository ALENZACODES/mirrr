/** Layout v1 editor chrome on top of the R8/R9 studio (layout spec §3 "Editor").
 * Adds, without forking the studio: Save in the top bar (the studio's own export), the always
 * visible 0-100 strength slider for the selected edit (gentle default, Subtle/Normal/Strong
 * ticks), Split compare, the Simulation and Still you tags, the face picker, the in-editor
 * category bar (edits stack), Save as My Look, and the hash actions from Home: #rescue,
 * #look=<id>, #try=<studio>:<look id> (a Holiday Engine suggestion), #cat=<Category> and #open.
 * The Still you tag runs the browser port of the arena's freckle/mole and skin-lightening checks
 * (still-you.ts) on her edits; it reports what it measured, never a made-up pass.
 * Author: John Khan.
 */
import type { ShellView } from "../ui/shell/view.js";
import type { RenderKind, ShellLayer, StudioId } from "../ui/shell/types.js";
import type { ByteImage } from "../engines/core/buffer.js";
import type { Point2 } from "../engines/warp/field.js";
import { regionMask } from "../data/regions/index.js";
import { type StillYou, stillYou } from "./still-you.js";
import { CATEGORIES, type Category, STRENGTH_TICKS, clampStrength, effectsIn, studioFor } from "./effects.js";
import { LookStore, type LookStep, browserLooks, stepsFromLayers } from "./my-looks.js";
import { rescueSteps } from "./rescue.js";
import { tryStep } from "./holiday/try-look.js";
import { wireSave } from "./topbar.js";
import { simulationLabelPref } from "./trust.js";
import { browserStore } from "../session.js";
import { LookLibrary, SaveOffer, OFFER_TEXT } from "../save/looks.js";
import { browserLookStorage } from "../save/storage.js";
import type { RecipeStep } from "../save/recipe.js";
import { paywallCopy, DEMO_NOTE } from "../screens/paywall.js";
import { strengthLabel, hapticTick } from "../ui/shell/stops.js";
import {
  engineToVisible,
  visibleToEngine,
  parseVisibleStrength,
  PreviewDebouncer,
  setStrengthRange,
} from "./strength-scale.js";
import { mountStudioIdentity, type StudioIdentityUI } from "../ui/shell/studio-identity.js";
import { paintFaceChip } from "./face-chip.js";
import { salonPackScreen } from "../screens/salon-pack.js";
import { batchReviewScreen } from "../screens/batch-review.js";
import { groupFacesScreen } from "../screens/group-faces.js";
import { bestSelfieScreen } from "../screens/best-selfie.js";
import { exportSizesScreen } from "../screens/export-sizes.js";
import { eventTrialScreen } from "../screens/event-trial.js";
import { beforeAfterScreen } from "../screens/before-after-video.js";
import { stickersScreen } from "../screens/stickers.js";
import { tattooScreen } from "../screens/tattoo.js";
import { voiceFramingScreen } from "../screens/voice-framing.js";
import { blinkRescueScreen } from "../screens/blink-rescue.js";
import { MultiFaceEdit, MultiFaceError } from "../save/multi-face.js";

/** The panels the studio opens under the photo. */
export type Deliverable = "salon" | "batch" | "faces" | "selfie" | "blink" | "sizes" | "event" | "video" | "stickers" | "tattoo" | "framing";

export type HashAction = { kind: "rescue" } | { kind: "look"; id: string } | { kind: "try"; value: string } | { kind: "category"; category: Category }
  | { kind: "salon" | "batch"; id: string } | { kind: "open" } | { kind: "paywall" } | { kind: "none" };

export function parseHash(hash: string): HashAction {
  let value: string;
  try { value = decodeURIComponent(hash.replace(/^#/, "")); } catch { return { kind: "none" }; }
  if (value === "rescue") return { kind: "rescue" };
  if (value === "open") return { kind: "open" };
  if (value === "paywall") return { kind: "paywall" };
  const look = /^look=(look-[0-9a-f]{8})$/.exec(value);
  if (look) return { kind: "look", id: look[1] };
  if (/^try=(?:filters|portrait):[A-Z]{1,2}\d{1,3}$/.test(value)) return { kind: "try", value };
  const action = /^(salon|batch)=(look-[0-9a-f]{8})$/.exec(value);
  if (action) return { kind: action[1] as "salon" | "batch", id: action[2] };
  const cat = /^cat=(\w+)$/.exec(value);
  if (cat && (CATEGORIES as readonly string[]).includes(cat[1])) return { kind: "category", category: cat[1] as Category };
  return { kind: "none" };
}

/** The editor surface the chrome needs (the studio's Editor satisfies it; tests pass a stub). */
export interface EditorLike {
  readonly document: { layers: readonly ShellLayer[]; studio: StudioId; selected: string | null };
  readonly selected: ShellLayer | null;
  readonly source: { face?: readonly Point2[]; faces?: readonly (readonly Point2[])[]; image: ByteImage };
  rendered(): { image: ByteImage };
  add(kind?: RenderKind, overrides?: Readonly<Record<string, string | number | boolean>>, strength?: number): ShellLayer;
  update(id: string, changes: { strength?: number }, label?: string): void;
  selectStudio(studio: StudioId): void;
}

/** Apply look steps as new layers, in order. Returns how many were added and what failed. */
export function applySteps(editor: EditorLike, steps: readonly LookStep[]): { added: number; skipped: string[] } {
  let added = 0;
  const skipped: string[] = [];
  for (const step of steps) {
    try { editor.add(step.kind, step.params, clampStrength(step.strength)); added++; }
    catch (error) { skipped.push(`${step.kind}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  return { added, skipped };
}

/** What a category tap does: open its studio tool, or explain that it isn't in the studio yet. */
export function categoryTarget(category: Category): { studio: StudioId | null; note: string } {
  const studio = studioFor(category);
  if (studio) return { studio, note: "" };
  const items = effectsIn(category);
  return { studio: null, note: items.map((e) => `${e.label}: ${e.note}`).join(" ") };
}

export function faceCount(editor: EditorLike): number {
  return editor.source.faces?.length ?? (editor.source.face ? 1 : 0);
}

/** The Still you check on the current edits: recorded face points give the real skin region
 * (eyes, brows and lips left out); without them a centred face ellipse is used. */
export function stillYouFor(editor: EditorLike): StillYou {
  const edited = editor.document.layers.some((l) => l.enabled && l.strength > 0 && l.opacity > 0);
  const before = editor.source.image;
  if (!edited) return stillYou(before, before, { edited: false });
  const face = editor.source.face;
  const skin = face && face.length >= 468
    ? regionMask("skin", face, before.width, before.height, { normalized: false, supersample: 2 }) : undefined;
  return stillYou(before, editor.rendered().image, { skin, face, edited: true });
}

/** Simulation tag: shown whenever a visible layer is a simulation (enhance is not). */
export function showsSimulation(layers: readonly ShellLayer[]): boolean {
  return layers.some((l) => l.enabled && l.strength > 0 && l.simulation);
}

/** The photo's bottom-left tag: always there once the photo is edited (spec: permanent),
 * saying "Simulation" whenever any visible edit is one. */
export function editTag(layers: readonly ShellLayer[]): string | null {
  const visible = layers.filter((l) => l.enabled && l.strength > 0 && l.opacity > 0);
  if (!visible.length) return null;
  return showsSimulation(visible) ? "Simulation, edited photo" : "Edited photo";
}

/** My Look steps as versioned Save System recipe steps (all local tools). */
export function recipeSteps(steps: readonly LookStep[]): RecipeStep[] {
  return steps.map((s) => ({ tool: s.kind, strength: s.strength, settings: { ...s.params }, provider: "local" as const }));
}

export class EditorChrome {
  private readonly looks = new LookStore(browserLooks());
  private readonly library = new LookLibrary(browserLookStorage());
  private readonly offer = new SaveOffer(browserStore());
  private savedAsLook = false;
  private stillKey = "";
  private stillSource: ByteImage | null = null;
  private stillFace: readonly Point2[] | undefined;
  private readonly line: HTMLElement | null;
  private readonly previewDebouncer = new PreviewDebouncer(85);
  private identityUI: StudioIdentityUI | null = null;
  private closePanel: (() => void) | null = null;
  /** Per-face edits of the open group photo; rebuilt when the photo's faces change. */
  private group: { faces: readonly (readonly Point2[])[]; session: MultiFaceEdit; active: number } | null = null;
  private chipsKey = "";
  constructor(private readonly view: ShellView, private readonly doc: Document = document) {
    this.line = doc.getElementById("lg-chrome-status");
  }
  private get editor(): EditorLike { return this.view.editor as unknown as EditorLike; }
  private say(text: string): void { if (this.line) this.line.textContent = text; }

  mount(): void {
    wireSave(this.doc, () => this.doc.getElementById("shell-download")?.click());
    const label = this.doc.getElementById("shell-export-label") as HTMLInputElement | null;
    const pref = simulationLabelPref(browserStore());
    if (label) {
      label.checked = pref.get();
      label.addEventListener("change", () => pref.set(label.checked));
    }
    this.buildCategories();
    this.wireStrength();
    this.identityUI = mountStudioIdentity(this.doc, this.doc.querySelector(".lg-strength"));
    this.doc.getElementById("lg-split")?.addEventListener("click", () => {
      this.doc.querySelector<HTMLButtonElement>('#shell-compare-modes [data-mode="split-vertical"]')?.click();
      this.say("Split compare: drag the line or use the arrow keys on the photo.");
    });
    this.doc.getElementById("lg-salon-pack")?.addEventListener("click", () => this.openDeliverable("salon"));
    this.doc.getElementById("lg-batch-review")?.addEventListener("click", () => this.openDeliverable("batch"));
    this.doc.getElementById("lg-group-faces")?.addEventListener("click", () => this.openDeliverable("faces"));
    this.doc.getElementById("lg-best-selfie")?.addEventListener("click", () => this.openDeliverable("selfie"));
    this.doc.getElementById("lg-export-sizes")?.addEventListener("click", () => this.openDeliverable("sizes"));
    this.doc.getElementById("lg-event-trial")?.addEventListener("click", () => this.openDeliverable("event"));
    this.doc.getElementById("lg-before-after")?.addEventListener("click", () => this.openDeliverable("video"));
    this.doc.getElementById("lg-stickers")?.addEventListener("click", () => this.openDeliverable("stickers"));
    this.doc.getElementById("lg-tattoo")?.addEventListener("click", () => this.openDeliverable("tattoo"));
    this.doc.getElementById("lg-voice-framing")?.addEventListener("click", () => this.openDeliverable("framing"));
    this.doc.getElementById("lg-blink-rescue")?.addEventListener("click", () => this.openDeliverable("blink"));
    this.doc.getElementById("lg-close-deliverable")?.addEventListener("click", () => { this.closePanel?.(); this.closePanel = null;
      const panel = this.doc.getElementById("lg-deliverable"); if (panel) { panel.replaceChildren(); panel.hidden = true; }
      const close = this.doc.getElementById("lg-close-deliverable"); if (close) close.hidden = true; });
    globalThis.addEventListener?.("pagehide", () => {
      this.closePanel?.();
      this.closePanel = null;
      this.previewDebouncer.dispose();
      this.identityUI?.dispose();
    }, { once: true });
    this.doc.getElementById("lg-save-look")?.addEventListener("click", () => this.saveLook());
    this.doc.getElementById("shell-download")?.addEventListener("click", () => this.afterSavePhoto());
    for (const id of ["shell-canvas", "shell-layers", "shell-settings", "shell-strip"]) {
      this.doc.getElementById(id)?.addEventListener("click", () => this.refresh());
      this.doc.getElementById(id)?.addEventListener("input", () => this.refresh());
    }
    this.doc.getElementById("shell-apply")?.addEventListener("click", () => this.refresh());
    globalThis.addEventListener?.("hashchange", () => this.runHash());
    this.runHash();
    this.refresh();
    // edits made through the studio's own controls (strip, inspector, keyboard) also refresh the chrome
    this.doc.addEventListener("keyup", () => this.refresh());
  }

  private buildCategories(): void {
    const bar = this.doc.getElementById("lg-categories");
    if (!bar) return;
    for (const category of CATEGORIES) {
      const b = this.doc.createElement("button");
      b.type = "button"; b.className = "lg-cat"; b.textContent = category; b.dataset.category = category;
      b.addEventListener("click", () => this.openCategory(category));
      bar.append(b);
    }
  }

  openCategory(category: Category): void {
    const target = categoryTarget(category);
    if (target.studio) {
      this.editor.selectStudio(target.studio);
      this.view.draw();
      this.say(`${category}: edits stack on the ones you already have.`);
    } else {
      this.say(`${category}. ${target.note}`);
    }
    for (const b of this.doc.querySelectorAll<HTMLButtonElement>("#lg-categories .lg-cat")) {
      b.setAttribute("aria-pressed", String(b.dataset.category === category));
    }
  }

  private wireStrength(): void {
    const slider = this.doc.getElementById("lg-strength") as HTMLInputElement | null;
    const list = this.doc.getElementById("lg-ticks");
    if (list && !list.childElementCount) {
      for (const tick of STRENGTH_TICKS) {
        const option = this.doc.createElement("option");
        option.value = engineToVisible(tick.value).toFixed(1);
        option.label = tick.name;
        list.append(option);
      }
    }
    if (!slider) return;
    setStrengthRange(slider, 1.0);
    const apply = (value: number): void => {
      const layer = this.editor.selected;
      if (!layer) return;
      const internal = visibleToEngine(value);
      if (Math.abs(internal - layer.strength) < 0.0001) return;
      hapticTick(layer.strength, internal);
      this.editor.update(layer.id, { strength: clampStrength(internal) }, "Strength");
      this.view.draw();
      this.refresh();
    };
    slider.addEventListener("input", () => {
      const layer = this.editor.selected;
      if (!layer) return;
      let value: number;
      try { value = parseVisibleStrength(slider.value); } catch { return; }
      const output = this.doc.getElementById("lg-strength-value");
      if (output) output.textContent = `${value.toFixed(1)} / 5.0`;
      const key = `${this.editor.source.image.width}x${this.editor.source.image.height}:${layer.id}:${value}`;
      this.previewDebouncer.schedule(key, () => apply(value));
    });
    slider.addEventListener("change", () => {
      const layer = this.editor.selected;
      if (!layer) return;
      let value: number;
      try { value = parseVisibleStrength(slider.value); } catch { return; }
      this.previewDebouncer.flush(`${this.editor.source.image.width}x${this.editor.source.image.height}:${layer.id}:${value}`,
        () => apply(value));
    });
  }

  runHash(): void {
    const action = parseHash(globalThis.location?.hash ?? "");
    if (action.kind === "rescue") {
      const res = applySteps(this.editor, rescueSteps());
      this.say(res.added ? `Rescue applied: ${res.added === 2 ? "a gentle enhance and under-eye brightening" : "a gentle enhance"}.`
        + (res.skipped.length ? ` Skipped ${res.skipped.join("; ")}.` : "") + " Dull skin and flyaway hair are not built yet."
        : `Rescue couldn't run: ${res.skipped.join("; ")}`);
    } else if (action.kind === "look") {
      const look = this.looks.get(action.id);
      if (!look) this.say("That saved look isn't in this browser.");
      else {
        const res = applySteps(this.editor, look.steps);
        this.say(`${look.name}: ${res.added} edit${res.added === 1 ? "" : "s"} applied` + (res.skipped.length ? `; skipped ${res.skipped.join("; ")}` : "."));
      }
    } else if (action.kind === "try") {
      const tried = tryStep(action.value);
      if (!tried) this.say("That look isn't in this version of the app.");
      else {
        const res = applySteps(this.editor, [tried.step]);
        this.say(res.added ? `${tried.name} added at its gentle default. Move the slider to taste.`
          : `${tried.name} couldn't be added: ${res.skipped.join("; ")}`);
      }
    } else if (action.kind === "salon" || action.kind === "batch") {
      const look = this.looks.get(action.id);
      if (!look) this.say("That saved look is not in this browser.");
      else {
        const name = this.doc.getElementById("lg-look-name") as HTMLInputElement | null; if (name) name.value = look.name;
        if (action.kind === "batch") {
          const layers: ShellLayer[] = look.steps.map((step, i) => ({ id: `saved-${i}`, kind: step.kind, name: step.kind,
            strength: step.strength, parameters: { ...step.params }, enabled: true, opacity: 1, provenance: "local",
            origin: "photo", simulation: !["enhance", "filters"].includes(step.kind) }));
          this.openDeliverable("batch", layers);
        } else {
          const result = applySteps(this.editor, look.steps); this.openDeliverable("salon");
          this.say(`Photos are not stored. Open your photo and reapply ${look.name} for your own pack. ${result.skipped.join("; ")}`);
        }
      }
    } else if (action.kind === "category") {
      this.openCategory(action.category);
    } else if (action.kind === "open") {
      this.doc.getElementById("shell-upload")?.click();
    } else if (action.kind === "paywall") {
      const copy = paywallCopy();
      this.say(`${copy.title}: ${copy.trial} ${DEMO_NOTE}`);
    }
    if (action.kind !== "none") { this.view.draw(); this.refresh(); }
  }

  openDeliverable(kind: Deliverable, layers: readonly ShellLayer[] = this.editor.document.layers): void {
    const panel = this.doc.getElementById("lg-deliverable");
    if (!panel) return;
    this.closePanel?.(); this.closePanel = null;
    const name = (this.doc.getElementById("lg-look-name") as HTMLInputElement | null)?.value.trim() || "My look";
    try {
      if (kind === "salon") panel.replaceChildren(salonPackScreen(this.view.editor, name));
      else if (kind === "faces") {
        const group = this.groupSession();
        if (!group) throw new Error("Find two or more faces first: Older, Younger or Gender, then Find face points.");
        panel.replaceChildren(groupFacesScreen(group.session, group.active, () => group.session.setEdits(group.active, this.editor.document.layers),
          { openSource: (source) => { this.view.editor.load(source); this.view.afterSource(); this.refresh(); } }));
      } else if (kind === "blink") {
        panel.replaceChildren(blinkRescueScreen(() => this.view.editor.source, (source) => { this.view.editor.load(source); this.view.afterSource(); this.refresh(); }));
      } else if (kind === "framing") {
        const screen = voiceFramingScreen((source) => { this.view.editor.load(source); this.view.afterSource(); this.refresh(); });
        panel.replaceChildren(screen.element); this.closePanel = screen.dispose;
      } else if (kind === "tattoo") {
        panel.replaceChildren(tattooScreen(this.view.editor, name, { simulationLabel: () => simulationLabelPref(browserStore()).get() }));
      } else if (kind === "stickers") {
        panel.replaceChildren(stickersScreen(this.view.editor, { simulationLabel: () => simulationLabelPref(browserStore()).get() }));
      } else if (kind === "video") {
        panel.replaceChildren(beforeAfterScreen(this.view.editor, name, { simulationLabel: () => simulationLabelPref(browserStore()).get() }));
      } else if (kind === "event") {
        panel.replaceChildren(eventTrialScreen(() => this.looks.list()));
      } else if (kind === "sizes") {
        panel.replaceChildren(exportSizesScreen(this.view.editor, name, { simulationLabel: () => simulationLabelPref(browserStore()).get() }));
      } else if (kind === "selfie") {
        panel.replaceChildren(bestSelfieScreen((source) => { this.view.editor.load(source); this.view.afterSource(); this.refresh(); }));
      } else { const screen = batchReviewScreen(name, layers); panel.replaceChildren(screen.element); this.closePanel = screen.dispose; }
      panel.hidden = false; this.doc.getElementById("lg-close-deliverable")?.removeAttribute("hidden"); panel.scrollIntoView({ block: "nearest" });
    } catch (error) { this.say(error instanceof Error ? error.message : String(error)); }
  }

  saveLook(): void {
    const input = this.doc.getElementById("lg-look-name") as HTMLInputElement | null;
    const name = (input?.value ?? "").trim() || "My look";
    const steps = stepsFromLayers(this.editor.document.layers);
    if (!steps.length) { this.say("Add an edit first, then save it as a look."); return; }
    try {
      const look = this.looks.save(name, steps);
      this.savedAsLook = true;
      // The versioned recipe (Save System v1) goes to IndexedDB; failures keep the My Look copy.
      void this.library.saveLook(look.name, recipeSteps(look.steps)).catch(() => undefined);
      this.say(`Saved "${look.name}" with ${look.steps.length} edit${look.steps.length === 1 ? "" : "s"}. It's on Home under My Looks.`);
    } catch (error) { this.say(error instanceof Error ? error.message : String(error)); }
  }

  /** After "Save photo": offer once to keep the edits as a reusable look. */
  afterSavePhoto(): void {
    const hasEdits = stepsFromLayers(this.editor.document.layers).length > 0;
    if (this.offer.shouldOffer({ savedPhoto: true, hasEdits, savedAsLook: this.savedAsLook })) {
      this.offer.answer("no");
      this.say(OFFER_TEXT + " Name it below and tap Save as My Look.");
      (this.doc.getElementById("lg-look-name") as HTMLInputElement | null)?.focus();
    }
  }

  refresh(): void {
    const layer = this.editor.selected;
    const slider = this.doc.getElementById("lg-strength") as HTMLInputElement | null;
    const out = this.doc.getElementById("lg-strength-value");
    if (slider) {
      slider.disabled = !layer;
      setStrengthRange(slider, layer ? engineToVisible(layer.strength) : 1.0);
      slider.setAttribute("aria-valuetext", layer
        ? `${layer.name} ${engineToVisible(layer.strength).toFixed(1)} of 5.0`
        : "No edit selected");
    }
    if (out) out.textContent = layer
      ? `${engineToVisible(layer.strength).toFixed(1)} / 5.0 · ${strengthLabel(layer.kind as RenderKind, layer.strength)}`
      : "Add an edit";
    const sim = this.doc.getElementById("lg-sim-tag");
    if (sim) {
      const tag = editTag(this.editor.document.layers);
      sim.hidden = tag === null;
      if (tag) sim.textContent = tag;
    }
    const still = this.doc.getElementById("lg-still-tag");
    const key = JSON.stringify(this.editor.document.layers) + (this.editor.source.image.width + "x" + this.editor.source.image.height);
    if (still && (key !== this.stillKey || this.stillSource !== this.editor.source.image || this.stillFace !== this.editor.source.face)) {
      this.stillSource = this.editor.source.image; this.stillFace = this.editor.source.face;
      this.stillKey = key;
      try {
        const result = stillYouFor(this.editor);
        still.textContent = result.text;
        still.dataset.state = result.state;
      } catch {
        still.textContent = "Photo checks: unavailable for this photo";
        still.dataset.state = "not checked";
      }
    }
    const faces = this.doc.getElementById("lg-faces");
    if (faces) this.renderFaceChips(faces);
  }

  /** The open photo's group session, or null for a photo with fewer than two faces. */
  private groupSession(): { faces: readonly (readonly Point2[])[]; session: MultiFaceEdit; active: number } | null {
    const all = this.editor.source.faces;
    if (!all || all.length < 2) { this.group = null; return null; }
    if (this.group?.faces !== all) {
      try { this.group = { faces: all, session: new MultiFaceEdit(this.view.editor.source, all), active: 0 }; }
      catch (error) { this.group = null; this.say(error instanceof MultiFaceError ? error.message : String(error)); }
    }
    return this.group;
  }

  /** Keep this face's edits, move the editor to face `index` and bring back that face's edits. */
  switchFace(index: number): void {
    const group = this.groupSession();
    if (!group || index === group.active) return;
    group.session.setEdits(group.active, this.editor.document.layers);
    this.view.editor.setFace(group.session.faces[index]);
    const restored = applySteps(this.editor, stepsFromLayers(group.session.editsFor(index)));
    group.active = index;
    this.say(`Editing face ${index + 1}. The other faces keep their own edits.${restored.skipped.length ? ` Not restored: ${restored.skipped.join("; ")}` : ""}`);
    this.view.draw(); this.refresh();
  }

  /** "All": the face being edited gives its edits to every face. */
  editAllFaces(): void {
    const group = this.groupSession();
    if (!group) return;
    group.session.setEdits(group.active, this.editor.document.layers);
    group.session.copyToAll(group.active);
    this.say(`Face ${group.active + 1}'s edits now apply to every face, each inside its own face.`);
    this.openDeliverable("faces");
  }

  private renderFaceChips(faces: HTMLElement): void {
    const group = this.groupSession(), n = faceCount(this.editor), active = group?.active ?? 0;
    const key = `${n}:${active}:${this.editor.source.image.width}x${this.editor.source.image.height}`;
    faces.dataset.count = String(n);
    if (key !== this.chipsKey) {
      this.chipsKey = key;
      const chips = Array.from({ length: Math.max(1, n) }, (_, i) => {
        const chip = this.doc.createElement("button");
        chip.type = "button"; chip.textContent = String(i + 1); chip.disabled = n <= 1;
        chip.setAttribute("aria-label", `Edit face ${i + 1}`); chip.setAttribute("aria-pressed", String(n > 1 && i === active));
        chip.addEventListener("click", () => this.switchFace(i));
        return chip;
      });
      const all = this.doc.createElement("button");
      all.type = "button"; all.textContent = "All"; all.disabled = n <= 1;
      all.addEventListener("click", () => this.editAllFaces());
      const note = this.doc.createElement("span");
      note.className = "lg-small lg-faces-note";
      note.textContent = n > 1 ? `${n} faces. Pick a face to edit it, or All. Each face's edits stay inside that face.` : "One face, or no recorded face points.";
      faces.replaceChildren(...chips, all, note);
    }
    // 4.1: each face chip shows that face, cut from this photo on the device.
    const points = group ? group.session.faces : this.editor.source.face ? [this.editor.source.face] : [];
    faces.querySelectorAll<HTMLButtonElement>("button").forEach((chip, i) => {
      if (points[i]) paintFaceChip(this.doc, chip, this.editor.source.image, points[i]);
    });
  }
}

export function mountChrome(view: ShellView): EditorChrome {
  const chrome = new EditorChrome(view);
  chrome.mount();
  return chrome;
}
