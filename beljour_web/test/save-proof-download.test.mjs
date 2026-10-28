/** User-triggered local receipt download: synthetic browser capability injection. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { auditSavedBatch } from "../dist/js/save/proof-service.js";
import { createPortableProof } from "../dist/js/save/proof-receipt.js";
import { downloadLocalReceipt, LOCAL_RECEIPT_NAME } from "../dist/js/save/proof-download.js";

function recipe() {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1", id: "look-1234abcd", name: "Drawn", created,
    versions: [{ version: 1, created, steps: [{ tool: "enhance", provider: "local", strength: 20, settings: {} }] }],
  };
}

async function proof() {
  const pixels = { width: 2, height: 2, channels: 4, data: new Uint8Array(16) };
  const engine = { enhance: (photo) => ({ ...photo, data: new Uint8Array(photo.data) }) };
  const result = await auditSavedBatch(recipe(), [{ pixels }], engine, 1);
  return createPortableProof(result, recipe());
}

function fakeBrowser(options = {}) {
  const events = [];
  const anchor = {
    href: "", download: "", rel: "",
    click() { events.push("click"); if (options.clickFails) throw Error("blocked"); },
    remove() { events.push("remove"); if (options.removeFails) throw Error("cannot remove"); },
  };
  const source = {
    doc: {
      createElement(tag) { events.push(`element:${tag}`); return anchor; },
      body: options.noBody ? null : { appendChild() { events.push("append"); } },
    },
    urls: {
      createObjectURL(blob) { events.push(`blob:${blob.type}`); return options.noUrl ? "" : "blob:synthetic"; },
      revokeObjectURL(url) { events.push(`revoke:${url}`); },
    },
  };
  return { source, events, anchor };
}

test("the user action creates only a JSON Blob and revokes the URL immediately", async () => {
  const { source, events, anchor } = fakeBrowser();
  const status = await downloadLocalReceipt(LOCAL_RECEIPT_NAME, await proof(), recipe(), source);
  assert.equal(status, "downloaded");
  assert.equal(anchor.download, "LookProof-counts.json");
  assert.equal(anchor.rel, "noopener noreferrer");
  assert.equal(anchor.href, "blob:synthetic");
  assert.deepEqual(events, ["blob:application/json", "element:a", "append", "click", "remove", "revoke:blob:synthetic"]);
});

test("blocked click still removes element and revokes URL, never claims success", async () => {
  const { source, events } = fakeBrowser({ clickFails: true });
  const status = await downloadLocalReceipt(LOCAL_RECEIPT_NAME, await proof(), recipe(), source);
  assert.equal(status, "unavailable");
  assert(events.includes("remove"));
  assert(events.includes("revoke:blob:synthetic"));
});

test("failed URL construction does not trigger click, but cleanup is attempted", async () => {
  const { source, events } = fakeBrowser({ noUrl: true });
  const status = await downloadLocalReceipt(LOCAL_RECEIPT_NAME, await proof(), recipe(), source);
  assert.equal(status, "unavailable");
  assert.equal(events.includes("click"), false);
});

test("storage and browser API denied gracefully", async () => {
  const text = await proof();
  assert.equal(await downloadLocalReceipt(LOCAL_RECEIPT_NAME, text, recipe(), null), "unavailable");
  assert.equal(await downloadLocalReceipt(LOCAL_RECEIPT_NAME, text, recipe(), fakeBrowser({ noBody: true }).source), "unavailable");
});

test("receipt of a different recipe is rejected before any browser resource is created", async () => {
  const text = await proof();
  const { source, events } = fakeBrowser();
  const changed = recipe();
  changed.versions[0].steps[0].strength = 21;
  await assert.rejects(downloadLocalReceipt(LOCAL_RECEIPT_NAME, text, changed, source), /changed/);
  assert.deepEqual(events, []);
});

test("untrusted filename is rejected rather than used as a download path", async () => {
  const text = await proof();
  const { source, events } = fakeBrowser();
  await assert.rejects(downloadLocalReceipt("../../portrait.jpg", text, recipe(), source), /filename/);
  assert.deepEqual(events, []);
});

test("a forged or too-large receipt is rejected before any local URL is created", async () => {
  const { source, events } = fakeBrowser();
  await assert.rejects(downloadLocalReceipt(LOCAL_RECEIPT_NAME, " ".repeat(70000), recipe(), source), /too large/);
  assert.deepEqual(events, []);
});

test("even when DOM cleanup fails, blob URL revocation is still attempted", async () => {
  const { source, events } = fakeBrowser({ removeFails: true });
  const status = await downloadLocalReceipt(LOCAL_RECEIPT_NAME, await proof(), recipe(), source);
  assert.equal(status, "downloaded");
  assert(events.includes("revoke:blob:synthetic"));
});
