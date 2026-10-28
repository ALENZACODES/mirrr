/** Small DOM primitives so Judge Mode uses semantic, testable native controls. */
export function judgeNode<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function judgeParagraph(doc: Document, text: string, className = "lg-judge-copy"): HTMLParagraphElement {
  return judgeNode(doc, "p", className, text);
}

export function judgeHeading(doc: Document, text: string): HTMLHeadingElement {
  return judgeNode(doc, "h3", "lg-judge-section-title", text);
}

export function judgeButton(
  doc: Document,
  label: string,
  action: string,
  onClick: () => void,
  primary = false,
): HTMLButtonElement {
  const button = judgeNode(doc, "button", primary ? "lg-judge-button lg-judge-primary" : "lg-judge-button", label);
  button.type = "button";
  button.dataset.judgeAction = action;
  button.addEventListener("click", onClick);
  return button;
}

export function judgeStatus(doc: Document, text = ""): HTMLParagraphElement {
  const status = judgeParagraph(doc, text, "lg-judge-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  return status;
}

export function judgeNotice(doc: Document, heading: string, message: string): HTMLElement {
  const panel = judgeNode(doc, "aside", "lg-judge-note");
  panel.append(judgeNode(doc, "strong", "", heading), judgeParagraph(doc, message));
  return panel;
}

export function judgeChoice(
  doc: Document,
  name: string,
  value: string,
  text: string,
  selected: boolean,
  callback: () => void,
  enabled = true,
): HTMLButtonElement {
  const control = judgeButton(doc, text, name + "-" + value, callback);
  control.setAttribute("aria-pressed", selected ? "true" : "false");
  control.disabled = !enabled;
  return control;
}

export function judgeTick(
  doc: Document,
  action: string,
  title: string,
  description: string,
  checked: boolean,
  onChange: (checked: boolean) => void,
  enabled = true,
): HTMLElement {
  const row = judgeNode(doc, "label", "lg-judge-check");
  const input = judgeNode(doc, "input", "") as HTMLInputElement;
  input.type = "checkbox";
  input.checked = checked;
  input.disabled = !enabled;
  input.dataset.judgeAction = action;
  input.addEventListener("change", () => onChange(input.checked));
  const detail = judgeNode(doc, "span", "lg-judge-check-copy");
  detail.append(judgeNode(doc, "strong", "", title), judgeParagraph(doc, description, "lg-judge-small"));
  row.append(input, detail);
  return row;
}

export function judgePreview(doc: Document, name: string): HTMLCanvasElement {
  const canvas = judgeNode(doc, "canvas", "lg-judge-preview") as HTMLCanvasElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", name);
  canvas.width = 512;
  canvas.height = 640;
  return canvas;
}
