/**
 * BELJOUR filter render latency evidence, from actual Node V8 execution.
 * This measures the web filter engine, not a browser, GPU, mobile device,
 * user photograph, or production 100,000-face runner.
 * Created by John Khan.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import { LUTS, render } from "../dist/js/filters/runtime/engine.js";

const WIDTH = 80;
const HEIGHT = 96;
const REPEAT_MIN = 3;
const REPEAT_MAX = 11;

export function fixture() {
  const image = new Uint8Array(WIDTH * HEIGHT * 3);
  const skin = new Float32Array(WIDTH * HEIGHT);
  const person = new Float32Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const i = y * WIDTH + x;
      const oval = ((x - 40) / 23) ** 2 + ((y - 51) / 35) ** 2;
      const face = oval <= 1;
      const inside = oval <= 0.78;
      person[i] = face ? 1 : 0;
      skin[i] = inside ? 1 : 0;
      const base = inside ? [152, 103, 81] : face ? [91, 72, 59] : [203, 199, 190];
      const detail = ((x * 19 + y * 23) % 17) - 8;
      for (let channel = 0; channel < 3; channel++) {
        image[i * 3 + channel] = Math.max(0, Math.min(255, base[channel] + detail));
      }
    }
  }
  const mask = (data) => ({ width: WIDTH, height: HEIGHT, channels: 1, data });
  return {
    image: { width: WIDTH, height: HEIGHT, channels: 3, data: image },
    masks: { skin: mask(skin), person: mask(person), source: "segmenter", note: "" },
    centre: [40, 51],
  };
}

const sha = (value) => createHash("sha256").update(value).digest("hex");

/** Include exact source bytes, not just recipe IDs, so a code change requires new timings. */
export function webSourceHash() {
  const root = new URL("../src/filters/", import.meta.url);
  const parts = [];
  function collect(folder, prefix = "") {
    for (const entry of readdirSync(folder, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name, "en"))) {
      const rel = prefix + entry.name;
      if (entry.isDirectory()) collect(new URL(`${entry.name}/`, folder), `${rel}/`);
      else if (entry.isFile() && rel.endsWith(".ts")) parts.push([rel, new URL(entry.name, folder)]);
    }
  }
  collect(root);
  if (!parts.length) throw new Error("web filter source tree is missing");
  parts.sort(([first], [second]) => first < second ? -1 : first > second ? 1 : 0);
  const digest = createHash("sha256");
  for (const [rel, url] of parts) {
    digest.update(rel).update("\0").update(readFileSync(url)).update("\0");
  }
  return digest.digest("hex");
}

export function percentile(samples, percentileRank) {
  if (!samples.length || !samples.every((sample) => Number.isFinite(sample) && sample > 0)) {
    throw new RangeError("timing samples must be positive and finite");
  }
  if (!(Number.isFinite(percentileRank) && percentileRank >= 0 && percentileRank <= 1)) {
    throw new RangeError("invalid percentile");
  }
  const ascending = [...samples].sort((a, b) => a - b);
  const position = percentileRank * (ascending.length - 1);
  const low = Math.floor(position);
  const fraction = position - low;
  return ascending[low] + fraction * (ascending[Math.min(low + 1, ascending.length - 1)] - ascending[low]);
}

function validateOptions(options) {
  const repeats = options.repeats ?? 5;
  if (!(Number.isSafeInteger(repeats) && repeats >= REPEAT_MIN && repeats <= REPEAT_MAX)) {
    throw new RangeError(`repeats must be ${REPEAT_MIN}..${REPEAT_MAX}`);
  }
  let recipes;
  if (options.recipesPath) {
    recipes = JSON.parse(readFileSync(options.recipesPath, "utf8"));
    if (!Array.isArray(recipes)) throw new RangeError("recipes file must contain a JSON array");
  } else {
    recipes = options.ids
      ? options.ids.map((id) => catalogue().get(id))
      : [...catalogue().recipes];
  }
  if (!recipes.length || new Set(recipes.map((recipe) => recipe.id)).size !== recipes.length) {
    throw new RangeError("filter ids must be distinct and nonempty");
  }
  return { repeats, recipes, externalRecipes: Boolean(options.recipesPath) };
}

/** Cold means the colour LUT cache is cleared. Warm measures an already baked LUT. */
export function benchmark(options = {}) {
  const { repeats, recipes, externalRecipes } = validateOptions(options);
  const source = fixture();
  const sourceHash = sha(source.image.data);
  const versions = (externalRecipes ? recipes : catalogue().recipes).map((recipe) => [recipe.id, recipe.version, recipe.rank]);
  const catalogueHash = sha(JSON.stringify(versions));
  const ordered = [];
  for (const recipe of recipes) {
    LUTS.clear();
    let begin = performance.now();
    const cold = render(source.image, recipe, {}, source.masks, source.centre);
    const coldMs = performance.now() - begin;
    if (coldMs <= 0 || !Number.isFinite(coldMs)) throw new Error("invalid cold measurement");
    const outputHash = sha(cold.image.data);
    const warmSamples = [];
    for (let index = 0; index < repeats; index++) {
      begin = performance.now();
      const warm = render(source.image, recipe, {}, source.masks, source.centre);
      const elapsed = performance.now() - begin;
      if (!Number.isFinite(elapsed) || elapsed <= 0) throw new Error("invalid warm measurement");
      if (sha(warm.image.data) !== outputHash) {
        throw new Error(`${recipe.id}: cold/warm output bytes differ`);
      }
      warmSamples.push(Number(elapsed.toFixed(6)));
    }
    ordered.push({
      id: recipe.id,
      version: recipe.version,
      rank: recipe.rank,
      coldMs: Number(coldMs.toFixed(6)),
      warmSamplesMs: warmSamples,
      warmP50Ms: Number(percentile(warmSamples, 0.5).toFixed(6)),
      warmP95Ms: Number(percentile(warmSamples, 0.95).toFixed(6)),
      outputSha256: outputHash,
    });
  }
  return {
    format: "beljour-filter-latency-v1",
    generatedAtUtc: new Date().toISOString(),
    scope: "synthetic_node_v8_not_browser_or_real_faces",
    runtime: "node_v8_web_filter_engine",
    platform: { os: os.platform(), arch: os.arch(), node: process.version, cpuCount: os.cpus().length },
    timing: { clock: "performance.now", cold: "clear LUT then render once", warm: "same LUT, complete render",
      repetitions: repeats, quantile: "linear_interpolation_sorted_samples", parallelism: 1 },
    fixture: { kind: "code_drawn_portrait", width: WIDTH, height: HEIGHT, channels: 3,
      skinMask: true, personMask: true, inputSha256: sourceHash },
    recipeManifestSha256: catalogueHash,
    webSourceSha256: webSourceHash(),
    realFacesEvaluated: 0,
    mobileOrBrowserBudgetVerified: false,
    filters: ordered,
  };
}

function command(argv) {
  const opts = {};
  let output = "";
  for (const arg of argv) {
    if (arg.startsWith("--out=")) output = arg.slice(6);
    else if (arg.startsWith("--repeats=")) opts.repeats = Number(arg.slice(10));
    else if (arg.startsWith("--recipes=")) opts.recipesPath = arg.slice(10);
    else if (arg.startsWith("--ids=")) opts.ids = arg.slice(6).split(",").filter(Boolean);
    else throw new RangeError(`unrecognized argument ${arg}`);
  }
  const result = benchmark(opts);
  const serialized = JSON.stringify(result, null, 2) + "\n";
  if (output) writeFileSync(output, serialized, "utf8");
  else process.stdout.write(serialized);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    command(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error}\n`);
    process.exitCode = 1;
  }
}
