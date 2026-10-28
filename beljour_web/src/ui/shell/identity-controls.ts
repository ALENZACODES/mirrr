/** Native controls shared by Studio, Judge Mode and pose-labelled editing. */
import { type EditFamily, IdentityLockController } from "../../layout/identity-lock.js";
import {
  parseVisibleStrength,
  setStrengthRange,
  strengthText,
} from "../../layout/strength-scale.js";

export interface IdentityControls {
  readonly element: HTMLElement;
  readonly strength: HTMLInputElement;
  readonly looseness: HTMLInputElement;
  destroy(): void;
}

export interface IdentityControlOptions {
  readonly family: EditFamily;
  readonly photoRevision: string;
  readonly strength: number;
  readonly controller: IdentityLockController;
  readonly onStrength: (strength: number) => void;
  readonly onTune?: (looseness: number) => void;
}

function element<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, text = ""):
  HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  node.textContent = text;
  return node;
}

function group(doc: Document, title: string, value: number, action: string, callback: (n: number) => void):
  { box: HTMLElement; input: HTMLInputElement; output: HTMLElement } {
  const box = element(doc, "label");
  box.className = "lg-lock-field";
  const caption = element(doc, "span", title);
  const range = element(doc, "input") as HTMLInputElement;
  setStrengthRange(range, value);
  range.dataset.judgeAction = action;
  const output = element(doc, "output", strengthText(value));
  const handle = (): void => {
    const current = parseVisibleStrength(range.value);
    output.textContent = strengthText(current);
    range.setAttribute("aria-valuetext", strengthText(current));
    callback(current);
  };
  range.addEventListener("input", handle);
  box.append(caption, range, output);
  return { box, input: range, output };
}

export function renderIdentityControls(doc: Document, options: IdentityControlOptions): IdentityControls {
  const section = element(doc, "section");
  section.className = "lg-identity-guard";
  section.setAttribute("aria-label", "Edit strength and identity protection");
  const heading = element(doc, "h4", "Identity lock: ON by default");
  const note = element(doc, "p");
  note.className = "lg-guard-note";
  const updateNote = (): void => {
    const decision = options.controller.evaluate(options.family, options.photoRevision, options.strength);
    note.textContent = decision.safeToClaimProtected
      ? "Identity lock is enforced for this edit."
      : "Protection is requested, but the Lane H engine is not connected; no identity guarantee is claimed.";
    note.dataset.identityLock = "on";
    note.dataset.engineStatus = decision.status;
  };
  const strength = group(doc, "Edit strength (1.0–5.0)", options.strength, "edit-strength", options.onStrength);
  const details = element(doc, "details");
  const summary = element(doc, "summary", "Fine-tune identity protection");
  const tuning = group(doc, "Looseness (1.0 = strict, 5.0 = less strict)",
    options.controller.snapshot.looseness, "identity-tune", (value) => {
      options.controller.tune(value);
      updateNote();
      options.onTune?.(value);
    });
  const help = element(doc, "p", "There is no one-tap off control. This value is only a UI request until Lane H is integrated.");
  help.className = "lg-guard-note";
  details.append(summary, tuning.box, help);
  section.append(heading, note, strength.box, details);
  updateNote();
  return {
    element: section,
    strength: strength.input,
    looseness: tuning.input,
    destroy: () => section.remove(),
  };
}
