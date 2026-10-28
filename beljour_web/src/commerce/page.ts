/** Standalone commerce studio, independently packaged from the main editor.
 * Accessible, consent-first, fictional catalogue, original canvas illustration.
 * No photo is uploaded in local mode. Author: John Khan.
 */
import { apiBase } from "../api.js";
import { money } from "./bag.js";
import { assertCatalogue, expandCatalogue, findProduct, nearbyShades } from "./catalogue.js";
import { CommerceController } from "./controller.js";
import { cleanUpload, decodePrivate, syntheticPortrait, type PrivatePhoto } from "./image.js";
import { renderInteractive, renderLocal } from "./local-render.js";
import { LookShelf, type LookStep } from "./look.js";
import { setupHairDemo } from "./hair-demo.js";
import { setupHairWorkbench } from "./hair-workbench.js";
import { buildShortlist, type ShoppingShortlist } from "./shortlist.js";
import { KeyProxyCommerceRemote } from "./remote.js";
import { DEFAULT_LOCK, fromLegacy, toLegacy, validateLevel, LevelHistory } from "./strength.js";
import type { Finish, Mode, Product, Profile, Recommendation, Tone, TryOnResult } from "./types.js";
import { SAMPLE_NOTICE, SIMULATION_NOTICE } from "./types.js";

function el<E extends HTMLElement>(id: string): E {
  const node = document.getElementById(id);
  if (!node) throw Error(`The commerce page is missing ${id}.`);
  return node as E;
}
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text = "", className = ""): HTMLElementTagNameMap[K] {
  const made = document.createElement(tag);
  if (text) made.textContent = text;
  if (className) made.className = className;
  return made;
}
function block(message: string): HTMLElement { return node("p", message, "fineprint"); }
function button(text: string, action: () => void, label?: string): HTMLButtonElement {
  const b = node("button", text);
  b.type = "button";
  if (label) b.setAttribute("aria-label", label);
  b.addEventListener("click", action);
  return b;
}
function announce(message: string): void { el("commerce-status").textContent = message; }
function displayError(reason: unknown): void {
  announce(reason instanceof Error ? reason.message :
    "The action could not be completed. The original photo remains safe.");
}
function selectedMode(): Mode { return el<HTMLInputElement>("mode-youcam").checked ? "youcam" : "local"; }
function makeProfile(): Profile {
  return { depth: Number(el<HTMLSelectElement>("depth").value),
    undertone: el<HTMLSelectElement>("undertone").value as Tone,
    confidence: "manual", evidence: "Visitor-selected fictional colour category" };
}
function selectedFinish(): Finish { return el<HTMLSelectElement>("finish").value as Finish; }
function consentValues(): [boolean, boolean, boolean] {
  return [el<HTMLInputElement>("confirm-adult").checked,
    el<HTMLInputElement>("confirm-skin").checked, el<HTMLInputElement>("confirm-makeup").checked];
}
function setPhotoDisplay(photo: PrivatePhoto): void {
  const img = el<HTMLImageElement>("photo-image");
  img.src = photo.canvas.toDataURL("image/jpeg", .82);
  img.alt = photo.synthetic ? "A geometrically drawn, labelled synthetic portrait" :
    "Your selected photo before editing";
  img.hidden = false;
  el("photo-empty").hidden = true;
  el("photo-details").textContent = `${photo.name} · ${photo.sourceWidth}×${photo.sourceHeight} · ` +
    `preview ${photo.canvas.width}×${photo.canvas.height}`;
}
function providerConfigured(): boolean {
  const settings = globalThis as { BELJOUR_COMMERCE_PROVIDER?: unknown };
  return apiBase() !== null && settings.BELJOUR_COMMERCE_PROVIDER !== false;
}
function showMode(): void {
  const live = selectedMode() === "youcam" && providerConfigured();
  const field = el<HTMLFieldSetElement>("sharing-consent");
  field.hidden = !live;
  field.disabled = !live;
  announce(live ? "YouCam is optional. Tick adult status and each sharing purpose before upload." :
    "Local-only preview is active. The YouCam provider is off or no proxy is configured; no photo will be uploaded.");
}
function sourceName(result: TryOnResult): string {
  return result.source === "youcam" ? "YouCam makeup virtual try-on simulation" :
    "Approximate local cosmetic simulation";
}
function drawComparison(after: string, before: string, message: string): void {
  el<HTMLImageElement>("before-image").src = before;
  el<HTMLImageElement>("after-image").src = after;
  el("preview-note").textContent = `${message} ${SIMULATION_NOTICE}`;
  el("try-on-section").hidden = false;
  updateComparison();
}
function updateComparison(): void {
  const pct = Number(el<HTMLInputElement>("compare-slider").value);
  el("after-clip").style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  el("comparison-divider").style.left = `${pct}%`;
  el("compare-output").textContent = `${pct}%`;
}

async function start(): Promise<void> {
  // Static JSON is embedded at build time and compared with the Python source.
  // Never call the network to load fictional samples or a local preview.
  const embedded = el<HTMLScriptElement>("commerce-catalogue-data").textContent;
  if (!embedded || embedded.length > 250_000) throw Error("The original sample catalogue is unavailable.");
  const source: unknown = JSON.parse(embedded);
  assertCatalogue(source);
  const catalogue = expandCatalogue(source);
  const allowedConcerns: readonly string[] = source.concerns;
  const remote = new KeyProxyCommerceRemote();
  const strengthMemory = new LevelHistory();
  // Upgrade the legacy 0–100 HTML input at the owned screen boundary.
  const levelSlider = el<HTMLInputElement>("effect-strength");
  levelSlider.min = "1";
  levelSlider.max = "5";
  levelSlider.step = "0.1";
  levelSlider.value = strengthMemory.get("complexion").toFixed(1);
  levelSlider.setAttribute("aria-label", "Sample visual strength, from 1.0 to 5.0 in tenths");
  el("strength-output").textContent = levelSlider.value;
  const levelLabel = document.querySelector<HTMLLabelElement>('label[for="effect-strength"]');
  if (levelLabel) levelLabel.firstChild!.textContent = "Sample colour strength (1.0–5.0) ";
  let photo: PrivatePhoto | null = null;
  let displayedBefore = "";
  let chosenProduct: string | null = null;
  let previewResult: TryOnResult | null = null;
  const media = {
    async upload(): Promise<Blob> {
      if (!photo) throw Error("Choose a photo first.");
      return cleanUpload(photo);
    },
    async localPreview(product: Product, strength: number): Promise<TryOnResult> {
      if (!photo) throw Error("Choose a photo first.");
      const rendered = renderLocal(photo.canvas, product, strength);
      return { image: rendered.toDataURL("image/jpeg", .9), source: "local", simulation: true,
        notice: "Approximate on-device colour overlay. No face was detected and no photo was uploaded.",
        product, provider_calls: 0, cached: false, units_spent: 0, label: "Local simulation" };
    },
    async localCompositePreview(steps: readonly LookStep[]): Promise<TryOnResult> {
      if (!photo) throw Error("Choose a photo first.");
      if (!steps.length || steps.length > 3) throw Error("Choose one to three sample effects.");
      let current = photo.canvas;
      for (const step of steps) current = renderLocal(current, step.product, step.strength);
      return { image: current.toDataURL("image/jpeg", .9), source: "local", simulation: true,
        notice: "Local multi-product simulation, with approximate centred masks and fictional colours. " +
          "No face detection or upload.",
        product: steps[0].product, provider_calls: 0, cached: false, units_spent: 0,
        label: "Local composite simulation" };
    },
  };
  const controller = new CommerceController(catalogue, remote, media, Date.now, {
    providerEnabled: providerConfigured, allowedConcerns: new Set(source.concerns),
  });
  let photoEpoch = 0;
  let matchEpoch = 0;
  let previewEpoch = 0;

  const lookShelf = new LookShelf(catalogue);
  function paintLookShelf(): void {
    const list = el("look-steps");
    list.replaceChildren();
    for (const step of lookShelf.list()) {
      const line = node("li", "", "look-step");
      line.append(node("span", `${step.product.name} · ${fromLegacy(step.strength).toFixed(1)} / 5.0 · sample only`),
        button("Remove", () => { lookShelf.remove(step.effect); paintLookShelf(); },
          `Remove ${step.effect} from sample look`));
      list.append(line);
    }
    if (lookShelf.empty) list.append(node("li", "Choose sample colours from the results below to build a look."));
    el("look-subtotal").textContent = lookShelf.empty
      ? "No sample items selected" : `Sample subtotal: ${money(lookShelf.plan().subtotalCents)} CAD. No checkout.`;
    el<HTMLButtonElement>("preview-look").disabled = lookShelf.empty;
    el<HTMLButtonElement>("export-look").disabled = lookShelf.empty;
  }
  function resetLook(): void {
    lookShelf.clear();
    el<HTMLTextAreaElement>("look-recipe").value = "";
    paintLookShelf();
  }
  el("preview-look").addEventListener("click", () => void (async () => {
    try {
      previewEpoch += 1;
      const requestEpoch = previewEpoch;
      const imageEpoch = photoEpoch;
      const original = photo;
      const selected = lookShelf.plan().steps.map((s) => ({product_id: s.product.id, strength: s.strength}));
      controller.grant(...consentValues());
      announce("Combining the selected fictional samples…");
      const state = await controller.tryOnComposite(selected);
      if (requestEpoch !== previewEpoch || imageEpoch !== photoEpoch || original !== photo) return;
      if (!state.preview) throw Error("No valid sample preview returned.");
      previewResult = state.preview;
      drawComparison(state.preview.image, displayedBefore, `${sourceName(state.preview)}. ${state.preview.notice}`);
      announce(`Composite look ready: ${state.preview.label}; ${state.preview.units_spent} provider units used.`);
      el("try-on-section").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (reason) { displayError(reason); }
  })());
  el("clear-look").addEventListener("click", () => {
    resetLook(); announce("The sample look has been cleared without a network call.");
  });
  el("export-look").addEventListener("click", () => {
    try {
      el<HTMLTextAreaElement>("look-recipe").value = lookShelf.plan().exportRecipe();
      announce("The portable recipe contains product IDs and strengths only; no photo or account details.");
    } catch (reason) { displayError(reason); }
  });
  el("import-look").addEventListener("click", () => {
    try {
      lookShelf.import(el<HTMLTextAreaElement>("look-recipe").value);
      paintLookShelf();
      announce("Reviewed sample recipe loaded locally. No network was used.");
    } catch (reason) { displayError(reason); }
  });
  paintLookShelf();

  async function usePhoto(next: Promise<PrivatePhoto> | PrivatePhoto): Promise<void> {
    const epoch = ++photoEpoch;
    matchEpoch += 1;
    previewEpoch += 1;
    // Revoke the old photo's consent synchronously, before image decoding can
    // finish. A slow decode must not leave an old photo eligible for upload.
    controller.setPhoto(false);
    resetLook();
    photo = null;
    displayedBefore = "";
    chosenProduct = null;
    previewResult = null;
    el<HTMLImageElement>("photo-image").hidden = true;
    el("photo-empty").hidden = false;
    el("products-section").hidden = true;
    el("try-on-section").hidden = true;
    announce("Decoding your selected photo locally. Provider permission is revoked until you opt in again.");
    try {
      const decoded = await next;
      if (epoch !== photoEpoch) return;  // The user selected a newer image while this one decoded.
      photo = decoded;
      displayedBefore = photo.canvas.toDataURL("image/jpeg", .82);
      setPhotoDisplay(photo);
      controller.setPhoto(true);
      for (const id of ["confirm-adult", "confirm-skin", "confirm-makeup"]) el<HTMLInputElement>(id).checked = false;
      el("products-section").hidden = true;
      el("try-on-section").hidden = true;
      previewResult = null;
      chosenProduct = null;
      announce(photo.synthetic ? "A drawn synthetic illustration is ready. No photo was uploaded." :
        "The selected image is in browser memory only. Choose processing and consent before any upload.");
    } catch (reason) { if (epoch === photoEpoch) displayError(reason); }
  }
  el<HTMLInputElement>("photo-file").addEventListener("change", () => {
    const file = el<HTMLInputElement>("photo-file").files?.[0];
    if (file) void usePhoto(decodePrivate(file));
  });
  el("synthetic-button").addEventListener("click", () => void usePhoto(syntheticPortrait()));
  for (const id of ["mode-local", "mode-youcam"]) {
    el<HTMLInputElement>(id).addEventListener("change", () => {
      controller.chooseMode(selectedMode());
      resetLook();
      matchEpoch += 1;
      previewEpoch += 1;
      chosenProduct = null;
      previewResult = null;
      for (const consent of ["confirm-adult", "confirm-skin", "confirm-makeup"]) {
        el<HTMLInputElement>(consent).checked = false;
      }
      el("products-section").hidden = true;
      el("try-on-section").hidden = true;
      showMode();
    });
  }
  for (const id of ["confirm-adult", "confirm-skin", "confirm-makeup"]) {
    el<HTMLInputElement>(id).addEventListener("change", () => controller.grant(...consentValues()));
  }
  el("forget-server-photo").addEventListener("click", () => {
    void (async () => {
      try {
        if (await controller.forgetServerPhoto()) {
          for (const id of ["confirm-adult", "confirm-skin", "confirm-makeup"]) {
            el<HTMLInputElement>(id).checked = false;
          }
          el("products-section").hidden = true;
          el("try-on-section").hidden = true;
          previewResult = null;
          announce("The temporary server photo was deleted. Your original is still on this device.");
        } else announce("No server photo was uploaded in this session.");
      } catch (reason) { displayError(reason); }
    })();
  });

  async function performPreview(sku: string): Promise<void> {
    try {
      matchEpoch += 1;
      const requestEpoch = ++previewEpoch;
      const photoAtStart = photo;
      const photoVersionAtStart = photoEpoch;
      chosenProduct = sku;
      const level = validateLevel(Number(el<HTMLInputElement>("effect-strength").value));
      announce("Rendering your selected fictional cosmetic item…");
      controller.grant(...consentValues());
      const product = findProduct(catalogue, sku);
      strengthMemory.remember(product.category === "complexion" ? "complexion" :
        product.category === "cheek" ? "cheek" : "lip", level);
      const state = await controller.tryOnLevel(sku, level, DEFAULT_LOCK);
      if (requestEpoch !== previewEpoch || photo !== photoAtStart || photoEpoch !== photoVersionAtStart) return;
      if (!state.preview || !photo) throw Error("There is no preview available for this item.");
      previewResult = state.preview;
      drawComparison(state.preview.image, displayedBefore, `${sourceName(state.preview)}. ${state.preview.notice}`);
      announce(`${findProduct(catalogue, sku).name}: ${sourceName(state.preview)}. ` +
        `${state.preview.units_spent} provider units used.`);
      el("try-on-section").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (reason) { displayError(reason); }
  }
  function paintBag(): void {
    const bag = controller.state.bag;
    const lines = el("bag-lines");
    lines.replaceChildren();
    if (!bag.lines.length) lines.append(block("No sample items yet."));
    for (const item of bag.lines) {
      const wrapper = node("div", "", "bag-row");
      const text = node("span", `${item.quantity} × ${item.product.name} · ${money(item.total_cents)}`);
      wrapper.append(text, button("Remove", () => {
        controller.remove(item.product.id); paintBag();
        announce(`${item.product.name} removed from demo bag.`);
      }, `Remove ${item.product.name} from bag`));
      lines.append(wrapper);
    }
    el("bag-total").textContent = `Sample subtotal: ${money(bag.subtotal_cents)} CAD`;
    el("bag-notice").textContent = `${bag.total_label}. No checkout is offered.`;
    const wishes = el("wish-items");
    wishes.replaceChildren();
    if (!bag.wishlist.length) wishes.append(block("No saved sample items yet."));
    for (const item of bag.wishlist) {
      const wrapper = node("div", "", "wish-row");
      wrapper.append(node("span", item.name), button("Unsave", () => {
        controller.wish(item.id, false); paintBag();
      }, `Remove ${item.name} from wishlist`));
      wishes.append(wrapper);
    }
  }
  function makeProductCard(match: Recommendation): HTMLElement {
    const p = match.product;
    const card = node("article", "", "commerce-product");
    const swatch = node("div", "", "product-swatch");
    swatch.style.backgroundColor = p.swatch;
    swatch.setAttribute("aria-label", `Invented swatch ${p.swatch}`);
    swatch.setAttribute("role", "img");
    card.append(swatch, node("h3", p.name), block(p.description),
      node("strong", `${money(p.price_cents)} CAD · ${p.finish} · ${p.coverage}`));
    const notes = node("ul", "", "product-reason");
    for (const reason of match.why) notes.append(node("li", reason));
    card.append(notes, block("Fictional sample product. No brand permission or validated real shade."));
    let itemId = p.id;
    const options = nearbyShades(catalogue, p.id, controller.state.profile?.depth ?? 9,
      controller.state.profile?.undertone ?? "warm");
    if (options.length) {
      const label = node("label", "Swap the invented shade");
      const select = node("select") as HTMLSelectElement;
      const mainOption = node("option", p.name) as HTMLOptionElement;
      mainOption.value = p.id;
      select.append(mainOption);
      for (const alt of options) {
        const entry = node("option", alt.name) as HTMLOptionElement;
        entry.value = alt.id;
        select.append(entry);
      }
      select.addEventListener("change", () => {
        itemId = select.value;
        swatch.style.backgroundColor = findProduct(catalogue, itemId).swatch;
      });
      label.append(select);
      card.append(label);
    }
    const actions = node("div", "", "product-actions");
    if (p.vto) {
      actions.append(button("Try on", () => void performPreview(itemId), `Preview ${p.name}`));
      actions.append(button("Add to look", () => {
        try {
          lookShelf.add(itemId, toLegacy(validateLevel(Number(el<HTMLInputElement>("effect-strength").value))));
          paintLookShelf();
          announce(`${findProduct(catalogue, itemId).name} added to your fictional sample look.`);
        } catch (reason) { displayError(reason); }
      }, `Add ${p.name} to a sample multi-colour look`));
    }
    actions.append(button("Add to bag", () => {
      try {
        controller.add(itemId);
        paintBag();
        announce(`${findProduct(catalogue, itemId).name} added to the demo bag.`);
      }
      catch (reason) { displayError(reason); }
    }));
    actions.append(button("Save", () => {
      try {
        controller.wish(itemId, true);
        paintBag();
        announce(`${findProduct(catalogue, itemId).name} saved to your wishlist.`);
      }
      catch (reason) { displayError(reason); }
    }));
    card.append(actions);
    return card;
  }
  // The budget comparison never uses a network action; the source ranked list
  // was already validated by the consent-first controller against local SKUs.
  let currentShopping: ShoppingShortlist | null = null;
  function showShoppingComparison(): void {
    const price = Number(el<HTMLInputElement>("sample-budget-dollars").value);
    const status = el("sample-shortlist-status");
    const rows = el<HTMLOListElement>("sample-shortlist-results");
    rows.replaceChildren();
    currentShopping = null;
    el<HTMLButtonElement>("sample-apply-look").disabled = true;
    if (!controller.state.results.length) {
      status.textContent = "Choose a profile and get sample results before comparing fictional prices.";
      return;
    }
    if (!Number.isSafeInteger(price) || price < 0 || price > 1000) {
      status.textContent = "Choose an integer sample budget from zero to 1,000 CAD.";
      return;
    }
    try {
      const subset = buildShortlist(catalogue, controller.state.results, {
        budget_cents: price * 100,
        goal: el<HTMLSelectElement>("sample-shopping-goal").value as
          "balanced" | "lower-cost" | "visual-try-on" | "shade-first",
        visual_only: el<HTMLInputElement>("sample-visual-only").checked,
      }, allowedConcerns);
      currentShopping = subset;
      for (const item of subset.items) {
        rows.append(node("li", `${item.product.name} · ${money(item.sample_price_cents)} CAD · ` +
          `${item.reason_codes.join(", ")} · fictional item`));
      }
      if (!subset.items.length) rows.append(node("li", "No fictional sample meets this budget; nothing was ordered."));
      if (subset.three_piece) {
        const names = subset.three_piece.products.map(id => findProduct(catalogue, id).name);
        status.textContent = `${names.join(" + ")} · fictional subtotal ` +
          `${money(subset.three_piece.subtotal_cents)} CAD. ` +
          "No tax, delivery or real product quote. No additional network call.";
        el<HTMLButtonElement>("sample-apply-look").disabled = false;
      } else {
        status.textContent = `Showing ${subset.items.length} sample items within the invented budget. ` +
          "No compatible three-piece set fits the selected price limit.";
      }
    } catch (reason) {
      status.textContent = reason instanceof Error ? reason.message : "The budget comparison could not be made.";
    }
  }
  el("sample-refresh-shortlist").addEventListener("click", showShoppingComparison);
  el("sample-apply-look").addEventListener("click", () => {
    if (!currentShopping?.three_piece) return;
    const trio = currentShopping.three_piece.products;
    try {
      lookShelf.clear();
      for (const id of trio) lookShelf.add(id, 50);
      paintLookShelf();
      announce("Three fictional makeup colours added to your local look. No image was uploaded or ordered.");
    } catch (reason) { displayError(reason); }
  });

  el("find-matches").addEventListener("click", async () => {
    try {
      previewEpoch += 1;
      const requestEpoch = ++matchEpoch;
      const photoAtStart = photo;
      const photoVersionAtStart = photoEpoch;
      controller.grant(...consentValues());
      announce("Finding fictional shade options…");
      const matches = await controller.match(makeProfile(), selectedFinish());
      if (requestEpoch !== matchEpoch || photo !== photoAtStart || photoEpoch !== photoVersionAtStart) return;
      el("products-section").hidden = false;
      const section = el("match-results");
      section.replaceChildren();
      for (const item of matches.results) section.append(makeProductCard(item));
      if (!matches.results.length) {
        section.append(block("No sample products match that profile. Try a different finish."));
      }
      el("match-provenance").textContent = `${matches.analysedBy ?? "Local"} · ` +
        `${matches.units} provider units · ${SAMPLE_NOTICE}`;
      showShoppingComparison();
      announce(matches.message);
      el("products-section").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (reason) { displayError(reason); }
  });
  el<HTMLInputElement>("compare-slider").addEventListener("input", updateComparison);
  el<HTMLInputElement>("effect-strength").addEventListener("input", () => {
    const value = Number(el<HTMLInputElement>("effect-strength").value);
    el("strength-output").textContent = value.toFixed(1);
    if (!chosenProduct || !photo) return;
    try {
      const product = findProduct(catalogue, chosenProduct);
      const small = renderInteractive(photo.canvas, product, value);
      drawComparison(small.toDataURL("image/jpeg", .8), displayedBefore,
        "Low-resolution local slider preview. Release to apply a full-resolution guarded edit.");
    } catch (reason) { displayError(reason); }
  });
  el<HTMLInputElement>("effect-strength").addEventListener("change", () => {
    if (chosenProduct && photo) void performPreview(chosenProduct);
  });
  el("update-preview").addEventListener("click", () => {
    if (chosenProduct) void performPreview(chosenProduct);
    else announce("Choose a product to preview first.");
  });
  el("save-preview").addEventListener("click", () => {
    if (!previewResult || !previewResult.image.startsWith("data:image/")) {
      announce("Create a preview before saving."); return;
    }
    const a = document.createElement("a");
    a.href = previewResult.image;
    const ext = previewResult.image.startsWith("data:image/png;") ? "png" :
      previewResult.image.startsWith("data:image/webp;") ? "webp" : "jpg";
    a.download = `beljour-sample-simulation.${ext}`;
    a.click();
    announce("Your simulation preview was saved locally. No purchase was made.");
  });
  el("clear-bag").addEventListener("click", () => {
    controller.clear(); paintBag(); announce("Your demo bag and wishlist are clear.");
  });
  showMode();
  paintBag();
  announce("Catalogue loaded. Choose a photo or draw the local synthetic illustration.");
}

void start().catch(displayError);
void setupHairDemo();
void setupHairWorkbench();
