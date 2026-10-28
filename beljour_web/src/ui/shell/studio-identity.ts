/** Studio-wide identity-lock request UI; applies to every selected layer, including pose.
 * Enforcement is deferred until Lane H ships a public adapter.
 */
import { IdentityLockController } from "../../layout/identity-lock.js";
import { setStrengthRange, strengthText, parseVisibleStrength } from "../../layout/strength-scale.js";

export interface StudioIdentityUI {
  readonly controller: IdentityLockController;
  readonly root: HTMLElement | null;
  dispose(): void;
}

export function mountStudioIdentity(doc: Document, destination: HTMLElement | null): StudioIdentityUI {
  const controller = new IdentityLockController();
  if (!destination) return { controller, root: null, dispose: () => undefined };
  const root = doc.createElement("section");
  root.className = "lg-identity-studio";
  root.setAttribute("aria-label", "Identity lock for every edit including posture");
  root.dataset.identityLock = "on";
  const status = doc.createElement("p");
  status.className = "lg-lock-status";
  status.textContent = "Identity lock: ON (requested). Lane H protection engine not connected; identity is unverified.";
  const details = doc.createElement("details");
  const summary = doc.createElement("summary");
  summary.textContent = "Fine-tune protection, no one-tap off";
  const label = doc.createElement("label");
  label.textContent = "Looseness (1.0 strict – 5.0 less strict)";
  const slider = doc.createElement("input");
  slider.id = "lg-identity-looseness";
  setStrengthRange(slider, 1.0);
  slider.dataset.identityAdjustment = "true";
  const output = doc.createElement("output");
  output.htmlFor = slider.id;
  output.textContent = strengthText(1.0);
  const onChange = (): void => {
    const value = parseVisibleStrength(slider.value);
    controller.tune(value);
    output.textContent = strengthText(value);
    status.textContent = "Identity lock requested. Engine pending; protection is not verified.";
  };
  slider.addEventListener("input", onChange);
  label.append(slider, output);
  details.append(summary, label);
  root.append(status, details);
  destination.append(root);
  return {
    controller,
    root,
    dispose(): void {
      slider.removeEventListener("input", onChange);
      root.remove();
    },
  };
}
