import { createRequire } from "node:module";
// Needs Playwright (npm i -g playwright && npx playwright install chromium) and the site
// served from dist/ with this page copied in: see web/test/browser/README.md
const require = createRequire(process.env.PLAYWRIGHT_REQUIRE_FROM ?? import.meta.url);
const { chromium } = require("playwright");
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e)));
await page.goto("http://localhost:8080/gltest.html");
await page.waitForFunction(() => document.title === "done", null, { timeout: 30000 });
console.log(JSON.stringify(await page.evaluate(() => window.RESULT)));
await browser.close();
