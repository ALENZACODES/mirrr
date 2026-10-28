/** Opt-in face part previews on the Previews screen: nose (a decision preview), lips,
 * eyes and brows. Hidden until the person turns them on; every control starts at zero,
 * the original photo is never changed, and a refusal is shown in plain words with the
 * original kept. Local only: no upload, no provider call. Author: John Khan. */
import type { Ctx } from "../ctx.js";
import { announce, clear, h } from "../dom.js";
import { CONTROLS, PART_SPEC, PartRefusal, renderParts, type PartName, type PartValues } from "../engines/shape/parts.js";
import { type LocalPreviewDependencies, localPreviewError, measuredMesh } from "./local-preview.js";

const ORDER: readonly PartName[] = ["nose", "lips", "eyes", "brows"];
const shown = (value: number): string => `${value} · ${value === 0 ? "Original" : value < 0 ? "Reduce" : "Increase"}`;

export function facePartsSection(ctx: Ctx, dependencies: LocalPreviewDependencies): HTMLElement {
  const section = h("section", { class: "face-parts" }, h("h2", {}, "Face parts"),
    h("p", {}, "Opt-in. Small local simulations of the nose, lips, eyes or brows on your own photo. Nothing here is on until you turn it on."));
  const turnOn = h("button", { class: "btn btn-quiet", type: "button" }, "Turn on face part previews");
  turnOn.addEventListener("click", () => { turnOn.remove(); open(section, ctx, dependencies); });
  section.append(turnOn);
  return section;
}

function open(section: HTMLElement, ctx: Ctx, dependencies: LocalPreviewDependencies): void {
  const source = ctx.photoSrc, points = ctx.face?.points;
  const values: PartValues = {};
  const inputs: [HTMLInputElement, HTMLElement][] = [];
  const output = h("div", { "aria-live": "polite" });
  let revision = 0;
  const groups = ORDER.map((part) => {
    const box = h("fieldset", { class: "proc-area" }, h("legend", {}, PART_SPEC.parts[part].title),
      h("p", { class: "fine" }, PART_SPEC.parts[part].label));
    for (const spec of CONTROLS.filter((c) => c.part === part)) {
      const input = h("input", { type: "range", min: "-100", max: "100", step: "1", value: "0",
        id: `part-${spec.id}`, "aria-label": spec.label }) as HTMLInputElement;
      const readout = h("output", { for: input.id }, shown(0));
      input.addEventListener("input", () => { readout.textContent = shown(Number(input.value)); });
      input.addEventListener("change", () => { values[spec.id] = Number(input.value); revision++; });
      inputs.push([input, readout]);
      box.append(h("label", { for: input.id }, spec.label), h("p", { class: "fine" }, spec.summary), input, readout);
    }
    return box;
  });
  const show = h("button", { class: "btn", type: "button" }, "Show face part preview");
  show.addEventListener("click", async () => {
    const own = ++revision, selected = { ...values };
    show.disabled = true;
    try {
      const image = await dependencies.read(source!);
      if (own !== revision || ctx.photoSrc !== source || ctx.face?.points !== points || !output.isConnected) return;
      const mesh = measuredMesh(points, image.width, image.height);
      const result = renderParts(image, mesh, selected, { optedIn: true });
      clear(output);
      output.append(dependencies.paint(result.image, result.labels.join(" ")),
        h("p", { class: "fine" }, `Movement guard retained ${Math.round(result.metrics.guardScale * 100)}% of the requested movement.`));
      announce("Face part preview ready.");
    } catch (error) {
      if (own !== revision || ctx.photoSrc !== source) return;
      clear(output);
      output.append(error instanceof PartRefusal
        ? h("p", { class: "notice notice-warn", role: "alert" }, `${error.message} Your original is unchanged.`)
        : localPreviewError(error));
    } finally { show.disabled = false; }
  });
  const reset = h("button", { class: "btn btn-quiet", type: "button" }, "Reset face parts");
  reset.addEventListener("click", () => {
    for (const key of Object.keys(values)) delete values[key as keyof PartValues];
    for (const [input, readout] of inputs) { input.value = "0"; readout.textContent = shown(0); }
    clear(output); revision++;
  });
  section.append(h("p", { class: "notice" }, "These change photo geometry on your device only. They do not predict the result of any treatment."),
    h("div", { class: "proc-grid" }, ...groups), h("div", { class: "row" }, show, reset), output);
}
