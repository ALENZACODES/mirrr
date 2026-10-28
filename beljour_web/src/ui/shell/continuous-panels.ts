/** Accessible native controls for the optional continuous demo. No HTML injection. */
import { TOUR_STEPS, type TourEffect, type TourState } from "../../layout/continuous/contract.js";
import { PRO_COMMAND_INFO, type CheckedProCommand } from "../../layout/continuous/pro-commands.js";
import type { SeasonalResult } from "../../layout/continuous/seasonal.js";
import { judgeNode, judgeParagraph } from "./judge-elements.js";

export interface ContinuousActions {
  readonly openSample: () => void;
  readonly selectSubject: (id: string) => void;
  readonly setConsent: (key: "local" | "hair" | "face" | "mock", enabled: boolean) => void;
  readonly setLock: (enabled: boolean) => void;
  readonly setStrength: (effect: TourEffect, value: number) => void;
  readonly applyEffect: (effect: TourEffect) => void;
  readonly setAppearance: (cue: "none" | "masc" | "fem") => void;
  readonly reviewCommand: (name: string) => void;
  readonly selectSeasonal: (id: string) => void;
  readonly setMode: (mode: "mock" | "off") => void;
  readonly tryon: () => void;
  readonly setComparison: (percent: number) => void;
  readonly download: () => void;
  readonly back: () => void;
  readonly next: () => void;
  readonly skip: () => void;
  readonly exit: () => void;
}

export function tourButton(
  doc: Document, title: string, action: string, callback: () => void,
): HTMLButtonElement {
  const button = judgeNode(doc, "button", "lg-cont-button", title);
  button.type = "button";
  button.dataset.tourAction = action;
  button.addEventListener("click", callback);
  return button;
}

export function tourCheck(
  doc: Document, title: string, action: string, checked: boolean,
  callback: (next: boolean) => void,
): HTMLLabelElement {
  const label = judgeNode(doc, "label", "lg-cont-check");
  const check = judgeNode(doc, "input", "") as HTMLInputElement;
  check.type = "checkbox";
  check.checked = checked;
  check.dataset.tourAction = action;
  check.addEventListener("change", () => callback(check.checked));
  label.append(check, judgeNode(doc, "span", "", title));
  return label;
}

export function tourEffectSlider(
  doc: Document, effect: TourEffect, level: number,
  callback: (value: number) => void,
): HTMLElement {
  const control = judgeNode(doc, "label", "lg-cont-level");
  const name = judgeNode(doc, "span", "", `${effect} strength`);
  const slider = judgeNode(doc, "input", "") as HTMLInputElement;
  slider.type = "range";
  slider.min = "1";
  slider.max = "5";
  slider.step = "0.1";
  slider.value = level.toFixed(1);
  slider.dataset.editStrength = "true";
  slider.dataset.tourAction = `strength-${effect}`;
  slider.setAttribute("aria-label", `${effect} intensity from 1.0 to 5.0`);
  slider.setAttribute("aria-valuetext", `${level.toFixed(1)} of 5.0`);
  const output = judgeNode(doc, "output", "lg-cont-level-value", level.toFixed(1));
  slider.addEventListener("input", () => {
    const value = Number(slider.value);
    output.textContent = value.toFixed(1);
    slider.setAttribute("aria-valuetext", `${value.toFixed(1)} of 5.0`);
    callback(value);
  });
  control.append(name, slider, output);
  return control;
}

export function tourProgress(doc: Document, state: TourState): HTMLElement {
  const panel = judgeNode(doc, "nav", "lg-cont-progress");
  panel.setAttribute("aria-label", "Continuous Judge Mode steps");
  const list = judgeNode(doc, "ol", "lg-cont-step-list");
  for (const [index, step] of TOUR_STEPS.entries()) {
    const item = judgeNode(doc, "li", "lg-cont-step", `${index + 1}. ${step.title}`);
    if (state.step === step.id) item.setAttribute("aria-current", "step");
    if (state.completed.includes(step.id)) item.dataset.progress = "done";
    if (state.skipped.includes(step.id)) item.dataset.progress = "skipped";
    list.append(item);
  }
  panel.append(list);
  return panel;
}

export function tourConsentPanel(doc: Document, state: TourState, actions: ContinuousActions): HTMLElement {
  const section = judgeNode(doc, "section", "lg-cont-controls");
  section.append(judgeParagraph(doc, "Only this disposable demonstration uses these choices."));
  const choices = [
    ["local", "Local image illustration"],
    ["hair", "Local hair illustrations"],
    ["face", "Local face and pose guides"],
    ["mock", "Separate mock try-on (no provider calls)"],
  ] as const;
  for (const [id, label] of choices) {
    section.append(tourCheck(doc, label, `consent-${id}`, state.permissions[id],
      (enabled) => actions.setConsent(id, enabled)));
  }
  section.append(judgeParagraph(doc,
    "No user photo is uploaded, analyzed for identity, or persisted by this demonstration."));
  return section;
}

export function tourEffectPanel(
  doc: Document, state: TourState, effect: TourEffect, actions: ContinuousActions,
): HTMLElement {
  const panel = judgeNode(doc, "section", "lg-cont-controls");
  const description: Record<TourEffect, string> = {
    hair: "Apply a drawn hair colour on the selected figure.",
    colour: "Add a separate highlight illustration, only on the selected figure.",
    concealer: "Show a cosmetic placement diagram, not a real coverage guarantee.",
    appearance: "Optional masculine or feminine style cues; never infer the person's gender.",
    ratio: "Display reference proportions; no golden-ratio measurement is available.",
    turn: "Illustrative turn direction only; hidden-side pixels are not generated.",
    posture: "Visual alignment planning only; no body transformation or health claim.",
  };
  panel.append(judgeParagraph(doc, description[effect]));
  panel.append(tourEffectSlider(doc, effect, state.levels[effect],
    (value) => actions.setStrength(effect, value)));
  if (effect === "appearance") {
    const group = judgeNode(doc, "div", "lg-cont-options");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Illustrative appearance cues");
    for (const cue of ["none", "masc", "fem"] as const) {
      const control = tourButton(doc, cue === "none" ? "Neutral" : cue === "masc" ? "Masculine" : "Feminine",
        `cue-${cue}`, () => actions.setAppearance(cue));
      control.setAttribute("aria-pressed", String(state.appearanceCue === cue));
      group.append(control);
    }
    panel.append(group);
  }
  panel.append(tourButton(doc, `Apply ${effect} step`, `apply-${effect}`,
    () => actions.applyEffect(effect)));
  panel.append(judgeParagraph(doc,
    state.applied[effect] ? "Illustrative setting applied; real engine quality unverified."
      : "This effect has not been applied."));
  return panel;
}

export function tourProPanel(
  doc: Document,
  state: TourState,
  commands: readonly CheckedProCommand[],
  actions: ContinuousActions,
): HTMLElement {
  const panel = judgeNode(doc, "section", "lg-cont-controls");
  panel.append(judgeParagraph(doc,
    "The five command names are binding. Reviewing a command does not execute its missing owner adapter."));
  const list = judgeNode(doc, "ul", "lg-cont-cards");
  for (const item of commands) {
    const detail = PRO_COMMAND_INFO.find((command) => command.name === item.name);
    const card = judgeNode(doc, "li", "lg-cont-card");
    card.append(judgeNode(doc, "strong", "", item.name));
    if (detail) card.append(judgeParagraph(doc, detail.caption));
    card.append(judgeParagraph(doc, `Public execution: ${item.available}. ${item.safety}`, "lg-cont-caption"));
    const button = tourButton(doc, "Review command", `pro-${item.name.slice(1)}`,
      () => actions.reviewCommand(item.name));
    button.setAttribute("aria-pressed", String(state.proCommandsReviewed.includes(item.name)));
    card.append(button);
    list.append(card);
  }
  panel.append(list);
  return panel;
}

export function tourSeasonalPanel(
  doc: Document, result: SeasonalResult, state: TourState, actions: ContinuousActions,
): HTMLElement {
  const panel = judgeNode(doc, "section", "lg-cont-controls");
  panel.append(judgeParagraph(doc, result.explanation));
  if (result.status !== "ready") {
    panel.append(judgeParagraph(doc, "Seasonal API unavailable; no invented Halloween pack is shown."));
    return panel;
  }
  const list = judgeNode(doc, "ul", "lg-cont-cards");
  for (const pack of result.cards) {
    const card = judgeNode(doc, "li", "lg-cont-card");
    card.append(judgeNode(doc, "strong", "", `${pack.title} · ${pack.season}`));
    card.append(judgeParagraph(doc, pack.summary));
    const button = tourButton(doc, "Select this pack", `season-${pack.id}`,
      () => actions.selectSeasonal(pack.id));
    button.disabled = !pack.available;
    button.setAttribute("aria-pressed", String(state.seasonalId === pack.id));
    card.append(button);
    list.append(card);
  }
  panel.append(list);
  return panel;
}

export function tourTryonPanel(doc: Document, state: TourState, actions: ContinuousActions): HTMLElement {
  const panel = judgeNode(doc, "section", "lg-cont-controls");
  const choices = judgeNode(doc, "div", "lg-cont-options");
  choices.setAttribute("role", "group");
  choices.setAttribute("aria-label", "Mock provider availability");
  for (const mode of ["mock", "off"] as const) {
    const button = tourButton(doc, mode === "mock" ? "Mock try-on" : "Provider switched off",
      `mode-${mode}`, () => actions.setMode(mode));
    button.setAttribute("aria-pressed", String(state.mockMode === mode));
    choices.append(button);
  }
  panel.append(choices);
  panel.append(tourButton(doc, "Run local mock or off-path", "mock-preview", actions.tryon));
  panel.append(judgeParagraph(doc, `Result: ${state.mockResult}. No API units, real face, or key used.`));
  return panel;
}

export function tourFooter(doc: Document, actions: ContinuousActions): HTMLElement {
  const nav = judgeNode(doc, "nav", "lg-cont-footer");
  nav.setAttribute("aria-label", "Guided walkthrough controls");
  nav.append(tourButton(doc, "Exit", "exit", actions.exit));
  nav.append(tourButton(doc, "Back", "back", actions.back));
  nav.append(tourButton(doc, "Skip", "skip", actions.skip));
  nav.append(tourButton(doc, "Continue", "continue", actions.next));
  return nav;
}
