/** Compare toolbar and stage on the studio page (DOM). The arithmetic lives in compare*.ts;
 * this file wires buttons, pointer and keys to it and paints the result.
 *
 * - The ten modes are a radio group: one Tab stop, arrow keys move, digits 1–0 jump.
 * - The stage canvas is focusable; its arrow keys move the split line or the loupe.
 * - Grid modes render their frames in the shell worker, so nine renders don't freeze the page.
 * - Flicker only animates when the person hasn't asked for reduced motion.
 * - Nothing here touches the network or the undo history (a stop-grid tap is a normal edit).
 *
 * Author: John Khan.
 */
import { toRGBA } from "../../engines/core/buffer.js";
import { label as drawLabel, downloadCanvas } from "./canvas.js";
import { COMPARE_MODES, type CompareMode, MODE_INFO, splitOrientation, stopGridValues } from "./compare.js";
import { type Frame, stacksFor, targetLayer } from "./compare-frames.js";
import { type Box, PHONE_MAX, stageBox } from "./compare-layout.js";
import { type CompareView, renderCompare } from "./compare-render.js";
import { CompareSession, LOUPE_ZOOMS, type LoupeZoom } from "./compare-session.js";
import type { Editor } from "./controller.js";
import { roving } from "./focus.js";
import { stopsFor } from "./stops.js";
import type { LocalKind } from "./types.js";
import type { ShellClient } from "./worker-protocol.js";

export interface CompareElements {
  modes: HTMLElement; controls: HTMLElement; canvas: HTMLCanvasElement; scroll: HTMLElement;
  description: HTMLElement; measure: HTMLElement; board: HTMLButtonElement; hold: HTMLButtonElement; stage: HTMLElement;
}
export interface CompareHooks {
  client: ShellClient; threaded: boolean;
  announce(text: string): void;
  status(text: string): void;
  zoom(): number;
  exportLabel(): boolean;
  /** Called after a stop-grid tap changes the document. */
  edited(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag); if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

const measureCtx = (() => {
  let ctx: CanvasRenderingContext2D | null = null;
  return (text: string, font: number) => {
    ctx ??= document.createElement("canvas").getContext("2d");
    if (!ctx) return text.length * font * 0.6;
    ctx.font = `600 ${font}px system-ui, sans-serif`;
    return ctx.measureText(text).width;
  };
})();

/** Write a board's captions, centred under each pane, in the theme's ink colour. */
function drawCaptions(ctx: CanvasRenderingContext2D, view: CompareView): void {
  ctx.save();
  ctx.fillStyle = "#16202E"; ctx.textBaseline = "top"; ctx.textAlign = "center";
  for (const caption of view.captions) {
    ctx.font = `600 ${caption.fontPx}px system-ui, sans-serif`;
    caption.lines.forEach((line, i) => ctx.fillText(line, caption.x, caption.y + i * caption.lineHeight, caption.width));
  }
  ctx.restore();
}

export class CompareController {
  readonly session: CompareSession;
  private view: CompareView | null = null;
  private frames: Frame[] | null = null;
  private framesKey = "";
  private ticket = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private started = performance.now();
  private drag: { id: number; x: number; y: number; loupe: { x: number; y: number; zoom: number } } | null = null;
  private builtFor: CompareMode | null = null;
  private readonly gridCache = new Map<string, Frame[]>();
  /** When true (annotation drafting), the stage is owned by the marking tool. */
  suspended = false;

  constructor(private readonly editor: Editor, private readonly els: CompareElements, private readonly hooks: CompareHooks,
    reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    this.session = new CompareSession({}, reducedMotion);
    this.buildModes();
    this.session.subscribe(() => this.refresh());
    this.wireStage();
  }

  get reducedMotion(): boolean { return this.session.reducedMotion; }

  private buildModes(): void {
    const group = this.els.modes;
    group.replaceChildren();
    for (const mode of COMPARE_MODES) {
      const info = MODE_INFO[mode];
      const b = el("button", "shell-mode");
      b.type = "button"; b.setAttribute("role", "radio"); b.dataset.mode = mode;
      b.setAttribute("aria-keyshortcuts", info.key); b.title = `${info.summary} (key ${info.key})`;
      b.append(el("span", "shell-mode-title", info.title));
      const key = el("span", "shell-mode-key", info.key); key.setAttribute("aria-hidden", "true"); b.append(key);
      b.addEventListener("click", () => this.select(mode));
      group.append(b);
    }
    this.syncModes();
    roving(group, "[role=radio]", "horizontal", (item) => this.select(item.dataset.mode as CompareMode));
  }

  private syncModes(): void {
    for (const b of this.els.modes.querySelectorAll<HTMLButtonElement>("[role=radio]")) {
      const on = b.dataset.mode === this.session.mode;
      b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1;
      b.classList.toggle("is-active", on);
    }
  }

  select(mode: CompareMode): void {
    this.session.setMode(mode);
    this.hooks.announce(`${MODE_INFO[mode].title}. ${MODE_INFO[mode].summary}`);
  }

  private controlRange(label: string, min: number, max: number, step: number, value: number, text: (v: number) => string,
    onInput: (v: number) => void, key: string): HTMLElement {
    const wrap = el("label", "shell-compare-field");
    const range = el("input", "shell-range") as HTMLInputElement;
    range.type = "range"; range.min = String(min); range.max = String(max); range.step = String(step); range.value = String(value);
    range.dataset.control = key; range.setAttribute("aria-valuetext", text(value));
    const out = el("output", "shell-range-output", text(value));
    range.addEventListener("input", () => { const v = Number(range.value); out.textContent = text(v); range.setAttribute("aria-valuetext", text(v)); onInput(v); });
    wrap.append(el("span", "shell-field-name", label), range, out);
    return wrap;
  }

  /** Per-mode controls; rebuilt only when the mode changes so keyboard focus isn't lost. */
  private buildControls(): void {
    const mode = this.session.mode, s = this.session.state, box = this.els.controls;
    box.replaceChildren();
    this.builtFor = mode;
    const split = splitOrientation(mode);
    if (mode === "hold") box.append(el("p", "shell-compare-note", "Press and hold the picture or the Hold button. Space toggles it from the keyboard."));
    if (split) {
      box.append(this.controlRange(split === "horizontal" ? "Line, from the top" : "Line position", 0, 100, 1, Math.round(s.position * 100),
        (v) => `${v}% original`, (v) => this.session.setPosition(v / 100), "position"));
    }
    if (mode === "flicker") {
      const play = el("button", "shell-button", s.playing ? "Pause" : "Play");
      play.type = "button"; play.dataset.control = "play";
      play.disabled = this.reducedMotion;
      play.addEventListener("click", () => { this.session.togglePlay(); });
      const swap = el("button", "shell-button", "Switch picture");
      swap.type = "button"; swap.addEventListener("click", () => { this.session.toggleManual(); this.hooks.announce(this.session.describe()); });
      box.append(play, swap, this.controlRange("Speed", 400, 3000, 100, s.flickerMs, (v) => `${(v / 1000).toFixed(1)} s each`,
        (v) => this.session.setFlickerMs(v), "speed"));
      if (this.reducedMotion) box.append(el("p", "shell-compare-note", "Reduced motion is on, so the picture changes only when you press Space or Switch picture."));
    }
    if (mode === "loupe") {
      const wrap = el("label", "shell-compare-field");
      const zoom = el("select", "shell-select") as HTMLSelectElement;
      zoom.dataset.control = "zoom";
      for (const z of LOUPE_ZOOMS) { const o = el("option", "", `${z}×`); o.value = String(z); zoom.append(o); }
      zoom.value = String(s.loupe.zoom);
      zoom.addEventListener("change", () => this.session.setLoupeZoom(Number(zoom.value) as LoupeZoom));
      wrap.append(el("span", "shell-field-name", "Magnify"), zoom);
      const centre = el("button", "shell-button", "Centre");
      centre.type = "button"; centre.addEventListener("click", () => this.session.setLoupe(0.5, 0.5));
      box.append(wrap, centre, el("p", "shell-compare-note", "Drag the picture or use the arrow keys to move the loupe."));
    }
    if (mode === "difference") {
      box.append(this.controlRange("Sensitivity", 1, 16, 1, s.differenceGain, (v) => `${v}×`, (v) => this.session.setGain(v), "gain"));
      const legend = el("p", "shell-legend");
      const ramp = el("span", "shell-legend-ramp"); ramp.setAttribute("aria-hidden", "true");
      legend.append(el("span", "shell-legend-low", "Blue: small change"), ramp, el("span", "shell-legend-high", "Red: large change"));
      box.append(legend);
    }
    if (mode === "stop-grid") box.append(el("p", "shell-compare-note", "Tap a picture to use that strength. The real layer changes only when you tap."));
    if (mode === "grid-2x2") box.append(el("p", "shell-compare-note", "The selected layer is the one studied. Select another in the layer stack."));
    this.els.board.hidden = !MODE_INFO[mode].board;
  }

  private syncControls(): void {
    const s = this.session.state;
    const position = this.els.controls.querySelector<HTMLInputElement>("[data-control=position]");
    if (position && document.activeElement !== position) { position.value = String(Math.round(s.position * 100)); position.setAttribute("aria-valuetext", `${Math.round(s.position * 100)}% original`); }
    const play = this.els.controls.querySelector<HTMLButtonElement>("[data-control=play]");
    if (play) { play.textContent = s.playing ? "Pause" : "Play"; play.setAttribute("aria-pressed", String(s.playing)); }
    const zoom = this.els.controls.querySelector<HTMLSelectElement>("[data-control=zoom]");
    if (zoom) zoom.value = String(s.loupe.zoom);
    this.els.hold.setAttribute("aria-pressed", String(s.held));
  }

  private box(): { box: Box; phone: boolean } {
    const phone = window.innerWidth <= PHONE_MAX;
    // The stage may grow to its CSS max-height, so fit to that rather than to its current size.
    const cs = getComputedStyle(this.els.scroll), px = (v: string) => Number.parseFloat(v) || 0;
    const maxH = Number.parseFloat(cs.maxHeight);
    const width = this.els.scroll.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight);
    const height = (Number.isFinite(maxH) ? maxH : this.els.scroll.clientHeight) - px(cs.paddingTop) - px(cs.paddingBottom);
    if (width >= 96 && height >= 64) return { box: { width, height: Math.max(height, phone ? 260 : 300) }, phone };
    return stageBox(Math.max(280, window.innerWidth), Math.max(320, window.innerHeight));
  }

  private key(): string {
    const doc = this.editor.document, info = MODE_INFO[this.session.mode];
    return JSON.stringify([this.editor.source.id, this.editor.renderVersion, info.inputs === "pair" ? "pair" : this.session.mode, doc.layers, info.inputs === "pair" ? null : doc.selected]);
  }

  /** Recompute frames if the document changed, then paint. */
  refresh(): void {
    if (this.builtFor !== this.session.mode) { this.buildControls(); this.syncModes(); }
    this.syncControls();
    this.schedule();
    if (this.suspended) return;
    const key = this.key(), mode = this.session.mode, info = MODE_INFO[mode];
    if (key === this.framesKey && this.frames) { this.paint(); return; }
    const ticket = ++this.ticket;
    if (info.inputs === "pair") {
      this.frames = this.editor.frames(mode); this.framesKey = key; this.paint(); return;
    }
    const cached = this.gridCache.get(key);
    if (cached) { this.frames = cached; this.framesKey = key; this.paint(); return; }
    let count = 0;
    try { count = stacksFor(mode, this.editor.document.layers, this.editor.document.selected).length; }
    catch (error) { this.showMessage(error instanceof Error ? error.message : String(error)); return; }
    this.hooks.status(`Rendering ${count} previews on this device…`);
    this.els.stage.setAttribute("aria-busy", "true");
    const done = (frames: Frame[]) => {
      if (ticket !== this.ticket) return;
      this.gridCache.set(key, frames);
      if (this.gridCache.size > 8) this.gridCache.delete(this.gridCache.keys().next().value as string);
      this.frames = frames; this.framesKey = key;
      this.els.stage.removeAttribute("aria-busy");
      this.paint();
      this.hooks.status(`${MODE_INFO[mode].title}: ${count} previews ready.`);
    };
    const fail = (error: unknown) => {
      if (ticket !== this.ticket) return;
      this.els.stage.removeAttribute("aria-busy");
      this.showMessage(error instanceof Error ? error.message : String(error));
    };
    if (this.hooks.threaded) {
      const doc = this.editor.document;
      this.hooks.client.frames(this.editor.source, doc.layers, doc.selected, mode).then(done, fail);
    } else {
      setTimeout(() => { try { done(this.editor.frames(mode)); } catch (error) { fail(error); } }, 0);
    }
  }

  private showMessage(text: string): void {
    this.view = null; this.frames = null; this.framesKey = "";
    this.hooks.status(text);
    this.els.measure.textContent = text;
    this.els.description.textContent = text;
  }

  private schedule(): void {
    const s = this.session.state;
    const want = s.mode === "flicker" && s.playing && !this.reducedMotion && !this.suspended;
    if (!want && this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    if (want && this.timer === null) {
      this.started = performance.now();
      this.timer = setInterval(() => { if (!document.hidden) this.paint(); }, Math.max(100, Math.round(s.flickerMs / 2)));
    }
  }

  /** Paint the current view at its display scale, with captions and the simulation label. */
  paint(): void {
    if (this.suspended || !this.frames) return;
    const { box, phone } = this.box();
    let view: CompareView;
    try { view = renderCompare(this.session.state, this.frames, { box, phone, elapsedMs: performance.now() - this.started, measure: measureCtx }); }
    catch (error) { this.showMessage(error instanceof Error ? error.message : String(error)); return; }
    this.view = view;
    const canvas = this.els.canvas, ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D canvas is not supported");
    canvas.width = view.image.width; canvas.height = view.image.height;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(toRGBA(view.image)), view.image.width, view.image.height), 0, 0);
    drawCaptions(ctx, view);
    if (view.simulation) drawLabel(ctx, view.image.width, view.image.height, "Photo simulation · BELJOUR — FULL BEAUTY STUDIO");
    const single = MODE_INFO[this.session.mode].inputs === "pair" && !["side-by-side", "loupe"].includes(this.session.mode);
    const scale = view.layout.displayScale * (single ? this.hooks.zoom() : 1);
    canvas.style.width = `${Math.round(view.image.width * scale)}px`;
    canvas.style.height = `${Math.round(view.image.height * scale)}px`;
    canvas.setAttribute("aria-label", `${MODE_INFO[this.session.mode].title} compare of the ${this.editor.source.kind === "sample" ? "drawn sample" : "photo on this device"}`);
    this.els.description.textContent = view.description;
    this.els.measure.textContent = view.status;
    this.els.stage.dataset.compare = this.session.mode;
  }

  private unitPoint(event: PointerEvent): [number, number] {
    const r = this.els.canvas.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (event.clientX - r.left) / Math.max(1, r.width))), Math.min(1, Math.max(0, (event.clientY - r.top) / Math.max(1, r.height)))];
  }

  private wireStage(): void {
    const canvas = this.els.canvas;
    canvas.addEventListener("pointerdown", (event) => {
      if (this.suspended || event.button !== 0) return;
      const mode = this.session.mode, split = splitOrientation(mode);
      const [ux, uy] = this.unitPoint(event);
      if (mode === "hold") { this.session.hold(true); canvas.setPointerCapture(event.pointerId); event.preventDefault(); return; }
      if (split) {
        this.session.setPosition(split === "vertical" ? ux : split === "horizontal" ? uy : (ux + uy) / 2);
        this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, loupe: this.session.state.loupe };
        canvas.setPointerCapture(event.pointerId); event.preventDefault(); return;
      }
      if (mode === "loupe") {
        this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, loupe: { ...this.session.state.loupe } };
        canvas.setPointerCapture(event.pointerId); event.preventDefault(); return;
      }
      if (mode === "flicker") { this.session.toggleManual(); this.hooks.announce(this.session.describe()); return; }
      if (mode === "stop-grid") this.tapStop(event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!this.drag || this.drag.id !== event.pointerId) return;
      const mode = this.session.mode, split = splitOrientation(mode);
      if (split) { const [ux, uy] = this.unitPoint(event); this.session.setPosition(split === "vertical" ? ux : split === "horizontal" ? uy : (ux + uy) / 2); return; }
      if (mode === "loupe" && this.frames) {
        // Drag pans the loupe: one CSS pixel moves 1 / (zoom × display scale) photo pixels.
        const r = canvas.getBoundingClientRect(), w = this.frames[0].image.width, h = this.frames[0].image.height;
        const cssScale = r.width / Math.max(1, this.view?.layout.width ?? r.width), zoom = this.drag.loupe.zoom;
        this.session.setLoupe(this.drag.loupe.x - (event.clientX - this.drag.x) / (zoom * cssScale) / w,
          this.drag.loupe.y - (event.clientY - this.drag.y) / (zoom * cssScale) / h);
      }
    });
    const end = (event: PointerEvent) => {
      if (this.session.mode === "hold" && this.session.state.held && event.type !== "pointermove") this.session.hold(false);
      if (this.drag?.id === event.pointerId) {
        this.drag = null;
        if (splitOrientation(this.session.mode)) this.hooks.announce(`Line at ${Math.round(this.session.state.position * 100)}%`);
      }
    };
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"] as const) canvas.addEventListener(name, end);
    canvas.addEventListener("keydown", (event) => {
      if (this.suspended) return;
      const out = this.session.key(event);
      if (out.handled) { event.preventDefault(); event.stopPropagation(); if (out.announce) this.hooks.announce(out.announce); }
    });
    // The R8 Hold button: hold with a pointer, toggle with the keyboard (a click with detail 0).
    const hold = this.els.hold;
    hold.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (this.session.mode !== "hold") this.session.setMode("hold");
      this.session.hold(true);
    });
    for (const name of ["pointerup", "pointerleave", "pointercancel"] as const) hold.addEventListener(name, () => { if (this.session.state.held) this.session.hold(false); });
    hold.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      if (this.session.mode !== "hold") this.session.setMode("hold");
      this.session.hold(!this.session.state.held);
      this.hooks.announce(this.session.describe());
    });
    this.els.board.addEventListener("click", () => { void this.saveBoard(); });
    window.addEventListener("resize", () => { if (!this.suspended) this.paint(); });
  }

  /** Stop grid: tapping a pane sets the target layer to that strength (one undoable edit). */
  private tapStop(event: PointerEvent): void {
    if (!this.view) return;
    const r = this.els.canvas.getBoundingClientRect(), scale = r.width / Math.max(1, this.view.layout.width);
    const x = (event.clientX - r.left) / scale, y = (event.clientY - r.top) / scale;
    const pane = this.view.layout.panes.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h + p.captionH);
    const doc = this.editor.document, target = targetLayer(doc.layers, doc.selected);
    if (!pane || !target) return;
    const value = stopGridValues(stopsFor(target.kind as LocalKind))[pane.frame];
    this.editor.update(target.id, { strength: value }, `Strength from grid: ${value}%`);
    this.hooks.announce(`${target.name} set to ${value}%`);
    this.hooks.edited();
  }

  /** Save the current board (side by side, 2×2 or 3×3) with captions and, when on, the label. */
  async saveBoard(): Promise<void> {
    if (!this.view || !MODE_INFO[this.session.mode].board) return;
    const copy = document.createElement("canvas");
    const ctx = copy.getContext("2d");
    if (!ctx) return;
    const footer = 26;
    copy.width = this.els.canvas.width; copy.height = this.els.canvas.height + footer;
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, copy.width, copy.height);
    ctx.drawImage(this.els.canvas, 0, 0);
    // Provenance line on every saved board: where it was made and what it is.
    ctx.fillStyle = "#000091"; ctx.fillRect(0, copy.height - footer, copy.width, footer);
    ctx.fillStyle = "#FFFFFF"; ctx.font = "600 11px system-ui, sans-serif"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    const kind = this.view.simulation ? "Includes photo simulations" : "Local edits";
    ctx.fillText(`BELJOUR — FULL BEAUTY STUDIO · ${kind} · made on this device · ${new Date().toISOString().slice(0, 10)}`, 8, copy.height - footer / 2, copy.width - 16);
    if (!this.hooks.exportLabel() && this.view.simulation) {
      // The visible board always carries the label; the export follows the export switch.
      ctx.putImageData(new ImageData(new Uint8ClampedArray(toRGBA(this.view.image)), this.view.image.width, this.view.image.height), 0, 0);
      drawCaptions(ctx, this.view);
    }
    await downloadCanvas(copy, `beljour-${this.session.mode}-board.png`);
    this.hooks.status("Board saved on this device.");
  }
}
