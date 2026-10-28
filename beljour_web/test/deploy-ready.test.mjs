// R23d Pages preflight. Files only: never deploys or makes a network request.
import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

const source = new URL("../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const root = (path) => readFileSync(new URL(path, source), "utf8");
const built = (path) => readFileSync(new URL(path, dist), "utf8");

function listFiles(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    return entry.isDirectory() ? listFiles(path) : entry.isFile() ? [path] : [];
  });
}

function parseHeaders(body) {
  const headers = new Map();
  let route = "";
  for (const line of body.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      route = line.trim();
      headers.set(route, new Map());
      continue;
    }
    const colon = line.indexOf(":");
    assert.ok(colon > 0, `invalid header: ${line}`);
    headers.get(route).set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
  }
  return headers;
}

test("dist copies the exact policy and every entry point is present", () => {
  assert.equal(built("_headers"), root("_headers"));
  assert.ok(existsSync(new URL("config.js", dist)));
  const pages = readdirSync(dist).filter((name) => name.endsWith(".html"));
  for (const page of ["index.html", "home.html", "studio.html", "trust.html", "arena.html", "recorder.html"]) {
    assert.ok(pages.includes(page), `${page} must reach Pages build output`);
    assert.match(built(page), /<main\b/i);
    assert.match(built(page), /<script\b/i);
  }
  assert.ok(pages.length >= 6);
});

test("CSP, privacy headers and opt-in backend permit only named origins", () => {
  const headers = parseHeaders(built("_headers"));
  const main = headers.get("/*");
  assert.ok(main);
  const policy = main.get("content-security-policy");
  for (const part of ["default-src 'self'", "script-src 'self' 'wasm-unsafe-eval'", "object-src 'none'",
    "frame-ancestors 'none'", "form-action 'self'", "connect-src 'self'", "base-uri 'self'"]) {
    assert.ok(policy.includes(part), part);
  }
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-(?:inline|eval)'/);
  assert.doesNotMatch(policy, /connect-src[^;]*\*/);
  assert.match(policy, /https:\/\/beljour-api\.onrender\.com/);
  assert.equal(main.get("x-content-type-options"), "nosniff");
  assert.equal(main.get("referrer-policy"), "no-referrer");
  assert.equal(main.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(main.get("x-frame-options"), "DENY");
  assert.equal(headers.get("/config.js").get("cache-control"), "no-store");
});

test("no deployed HTML, JS or config embeds absolute loopback HTTP URLs", () => {
  const output = listFiles(new URL(".", dist).pathname);
  let checked = 0;
  for (const path of output) {
    if (!/\.(?:html|js|css)$/.test(path) || path.endsWith(".map")) continue;
    const text = readFileSync(path, "utf8");
    assert.doesNotMatch(text, /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i, path);
    checked += 1;
  }
  assert.ok(checked >= 10, `${checked} built files inspected`);
});

test("every built HTML entry forbids inline scripts and executable markup", () => {
  const pages = readdirSync(dist).filter((name) => name.endsWith(".html"));
  for (const name of pages) {
    const html = built(name);
    for (const tag of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      assert.match(tag[1], /\bsrc=/, `${name}: script requires external src`);
      assert.equal(tag[2].trim(), "", `${name}: no inline script body`);
    }
    assert.doesNotMatch(html, /\son\w+\s*=\s*["']/i, `${name}: no inline event handlers`);
    assert.doesNotMatch(html, /javascript:/i, `${name}: no executable URL`);
  }
});

test("all six pages use a truly offline default when no server is set", async () => {
  const config = built("config.js");
  const pages = readdirSync(dist).filter((name) => name.endsWith(".html"));
  for (const page of pages) {
    const window = {};
    runInNewContext(config, { window, location: { hostname: "beljour.pages.dev", pathname: `/${page}` } });
    assert.equal(window.BELJOUR_API, "", page);
  }
  const api = await import("../dist/js/api.js");
  delete globalThis.BELJOUR_API;
  delete globalThis.PLUMB_API;
  assert.equal(api.apiBase(), null);
  globalThis.BELJOUR_API = "";
  assert.equal(api.apiBase(), null);
  delete globalThis.BELJOUR_API;
});

test("output stays within Pages Free's file and per-object limits", () => {
  const output = listFiles(new URL(".", dist).pathname);
  assert.ok(output.length > 15 && output.length < 20_000);
  for (const path of output) {
    const bytes = statSync(path).size;
    assert.ok(bytes <= 25 * 1024 * 1024, `${path} exceeds 25 MiB`);
  }
});

test("source deploy config contains no secret or automatic deploy action", () => {
  const wrangler = root("wrangler.toml");
  assert.match(wrangler, /pages_build_output_dir\s*=\s*"dist"/);
  assert.doesNotMatch(wrangler, /(?:secret|token|api[_-]?key|credential)\s*=/i);
  const guide = readFileSync(new URL("../docs/DEPLOY-CLOUDFLARE.md", source), "utf8");
  assert.match(guide, /owner must explicitly authorize/i);
  assert.match(guide, /rollback/i);
  assert.match(guide, /Canvas raster timing is not a complete edit pipeline/i);
});
