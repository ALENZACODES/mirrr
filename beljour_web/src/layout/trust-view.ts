/** Layout v1 Trust Centre screen: one screen she can screenshot, one tap from every screen.
 * Switches are wired to the real consent gate and the export label setting; deletion runs the
 * real steps in trust.ts and shows the receipt. No network call is made unless a photo id is
 * known for this tab, and then only our own server's DELETE route.
 * Author: John Khan.
 */
import { clear, h } from "../dom.js";
import { api } from "../api.js";
import { appConsent, STORAGE_KEY } from "../ui/shell/consent.js";
import { browserStore, PENDING_KEY, SESSION_KEY } from "../session.js";
import { clearAll } from "../store.js";
import { RECOVERY_KEY } from "../save/recovery.js";
import { browserLookStorage } from "../save/storage.js";
import { LookStore, browserLooks } from "./my-looks.js";
import { type DeletionDeps, PHOTO_IDS_KEY, type TrustDeps, deleteFaceData, knownPhotoIds, receiptText, setToggle,
  simulationLabelPref, trustItems } from "./trust.js";

export function mountTrust(doc: Document = document): void {
  const session = browserStore();
  const deps: TrustDeps = { consent: appConsent, simulationLabel: simulationLabelPref(session) };
  const list = doc.getElementById("lg-trust-list");
  const out = doc.getElementById("lg-receipt");
  if (!list || !out) return;
  const render = (): void => {
    clear(list);
    for (const item of trustItems(deps)) {
      if (item.id === "delete") continue;
      const control = item.toggle
        ? h("label", { class: "lg-switch" },
          h("input", { type: "checkbox", checked: item.state === "on", onchange: (e: Event) => {
            setToggle(deps, item.id, (e.target as HTMLInputElement).checked); render();
          } }), h("span", {}, item.state === "on" ? "On" : "Off"))
        : h("span", { class: `lg-state lg-state-${item.state.replace(" ", "-")}` }, item.state === "not built" ? "Not built" : "In place");
      list.append(h("li", { class: "lg-trust-item" }, h("div", {}, h("strong", {}, item.title), h("p", { class: "lg-small" }, item.detail)), control));
    }
  };
  render();
  const also = doc.getElementById("lg-delete-looks") as HTMLInputElement | null;
  doc.getElementById("lg-delete")?.addEventListener("click", async () => {
    const del: DeletionDeps = {
      // the on-device switch is a privacy setting, not face data, so deleting never turns it off
      consent: appConsent, session, sessionKeys: [STORAGE_KEY, SESSION_KEY, PENDING_KEY, PHOTO_IDS_KEY, RECOVERY_KEY],
      clearHistory: clearAll, photoIds: knownPhotoIds(session), deletePhoto: (id) => api.deletePhoto(id),
      looks: new LookStore(browserLooks()), versionedLooks: browserLookStorage(),
      alsoLooks: Boolean(also?.checked), clock: () => new Date(),
    };
    const receipt = await deleteFaceData(del);
    clear(out);
    out.append(h("h2", {}, `Receipt ${receipt.id}`), h("p", { class: "lg-small" }, new Date(receipt.at).toLocaleString()),
      h("ul", { class: "lg-plain" }, ...receipt.lines.map((l) => h("li", {}, h("strong", {}, `${l.what}: ${l.result}. `), l.detail))),
      h("a", { class: "lg-link", download: `deletion-${receipt.id}.txt`,
        href: "data:text/plain;charset=utf-8," + encodeURIComponent(receiptText(receipt)) }, "Save the receipt"));
    out.hidden = false;
    render();
  });
}
