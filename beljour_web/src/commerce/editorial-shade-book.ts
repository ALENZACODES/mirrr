/** Editorial Shade Book: a browsable folio of the 90 original in-house hair swatches.
 * Family, undertone and text-search controls, twelve folios at a time, an original
 * strand-and-shine illustration per folio, and a print layout that only the visitor's
 * own button starts. Choosing a folio only marks it; "Carry to local workbench" hands
 * the chosen swatch to a caller-supplied callback and applies no edit. No photo, upload,
 * price, brand colour or network call. Decorative motion is off when reduced motion is
 * requested. Data from editorial-shade-model.ts. Author: John Khan.
 */
import {
  EditorialShadeBookModel, FAMILY_WORDS, NOTE, UNDERTONE_NOTES, type Folio, type FolioPage,
} from "./editorial-shade-model.js";
import type { HairFamily, Undertone } from "../engines/hair_palette/index.js";

const SVG = "http://www.w3.org/2000/svg";
const STRANDS = 5;
const ART_WIDTH = 120;
const ART_HEIGHT = 80;

export interface ShadeBookOptions {
  /** Receives the chosen folio when the visitor carries it to the local workbench. */
  onCarry?: (folio: Folio) => void;
  /** Starts the print dialog; defaults to window.print when it exists. */
  print?: () => void;
  /** Overrides the prefers-reduced-motion media query. */
  reducedMotion?: boolean;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = "", className = ""): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function svg(tag: string, attributes: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(SVG, tag) as SVGElement;
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

/** One strand path: a sine-like wave of the folio's height, as cubic segments. */
export function strandPath(index: number, wave: number): string {
  const x = 12 + index * ((ART_WIDTH - 24) / (STRANDS - 1));
  const sway = index % 2 === 0 ? wave : -wave;
  const step = ART_HEIGHT / 4;
  let path = `M ${x} 0`;
  for (let k = 0; k < 4; k++) {
    const side = k % 2 === 0 ? sway : -sway;
    path += ` C ${x + side} ${k * step + step / 3} ${x + side} ${k * step + 2 * step / 3} ${x} ${(k + 1) * step}`;
  }
  return path;
}

/** Original strand-and-shine illustration in the folio's presentation colours. */
export function folioIllustration(folio: Folio, still: boolean): SVGElement {
  const art = svg("svg", { viewBox: `0 0 ${ART_WIDTH} ${ART_HEIGHT}`, width: ART_WIDTH, height: ART_HEIGHT,
    role: "img", "aria-label": `Illustration of ${folio.name}: ${folio.movement_note}` });
  art.append(svg("rect", { x: 0, y: 0, width: ART_WIDTH, height: ART_HEIGHT, fill: folio.shadow }));
  for (let i = 0; i < STRANDS; i++) {
    art.append(svg("path", { d: strandPath(i, folio.wave), fill: "none", "stroke-width": 9,
      stroke: i % 2 === 0 ? folio.rgb : folio.shadow, "stroke-linecap": "round" }));
  }
  const band = svg("rect", { x: 0, y: Math.round(ART_HEIGHT * folio.shine / 100) - 4, width: ART_WIDTH, height: 8,
    fill: folio.glint, opacity: 0.55, "data-shine": folio.shine });
  if (!still) {
    band.append(svg("animate", { attributeName: "opacity", values: "0.4;0.65;0.4", dur: "6s",
      repeatCount: "indefinite" }));
  }
  art.append(band);
  return art;
}

function prefersReducedMotion(): boolean {
  const view = (document as Document & { defaultView?: Window | null }).defaultView ??
    (typeof window === "undefined" ? null : window);
  return Boolean(view?.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export class EditorialShadeBook {
  readonly root = element("section", "", "commerce-panel editorial-shade-book");
  readonly model = new EditorialShadeBookModel();
  private readonly family = element("select");
  private readonly undertone = element("select");
  private readonly search = element("input");
  private readonly previous = element("button", "Previous twelve");
  private readonly next = element("button", "Next twelve");
  private readonly status = element("p", "", "fineprint");
  private readonly grid = element("ol", "", "folio-grid");
  private readonly chosen = element("p", "No folio chosen.", "fineprint");
  private readonly carry = element("button", "Carry to local workbench");
  private readonly printButton = element("button", "Print this book");
  private readonly still: boolean;
  private printing = false;

  constructor(private readonly host: HTMLElement, private readonly options: ShadeBookOptions = {}) {
    this.still = options.reducedMotion ?? prefersReducedMotion();
    this.root.id = "editorial-shade-book";
    this.root.setAttribute("aria-label", "Editorial Shade Book of original hair swatches");
    this.root.dataset.motion = this.still ? "still" : "drift";
    this.root.dataset.layout = "screen";
    const heading = element("h3", "Editorial Shade Book");
    const intro = element("p", NOTE, "fineprint");
    this.option(this.family, "", "All families");
    for (const [key, word] of Object.entries(FAMILY_WORDS)) this.option(this.family, key, word);
    this.option(this.undertone, "", "All undertones");
    for (const key of Object.keys(UNDERTONE_NOTES)) this.option(this.undertone, key, key);
    this.family.setAttribute("aria-label", "Filter by hair family");
    this.undertone.setAttribute("aria-label", "Filter by undertone");
    this.search.type = "search";
    this.search.maxLength = 80;
    this.search.setAttribute("aria-label", "Search folios by name, number or note");
    this.status.setAttribute("role", "status");
    this.status.setAttribute("aria-live", "polite");
    for (const button of [this.previous, this.next, this.carry, this.printButton]) button.type = "button";
    this.family.addEventListener("change", () => this.show(this.model.setFilter(
      { family: (this.family.value || null) as HairFamily | null })));
    this.undertone.addEventListener("change", () => this.show(this.model.setFilter(
      { undertone: (this.undertone.value || null) as Undertone | null })));
    this.search.addEventListener("input", () => this.show(this.model.setFilter({ query: this.search.value.slice(0, 80) })));
    this.previous.addEventListener("click", () => this.show(this.model.previous()));
    this.next.addEventListener("click", () => this.show(this.model.next()));
    this.carry.disabled = true;
    this.carry.addEventListener("click", () => this.carryChosen());
    this.printButton.addEventListener("click", () => this.print());
    const controls = element("div", "", "folio-controls");
    controls.append(this.family, this.undertone, this.search, this.previous, this.next);
    const actions = element("div", "", "folio-actions");
    actions.append(this.chosen, this.carry, this.printButton);
    this.root.append(heading, intro, controls, this.status, this.grid, actions);
    this.host.append(this.root);
    this.show(this.model.view());
  }

  private option(parent: HTMLSelectElement, value: string, text: string): void {
    const child = element("option", text);
    child.value = value;
    parent.append(child);
  }

  private card(folio: Folio): HTMLLIElement {
    const item = element("li", "", "folio");
    item.dataset.folio = String(folio.number);
    item.dataset.shade = folio.shade_id;
    const swatch = element("span", "", "folio-swatch");
    swatch.style.background = folio.rgb;
    const choose = element("button", `Choose ${folio.code}`);
    choose.type = "button";
    const picked = this.model.selected?.number === folio.number;
    choose.setAttribute("aria-pressed", picked ? "true" : "false");
    choose.addEventListener("click", () => this.choose(folio.number));
    item.append(element("strong", `${folio.code} · ${folio.name}`), swatch,
      folioIllustration(folio, this.still || this.printing),
      element("p", folio.lab_label, "folio-lab"), element("p", folio.lch_label, "folio-lch"),
      element("p", folio.undertone_note), element("p", folio.movement_note), choose);
    return item;
  }

  private show(view: FolioPage): void {
    const rows = this.printing ? this.model.matches() : view.folios;
    this.grid.replaceChildren(...rows.map((folio) => this.card(folio)));
    this.previous.disabled = this.printing || view.page <= 1;
    this.next.disabled = this.printing || view.page >= view.pages;
    this.status.textContent = view.total === 0 ? "No folios match these choices."
      : this.printing ? `Print layout: all ${view.total} matching folios.`
      : `Page ${view.page} of ${view.pages} · ${view.total} folios`;
  }

  /** Mark a folio as chosen. This applies no edit to any photo. */
  choose(number: number): Folio {
    const folio = this.model.select(number);
    this.chosen.textContent = `Chosen: ${folio.code} ${folio.name}. Nothing is applied until you use the workbench.`;
    this.carry.disabled = this.options.onCarry === undefined;
    this.show(this.model.view());
    return folio;
  }

  /** Hand the chosen swatch to the local workbench callback. */
  carryChosen(): Folio | null {
    const folio = this.model.selected;
    if (folio === null || this.options.onCarry === undefined) return null;
    this.options.onCarry(folio);
    this.chosen.textContent = `${folio.code} ${folio.name} carried to the local workbench; no edit was applied.`;
    return folio;
  }

  /** Visitor-triggered print: lay out every matching folio, print, then restore the page view. */
  print(): void {
    const start = this.options.print ?? (typeof window !== "undefined" && typeof window.print === "function"
      ? () => window.print() : null);
    if (start === null) return;
    this.printing = true;
    this.root.dataset.layout = "print";
    this.show(this.model.view());
    try {
      start();
    } finally {
      this.printing = false;
      this.root.dataset.layout = "screen";
      this.show(this.model.view());
    }
  }

  dispose(): void {
    this.root.remove();
  }
}
