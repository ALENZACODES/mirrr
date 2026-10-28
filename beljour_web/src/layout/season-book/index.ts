/** Public activation point for a staged Season Book integration.
 * No Season Book controller, mapping, file or network path loads on Home
 * unless a seasonal package explicitly registers its reviewed public port.
 * Author: John Khan.
 */
import type { MyLook } from "../my-looks.js";
import type { SeasonBookPort } from "./controller.js";
import type { SeasonBookSurface } from "./surface.js";

interface MountContext {
  doc: Document;
  getSavedLooks: () => readonly MyLook[];
}

let source: SeasonBookPort | null = null;
let context: MountContext | null = null;
let mounted: SeasonBookSurface | null = null;
let revision = 0;

async function activate(): Promise<void> {
  const ticket = ++revision;
  const selectedSource = source;
  const selectedContext = context;
  if (!selectedSource || !selectedContext) {
    return;
  }
  try {
    const { SeasonBookSurface } = await import("./surface.js");
    if (ticket !== revision || source !== selectedSource || context !== selectedContext) {
      return;
    }
    mounted?.dispose();
    const next = new SeasonBookSurface(selectedContext.doc, selectedContext.getSavedLooks);
    mounted = next;
    await next.connect(selectedSource);
  } catch {
    // An unavailable optional seasonal bundle cannot break the Home screen.
  }
}

export function mountSeasonBook(doc: Document, getSavedLooks: () => readonly MyLook[]): void {
  revision += 1;
  mounted?.dispose();
  mounted = null;
  context = { doc, getSavedLooks };
  if (source) {
    void activate();
  }
}

export function registerSeasonBookPort(port: SeasonBookPort): void {
  source = port;
  if (context) {
    void activate();
  }
}

export function unregisterSeasonBookPort(): void {
  revision += 1;
  source = null;
  mounted?.dispose();
  mounted = null;
}
