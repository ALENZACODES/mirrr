/** Actual-browser R15B checks using the labelled drawn fixture only. Author: John Khan.
 * Usage: BROWSER_EXECUTABLE=/path/to/chromium node test/browser/eyes-brows.mjs
 * A local server must serve web/dist at STUDIO_URL (default localhost:8765).
 * Requires an existing Playwright installation; it adds no runtime dependency.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve("playwright", { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ?? process.cwd()] }));
const base = process.env.STUDIO_URL ?? "http://127.0.0.1:8765/eyes-brows.html";
const directory = process.env.BROWSER_QA_DIR ?? path.resolve("../../qa");
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}), args: ["--no-sandbox"] });
const checks = [], errors = [], requests = [], workers = [];
const context = await browser.newContext({ viewport: { width: 1360, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("request", request => requests.push(request.url()));
page.on("worker", worker => workers.push(worker.url()));
const feature = page.getByLabel("Feature", { exact: true });
const preview = page.getByRole("button", { name: "Preview locally", exact: true });
const save = page.getByRole("button", { name: "Download labelled preview", exact: true });
const status = page.locator(".eb-status");
const resultCanvas = page.locator('canvas[aria-label^="Simulation result"]');
const sourceCanvas = page.locator('canvas[aria-label^="Original photo"]');
const expectedStyles = {
  W59: ["classic", "hybrid", "volume", "mega"], W60: ["cat", "doll", "wispy", "kitten", "fox"],
  W61: ["lifting", "tint"], W62: ["strip", "cluster", "half_strip"],
  W63: ["lengthening", "volumising", "tubing"], W64: ["wing", "batwing", "tightline", "soft_wing"],
  W65: ["floating", "double_wing", "smoked_pencil", "gel", "shadow"], W66: ["cut_crease", "halo", "smokey"],
  W67: ["foil", "duochrome"], W69: ["settled", "first_week", "faded"], W70: [],
  W71: ["healed", "fresh", "faded"], W72: ["powder", "nano", "microblading"], W73: [],
  W74: ["brows", "lashes"], W75: [], W76: ["navy", "burgundy", "forest"],
  "ink-study": [], "pigment-oil": [], "rain-expression": [], "meadow-crown": [],
};
async function pixels(canvas) {
  return canvas.evaluate(node => node.toDataURL("image/png"));
}
async function select(id) {
  await feature.selectOption(id);
  await page.waitForTimeout(30);
}
async function render(id) {
  if (id) await select(id);
  assert.equal(await preview.isEnabled(), true, `${id ?? "current"} preview enabled`);
  await preview.click();
  await page.waitForFunction(() => !document.querySelector('[role="status"]')?.textContent?.startsWith("Rendering locally."), undefined, { timeout: 20000 });
  const message = await status.innerText();
  const successful = await save.isEnabled();
  return { successful, message };
}
try {
  await page.goto(base);
  await feature.waitFor();
  const ids = await feature.locator("option").evaluateAll(nodes => nodes.map(node => node.value));
  assert.equal(ids.length, 21);
  assert.equal(new Set(ids).size, 21);
  assert.equal(ids.includes("W68"), false);
  assert.deepEqual([...ids].sort(), Object.keys(expectedStyles).sort());
  checks.push({ check: "all21_features", passed: true, ids });
  assert.equal(await preview.isDisabled(), true);
  await page.getByRole("button", { name: "Use drawn fixture", exact: true }).click();
  const original = await pixels(sourceCanvas);
  assert.match(await status.innerText(), /Drawn fixture/);
  let result = await render("W59");
  assert.equal(result.successful, true, result.message);
  assert.notEqual(await pixels(resultCanvas), original);
  assert.equal(await page.getByRole("img", { name: /Technician map/ }).count(), 1);
  checks.push({ check: "W59_worker_pixels_and_map", ...result });
  await page.screenshot({ path: path.join(directory, "eyes-brows-lash-map.png"), fullPage: true });
  await page.getByRole("button", { name: "Show original", exact: true }).click();
  assert.equal(await pixels(resultCanvas), original);
  await page.getByRole("button", { name: "Show simulation", exact: true }).click();
  assert.notEqual(await pixels(resultCanvas), original);
  checks.push({ check: "source_compare_preserved", passed: true });
  const downloadEvent = page.waitForEvent("download");
  await save.click();
  const download = await downloadEvent;
  assert.match(download.suggestedFilename(), /simulation\.png$/);
  await download.saveAs(path.join(directory, "labelled-drawn-preview.png"));
  const exported = await readFile(path.join(directory, "labelled-drawn-preview.png"));
  const dimensions = await sourceCanvas.evaluate(canvas => ({ width: canvas.width, height: canvas.height }));
  assert.equal(exported.subarray(1, 4).toString(), "PNG");
  assert.ok(exported.readUInt32BE(16) >= dimensions.width, "export retains the complete preview width");
  assert.ok(exported.readUInt32BE(20) > dimensions.height, "export includes a separate simulation label band");
  checks.push({ check: "labelled_png_download", passed: true, name: download.suggestedFilename() });
  await select("W71");
  assert.equal(await preview.isDisabled(), true);
  const adult = page.getByLabel(/I confirm I am 18 or older/);
  await adult.check();
  result = await render();
  assert.equal(result.successful, true, result.message);
  assert.match(result.message, /simulation/i);
  checks.push({ check: "W71_explicit_adult_gate", ...result });
  await select("W67");
  result = await render();
  assert.equal(result.successful, true, result.message);
  const firstAngle = await pixels(resultCanvas);
  await page.getByRole("button", { name: "Move the light", exact: true }).click();
  await page.waitForTimeout(1300);
  await page.getByRole("button", { name: "Stop moving light", exact: true }).click();
  const secondAngle = await pixels(resultCanvas);
  assert.notEqual(firstAngle, secondAngle);
  checks.push({ check: "W67_light_animation_changes_pixels", passed: true });
  await select("meadow-crown");
  assert.equal(await preview.isDisabled(), true);
  await page.getByText("Hair protection and observed lashes", { exact: true }).click();
  await page.getByRole("button", { name: "Confirm no hair is visible", exact: true }).click();
  result = await render();
  assert.equal(result.successful, true, result.message);
  assert.notEqual(await pixels(resultCanvas), original);
  checks.push({ check: "crown_requires_explicit_hair_evidence", ...result });
  for (const id of ids) {
    await select(id);
    const style = page.getByLabel("Style", { exact: true });
    const choices = await style.count() ? await style.locator("option").evaluateAll(nodes => nodes.map(node => node.value)) : [];
    assert.deepEqual(choices, expectedStyles[id], `${id} exact implemented styles`);
    checks.push({ check: `${id}_styles`, passed: true, choices });
    if (["W61", "W63"].includes(id)) {
      assert.equal(await preview.isDisabled(), true);
      checks.push({ check: `${id}_missing_observations_disabled`, passed: true });
      continue;
    }
    if (await preview.isDisabled()) {
      assert.fail(`${id} unexpectedly disabled: ${await page.locator('.eb-reasons').innerText()}`);
    }
    result = await render();
    if (id === "W70") {
      assert.equal(result.successful, false, "broad drawn brow is correctly refused as unseparated");
      assert.match(result.message, /unseparated/);
      checks.push({ check: "W70_unseparated_drawn_brow_refused", passed: true, ...result });
    } else {
      assert.equal(result.successful, true, `${id}: ${result.message}`);
      checks.push({ check: `${id}_visible_default`, passed: true, ...result });
      for (const choice of choices.slice(1)) {
        await style.selectOption(choice);
        result = await render();
        assert.equal(result.successful, true, `${id}/${choice}: ${result.message}`);
        checks.push({ check: `${id}/${choice}_renders`, passed: true });
      }
    }
    assert.equal(await pixels(sourceCanvas), original, `${id} source retained`);
  }
  await select("W74");
  result = await render();
  assert.equal(result.successful, true, result.message);
  assert.equal(await page.getByText("Hypothetical progression — your assumptions", { exact: true }).count(), 1);
  assert.equal(await pixels(resultCanvas), original);
  checks.push({ check: "W74_table_and_unchanged_photo", passed: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(directory, "eyes-brows-mobile.png"), fullPage: true });
  const layout = await page.evaluate(() => ({ viewport: innerWidth, body: document.documentElement.scrollWidth,
    main: document.querySelector("main").getBoundingClientRect().width }));
  checks.push({ check: "390px_responsive", passed: layout.body <= 390, ...layout });
  assert.ok(layout.body <= 390, `390px layout overflows to ${layout.body}px`);
  await page.getByRole("button", { name: "Clear photo and observations", exact: true }).click();
  assert.equal(await preview.isDisabled(), true);
  assert.equal(await save.isDisabled(), true);
  checks.push({ check: "clear_discards_private_state", passed: true });
  const outside = requests.filter(url => !url.startsWith(new URL(base).origin) && !url.startsWith("blob:") && !url.startsWith("data:"));
  assert.deepEqual(outside, []);
  checks.push({ check: "no_external_requests", passed: true });
  assert.ok(workers.some(url => url.endsWith("/ui/eyes-brows/worker.js")), "actual studio worker created");
  checks.push({ check: "actual_local_worker", passed: true, count: workers.length });
  assert.deepEqual(errors, []);
  checks.push({ check: "no_page_or_console_errors", passed: true });
} catch (error) {
  checks.push({ check: "fatal", passed: false, message: String(error) });
  await page.screenshot({ path: path.join(directory, "eyes-brows-failure.png"), fullPage: true });
} finally {
  await writeFile(path.join(directory, "eyes-brows-browser-results.json"), JSON.stringify({ checks, errors, requestCount: requests.length, workerCount: workers.length }, null, 2));
  console.log(JSON.stringify({ checks, errors, requestCount: requests.length, workerCount: workers.length }, null, 2));
  await browser.close();
}
if (checks.some(check => check.passed === false && check.check === "fatal")) process.exitCode = 1;
