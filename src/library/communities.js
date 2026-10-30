/**
 * MIRRR Library: the 9 communities the knowledge guides are written for, and how
 * the rest of the app's community ids (Cultural DNA, taste profile) map onto them.
 */

export const LIBRARY_COMMUNITIES = [
  { id: 'west_african', label: 'West African' },
  { id: 'east_african', label: 'East African' },
  { id: 'south_african', label: 'South African' },
  { id: 'black_american', label: 'Black American' },
  { id: 'caribbean', label: 'Caribbean' },
  { id: 'south_asian', label: 'South Asian' },
  { id: 'arab', label: 'Arab' },
  { id: 'latina', label: 'Latina' },
  { id: 'east_asian', label: 'East Asian' },
];

const BY_SQUASHED = new Map(LIBRARY_COMMUNITIES.map(c => [c.id.replace(/_/g, ''), c.id]));

/** 'west-african' | 'westAfrican' | 'WEST_AFRICAN' | 'west_african_hair' -> 'west_african' (or null). */
export function canonicalCommunity(raw) {
  if (raw == null) return null;
  const squashed = String(raw).toLowerCase().replace(/[^a-z]/g, '');
  if (BY_SQUASHED.has(squashed)) return BY_SQUASHED.get(squashed);
  for (const [sq, id] of BY_SQUASHED) if (squashed.startsWith(sq)) return id;
  return null;
}

/**
 * Communities in the wider app that the guides do not cover get the closest written guide,
 * and the response says so (no silent substitution).
 */
const NEAREST = { southeast_asian: 'east_asian' };

export function resolveCommunity(raw) {
  const direct = canonicalCommunity(raw);
  if (direct) return { id: direct, requested: raw, substituted: false };
  const key = String(raw ?? '').toLowerCase().replace(/[-\s]/g, '_');
  if (NEAREST[key]) return { id: NEAREST[key], requested: raw, substituted: true };
  return { id: null, requested: raw ?? null, substituted: false };
}

export function communityLabel(id) {
  return LIBRARY_COMMUNITIES.find(c => c.id === id)?.label ?? null;
}

/** Export-name prefix like ARAB_RITUALS or BLACK_AMERICAN_ICONS -> community id. */
export function communityOfExportName(name) {
  const squashed = name.toLowerCase().replace(/[^a-z]/g, '');
  for (const [sq, id] of BY_SQUASHED) if (squashed.startsWith(sq)) return id;
  return null;
}

/** True when an object is keyed by communities (at least 5 of its keys are community ids). */
export function isCommunityKeyed(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.filter(k => canonicalCommunity(k)).length >= 5;
}

/** Items tagged with a community field: 'west-african', ['arab', 'all'], 'all'. */
export function itemMatchesCommunity(item, id) {
  const tag = item?.community ?? item?.communities ?? item?.communityId;
  if (tag == null) return false;
  const tags = Array.isArray(tag) ? tag : [tag];
  return tags.some(t => t === 'all' || canonicalCommunity(t) === id);
}
