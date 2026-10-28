/** Drawn-free test records for season source and personal matching contracts.
 * Fictional records are never bundled as public seasonal trends. Author: John Khan.
 */
export function sampleSeason() {
  return {
    format: 'beljour-season-book/1',
    seasonId: 'autumn-2026',
    seasonName: 'Autumn 2026',
    validFrom: '2026-10-01',
    validUntil: '2026-11-30',
    reviewedAt: '2026-10-24',
    houses: [
      {
        id: 'contrast-house',
        name: 'Contrast',
        reportedTrend: 'Illustrative entry used for source-validation tests only.',
        reportedOn: '2026-10-23',
        release: 'reviewed',
        sources: [{
          publisher: 'Example Publisher',
          title: 'Fixture story only',
          published: '2026-10-22',
          url: 'https://example.org/fixture',
        }],
      },
      {
        id: 'unreviewed-house',
        name: 'Awaiting editorial review',
        reportedTrend: 'Never visible to users.',
        reportedOn: '2026-10-23',
        release: 'draft',
        sources: [],
      },
    ],
    looks: [
      {
        id: 'sample-look',
        houseId: 'contrast-house',
        name: 'Contrast Study',
        toneIds: ['BL12', 'BL14'],
        release: 'reviewed',
        status: 'illustrative',
        note: 'Source-bound digital concept, not a product claim.',
      },
      {
        id: 'unreviewed-look',
        houseId: 'unreviewed-house',
        name: 'Hidden Study',
        toneIds: ['BL19'],
        release: 'draft',
        status: 'illustrative',
        note: 'Never shown before review.',
      },
    ],
  };
}

export function exampleLook() {
  return {
    format: 'beljour-my-look/1',
    id: 'look-1234abcd',
    name: 'Fixture Saved Look',
    created: '2026-10-22T10:00:00.000Z',
    steps: [{
      kind: 'filters',
      strength: 50,
      params: { shade_id: 'BL12', note: 'never transfer free-form note' },
    }],
  };
}

export function samplePersonalMatch() {
  return {
    format: 'beljour-season-match/1',
    seasonId: 'autumn-2026',
    mappingProvider: 'lane-f',
    mappingVersion: 'season-map-1',
    matchedProfileId: 'profile-1234',
    matches: [{
      lookId: 'sample-look',
      toneId: 'BL12',
      fit: 'recommended',
      reason: 'The confirmed mapping supports this shade within the selected undertone.',
    }],
  };
}

export function mockPort(options = {}) {
  const calls = [];
  const port = {
    calls,
    async loadReviewedSeason() {
      calls.push('load');
      return options.catalogue ?? sampleSeason();
    },
    async readShadeHistory() {
      calls.push('history');
      return options.history ?? [{
        shadeId: 'BL12', observedOn: '2026-10-20', source: 'user-chosen',
      }];
    },
    async readUndertoneProfile() {
      calls.push('profile');
      return options.profile ?? {
        profileId: 'profile-1234', undertone: 'neutral',
        source: 'user-confirmed', confirmed: true,
      };
    },
    async matchUsingLaneF(input) {
      calls.push(['match', input]);
      return options.matches ?? samplePersonalMatch();
    },
  };
  return port;
}
