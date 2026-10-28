/** Modal dialogs for the studio: consent, the styling hand-off and the shortcuts list.
 *
 * While a dialog is open the rest of the page is inert (not focusable, not read), Tab stays in
 * the dialog, Escape closes it, and focus goes back to the control that opened it.
 * Author: John Khan.
 */
import { focusables, trap } from "./focus.js";

export class Modal<T> {
  private release: (() => void) | null = null;
  private resolve: ((value: T) => void) | null = null;
  private returnTo: HTMLElement | null = null;
  constructor(private readonly dialog: HTMLElement, private readonly scrim: HTMLElement,
    private readonly background: readonly HTMLElement[], private readonly cancelValue: T) {
    if (dialog.tabIndex < 0 && !dialog.hasAttribute("tabindex")) dialog.tabIndex = -1;
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); this.close(this.cancelValue); }
    });
    scrim.addEventListener("click", () => this.close(this.cancelValue));
  }
  get isOpen(): boolean { return !this.dialog.hidden; }
  /** Show the dialog and wait for close(value). `first` gets focus, else the first control. */
  open(first?: HTMLElement): Promise<T> {
    if (this.isOpen) this.close(this.cancelValue);
    this.returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.dialog.hidden = false; this.scrim.hidden = false;
    for (const el of this.background) el.inert = true;
    this.release = trap(this.dialog);
    (first ?? focusables(this.dialog)[0] ?? this.dialog).focus();
    return new Promise<T>((resolve) => { this.resolve = resolve; });
  }
  close(value: T): void {
    if (!this.isOpen) return;
    this.dialog.hidden = true; this.scrim.hidden = true;
    for (const el of this.background) el.inert = false;
    this.release?.(); this.release = null;
    const done = this.resolve; this.resolve = null;
    if (this.returnTo?.isConnected) this.returnTo.focus();
    done?.(value);
  }
}
