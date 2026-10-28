# BELJOUR | Tuesday technical lock review

Author: John Khan
Run: `tuesday-unmeasured`; renderer: `build-unverified`

## Evidence contract

Five commands at 41 strengths each, plus 1080 and 4K at 41 strengths each.
Every command uses Identity Lock by default. /CLEANUP precedes tier /UPSCALE.
1080 requires a 1920px long edge; 4K requires a 3840px long edge.
The STUDIO reference uses a soft key, gentle sculpting, preserved texture and true colour.
POSEONLY must preserve protected face pixels and satisfy the pose fold guard.

## Current measurement coverage

| Scope | Slots | Observed | Device | Missing | Safety | Timing | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| /identitylock | 41 | 0 | 0 | 41 | 0 | 0 | incomplete |
| /cleanup | 41 | 0 | 0 | 41 | 0 | 0 | incomplete |
| /upscale | 41 | 0 | 0 | 41 | 0 | 0 | incomplete |
| /studioquality | 41 | 0 | 0 | 41 | 0 | 0 | incomplete |
| /poseonly | 41 | 0 | 0 | 41 | 0 | 0 | incomplete |
| /upscale:1080 | 41 | 0 | 0 | 41 | 0 | 0 | incomplete |
| /upscale:4k | 41 | 0 | 0 | 41 | 0 | 0 | incomplete |

**Technical preflight: INCOMPLETE.**

This is an operator-ready evidence layout, not release approval.
The SHA-256 checksums detect file damage, not authentic model or consent provenance.
Production identity model: NOT APPROVED.
Independent 100,000-face qualification: NOT RUN.
Device performance across all 287 slots: NOT COMPLETE unless every device row is measured.

## Before Tuesday's lock

1. Run each missing level on the frozen renderer build and original photo session.
2. Retain measured preview/export latencies and per-edit identity decisions.
3. Check STUDIO skin lightness, colour, texture, protected pixels and alpha.
4. Check POSEONLY fold minima, applied retention and face immutability.
5. Keep 1080 and 4K timing separate, and do not conceal 4K preview misses.
6. Obtain the independent real-face verdict; never infer it from this packet.

See `action-gaps.csv` for each missing, failed, late or device-unmeasured slot.
