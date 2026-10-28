# Data factory

Author: John Khan.

Builds licence-clean, deduplicated, balanced and locked image sets for
training and collection. It works only on the files and metadata it is
given and never uses the network. Every test draws its images in code.

## Quick start

```
cd api
python -m plumb_api.data_factory intake --csv /data/set-a/batch.csv \
    --out /data/set-a/intake.jsonl --source beljour-studio-shoot --licence CC0-1.0
python -m plumb_api.data_factory example --out /data/set-a/config.json
# edit config.json, write intake.jsonl, put images under images/
python -m plumb_api.data_factory run --config /data/set-a/config.json
python -m plumb_api.data_factory verify --lock /data/set-a/out/train-set.lock --images
```

A run prints one line per stage and writes, under `output_dir`:

- `<set>.manifest.jsonl` (or `.jsonl.gz`): one row per kept image
- `<set>.lock`: the beljour-data-lock/1 file that pins the manifest
- `<set>.report.json` and `<set>.report.md`: counts, reasons, timings
- `images/<2 hex>/<content hash>.png`: the cleaned images (metadata removed)

## Intake rows

One JSON object per line. `path` is relative to `image_root`.

```
{"path": "shoot-1/0001.png", "source": "beljour-studio-shoot",
 "licence": "CC0-1.0", "attribution": "", "commercial_use": true,
 "consent": true, "age_band": "20-29", "skin_tone_group": "tone-04",
 "lighting": "studio", "pose_bucket": "frontal", "face_box": [80, 60, 220, 260]}
```

`content_sha256` may be given; it must then match the file. Declared
attributes and the face box are optional and are never inferred.

## Stages

| Stage | Drops an image when |
|---|---|
| ingest | the row is invalid, the file is missing or outside `image_root`, the declared hash differs, or the header fails the limits (format, CMYK, 16-bit, size) |
| licence | the source is on the deny-list, the licence is not allowed by licences.json (plus `extra_allowed`), commercial use or consent is missing, or a CC-BY licence has no attribution |
| exact_dedup | its upload bytes equal a kept image |
| quality | it cannot be decoded, or it is blurred, clipped, noisy, too small, or its face box is too small |
| near_dedup | its cleaned pixels equal a kept image, or pHash and dHash are both within the thresholds of a kept image |
| holdout | it is in the takedown registry, in a frozen test set, or a near copy of a frozen image present next to its lock (`on_leak: fail` stops the run; `near: false` turns the near check off) |
| balance | it is over its slice quota or outside the listed targets (only with a `balance` spec) |

Each stage writes kept items, rejects and a decision log to
`work_dir/stages/`, and its hashes to `work_dir/state.json`. A rerun skips
every stage whose settings, input and files are unchanged. Use `--fresh`
to start over, `--from-stage NAME` to rerun from a stage, `--until NAME`
to stop early.

## Locks

`beljour-data-lock/1` pins the manifest file hash, the hash of its rows,
the record count, each shard's count and hash, the filter config hash and
the tool version, and hashes itself. `verify` fails on any drift. A changed
set is only re-locked with `--relock`, as a new version that names its
parent; the old lock is kept as `<set>.lock.vN`. This format is separate
from the frozen test-set locks, which this package only reads.

## Other commands

- `intake --csv F --out F [--source S --licence L ...]`: contributor CSV to intake JSONL
- `status --config C`: which stages are done, stale or pending
- `leak-check --manifest M --frozen DIR...`: any record in a frozen test set
- `shards --lock L --out DIR`: per-shard file lists for loaders, checked against the lock
- `takedown --lock L --hash H --reason R --received YYYY-MM-DD [--registry F]`
- `datacard --lock L [--report R] --out DIR`
- `provenance --lock L [--reviews CSV] --out DIR`
- `diff --before M1 --after M2`
- `perf --records 100000 500000 --out DIR`

## Python API

Everything public is exported from `plumb_api.data_factory`; see
`__all__` in `__init__.py`.
