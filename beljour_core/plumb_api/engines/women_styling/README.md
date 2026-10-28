# BELJOUR — Lane C R20c local W-series engines

Author: John Khan. Rebased on `f1e4f37` with the complete cumulative R19c-fix2 archive preserved. The package provides testable Python reference implementations and byte-parity TypeScript mirrors for **13 next eligible W-series IDs**: W4, W5, W7, W8, W9, W10, W11, W12, W13, W15, W16, W17 and W18. W3 is blocked on uncleared real-brand data and W14 is blocked on third-party identity/name rights, so neither is activated.

## What has been built

- A strict pixel/region-mask boundary that accepts RGB/RGBA `uint8`, integer strengths, approved variants and zero-network manual colour choices. No masks means no edit.
- Individual, original layer plans for each W-series feature. An outfit colour or manually sampled swatch is an RGB tuple; no web image, product catalogue, upload, inference API or remote template is required.
- NumPy reference and TS `Uint8Array` mirror with channel delta caps and unchanged alpha. Python-generated parity vectors are ephemeral. They test all variants with both RGB and RGBA algebraic fixtures, including partially opaque masks.
- Full-frame and **halo-overlapped stripe renderer** (default 64 rows) for lower transient memory. Both implementations agree byte-for-byte in seam tests. The three-by-three blur uses replicated image edges and global image coordinates.
- Typed preregistered real-face pass definitions and measurable synthetic audit results, not claims of real-face quality. See [`PASS_DEFINITIONS.md`](PASS_DEFINITIONS.md).
- An in-package registry overlay whose entries explicitly say `implemented-synthetic-tests-only`. The canonical generated registry is intentionally left unchanged until its owner can regenerate it from the missing authoritative source.

## Running the owned tests

From the repository root, once the normal pinned environment is installed:

```sh
cd api && python3 -m mypy --config-file mypy.ini plumb_api
cd api && python3 -m ruff check --config ruff.toml .
PYTHONPATH=api python3 -m pytest -q api/tests/test_women_r20c_*.py
cd web && npm run build
node --test web/test/women_r20c_*.test.mjs
python3 scripts/check_boundaries.py
```

Run `make -k check` from the complete f1e4f37 checkout before any claim that the full build is green. This delivery does not alter the runner, its real-face lock, the Save System, turn features, filters, or Lane B's makeup/hair packages. No additional dependencies or licence edits are required (NumPy is part of the existing Python stack; TypeScript uses built-in browser/runtime features).

## Remaining prerequisites for production

1. Obtain and validate per-person consent, licensing and a commercially cleared region-mask pipeline. These engines intentionally refuse to create or guess face masks.
2. Merge the 13 registration rows into the owner-managed canonical women registry and regenerate its produced files. Do not hand-edit the generated JSON as a workaround.
3. Integrate the chosen local engine into owned app UI with unambiguous simulation wording, user-initiated reset/compare and no recording of original photographs.
4. Run full Python, browser, accessibility, latency, memory and privacy checks on target devices, plus the frozen 100,000-face real-quality gate. Synthetic agreement is necessary but not evidence of face-quality pass.
5. Do not claim virtual product matches, medical efficacy, exact cosmetic outcomes, face classification, or superiority to any commercial editor on the basis of these simulations.
