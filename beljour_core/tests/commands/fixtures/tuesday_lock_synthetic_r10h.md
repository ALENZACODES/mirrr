# BELJOUR | Five Pro Commands: Tuesday technical lock

Run: `tuesday-205-synthetic-r10h` | Renderer: `r10h-local-cpu`
Technical verdict: **TECHNICAL REVIEW REQUIRED**
Independent real-face gate: **NOT RUN**. Production identity qualification: **NOT VERIFIED**.
Release authorized: **NO**. This sheet is not an external evaluation.

Observed slots: 205/205 (5 commands × 41 levels from 1.0 to 5.0 at 0.1 increments).
Budget requirements: preview ≤ 100.0 ms; full render ≤ 2000.0 ms. Device figures require actual device observation.

| Command | Captured/41 | Missing | Safety failures | Over budget | Device evidence | Preview median / P95 ms | Export median / P95 ms |
|---|---:|---:|---:|---:|---:|---|---|
| /identitylock | 41 | 0 | 0 | 0 | 0 | 0.43 / 0.50 | 0.44 / 0.56 |
| /cleanup | 41 | 0 | 0 | 0 | 0 | 2.39 / 2.80 | 2.40 / 2.84 |
| /upscale | 41 | 0 | 0 | 0 | 0 | 2.79 / 3.06 | 2.72 / 3.07 |
| /studioquality | 41 | 0 | 0 | 0 | 0 | 0.94 / 1.16 | 0.94 / 1.05 |
| /poseonly | 41 | 0 | 0 | 0 | 0 | 1.34 / 1.67 | 0.87 / 0.99 |

## Per-command action list

All failed levels must be corrected and measured again on the same registered build.
- `/identitylock`: missing none; safety failed none; timing failed none.
- `/cleanup`: missing none; safety failed none; timing failed none.
- `/upscale`: missing none; safety failed none; timing failed none.
- `/studioquality`: missing none; safety failed none; timing failed none.
- `/poseonly`: missing none; safety failed none; timing failed none.

## External release prerequisites

- Approved commercial identity model, independently validated on consenting adults.
- Preregistered, unchanged real-face pass definitions and source hashes.
- Completed locked 100,000-face run with independent labels, group fairness and no regression.
- Tested preview and export on the intended physical mobile devices.
- Independent human quality reviews and judge-visible end-to-end demo.

Evidence ledger: the corresponding JSON packet contains all 205 slots and its SHA-256 checksum.
The checksum detects corruption only; it is not proof of authorship, consent or authenticity.
