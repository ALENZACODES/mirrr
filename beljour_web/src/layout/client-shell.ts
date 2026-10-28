/** Progressive navigation and status UI on the four existing application pages.
 * Does not own an editor, a photo, session state or a feature implementation.
 */
import { clientPage, type ClientPage, type ClientReadiness } from "./client-routes.js";
import { mountClientNavigation, type ClientNavigation } from "../ui/shell/client-navigation.js";
import { mountConnectionNotice, type ConnectionNotice } from "../ui/shell/connectivity.js";
import { mountErrorNotice, type ErrorNotice } from "../ui/shell/client-errors.js";

export interface ClientShellOptions {
  readonly page?: ClientPage;
  readonly health?: () => Promise<boolean>;
  readonly retryView?: () => void;
}

export interface ClientShell {
  readonly navigation: ClientNavigation | null;
  readonly connection: ConnectionNotice | null;
  readonly errors: ErrorNotice | null;
  update(page: ClientPage, hash: string, readiness?: ClientReadiness | null): void;
  destroy(): void;
}

type BrowserHost = Window;

function emptyClientShell(): ClientShell {
  return {
    navigation: null,
    connection: null,
    errors: null,
    update: () => undefined,
    destroy: () => undefined,
  };
}

/** Injects only within a dedicated page-owned node. Does not modify the page's landmarks. */
export function mountClientShell(
  doc: Document = document,
  browser: BrowserHost = window,
  options: ClientShellOptions = {},
): ClientShell {
  const target = doc.getElementById("lg-client-root");
  if (!target) return emptyClientShell();
  if (target.dataset.clientMounted === "true") return emptyClientShell();
  const mountNode = target;
  target.dataset.clientMounted = "true";

  const page = options.page ?? clientPage(doc.body.dataset.page);
  const navigation = mountClientNavigation(doc, browser, page, browser.location?.hash ?? "");
  const connection = mountConnectionNotice(doc, browser, options.health);
  const errors = mountErrorNotice(doc, browser, options.retryView);
  target.append(navigation.element, connection.element, errors.element);

  let disposed = false;
  const onHashChange: EventListener = (): void => {
    if (!disposed) navigation.update(page, browser.location?.hash ?? "");
  };
  browser.addEventListener("hashchange", onHashChange);

  const onPageHide: EventListener = (): void => destroy();
  browser.addEventListener("pagehide", onPageHide, { once: true });

  function destroy(): void {
    if (disposed) return;
    disposed = true;
    browser.removeEventListener("hashchange", onHashChange);
    browser.removeEventListener("pagehide", onPageHide);
    navigation.destroy();
    connection.destroy();
    errors.destroy();
    delete mountNode.dataset.clientMounted;
  }

  return {
    navigation,
    connection,
    errors,
    update(nextPage: ClientPage, hash: string, readiness: ClientReadiness | null = null): void {
      if (disposed) return;
      navigation.update(nextPage, hash, readiness);
    },
    destroy,
  };
}
