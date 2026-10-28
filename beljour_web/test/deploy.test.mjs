// R13 item 11: the static deploy ships its security headers, the pages obey the script policy,
// the app has a local-only mode with no API, and render.yaml is the API service only.
// Reads files and the built dist/; no network. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { runInNewContext } from "node:vm";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

function headerBlocks(text) {
  const blocks = new Map();
  let current = null;
  for (const raw of text.split("\n")) {
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(raw)) { current = raw.trim(); blocks.set(current, new Map()); continue; }
    const at = raw.indexOf(":");
    blocks.get(current).set(raw.slice(0, at).trim().toLowerCase(), raw.slice(at + 1).trim());
  }
  return blocks;
}

function directives(csp) {
  return new Map(csp.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
    const [name, ...values] = d.split(/\s+/);
    return [name, values];
  }));
}

test("dist/_headers exists and matches the source file", () => {
  assert.ok(existsSync(new URL("../dist/_headers", import.meta.url)), "copy-static.mjs must copy _headers into dist");
  assert.equal(read("../dist/_headers"), read("../_headers"));
});

test("the CSP has no inline or eval scripts and blocks framing and plugins", () => {
  const all = headerBlocks(read("../_headers")).get("/*");
  assert.ok(all, "headers apply to every path");
  const csp = directives(all.get("content-security-policy"));
  const scripts = csp.get("script-src");
  assert.ok(scripts.includes("'self'"));
  for (const bad of ["'unsafe-inline'", "'unsafe-eval'", "*", "data:", "http:", "https:"]) {
    assert.ok(!scripts.includes(bad), `script-src must not allow ${bad}`);
  }
  assert.ok(scripts.includes("'wasm-unsafe-eval'"), "MediaPipe WebAssembly needs compilation, not eval");
  assert.deepEqual(csp.get("default-src"), ["'self'"]);
  assert.deepEqual(csp.get("frame-ancestors"), ["'none'"]);
  assert.deepEqual(csp.get("object-src"), ["'none'"]);
  assert.deepEqual(csp.get("base-uri"), ["'self'"]);
  for (const name of ["connect-src", "img-src", "worker-src"]) {
    assert.ok(!csp.get(name).includes("*"), `${name} has no wildcard`);
    assert.ok(csp.get(name).every((v) => !/^http:/.test(v)), `${name} is https only`);
  }
  assert.ok(!csp.get("connect-src").some((v) => /makeupar|perfectcorp|yce-api/i.test(v)), "the browser never talks to YouCam");
  assert.equal(all.get("x-content-type-options"), "nosniff");
  assert.equal(all.get("referrer-policy"), "no-referrer");
  assert.equal(all.get("x-frame-options"), "DENY");
  assert.match(all.get("permissions-policy"), /geolocation=\(\)/);
  assert.match(all.get("permissions-policy"), /microphone=\(\)/);
});

test("an optional proxy is CSP-allowlisted but never activated implicitly", () => {
  const all = headerBlocks(read("../_headers")).get("/*");
  const csp = directives(all.get("content-security-policy"));
  const approvedProxy = "https://beljour-api.onrender.com";
  assert.ok(csp.get("connect-src").includes(approvedProxy));
  assert.ok(csp.get("img-src").includes(approvedProxy));
  const code = read("../config.js").split("\n")
    .filter((line) => !line.trimStart().startsWith("//")).join("\n");
  assert.doesNotMatch(code, /key|secret|token/i, "config.js holds no credential");
  assert.doesNotMatch(code, /https?:\/\/localhost|https?:\/\/127\.0\.0\.1/i);
});

test("built pages carry no inline scripts or inline event handlers", () => {
  const pages = readdirSync(new URL("../dist/", import.meta.url)).filter((f) => f.endsWith(".html"));
  assert.ok(pages.includes("index.html") && pages.includes("studio.html"));
  for (const page of pages) {
    const html = read(`../dist/${page}`);
    for (const tag of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      assert.match(tag[1], /\bsrc=/, `${page}: every script has a src`);
      assert.equal(tag[2].trim(), "", `${page}: no inline script body`);
    }
    assert.doesNotMatch(html, /\son[a-z]+\s*=\s*["']/i, `${page}: no inline event handler attributes`);
    assert.doesNotMatch(html, /javascript:/i, `${page}: no javascript: URLs`);
  }
});

test("with no API configured the client is local-only and makes no request", async () => {
  const realFetch = globalThis.fetch;
  let fetched = 0;
  globalThis.fetch = async () => { fetched++; throw new Error("no network in tests"); };
  try {
    delete globalThis.BELJOUR_API;
    delete globalThis.PLUMB_API;
    const mod = await import("../dist/js/api.js");
    assert.equal(mod.apiBase(), null);
    for (const value of ["", "   ", "none", "ftp://x.test", "javascript:alert(1)", "https://x.test/path", 42]) {
      globalThis.BELJOUR_API = value;
      assert.equal(mod.apiBase(), null, `rejects ${String(value)}`);
    }
    globalThis.BELJOUR_API = "";
    await assert.rejects(mod.api.health(), (e) => e.code === "no_api" && /on your device/.test(e.message));
    assert.throws(() => mod.api.photoUrl("a".repeat(64)), (e) => e.code === "no_api");
    assert.equal(fetched, 0);
    globalThis.BELJOUR_API = "https://api.example.test/";
    assert.equal(mod.apiBase(), "https://api.example.test");
    globalThis.PLUMB_API = "https://old.example.test";
    delete globalThis.BELJOUR_API;
    assert.equal(mod.apiBase(), "https://old.example.test", "the old name still works");
    const url = new URL(mod.api.photoUrl("b".repeat(64)));
    assert.equal(url.pathname, `/api/photos/${"b".repeat(64)}.jpg`);
    assert.match(url.searchParams.get("s"), /^[A-Za-z0-9_-]{16,64}$/, "an <img> carries the per-tab session id");
  } finally {
    globalThis.fetch = realFetch;
    delete globalThis.BELJOUR_API;
    delete globalThis.PLUMB_API;
  }
});

test("render.yaml is the API service only, with CORS set to the Pages origin", () => {
  const yaml = read("../../render.yaml");
  assert.equal((yaml.match(/- type: web/g) ?? []).length, 1);
  assert.doesNotMatch(yaml, /runtime: static/);
  assert.match(yaml, /key: BELJOUR_ALLOWED_ORIGINS\n\s+value: https:\/\/beljour\.pages\.dev/);
  assert.doesNotMatch(yaml, /onrender\.com/, "CORS no longer points at a Render static site");
  assert.match(yaml, /key: YOUCAM_API_KEY\n\s+sync: false/);
});

test("deploy docs exist with build settings and a rollback note", () => {
  const doc = read("../../docs/DEPLOY-CLOUDFLARE.md");
  for (const needle of ["Build output directory: `dist`", "Root directory: `web`", "Rollback", "no card", "_headers"]) {
    assert.ok(doc.includes(needle), needle);
  }
  assert.match(read("../wrangler.toml"), /pages_build_output_dir = "dist"/);
  assert.ok(existsSync(new URL("../../docs/THREAT-MODEL.md", import.meta.url)));
});

test("static builds default to local-only on every hostname", () => {
  const config = read("../config.js");
  const run = (hostname, initial = {}) => {
    const window = { ...initial };
    runInNewContext(config, { window, location: { hostname } });
    return window.BELJOUR_API;
  };
  for (const hostname of ["beljour.pages.dev", "production.test", "localhost", "127.0.0.1", "[::1]"]) {
    assert.equal(run(hostname), "", `${hostname} makes no implicit server connection`);
  }
  assert.match(read("../../render.yaml"), /name: beljour-api\n/);
  for (const value of ["", "none", "https://custom.example.test"]) {
    assert.equal(run("production.test", { BELJOUR_API: value }), value);
  }
  assert.equal(run("production.test", { PLUMB_API: "" }), "");
  assert.equal(run("production.test", { PLUMB_API: "https://legacy.example.test" }), "https://legacy.example.test");
  assert.doesNotMatch(config, /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])/i);
});

test("approved YouCam API names appear at their screens without claiming a replay is live", async () => {
  const { YOUCAM_PRODUCTS, YOUCAM_NOTICE } = await import("../dist/js/ui/provider-labels.js");
  assert.match(YOUCAM_PRODUCTS.makeup, /YouCam.*Makeup.*API/);
  assert.match(YOUCAM_PRODUCTS.hair, /YouCam.*Hair Style.*Hair Color.*APIs/);
  assert.match(YOUCAM_PRODUCTS.skin, /YouCam.*Skin Analysis.*product matching/);
  assert.match(YOUCAM_NOTICE, /quote and consent/); assert.match(YOUCAM_NOTICE, /Local simulations use no/);
  for (const [path, key] of [["../src/screens/tryon.ts", "makeup"], ["../src/screens/skin-match.ts", "skin"], ["../src/ui/studios/hair/view.ts", "hair"]]) {
    assert.ok(read(path).includes(`YOUCAM_PRODUCTS.${key}`), path);
  }
});

test("judge script distinguishes runnable local demo from unmeasured live and real-face evidence", () => {
  const script = read("../../docs/JUDGE-SCRIPT.md");
  for (const term of ["Older", "Younger", "Gender", "Local simulation", "YouCam", "Salon Decision Pack", "frozen-1000", "not measured"]) assert.ok(script.includes(term), term);
  assert.match(script, /120 seconds/); assert.match(script, /John Khan/);
});
