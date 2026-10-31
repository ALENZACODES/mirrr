// Refresh src/news/news-snapshot.json from the live feeds (layer C of MIRRR Beauty News).
// Run by hand or by .github/workflows/news-snapshot.yml. Never writes a smaller-than-safe snapshot.
import { writeFileSync } from 'fs';
import { aggregate, SNAPSHOT_PATH, MIN_KEEP, loadSnapshot } from '../src/news/feed.js';

const r = await aggregate({ timeoutMs: 12000 });
const old = loadSnapshot(SNAPSHOT_PATH);
console.log(`layer ${r.layer}: ${r.items.length} items; ${r.sources.ok}/${r.sources.tried} sources ok`);
for (const f of r.sources.failed) console.log(`  failed: ${f.id} (${f.error})`);
if (process.argv.includes('--report')) for (const x of r.report) console.log(`  ${x.ok ? 'ok ' : 'ERR'} ${x.id} raw=${x.raw ?? 0} kept=${x.kept ?? 0}${x.error ? ` ${x.error}` : ''}`);
if (r.items.length < MIN_KEEP) {
  console.log(`only ${r.items.length} items; keeping the existing snapshot (${old?.items.length ?? 0} items)`);
  process.exit(0);
}
writeFileSync(SNAPSHOT_PATH, `${JSON.stringify({ fetched_at: r.fetched_at, layer: r.layer, sources: r.sources, items: r.items.map(({ title, url, source, date, snippet, brands, communities, via }) => ({ title, url, source, date, snippet, brands, communities, via })) }, null, 1)}\n`);
console.log(`wrote ${SNAPSHOT_PATH}`);
