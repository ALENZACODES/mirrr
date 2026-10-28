/** The judging page (arena.html): open a judge bundle folder from this device, judge each
 * pair blind, and save the answers as a file to hand back. Images are read from the chosen
 * folder with object URLs; nothing is uploaded and no request leaves the page.
 * Answers are kept in this browser between reloads when storage works.
 * Author: John Khan.
 */
import { clear, h } from "../dom.js";
import { DIMENSION_HELP, DIMENSION_LABELS, JUDGE_DIMENSIONS, REASONS, type Reason } from "./reasons.js";
import { BundleError, JudgingSession, type Scores, type Side, readBundle, sideForKey } from "./session.js";

const DRAFT_PREFIX = "beljour.judging.";

function storage(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export class JudgeView {
  private session: JudgingSession | null = null;
  private files = new Map<string, File>();
  private urls: string[] = [];
  private winner: Side | null = null;
  private reason: Reason | null = null;
  private scores: { A: Scores; B: Scores } = { A: {}, B: {} };
  constructor(private readonly root: HTMLElement, private readonly status: HTMLElement) {}

  async open(list: FileList | File[], judge: string, womanJudge: boolean): Promise<void> {
    this.files.clear();
    let manifest: File | null = null;
    for (const file of Array.from(list)) {
      const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const parts = rel.split("/");
      const tail = parts.slice(-2).join("/");
      if (parts[parts.length - 1] === "manifest.json") manifest = file;
      else if (tail.startsWith("images/")) this.files.set(tail, file);
    }
    if (!manifest) throw new BundleError("Choose the bundle folder (it holds manifest.json and an images folder).");
    const bundle = readBundle(JSON.parse(await manifest.text()));
    this.session = new JudgingSession(bundle, judge, womanJudge);
    const draft = storage()?.getItem(this.draftKey());
    const restored = draft ? this.session.restore(draft) : 0;
    this.say(`${bundle.assignments.length} pairs to judge` + (restored ? `, ${restored} restored from this browser.` : "."));
    this.render();
  }

  private draftKey(): string {
    return this.session ? `${DRAFT_PREFIX}${this.session.bundle.run}.${this.session.bundle.bundle}.${this.session.judge}` : "";
  }
  private say(text: string): void { this.status.textContent = text; }
  private url(path: string): string {
    const file = this.files.get(path);
    if (!file) throw new BundleError(`The image ${path} is missing from the folder.`);
    const u = URL.createObjectURL(file);
    this.urls.push(u);
    return u;
  }

  private render(): void {
    for (const u of this.urls) URL.revokeObjectURL(u);
    this.urls = [];
    clear(this.root);
    const s = this.session;
    if (!s) return;
    const a = s.current();
    if (!a) {
      this.root.append(h("h2", {}, "All pairs judged"), h("p", {}, "Save your answers and send the file back."), this.saveButton(),
        h("button", { type: "button", class: "lg-link", onclick: () => { s.undo(); this.render(); } }, "Change the last answer"));
      return;
    }
    this.winner = null; this.reason = null; this.scores = { A: {}, B: {} };
    const stillHer = s.stillHerAsked(a);
    const figure = (title: string, path: string) => h("figure", {}, h("figcaption", {}, title),
      h("img", { src: this.url(path), alt: `${title} for this pair` }));
    const pick = (side: Side) => h("button", { type: "button", class: "lg-button", "aria-pressed": "false", "data-side": side,
      onclick: () => this.choose(side) }, `${side} is better`);
    const reasons = h("fieldset", { class: "lg-reasons" }, h("legend", {}, "Why did the other one lose? Pick one."),
      ...REASONS.map((r, i) => h("label", {}, h("input", { type: "radio", name: "reason", value: r,
        onchange: () => { this.reason = r; } }), `${i + 1}. ${r}`)));
    const scoreSide = (side: Side) => h("fieldset", {}, h("legend", {}, `Scores for ${side} (optional, 1-10)`),
      ...JUDGE_DIMENSIONS.filter((d) => d !== "still_her" || stillHer).map((d) => {
        const id = `score-${side}-${d}`;
        const out = h("output", { for: id }, "-");
        const input = h("input", { id, type: "range", min: "1", max: "10", step: "1", value: "5", title: DIMENSION_HELP[d],
          oninput: (e: Event) => { const v = Number((e.target as HTMLInputElement).value); this.scores[side][d] = v; out.textContent = String(v); } });
        return h("label", { for: id }, DIMENSION_LABELS[d], input, out);
      }));
    this.root.append(
      h("p", { class: "lg-small" }, `Pair ${s.done + 1} of ${s.total} · Filter: ${a.label}`),
      h("h2", {}, s.bundle.question),
      h("div", { class: "lg-trio" }, figure("Reference (original)", a.ref), figure("A", a.a), figure("B", a.b)),
      h("div", { class: "lg-choice", role: "group", "aria-label": "Which is better" }, pick("A"), pick("B")),
      reasons,
      h("details", {}, h("summary", {}, "Add scores (optional)"), h("div", { class: "lg-scores" }, scoreSide("A"), scoreSide("B"))),
      h("div", { class: "lg-choice" },
        h("button", { type: "button", class: "lg-button lg-primary", onclick: () => this.submit() }, "Next pair"),
        h("button", { type: "button", class: "lg-button", onclick: () => { s.undo(); this.persist(); this.render(); } }, "Back one"),
        this.saveButton()));
  }

  private saveButton(): HTMLElement {
    const s = this.session!;
    return h("a", { class: "lg-button", download: s.fileName(),
      href: "data:application/x-ndjson;charset=utf-8," + encodeURIComponent(s.toJsonl()) }, `Save answers (${s.done})`);
  }

  choose(side: Side): void {
    this.winner = side;
    for (const b of this.root.querySelectorAll<HTMLButtonElement>("[data-side]")) b.setAttribute("aria-pressed", String(b.dataset.side === side));
  }

  submit(): void {
    const s = this.session;
    if (!s) return;
    if (!this.winner) { this.say("Pick A or B first."); return; }
    if (!this.reason) { this.say("Pick one reason the other side lost."); return; }
    s.answer({ winner: this.winner, reason: this.reason, scores: { A: this.scores.A, B: this.scores.B } });
    this.persist();
    this.say(`${s.done} of ${s.total} judged.`);
    this.render();
  }

  private persist(): void {
    try { storage()?.setItem(this.draftKey(), this.session!.toJsonl()); } catch { /* answers stay on the page */ }
  }

  /** Keys: A/B (or 1/2) pick a side, Alt+1..9 pick a reason, Enter goes to the next pair. */
  key(event: KeyboardEvent): void {
    if (!this.session || (event.target as HTMLElement | null)?.tagName === "INPUT") return;
    const n = Number(event.key);
    if (event.altKey && Number.isInteger(n) && n >= 1 && n <= REASONS.length) {
      this.root.querySelectorAll<HTMLInputElement>('input[name="reason"]')[n - 1]?.click();
      return;
    }
    const side = sideForKey(event.key);
    if (side) { this.choose(side); return; }
    if (event.key === "Enter") this.submit();
  }
}

export function mountJudge(doc: Document = document): JudgeView | null {
  const root = doc.getElementById("lg-judge"), status = doc.getElementById("lg-judge-status");
  const form = doc.getElementById("lg-judge-start") as HTMLFormElement | null;
  if (!root || !status || !form) return null;
  const view = new JudgeView(root, status);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const folder = (doc.getElementById("lg-bundle") as HTMLInputElement).files;
    const judge = (doc.getElementById("lg-judge-name") as HTMLInputElement).value.trim();
    const woman = (doc.getElementById("lg-woman-judge") as HTMLInputElement).checked;
    try {
      if (!folder?.length) throw new BundleError("Choose the bundle folder first.");
      await view.open(folder, judge, woman);
      form.hidden = true;
    } catch (error) { status.textContent = error instanceof Error ? error.message : String(error); }
  });
  doc.addEventListener("keydown", (e) => view.key(e));
  return view;
}
