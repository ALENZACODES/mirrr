/** Mounted Season Book view. Loaded only after a reviewed source is installed.
 * Author: John Khan.
 */
import type { MyLook } from "../my-looks.js";
import { SeasonBookController, type SeasonBookPort } from "./controller.js";
import { renderSeasonBook } from "./view.js";

export class SeasonBookSurface {
  readonly controller: SeasonBookController;
  private readonly root: HTMLElement | null;
  private readonly rail: HTMLElement | null;
  private unsubscribe: (() => void) | null = null;
  private readonly onVisible: () => void;

  constructor(private readonly doc: Document, getSavedLooks: () => readonly MyLook[]) {
    this.root = doc.getElementById("lg-season-book-root");
    this.rail = doc.getElementById("lg-editorial-calendar-rail");
    this.controller = new SeasonBookController(getSavedLooks);
    // A new edition is picked up when Home comes back into view; nothing polls in the background.
    this.onVisible = () => {
      if (doc.visibilityState !== "hidden") {
        void this.controller.refreshIfDue();
      }
    };
    doc.addEventListener("visibilitychange", this.onVisible);
    if (this.root) {
      this.unsubscribe = this.controller.subscribe((state) => {
        if (!this.root) {
          return;
        }
        renderSeasonBook(doc, this.root, state, {
          personalize: () => {
            void this.controller.personalizeFromUserAction();
          },
          setAlerts: (enabled) => {
            this.controller.setInPageAlertsFromUserAction(enabled);
          },
          clearPersonal: () => {
            this.controller.resetPersonal();
          },
        });
        if (this.rail) {
          const holiday = doc.getElementById("lg-holiday-engine-slot");
          this.rail.hidden = this.root.hidden && (holiday?.hidden ?? true);
        }
      });
    }
  }

  async connect(port: SeasonBookPort): Promise<void> {
    await this.controller.connect(port);
  }

  disconnect(): void {
    this.controller.disconnect();
  }

  dispose(): void {
    this.doc.removeEventListener("visibilitychange", this.onVisible);
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.controller.dispose();
    if (this.root) {
      this.root.replaceChildren();
      this.root.hidden = true;
    }
    if (this.rail) {
      const holiday = this.rail.querySelector<HTMLElement>("#lg-holiday-engine-slot");
      this.rail.hidden = holiday?.hidden ?? true;
    }
  }
}
