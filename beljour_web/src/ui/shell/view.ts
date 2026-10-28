import { engineToVisible, visibleToEngine, setStrengthRange, PreviewDebouncer } from "../../layout/strength-scale.js";
/** Working studio UI (R8 shell, extended in R9). Native buttons and inputs; no framework, CDN or
 * third-party art. The editor page never calls fetch and never sends a user photo anywhere.
 * R9 adds: the ten compare modes (compare-view.ts), visit consent before opening a photo and a
 * styling hand-off that explains what is sent (consent.ts), the on-device pre-check and the
 * thumbnail strip, both computed in the shell worker, the demo tour (web/src/demo/), the phone
 * panel tabs, a keyboard map with a shortcuts dialog, and live-region announcements.
 * Author: John Khan.
 */
import { SIDEBAR_SECTIONS, defaultSample, readiness, tool, toolsIn } from "./catalogue.js";
import { Editor } from "./controller.js";
import { readLocalImage, SAMPLE_IDS, SAMPLE_NAMES, uploadedSource } from "./demo.js";
import { paint, downloadCanvas } from "./canvas.js";
import { hapticTick, strengthName, stopsFor } from "./stops.js";
import { documentEvidence } from "./evidence.js";
import { pixelsChanged } from "./pipeline.js";
import { POSTURE_DEFAULTS } from "./settings.js";
import { AnnotationDraft, drawMarks, pointFromScreen } from "./annotations.js";
import type { View } from "../../engines/local/posture.js";
import { MODES, STEPS as ENHANCE_STEPS } from "../../engines/local/enhance.js";
import { STYLES } from "../../engines/local/beard.js";
import { PRODUCTS } from "../../engines/local/strands.js";
import { fixesFor } from "../../engines/local/posture.js";
import type { ParamValue, SampleId, ShellLayer } from "./types.js";
import { CompareController } from "./compare-view.js";
import { StripView, renderPrecheck } from "./strip-view.js";
import { Modal } from "./dialogs.js";
import { LOCAL_ONLY_REASON, PROVIDER_FACTS, VISIT_STATEMENTS, appConsent } from "./consent.js";
import { PANELS, PANEL_LABELS, PanelTabs, isPhone } from "./panels.js";
import { SHORTCUTS, resolveKey } from "./keymap.js";
import { Announcer, regionSink } from "./announcer.js";
import { audit, fromDom } from "./a11y.js";
import { type ShellClient, createShellClient } from "./worker-protocol.js";
import { DEMO_SCENES } from "../../demo/scenes.js";
import { DemoTour, demoHash, parseDemoHash } from "../../demo/loader.js";
import type { FileFacts } from "./precheck.js";
import { PHONE_MAX } from "./compare-layout.js";
import { HairStudio } from "../studios/hair/view.js";
import { hashModel } from "../../vision/model-registry.js";
import { readHeader } from "../../image/decode.js";
import { heroAppearanceScreen } from "../../screens/hero-appearance.js";
import { lightingScreen } from "../../screens/lighting.js";
import { recolourScreen, CURL_PATTERNS } from "../../screens/recolour.js";
import { balayageScreen } from "../../screens/balayage.js";
import { skinToolsScreen } from "../../screens/skin-tools.js";
import { illustrationScreen, photoStudioScreen } from "../../screens/photo-studio.js";
import { STUDIO_LAYER_TOOLS, STUDIO_TOOL_NAMES } from "./studio-layer.js";
import { BACKDROPS } from "../../engines/studio/backdrops.js";
import { INDUSTRIES } from "../../engines/studio/headshot.js";
import { SIDES } from "../../engines/studio/relight.js";
import { LOOKS as ILLUSTRATION_LOOKS } from "../../engines/studio/illustration.js";
import { GLOWS } from "../../engines/skin/finish.js";
import { SHIFTS as UNDERTONES } from "../../engines/skin/glow-tan.js";
import { TOOLS as SKIN_TOOLS } from "../../engines/skin/studio.js";
import { SKIN_TOOL_NAMES } from "./skin-layer.js";
import { presetIds, preset } from "../../engines/shade/lighting.js";
import { LEVELS } from "../../engines/haircolour/generated/levels.js";
import { filterControls } from "../../filters/runtime/controls.js";
import { portraitOptions } from "../../filters/portrait/layer.js";
import { LABEL as PORTRAIT_LABEL } from "../../filters/portrait/compose.js";

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag); n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}
function find<K extends HTMLElement>(id: string): K {
  const n = document.getElementById(id);
  if (!n) throw new Error(`The studio page is missing ${id}`);
  return n as K;
}
function labelled(label: string, control: HTMLElement, className = "shell-field"): HTMLLabelElement {
  const el = node("label", className); el.append(node("span", "shell-field-name", label), control); return el;
}
function button(label: string, act: () => void, title = label, cls = "shell-button"): HTMLButtonElement {
  const el = node("button", cls, label); el.type = "button"; el.title = title; el.addEventListener("click", act); return el;
}
function select(options: readonly { value: string; label: string }[], value: string, onChange: (v: string) => void): HTMLSelectElement {
  const el = node("select", "shell-select");
  for (const item of options) { const option = node("option", "", item.label); option.value = item.value; el.append(option); }
  el.value = value; el.addEventListener("change", () => onChange(el.value)); return el;
}
function percent(label: string, value: number, min: number, max: number, step: number,
  change: (number: number) => void, suffix = "%", format?: (value: number) => string): HTMLElement {
  const range = node("input", "shell-range") as HTMLInputElement;
  range.type = "range"; range.min = String(min); range.max = String(max); range.step = String(step); range.value = String(value);
  range.setAttribute("aria-label", label);
  const show = format ?? ((v: number) => `${Math.round(v * 100) / 100}${suffix}`);
  const num = node("output", "shell-range-output", show(value));
  let last = value;
  range.addEventListener("input", () => {
    const next = Number(range.value);
    num.textContent = show(next);
    if (format) hapticTick(last, next);
    last = next;
  });
  range.addEventListener("change", () => change(Number(range.value)));
  const group = node("div", "shell-percent"); group.append(range, num);
  return labelled(label, group);
}
/** The checked engine receives its original 0–100 value; the input displays 1.0–5.0. */
function effectStrengthControl(label: string, current: number, change: (value: number) => void): HTMLElement {
  const range = node("input", "shell-range") as HTMLInputElement;
  setStrengthRange(range, engineToVisible(current));
  range.setAttribute("aria-label", label);
  const output = node("output", "shell-range-output", `${range.value} of 5.0`);
  const debounce = new PreviewDebouncer(85);
  const submit = (): void => {
    const level = Number(range.value);
    if (!Number.isFinite(level)) return;
    output.textContent = `${level.toFixed(1)} of 5.0`;
    debounce.schedule(String(level), () => change(visibleToEngine(level)));
  };
  range.addEventListener("input", submit);
  range.addEventListener("change", () => {
    const level = Number(range.value);
    if (Number.isFinite(level)) debounce.flush(String(level), () => change(visibleToEngine(level)));
  });
  const group = node("div", "shell-percent");
  group.append(range, output);
  return labelled(label, group);
}

function check(label: string, checked: boolean, change: (value: boolean) => void): HTMLLabelElement {
  const el = node("label", "shell-check");
  const input = node("input") as HTMLInputElement; input.type = "checkbox"; input.checked = checked;
  input.addEventListener("change", () => change(input.checked)); el.append(input, node("span", "", label)); return el;
}
const getParam = (layer: ShellLayer, key: string, fallback: string) => typeof layer.parameters[key] === "string" ? String(layer.parameters[key]) : fallback;
const getNumber = (layer: ShellLayer, key: string, fallback: number) => typeof layer.parameters[key] === "number" ? Number(layer.parameters[key]) : fallback;

export class ShellView {
  readonly editor: Editor;
  private readonly hairStudio: HairStudio;
  private readonly canvas: HTMLCanvasElement;
  private readonly stage: HTMLElement;
  private readonly nav: HTMLElement;
  private readonly layers: HTMLElement;
  private readonly settings: HTMLElement;
  private readonly status: HTMLElement;
  private readonly history: HTMLElement;
  private readonly sourceName: HTMLElement;
  private readonly layerCount: HTMLElement;
  private readonly toolTitle: HTMLElement;
  private readonly toolText: HTMLElement;
  private readonly flow: HTMLElement;
  private readonly safety: HTMLElement;
  private readonly add: HTMLButtonElement;
  private readonly undo: HTMLButtonElement;
  private readonly redo: HTMLButtonElement;
  private readonly sample: HTMLSelectElement;
  private readonly file: HTMLInputElement;
  private readonly exportLabel: HTMLInputElement;
  private draft: AnnotationDraft | null = null;
  private busy = false;
  private pending = 0;
  private lastMessage = "Ready. Start with a drawn sample, or open a photo on this device.";
  private readonly client: ShellClient;
  private readonly threaded: boolean;
  private readonly compare: CompareController;
  private readonly strip: StripView;
  private readonly tabs = new PanelTabs("edit");
  private readonly announcer: Announcer;
  private readonly tour: DemoTour;
  private readonly consentModal: Modal<boolean>;
  private readonly providerModal: Modal<boolean>;
  private readonly helpModal: Modal<boolean>;
  private singleKeys = true;
  private stripKey = "";
  private precheckTicket = 0;
  constructor(editor = new Editor()) {
    this.editor = editor;
    window.addEventListener("pagehide", () => this.editor.dispose(), { once: true });
    this.hairStudio = new HairStudio({ mode: "shell", image: null });
    this.canvas = find("shell-canvas"); this.stage = find("shell-stage");
    this.nav = find("shell-nav"); this.layers = find("shell-layers"); this.settings = find("shell-settings");
    this.status = find("shell-status"); this.history = find("shell-history");
    this.sourceName = find("shell-source-name"); this.layerCount = find("shell-layer-count");
    this.toolTitle = find("shell-tool-title"); this.toolText = find("shell-tool-text");
    this.flow = find("shell-flow"); this.safety = find("shell-safety");
    this.add = find("shell-apply"); this.undo = find("shell-undo"); this.redo = find("shell-redo");
    this.sample = find("shell-sample"); this.file = find("shell-file"); this.exportLabel = find("shell-export-label");
    const shell = createShellClient(new URL("./shell-worker.js", import.meta.url));
    this.client = shell.client; this.threaded = shell.threaded;
    this.announcer = new Announcer(regionSink(find("shell-announce"), find("shell-alert")));
    this.compare = new CompareController(this.editor, {
      modes: find("shell-compare-modes"), controls: find("shell-compare-controls"), canvas: this.canvas,
      scroll: find("shell-canvas-scroll"), description: find("shell-compare-description"), measure: find("shell-measure"),
      board: find("shell-board"), hold: find("shell-before"), stage: this.stage,
    }, { client: this.client, threaded: this.threaded, announce: (t) => this.announcer.say(t), status: (t) => this.inform(t),
      zoom: () => this.editor.document.zoom, exportLabel: () => this.exportLabel.checked, edited: () => this.draw() });
    this.strip = new StripView(find("shell-strip"), find("shell-strip-note"), {
      client: this.client,
      pick: (tile) => this.safely(() => {
        if (!tile.option) return;
        this.editor.applyOption(tile.option.kind, tile.option.params, tile.label, tile.option.strength);
      }, `${tile.label} applied from its preview. Undo returns the previous option.`),
      provider: () => { void this.openProvider(); },
    });
    const background = [find<HTMLElement>("shell-editor"), document.querySelector<HTMLElement>(".shell-header")!, document.querySelector<HTMLElement>(".shell-footer")!];
    const scrim = find<HTMLElement>("shell-scrim");
    this.consentModal = new Modal<boolean>(find("shell-consent"), scrim, background, false);
    this.providerModal = new Modal<boolean>(find("shell-provider"), scrim, background, false);
    this.helpModal = new Modal<boolean>(find("shell-help"), scrim, background, false);
    this.tour = new DemoTour(this.editor, this.compare.session);
    this.wire(); this.wireR9(); this.draw();
    this.afterSource();
    const scene = parseDemoHash(location.hash);
    if (scene) this.openDemo(scene);
    if (new URLSearchParams(location.search).get("audit") === "1") setTimeout(() => this.runAudit(), 300);
  }
  private inform(text: string): void { this.lastMessage = text; this.status.textContent = text; }
  private safely(action: () => void, message?: string): void {
    try { action(); if (message) this.inform(message); this.draw(); }
    catch (error) { this.inform(error instanceof Error ? error.message : String(error)); }
  }
  private wire(): void {
    this.sample.append(...SAMPLE_IDS.map((id) => { const opt = node("option", "", SAMPLE_NAMES[id]); opt.value = id; return opt; }));
    this.sample.value = "low-light";
    find<HTMLButtonElement>("shell-load-sample").addEventListener("click", () => this.safely(() => {
      this.draft = null;
      this.editor.loadSample(this.sample.value as SampleId);
      this.afterSource();
    }, "Drawn sample ready. No network or personal image."));
    find<HTMLButtonElement>("shell-upload").addEventListener("click", () => { void this.chooseFile(); });
    this.file.addEventListener("change", async () => {
      const file = this.file.files?.[0]; this.file.value = "";
      if (!file) return;
      this.inform("Reading this image on your device…"); this.busy = true;
      try {
        const image = await readLocalImage(file);
        this.draft = null;
        const source = uploadedSource(image, `upload:${Date.now().toString(36)}`);
        try {
          const bytes = await file.arrayBuffer(), header = readHeader(new Uint8Array(bytes));
          source.fileSha256 = await hashModel(bytes);
          source.fileDimensions = header.orientation >= 5 ? [header.height, header.width] : [header.width, header.height];
        } catch { /* The image remains usable without recorded-fixture attachment. */ }
        this.editor.load(source);
        this.inform(`Photo ready (${image.width}×${image.height}, local preview). No upload occurred.`);
        this.draw();
        this.afterSource({ type: file.type, bytes: file.size });
      } catch (error) { this.inform(error instanceof Error ? error.message : String(error)); }
      finally { this.busy = false; }
    });
    this.canvas.addEventListener("pointerdown", (event) => {
      if (!this.draft || event.button !== 0) return;
      event.stopImmediatePropagation();
      try {
        const rect = this.canvas.getBoundingClientRect();
        this.draft.add(pointFromScreen(rect, this.canvas.width, this.canvas.height, event.clientX, event.clientY));
        this.inform(this.draft.instructions);
        this.draw();
      } catch (error) { this.inform(error instanceof Error ? error.message : String(error)); }
    });
    find<HTMLButtonElement>("shell-mark-undo").addEventListener("click", () => this.safely(() => {
      this.draft?.undo();
    }));
    find<HTMLButtonElement>("shell-mark-clear").addEventListener("click", () => this.safely(() => {
      this.draft?.clear();
    }));
    find<HTMLButtonElement>("shell-mark-cancel").addEventListener("click", () => this.safely(() => {
      this.draft = null;
    }, "Manual marking cancelled. The original image is unchanged."));
    find<HTMLButtonElement>("shell-mark-commit").addEventListener("click", () => this.safely(() => {
      const sealed = this.draft?.seal();
      if (!sealed) throw new Error("Start the marking tool first");
      this.editor.mark(sealed); this.draft = null;
    }, "The manual region is ready. Previous layers have been reset so their geometry cannot become stale."));
    this.add.addEventListener("click", () => this.safely(() => {
      this.editor.add();
    }, "Local layer added; the original image is unchanged."));
    this.undo.addEventListener("click", () => this.safely(() => this.editor.undo(), "Undid one edit."));
    this.redo.addEventListener("click", () => this.safely(() => this.editor.redo(), "Redid one edit."));
    find<HTMLButtonElement>("shell-reset").addEventListener("click", () => this.safely(() => this.editor.resetLayers(), "All layers reset; the original remains."));
    find<HTMLButtonElement>("shell-zoom-in").addEventListener("click", () => this.safely(() => this.editor.zoom(this.editor.document.zoom * 1.25)));
    find<HTMLButtonElement>("shell-zoom-out").addEventListener("click", () => this.safely(() => this.editor.zoom(this.editor.document.zoom / 1.25)));
    find<HTMLButtonElement>("shell-zoom-reset").addEventListener("click", () => this.safely(() => this.editor.zoom(1)));
    find<HTMLButtonElement>("shell-download").addEventListener("click", () => { void this.exportPreview(); });
  }
  /** R9 controls: consent, provider hand-off, demo tour, tabs, shortcuts and the keyboard map. */
  private wireR9(): void {
    find<HTMLLabelElement>("shell-consent-adult").nextElementSibling!.textContent = VISIT_STATEMENTS[0].text;
    find<HTMLLabelElement>("shell-consent-understood").nextElementSibling!.textContent = VISIT_STATEMENTS[1].text;
    find<HTMLButtonElement>("shell-consent-cancel").addEventListener("click", () => this.consentModal.close(false));
    find<HTMLButtonElement>("shell-consent-accept").addEventListener("click", () => {
      try {
        appConsent.acceptVisit({ adult: find<HTMLInputElement>("shell-consent-adult").checked,
          understood: find<HTMLInputElement>("shell-consent-understood").checked });
        this.consentModal.close(true);
      } catch (error) { find<HTMLElement>("shell-consent-error").textContent = error instanceof Error ? error.message : String(error); }
    });
    find<HTMLElement>("shell-provider-facts").replaceChildren(...PROVIDER_FACTS.map((fact) => node("li", "", fact)));
    find<HTMLButtonElement>("shell-provider-cancel").addEventListener("click", () => this.providerModal.close(false));
    find<HTMLAnchorElement>("shell-provider-continue").addEventListener("click", () => this.providerModal.close(true));
    find<HTMLButtonElement>("shell-withdraw").addEventListener("click", () => this.safely(() => appConsent.withdraw(),
      "Consent withdrawn for this tab. Local tools and drawn samples still work."));
    const localOnly = find<HTMLInputElement>("shell-local-only");
    localOnly.checked = appConsent.localOnly;
    localOnly.addEventListener("change", () => this.safely(() => appConsent.setLocalOnly(localOnly.checked),
      localOnly.checked ? "On-device only is on: no photo can be sent to YouCam from this tab." : "On-device only is off. Styling still asks before sending a photo."));
    // Demo tour
    const demo = find<HTMLButtonElement>("shell-demo"), bar = find<HTMLElement>("shell-demo-bar"), picker = find<HTMLSelectElement>("shell-demo-scene");
    picker.append(...DEMO_SCENES.map((scene, i) => { const o = node("option", "", `${i + 1}. ${scene.title}`); o.value = scene.id; return o; }));
    demo.addEventListener("click", () => {
      const open = bar.hidden;
      bar.hidden = !open; demo.setAttribute("aria-expanded", String(open));
      if (open && !this.tour.current) this.openDemo(DEMO_SCENES[0].id); else if (open) picker.focus();
    });
    picker.addEventListener("change", () => this.openDemo(picker.value));
    find<HTMLButtonElement>("shell-demo-prev").addEventListener("click", () => this.stepDemo(-1));
    find<HTMLButtonElement>("shell-demo-next").addEventListener("click", () => this.stepDemo(1));
    // Phone panel tabs
    const tablist = find<HTMLElement>("shell-tabs");
    for (const id of PANELS) {
      const tab = find<HTMLButtonElement>(`shell-tab-${id}`);
      tab.textContent = PANEL_LABELS[id];
      tab.addEventListener("click", () => this.tabs.select(id));
    }
    tablist.addEventListener("keydown", (event) => {
      const next = this.tabs.key(event.key);
      if (next) { event.preventDefault(); find<HTMLButtonElement>(`shell-tab-${next}`).focus(); }
    });
    this.tabs.subscribe((id) => { this.renderTabs(); this.announcer.say(`${PANEL_LABELS[id]} panel`); });
    window.matchMedia?.(`(max-width: ${PHONE_MAX}px)`).addEventListener?.("change", () => this.renderTabs());
    this.renderTabs();
    // Shortcuts dialog
    find<HTMLElement>("shell-help-rows").replaceChildren(...SHORTCUTS.map((row) => {
      const tr = node("tr"); const k = node("td"); k.append(node("kbd", "", row.keys));
      tr.append(k, node("td", "", row.does)); tr.dataset.single = String(row.single); return tr;
    }));
    const single = find<HTMLInputElement>("shell-single-keys");
    single.addEventListener("change", () => { this.singleKeys = single.checked;
      this.announcer.say(single.checked ? "Single-key shortcuts on" : "Single-key shortcuts off"); });
    find<HTMLButtonElement>("shell-help-open").addEventListener("click", () => { void this.helpModal.open(); });
    find<HTMLButtonElement>("shell-help-close").addEventListener("click", () => this.helpModal.close(true));
    window.addEventListener("keydown", (event) => this.handleKey(event, "keydown"));
    window.addEventListener("keyup", (event) => this.handleKey(event, "keyup"));
    window.addEventListener("hashchange", () => { const id = parseDemoHash(location.hash); if (id && id !== this.tour.current?.id) this.openDemo(id); });
  }
  private handleKey(event: KeyboardEvent, type: "keydown" | "keyup"): void {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const editable = Boolean(target?.closest("input, select, textarea, [contenteditable='true']"));
    const inDialog = Boolean(target?.closest("[role=dialog]")) || this.consentModal.isOpen || this.providerModal.isOpen || this.helpModal.isOpen;
    // Keys the compare stage used (arrows, Space, loupe zoom) were already handled there.
    if (event.defaultPrevented) return;
    const action = resolveKey({ type, key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey,
      shiftKey: event.shiftKey, repeat: event.repeat, editable, inDialog }, { singleKeys: this.singleKeys, demoActive: !find<HTMLElement>("shell-demo-bar").hidden });
    if (!action) return;
    if (action.type === "escape") {
      if (this.compare.session.state.held) { this.compare.session.hold(false); event.preventDefault(); }
      return;
    }
    event.preventDefault();
    switch (action.type) {
      case "undo": this.safely(() => this.editor.undo(), "Undid one edit."); break;
      case "redo": this.safely(() => this.editor.redo(), "Redid one edit."); break;
      case "studio": this.safely(() => { this.editor.selectStudio(action.id); this.tabs.followTool(); }, `${tool(action.id).title} open.`); break;
      case "compare": this.compare.select(action.mode); break;
      case "compare-step": { const mode = this.compare.session.cycle(action.step); this.compare.select(mode); break; }
      case "hold":
        if (this.compare.session.mode !== "hold") this.compare.session.setMode("hold");
        this.compare.session.hold(action.on); break;
      case "zoom": this.safely(() => this.editor.zoom(this.editor.document.zoom * (action.direction > 0 ? 1.25 : 0.8))); break;
      case "help": void this.helpModal.open(); break;
      case "demo-step": this.stepDemo(action.step); break;
    }
  }
  /** Phone: the panels are tab panels. Wider: they are ordinary regions and the tabs are hidden. */
  private renderTabs(): void {
    const active = this.tabs.active, phone = isPhone(window.innerWidth);
    find<HTMLElement>("shell-editor").dataset.panel = active;
    for (const id of PANELS) {
      const tab = find<HTMLButtonElement>(`shell-tab-${id}`), on = id === active;
      tab.setAttribute("aria-selected", String(on)); tab.tabIndex = on ? 0 : -1;
      const panel = find<HTMLElement>(`shell-panel-${id}`);
      if (phone) { panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", `shell-tab-${id}`); }
      else if (panel.getAttribute("role") === "tabpanel") { panel.removeAttribute("role"); panel.removeAttribute("aria-labelledby"); }
    }
  }
  /** Visit consent first; then the file chooser opens from the same click. */
  private async chooseFile(): Promise<void> {
    if (appConsent.hasVisit) { this.file.click(); return; }
    find<HTMLElement>("shell-consent-error").textContent = "";
    const ok = await this.consentModal.open(find<HTMLInputElement>("shell-consent-adult"));
    if (ok) this.file.click(); else this.inform("No photo opened. Drawn samples need no consent.");
  }
  /** The styling hand-off: what is sent, the pre-check for styling, then a link to the styling screen. */
  private async openProvider(): Promise<void> {
    const studio = this.editor.document.studio;
    const go = find<HTMLAnchorElement>("shell-provider-continue");
    go.href = studio === "makeup" ? "index.html#/tryon" : "index.html#/photo";
    const box = find<HTMLElement>("shell-provider-check");
    go.hidden = appConsent.localOnly;
    if (appConsent.localOnly) {
      box.replaceChildren(node("p", "shell-error", LOCAL_ONLY_REASON));
      const closed = await this.providerModal.open(find<HTMLButtonElement>("shell-provider-cancel"));
      if (!closed) this.inform("On-device only is on. Nothing was sent.");
      return;
    }
    box.replaceChildren(node("p", "shell-small", "Checking this photo for styling on this device…"));
    const ticket = ++this.precheckTicket;
    this.client.precheck(this.editor.source.image, { purpose: "styling", face: this.editor.source.face }).then((report) => {
      if (ticket !== this.precheckTicket) return;
      const list = node("ul", "shell-precheck-list");
      for (const c of report.checks.filter((x) => x.level !== "pass")) {
        const li = node("li", "shell-check-item"); li.dataset.level = c.level; li.textContent = `${c.title}: ${c.message}`; list.append(li);
      }
      box.replaceChildren(node("p", "", this.editor.source.kind === "sample"
        ? "This is a drawn sample. On the styling screen you choose the photo to send."
        : "This photo stays here. On the styling screen you choose the photo to send and tick the box to send it."), list);
    }, () => box.replaceChildren(node("p", "shell-small", "The photo check couldn't run here; the styling screen checks before sending.")));
    const ok = await this.providerModal.open(find<HTMLButtonElement>("shell-provider-cancel"));
    if (!ok) this.inform("Kept editing here. Nothing was sent.");
  }
  /** Measure the new source in the worker, and refresh the strip. */
  /** Refresh everything that depends on the open photo (pre-check, canvas); public for the chrome's panels. */
  afterSource(file?: FileFacts): void {
    const source = this.editor.source, ticket = ++this.precheckTicket;
    this.stripKey = "";
    const details = find<HTMLDetailsElement>("shell-precheck");
    find<HTMLElement>("shell-precheck-summary").textContent = "Checking on this device…";
    find<HTMLElement>("shell-precheck-list").replaceChildren();
    details.hidden = false; details.dataset.verdict = "pending";
    this.client.precheck(source.image, { face: source.face, file }).then((report) => {
      if (ticket !== this.precheckTicket) return;
      const line = renderPrecheck(details, find("shell-precheck-summary"), find("shell-precheck-list"), report);
      this.announcer.say(`Photo check: ${line}`);
    }, (error) => {
      if (ticket !== this.precheckTicket) return;
      find<HTMLElement>("shell-precheck-summary").textContent = `Photo check unavailable: ${error instanceof Error ? error.message : String(error)}`;
    });
    this.draw();
  }
  private openDemo(id: string): void {
    this.safely(() => {
      this.draft = null;
      const result = this.tour.open(id);
      const bar = find<HTMLElement>("shell-demo-bar");
      bar.hidden = false; find<HTMLButtonElement>("shell-demo").setAttribute("aria-expanded", "true");
      find<HTMLSelectElement>("shell-demo-scene").value = result.id;
      find<HTMLElement>("shell-demo-label").textContent = this.tour.label();
      find<HTMLElement>("shell-demo-line").textContent = result.line;
      if (location.hash !== demoHash(result.id)) history.replaceState(null, "", demoHash(result.id));
      this.afterSource();
    }, "Demo scene loaded from a drawn sample. Nothing leaves this device.");
  }
  private stepDemo(step: 1 | -1): void {
    const index = this.tour.position < 0 ? 0 : (this.tour.position + step + this.tour.length) % this.tour.length;
    this.openDemo(DEMO_SCENES[index].id);
  }
  /** studio.html?audit=1: run the accessibility baseline on the live page and report it. */
  runAudit(): void {
    const issues = audit(fromDom(document.documentElement));
    this.inform(issues.length ? `Accessibility check: ${issues.length} issue${issues.length === 1 ? "" : "s"} (details in the console).` : "Accessibility check: no issues found by the baseline rules.");
    document.documentElement.dataset.audit = String(issues.length);
    for (const issue of issues) console.warn(`[audit] ${issue.rule}: ${issue.message} at ${issue.where}`);
  }
  private async exportPreview(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const preview = this.editor.preview();
      const copy = node("canvas");
      paint(copy, preview.image, { label: "Photo simulation · BELJOUR — FULL BEAUTY STUDIO", simulate: this.exportLabel.checked && preview.labels.some((l) => /simulat|photo edit/i.test(l)), zoom: 1 });
      await downloadCanvas(copy);
      this.inform("Image saved from this device. A simulation label is included when the export switch is on.");
    } catch (error) { this.inform(error instanceof Error ? error.message : String(error)); }
    finally { this.busy = false; }
  }
  private renderNavigation(): void {
    this.nav.replaceChildren();
    const active = this.editor.document.studio;
    for (const section of SIDEBAR_SECTIONS) {
      if (!toolsIn(section).length) continue;
      const group = node("section", "shell-nav-group");
      group.append(node("h3", "", section));
      for (const row of toolsIn(section)) {
        const control = button(row.title, () => this.safely(() => { this.editor.selectStudio(row.id); this.tabs.followTool(); }), row.description, "shell-nav-item");
        control.dataset.tool = row.id;
        if (row.id === active) { control.classList.add("is-active"); control.setAttribute("aria-current", "page"); }
        if (row.source === "planned") control.classList.add("is-future");
        control.append(node("span", "shell-nav-status", row.source === "local" ? "On device"
          : row.source === "youcam" ? (appConsent.localOnly ? "Off" : "YouCam") : "Later"));
        group.append(control);
      }
      this.nav.append(group);
    }
  }
  private startMarking(kind: "crown" | "body", view: View = "front", facing: -1 | 1 = 1): void {
    const { width, height } = this.editor.source.image;
    this.draft = new AnnotationDraft(kind, width, height, view, facing);
    this.inform(this.draft.instructions);
    this.draw();
  }
  private renderMarking(): void {
    const bar = find<HTMLElement>("shell-annotation");
    bar.hidden = this.draft === null;
    this.canvas.classList.toggle("shell-marking-canvas", this.draft !== null);
    if (!this.draft) return;
    find<HTMLElement>("shell-mark-next").textContent = this.draft.instructions;
    find<HTMLElement>("shell-mark-progress").textContent = `${this.draft.progress} / ${this.draft.required} points`;
    find<HTMLButtonElement>("shell-mark-undo").disabled = this.draft.progress === 0;
    find<HTMLButtonElement>("shell-mark-clear").disabled = this.draft.progress === 0;
    find<HTMLButtonElement>("shell-mark-commit").disabled = !this.draft.ready;
  }
  private renderIntro(): void {
    const state = this.editor.document, item = tool(state.studio);
    this.toolTitle.textContent = item.title;
    this.toolText.textContent = item.description;
    this.sourceName.textContent = this.editor.source.label;
    this.sample.value = this.editor.source.id.startsWith("sample:") ? this.editor.source.id.slice(7) : defaultSample(state.studio);
    this.layerCount.textContent = `${state.layers.length} layer${state.layers.length === 1 ? "" : "s"}`;
    const ready = readiness(state.studio, this.editor.source);
    this.add.disabled = !ready.ready || item.source !== "local" || this.busy;
    this.add.textContent = ready.ready ? `Add ${item.title} layer` : "Not ready for this photo";
    this.undo.disabled = !this.editor.history.canUndo;
    this.redo.disabled = !this.editor.history.canRedo;
    this.flow.textContent = item.source === "youcam" ? "sent to YouCam, deleted after the result" : "stays on this device";
    this.flow.dataset.scope = item.source;
    this.safety.textContent = item.safety;
    const guidance = find<HTMLElement>("shell-guidance");
    guidance.replaceChildren();
    if (!ready.ready) {
      guidance.append(node("p", "shell-note", ready.reason));
      if (item.source === "local" && this.editor.source.kind === "uploaded" && item.id === "hair-fibre") {
        guidance.append(button("Mark the crown on this photo", () => this.safely(() => {
          this.startMarking("crown");
        }), "Tap the two diagonal corners of an oval above your crown"));
      }
      if (item.source === "local" && this.editor.source.kind === "uploaded" && item.id === "posture") {
        guidance.append(button("Mark front-body points", () => this.safely(() => {
          this.startMarking("body", "front");
        }), "Six ordered landmarks, using the R7 front controls"));
        guidance.append(button("Mark side-body (facing image right)", () => this.safely(() => {
          this.startMarking("body", "side", 1);
        }), "Six ordered landmarks, with face to image right"));
        guidance.append(button("Mark side-body (facing image left)", () => this.safely(() => {
          this.startMarking("body", "side", -1);
        }), "Six ordered landmarks, with face to image left"));
      }
      if (item.source === "local") guidance.append(button("Open the drawn example", () => this.safely(() => {
        this.editor.loadRecommendedSample();
      }, "Matching R7 drawn example loaded; previous layers have been reset."), "Use a drawn photo for this tool"));
      if (item.source === "youcam") {
        guidance.append(button("What is sent, and open the styling screen", () => { void this.openProvider(); },
          "Explains what is sent to YouCam before you go to the styling screen", "shell-button shell-link"));
      }
    }
    // R10: embed the Hair Studio in the EXISTING shell guidance panel. The editor
    // remains the single owner of the source, layer history, compare and Trust Centre.
    // Neither switching studios nor re-rendering sends any photo to the provider.
    if (item.id === "hair-style") {
      const src = this.editor.source;
      this.hairStudio.setContext({ mode: "shell", image: {
        width: src.image.width, height: src.image.height,
        landmarks: src.face?.map((p) => ({ x: p[0], y: p[1] })) ?? null,
        synthetic: src.kind === "sample",
      } });
      guidance.append(this.hairStudio.element);
    }
    if (["older", "younger", "gender", "beard"].includes(item.id)) guidance.append(heroAppearanceScreen(this.editor, () => this.draw()));
    if (item.id === "lighting") guidance.append(lightingScreen(this.editor, () => this.draw()));
    if (item.id === "recolour") guidance.append(recolourScreen(this.editor, () => this.draw()));
    if (item.id === "balayage") guidance.append(balayageScreen(this.editor, () => this.draw()));
    if (item.id === "skin") guidance.append(skinToolsScreen(this.editor, () => this.draw()));
    if (item.id === "studio") guidance.append(photoStudioScreen(this.editor, () => this.draw()));
    if (item.id === "illustration") guidance.append(illustrationScreen(this.editor, () => this.draw()));
    const evidence = documentEvidence(this.editor.source, state.layers);
    find<HTMLElement>("shell-provenance").textContent = evidence.badges.join(" · ");
    find<HTMLElement>("shell-provenance").title = evidence.warnings.join(" ") || "Local photo editing only";
    find<HTMLElement>("shell-simulation").hidden = evidence.simulationCount === 0;
  }
  private renderLayers(): void {
    this.layers.replaceChildren();
    const state = this.editor.document;
    if (!state.layers.length) {
      this.layers.append(node("p", "shell-empty", "No edits yet. Add a tool layer to start a reversible preview."));
      return;
    }
    // Top of stack is visually first; order in the model is still bottom to top.
    [...state.layers].reverse().forEach((item, visualIndex) => {
      const index = state.layers.length - 1 - visualIndex;
      const row = node("li", "shell-layer");
      if (state.selected === item.id) row.classList.add("is-selected");
      row.dataset.layerId = item.id;
      const top = node("div", "shell-layer-top");
      const visible = check("", item.enabled, () => this.safely(() => this.editor.toggle(item.id), item.enabled ? "Layer hidden." : "Layer shown."));
      // R9: name the checkbox itself (a label's aria-label doesn't name the input inside it).
      visible.classList.add("shell-layer-eye"); visible.querySelector("input")?.setAttribute("aria-label", `Show ${item.name}`);
      const name = button(item.name, () => this.safely(() => this.editor.choose(item.id)), `Select ${item.name}`, "shell-layer-title");
      name.setAttribute("aria-pressed", String(state.selected === item.id));
      name.setAttribute("aria-label", `${item.name}, layer ${visualIndex + 1} of ${state.layers.length} from the top, ${item.enabled ? "shown" : "hidden"}, strength ${Math.round(item.strength)}%`);
      top.append(visible, name);
      const record = documentEvidence(this.editor.source, state.layers).layers[index];
      const detail = node("span", "shell-layer-origin", record.display);
      detail.title = record.scope === "on-device" ? "stays on this device" :
        record.scope === "provider" ? "sent to YouCam, deleted after the result" : "not built this round";
      const actions = node("div", "shell-layer-actions");
      const up = button("↑", () => this.safely(() => this.editor.move(item.id, 1)), "Move up", "shell-mini");
      const down = button("↓", () => this.safely(() => this.editor.move(item.id, -1)), "Move down", "shell-mini");
      up.disabled = index === state.layers.length - 1; down.disabled = index === 0;
      up.setAttribute("aria-label", `Move ${item.name} up`); down.setAttribute("aria-label", `Move ${item.name} down`);
      const remove = button("×", () => this.safely(() => this.editor.remove(item.id)), "Delete layer", "shell-mini shell-remove");
      remove.setAttribute("aria-label", `Delete ${item.name}`);
      actions.append(up, down, remove);
      row.append(top, detail, actions);
      this.layers.append(row);
    });
  }
  private renderHistory(): void {
    this.history.replaceChildren();
    for (const item of this.editor.history.timeline) {
      const el = button(`${item.index + 1}  ${item.label}`,
        () => this.safely(() => this.editor.jump(item.index)), `Jump to ${item.label}`, "shell-history-item");
      if (item.active) { el.classList.add("is-active"); el.setAttribute("aria-current", "step"); }
      this.history.append(el);
    }
  }
  private renderSettings(): void {
    const layer = this.editor.selected;
    this.settings.replaceChildren();
    if (!layer) {
      this.settings.append(node("p", "shell-empty", "Select a layer to adjust strength, named stops, options and opacity."));
      return;
    }
    const set = (changes: Partial<Pick<ShellLayer, "strength" | "opacity">>, label: string) => this.safely(() => this.editor.update(layer.id, changes, label));
    const param = (name: string, value: ParamValue) => this.safely(() => this.editor.param(layer.id, name, value));
    const strength = node("section", "shell-controls");
    strength.append(node("h3", "", "Strength"),
      effectStrengthControl(
        `Effect · ${strengthName(layer.kind as "enhance" | "posture" | "hair-fibre" | "beard" | "filters", layer.strength)}`,
        layer.strength,
        (value) => set({ strength: value }, "Adjust strength"),
      ));
    const buttons = node("div", "shell-stop-row");
    for (const stop of stopsFor(layer.kind as "enhance" | "posture" | "hair-fibre" | "beard" | "filters")) {
      const el = button(stop.name, () => set({ strength: stop.value }, `Strength: ${stop.name}`), `Set ${stop.value}%`, "shell-stop");
      if (Math.abs(layer.strength - stop.value) < 0.001) el.classList.add("is-active");
      buttons.append(el);
    }
    strength.append(buttons, percent("Layer opacity", Math.round(layer.opacity * 100), 0, 100, 1,
      (value) => set({ opacity: value / 100 }, "Adjust layer opacity")));
    this.settings.append(strength);
    const settings = node("section", "shell-controls"); settings.append(node("h3", "", "Tool options"));
    if (layer.kind === "enhance") {
      settings.append(labelled("Enhance mode", select(Object.keys(MODES).map((m) => ({ value: m, label: m.replaceAll("_", " ") })),
        getParam(layer, "mode", "natural"), (v) => param("mode", v))));
      const steps = node("div", "shell-step-grid");
      for (const step of ENHANCE_STEPS) steps.append(check(step.replaceAll("_", " "), layer.parameters[step] !== false, (v) => param(step, v)));
      settings.append(node("p", "shell-hint", "Choose which steps of the R7 analysis pipeline run."), steps);
    }
    if (layer.kind === "older" || layer.kind === "younger") {
      settings.append(percent("Appearance stop", getNumber(layer, "stop", 1), 1, layer.kind === "older" ? 5 : 3, 1, n => param("stop", n), ""));
    }
    if (layer.kind === "gender") {
      settings.append(percent("Feminine to masculine appearance", getNumber(layer, "slider", -33), -100, 100, 1, n => param("slider", n), ""),
        node("p", "shell-hint", "Face-only simulation. Original is 0. Hair and makeup stay as they are."));
    }
    if (layer.kind === "beard") {
      settings.append(labelled("Style", select(Object.keys(STYLES).map((s) => ({ value: s, label: s.replaceAll("_", " ") })),
        getParam(layer, "style", "stubble"), (v) => param("style", v))));
      settings.append(percent("Length", getNumber(layer, "length", 3), 1, 5, 1, (n) => param("length", n), "/5"));
      const colour = node("input", "shell-colour") as HTMLInputElement;
      colour.type = "color"; colour.value = getParam(layer, "colour", "#3B2A22");
      colour.addEventListener("change", () => param("colour", colour.value));
      settings.append(labelled("Strand colour", colour));
      settings.append(node("p", "shell-hint", "Strength sets strand density (1–4). No real beard is grown."));
    }
    if (layer.kind === "hair-fibre") {
      settings.append(labelled("Product", select(PRODUCTS.map((v) => ({ value: v, label: v })),
        getParam(layer, "product", "fibres"), (v) => param("product", v))));
      settings.append(node("p", "shell-hint", "The R7 6-zone crown reading picks a shade and the strand renderer. Coverage is a photo simulation, not a diagnosis."));
    }
    if (layer.kind === "filters") {
      const spec = filterControls(layer);
      settings.append(labelled("Look", select(spec.looks, spec.recipe, (v) => this.safely(() =>
        this.editor.applyOption("filters", spec.paramsFor(v), spec.labelFor(v))))));
      if (spec.presets.length > 1) settings.append(labelled("Variant", select(spec.presets, spec.preset, (v) => param("preset", v))));
      const toggles = node("div", "shell-step-grid");
      for (const t of spec.toggles) toggles.append(check(t.label, t.value, (v) => param(t.key, v)));
      settings.append(toggles);
      settings.append(percent("Fade add-on", spec.fade, 0, 100, 1, (n) => param("addon_fade", n)));
      settings.append(node("p", "shell-hint", spec.hint));
    }
    if (layer.kind === "portrait") {
      const looks = portraitOptions();
      settings.append(labelled("Portrait look", select(looks.map((o) => ({ value: o.look, label: `${o.label} · ${o.description}` })),
        getParam(layer, "look", looks[0].look), (v) => this.safely(() =>
          this.editor.applyOption("portrait", { look: v }, looks.find((o) => o.look === v)?.label ?? v)))));
      settings.append(node("p", "shell-hint", PORTRAIT_LABEL));
    }
    if (layer.kind === "lighting") {
      settings.append(labelled("Lighting preset", select(presetIds().map(id => ({ value: id, label: preset(id).label })),
        getParam(layer, "preset", "daylight"), value => param("preset", value))));
      settings.append(node("p", "shell-hint", "Local simulation. Screen calibration and product spectra are not known."));
    }
    if (layer.kind === "recolour") {
      const colour = node("input", "shell-colour") as HTMLInputElement;
      colour.type = "color"; colour.value = getParam(layer, "colour", "#6B3F2A");
      colour.addEventListener("change", () => param("colour", colour.value));
      settings.append(labelled("Target hair colour", colour), labelled("Curl pattern (your description)",
        select(CURL_PATTERNS.map(value => ({ value, label: value })), getParam(layer, "curl_pattern", "not specified"), value => param("curl_pattern", value))));
    }
    if (layer.kind === "balayage") {
      settings.append(labelled("Target hair level", select(LEVELS.levels.map(row => ({ value: String(row.level), label: `${row.level} · ${row.name}` })),
        String(getNumber(layer, "target_level", 7)), value => param("target_level", Number(value)))));
      settings.append(labelled("Colour history", select([
        { value: "virgin", label: "Never coloured" }, { value: "colour_treated", label: "Previously coloured" }, { value: "box_dye", label: "Box dye" }],
        getParam(layer, "history", "colour_treated"), value => param("history", value))));
      settings.append(labelled("Toner estimate", select(Object.keys(LEVELS.toners).map(value => ({ value, label: value })),
        getParam(layer, "toner", "none"), value => param("toner", value))));
      settings.append(node("p", "shell-hint", "Local simulation of the first session; change the placement in the tool panel."));
    }
    if (layer.kind === "skin") {
      const skinTool = getParam(layer, "tool", "tone");
      settings.append(labelled("Skin tool", select(SKIN_TOOLS.map((value) => ({ value, label: SKIN_TOOL_NAMES[value] })), skinTool, (v) => param("tool", v))));
      if (skinTool === "glow") settings.append(labelled("Glow look", select(Object.entries(GLOWS).map(([value, look]) => ({ value, label: look.name })),
        getParam(layer, "style", "cassis"), (v) => param("style", v))));
      if (skinTool === "freckles") settings.append(percent("Freckle density", getNumber(layer, "density", 50), 0, 100, 1, (n) => param("density", n)));
      if (skinTool === "tone") settings.append(percent("Redness", getNumber(layer, "redness", 50), 0, 100, 1, (n) => param("redness", n)));
      if (skinTool === "tan") {
        const allowed = layer.parameters.allow_lightening === true;
        settings.append(labelled("Undertone", select(Object.keys(UNDERTONES).map((value) => ({ value, label: value })),
          getParam(layer, "undertone", "neutral"), (v) => param("undertone", v))));
        settings.append(check("I choose to lighten my skin (tan removal)", allowed, (on) => this.safely(() => {
          if (!on) this.editor.param(layer.id, "direction", "add");
          this.editor.param(layer.id, "allow_lightening", on);
        })));
        if (allowed) settings.append(labelled("Tan", select([{ value: "add", label: "Add a tan" }, { value: "remove", label: "Remove a tan (lightens)" }],
          getParam(layer, "direction", "add"), (v) => param("direction", v))));
      }
      settings.append(node("p", "shell-hint", "Local simulation, not medical advice. Only tan removal lightens skin, and only when you tick the box."));
    }
    if (layer.kind === "studio") {
      const tool = getParam(layer, "tool", "blur");
      settings.append(labelled("Studio tool", select(STUDIO_LAYER_TOOLS.map((value) => ({ value, label: STUDIO_TOOL_NAMES[value] })), tool, (v) => param("tool", v))));
      if (tool === "replace") settings.append(labelled("Backdrop", select(Object.values(BACKDROPS).map((b) => ({ value: b.id, label: b.name })),
        getParam(layer, "backdrop", "chinon"), (v) => param("backdrop", v))));
      if (tool === "relight") settings.append(labelled("Light from", select(Object.keys(SIDES).map((value) => ({ value, label: value.replace("-", " ") })),
        getParam(layer, "side", "upper-left"), (v) => param("side", v))));
      if (tool === "headshot") settings.append(labelled("Industry", select(Object.values(INDUSTRIES).map((row) => ({ value: row.id, label: row.name })),
        getParam(layer, "industry", "technology"), (v) => param("industry", v))));
      settings.append(node("p", "shell-hint", "Edited photo, not generated. Relight and authenticity mode keep your face's average brightness."));
    }
    if (layer.kind === "illustration") {
      settings.append(labelled("Look", select(Object.entries(ILLUSTRATION_LOOKS).map(([value, row]) => ({ value, label: row.name })),
        getParam(layer, "look", "sancerre-cartoon"), (v) => param("look", v))));
      settings.append(node("p", "shell-hint", "Illustration filter on your own photo; your face shape is unchanged."));
    }
    if (layer.kind === "under-eye") {
      settings.append(check("Include eye-bag shadow", layer.parameters.include_bags !== false, (v) => param("include_bags", v)));
      settings.append(node("p", "shell-hint", "Brought toward your own cheek colour, never past it. Nothing changes when there is no dark circle. Not medical advice."));
    }
    if (layer.kind === "teeth") settings.append(node("p", "shell-hint", "A natural cap: teeth go a few shades lighter and keep their warmth. Nothing changes when the mouth is closed. Not dental advice."));
    if (layer.kind === "shave") settings.append(node("p", "shell-hint", "Stubble and short beards only. Skin under the hair is estimated from the skin beside it; nothing is lifted past your cheek."));
    if (layer.kind === "grey") {
      settings.append(labelled("Stage", select([{ value: "cover", label: "Cover greys" }, { value: "blend", label: "Blend greys" }, { value: "silver", label: "Go silver" }],
        getParam(layer, "stage", "cover"), (v) => param("stage", v))));
      settings.append(node("p", "shell-hint", "Grey Transition: a salon-decision preview inside the hair you marked. No age is asked or inferred."));
    }
    if (layer.kind === "posture") {
      settings.append(labelled("Photo edit", select(fixesFor(this.editor.source.body!.view).map((v) => ({ value: v, label: v.replaceAll("_", " ") })),
        getParam(layer, "fix", "lean"), (v) => param("fix", v))));
      settings.append(percent("Body band width", Math.round(getNumber(layer, "band_share", POSTURE_DEFAULTS.bandShare) * 100), 1, 10, 1,
        (value) => param("band_share", value / 100)));
      settings.append(percent("Movement cap", Math.round(getNumber(layer, "cap_share", POSTURE_DEFAULTS.capShare) * 100), 1, 12, 1,
        (value) => param("cap_share", value / 100)));
      settings.append(node("p", "shell-hint", "Default: 3% body band and 6% movement cap. Fold safety may reduce actual strength. Photo edit, not medical advice."));
    }
    this.settings.append(settings);
  }
  private showCanvas(): void {
    this.compare.suspended = this.draft !== null;
    if (!this.draft) {
      try { this.compare.refresh(); }
      catch (error) { this.inform(error instanceof Error ? error.message : String(error)); this.stage.dataset.preview = "error"; return; }
      this.stage.dataset.preview = this.editor.document.layers.some((l) => l.enabled) ? "edited" : "original";
      return;
    }
    const ticket = ++this.pending;
    try {
      const result = this.editor.preview();
      if (ticket !== this.pending) return;
      const simulate = result.labels.some((l) => /simulat|photo edit/i.test(l));
      paint(this.canvas, result.image, { zoom: this.editor.document.zoom,
        label: "Photo simulation · BELJOUR — FULL BEAUTY STUDIO", simulate });
      find<HTMLElement>("shell-measure").textContent = result.effective
        ? `${result.effective} active edit${result.effective === 1 ? "" : "s"} · ${pixelsChanged(this.editor.source.image, result.image).percent.toFixed(1)}% of pixels changed`
        : "Original — no active edits";
      this.stage.dataset.preview = result.effective ? "edited" : "original";
      if (this.draft) drawMarks(this.canvas, this.draft);
    } catch (error) {
      this.inform(error instanceof Error ? error.message : String(error));
      paint(this.canvas, this.editor.source.image, { zoom: this.editor.document.zoom });
      this.stage.dataset.preview = "error";
      if (this.draft) drawMarks(this.canvas, this.draft);
    }
  }
  private renderStrip(): void {
    const key = `${this.editor.source.id}|${this.editor.source.geometryRevision ?? 0}|${this.editor.document.studio}|${this.editor.source.crown ? 1 : 0}|${this.editor.source.body?.view ?? ""}`;
    if (key !== this.stripKey) { this.stripKey = key; this.strip.show(this.editor.document.studio, this.editor.source, this.editor.selected); }
    else this.strip.select(this.editor.selected);
  }
  draw(): void {
    this.renderNavigation(); this.renderIntro(); this.renderLayers(); this.renderSettings(); this.renderHistory();
    this.renderMarking();
    this.status.textContent = this.lastMessage;
    this.showCanvas();
    this.renderStrip();
  }
}

export function mountShell(): ShellView { return new ShellView(); }
