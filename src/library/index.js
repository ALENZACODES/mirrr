/**
 * MIRRR Library engine: turns the wired knowledge guides into community-aware reading views
 * and a full-text search. Pure functions over the catalog; no I/O.
 */
import { SHELVES, GUIDES } from './catalog.js';
import {
  LIBRARY_COMMUNITIES, resolveCommunity, communityLabel, communityOfExportName,
  isCommunityKeyed, canonicalCommunity, itemMatchesCommunity,
} from './communities.js';
import { withoutMensContent } from '../women_only.js';

const BY_ID = new Map(GUIDES.map(g => [g.id, g]));

/** 'ETHNIC_BATH_RITUAL_GUIDES' -> 'Ethnic Bath Ritual Guides'; 'culturalContext' -> 'Cultural Context'. */
export function humanize(key) {
  return String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Each guide's data with men's-grooming passages left out (MIRRR is for women), computed once.
const CLEAN = new WeakMap();
function dataExports(mod) {
  if (!CLEAN.has(mod)) {
    const seen = new WeakMap();
    CLEAN.set(mod, Object.entries(mod)
      .filter(([, v]) => v !== null && typeof v === 'object')
      .map(([k, v]) => [k, withoutMensContent(v, seen)])
      .filter(([, v]) => v != null));
  }
  return CLEAN.get(mod);
}

/** Collections whose items carry a community tag (e.g. SKIN_RITUALS entries with community: 'arab'). */
function taggedItems(value) {
  const items = Array.isArray(value) ? value : Object.values(value);
  if (!items.length || !items.every(i => i && typeof i === 'object')) return null;
  return items.some(i => 'community' in i || 'communities' in i || 'communityId' in i) ? items : null;
}

function communityKeyOf(obj, id) {
  return Object.keys(obj).find(k => canonicalCommunity(k) === id);
}

/** Size of the readable text inside a value, used to order sections and skip empties. */
export function textWeight(value) {
  if (value == null) return 0;
  if (typeof value === 'string') return value.trim().length;
  if (typeof value !== 'object') return String(value).length;
  return Object.values(value).reduce((n, v) => n + textWeight(v), 0);
}

/**
 * Read one guide for one community: the community's own sections first, then the
 * universal knowledge that applies to everyone. Sections with no text are dropped.
 */
export function readGuide(guideId, communityRaw) {
  const guide = BY_ID.get(guideId);
  if (!guide) return null;
  const community = resolveCommunity(communityRaw);
  const own = []; const universal = []; const seen = new Set();
  let coversCommunity = false;
  for (const [name, value] of dataExports(guide.mod)) {
    if (seen.has(value)) continue;
    seen.add(value);
    const exportCommunity = communityOfExportName(name);
    if (exportCommunity) {
      coversCommunity = true;
      if (exportCommunity === community.id) own.push({ title: humanize(name.slice(exportCommunity.length + 1) || name), body: value });
      continue;
    }
    if (isCommunityKeyed(value)) {
      Object.values(value).forEach(v => seen.add(v));
      coversCommunity = true;
      const key = community.id && communityKeyOf(value, community.id);
      if (key) own.push({ title: humanize(name), body: value[key] });
      continue;
    }
    const tagged = taggedItems(value);
    if (tagged && community.id) {
      const mine = tagged.filter(i => itemMatchesCommunity(i, community.id));
      if (mine.length) { coversCommunity = true; own.push({ title: humanize(name), body: mine }); }
      continue;
    }
    universal.push({ title: humanize(name), body: value });
  }
  const keep = s => textWeight(s.body) > 0;
  return {
    id: guide.id,
    title: guide.title,
    shelf: guide.shelf,
    community: community.id ? { id: community.id, label: communityLabel(community.id), requested: community.requested, substituted: community.substituted } : null,
    coversCommunity,
    sections: [
      ...own.filter(keep).map(s => ({ ...s, scope: 'community' })),
      ...universal.filter(keep).map(s => ({ ...s, scope: 'universal' })),
    ],
  };
}

/** Shelves with their guides; for a community, how much each guide has written for it. */
export function listLibrary(communityRaw) {
  const community = resolveCommunity(communityRaw);
  return {
    communities: LIBRARY_COMMUNITIES,
    community: community.id ? { id: community.id, label: communityLabel(community.id), substituted: community.substituted } : null,
    shelves: SHELVES.map(shelf => ({
      ...shelf,
      guides: GUIDES.filter(g => g.shelf === shelf.id).map(g => {
        const view = community.id ? readGuide(g.id, community.id) : null;
        const forYou = view ? view.sections.filter(s => s.scope === 'community').reduce((n, s) => n + textWeight(s.body), 0) : 0;
        return { id: g.id, title: g.title, forYou };
      }),
    })),
  };
}

function* walkText(value, path, seen) {
  if (value == null) return;
  if (typeof value === 'string') { yield [path, value]; return; }
  if (typeof value !== 'object' || seen.has(value)) return;
  seen.add(value); // aggregate exports (ALL_X) re-reference per-community objects: read each once
  for (const [k, v] of Object.entries(value)) yield* walkText(v, [...path, k], seen);
}

/**
 * Search every guide. Each hit names the guide, the readable path to the passage, the
 * community it belongs to (if any), and a snippet around the first match.
 */
export function searchLibrary(query, { community: communityRaw = null, limit = 30 } = {}) {
  const terms = String(query ?? '').toLowerCase().split(/\s+/).filter(t => t.length >= 2).slice(0, 6);
  if (!terms.length) return { query, hits: [] };
  const only = resolveCommunity(communityRaw).id;
  const hits = [];
  for (const g of GUIDES) {
    const seen = new Set();
    const exports = dataExports(g.mod).sort(([a], [b]) => Number(!!communityOfExportName(b)) - Number(!!communityOfExportName(a)));
    for (const [name, value] of exports) {
      for (const [path, text] of walkText(value, [name], seen)) {
        const lower = text.toLowerCase();
        if (!terms.every(t => lower.includes(t))) continue;
        const comm = path.map(p => communityOfExportName(String(p)) ?? canonicalCommunity(p)).find(Boolean) ?? null;
        if (only && comm && comm !== only) continue;
        const at = lower.indexOf(terms[0]);
        const start = Math.max(0, at - 80);
        hits.push({
          guide: g.id,
          guideTitle: g.title,
          path: path.map(humanize).join(' › '),
          community: comm,
          snippet: (start ? '…' : '') + text.slice(start, at + 160).replace(/\s+/g, ' ').trim() + (at + 160 < text.length ? '…' : ''),
          score: terms.reduce((n, t) => n + lower.split(t).length - 1, 0) + (comm && comm === only ? 5 : 0),
        });
      }
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return { query, total: hits.length, hits: hits.slice(0, limit) };
}

export function guideIds() { return GUIDES.map(g => g.id); }
