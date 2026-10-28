"""Synthetic record writers for the C18 tests: made-up rows whose true rates we set.

Every file written here is synthetic and goes to a pytest tmp folder outside the
repository; the manifest says "synthetic" unless a test asks otherwise, so the
checks must answer with triage_only rows. Cases are laid out deterministically:
in each band the first round(rate x n) cases are acceptable, so a test knows
the exact rate it planted. Ids are pseudonymous (P-, J-, X-). Author: John Khan.
"""
from __future__ import annotations

import csv
import json
from collections.abc import Mapping, Sequence
from pathlib import Path

from lab.bqa_shade import applied, bands

BANDS = bands.REPORTING_BANDS


def inputs_folder(root: Path, provenance: str = "synthetic",
                  disclosures: Sequence[str] = ()) -> Path:
    folder = root / "bqa_shade"
    folder.mkdir(parents=True, exist_ok=True)
    manifest = {"format": "beljour-bqa-shade-inputs/1", "provenance": provenance,
                "disclosures": list(disclosures)}
    (folder / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    return folder


def write_csv(path: Path, columns: Sequence[str], rows: Sequence[Mapping[str, object]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(columns))
        writer.writeheader()
        for row in rows:
            writer.writerow({k: "" if row.get(k) is None else row.get(k) for k in columns})


def _yes(flag: bool | None) -> str:
    return "" if flag is None else ("yes" if flag else "no")


def trial_rows(rates: Mapping[str, float], per_band: int, *, judges: int = 3,
               product: str = "foundation", study: str = "launch", bench: str = "standard",
               light: str = "daylight", rate30: Mapping[str, float] | None = None,
               top3_rate: float | None = None, start: int = 1) -> list[dict[str, object]]:
    """Per-judge rows; rate30 adds the 30-minute verdicts, top3_rate the top-3 verdicts."""
    rows: list[dict[str, object]] = []
    number = start
    for band, rate in rates.items():
        good = round(rate * per_band)
        good30 = round((rate30 or {}).get(band, rate) * per_band)
        good3 = round((top3_rate if top3_rate is not None else 1.0) * per_band)
        for i in range(per_band):
            for judge in range(1, judges + 1):
                rows.append({
                    "participant_id": f"P-{number:04d}", "mst_band": band, "undertone": "warm",
                    "light": light, "device_tier": "mid", "product_type": product,
                    "predicted_1": f"SHD-FND-{i % 50:03d}", "predicted_2": "SHD-FND-900",
                    "predicted_3": "", "expert_shade": "SHD-FND-901",
                    "judge_id": f"J-{judge:02d}",
                    "acceptable_10min": _yes(i < good),
                    "acceptable_30min": _yes(i < good30) if rate30 is not None else "",
                    "top3_acceptable": _yes(i < good3) if top3_rate is not None else "",
                    "under_eye_natural": _yes(i < good) if product == "concealer" else "",
                    "blemish_step_diff": (0 if i < good else 3) if product == "concealer"
                    else "",
                    "bench": bench, "study": study,
                })
            number += 1
    return rows


def write_trials(folder: Path, rows: Sequence[Mapping[str, object]]) -> None:
    write_csv(folder / "applied_trials.csv", [c.name for c in applied.TRIAL_COLUMNS], rows)


def label_rows(per_band: int, tone_rate: float, undertone_rate: float,
               expert_unsure: int = 0) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    number = 1
    for band_index in range(5):
        step = 2 * band_index + 1
        good_tone = round(tone_rate * per_band)
        good_under = round(undertone_rate * per_band)
        for i in range(per_band):
            rows.append({
                "participant_id": f"P-{number:04d}", "light": "daylight", "expert_id": "X-01",
                "expert_mst_step": step,
                "expert_undertone": "unsure" if i < expert_unsure else "warm",
                "product_mst_step": step if i < good_tone else min(10, step + 3),
                "product_undertone": "warm" if i < good_under else "cool",
            })
            number += 1
    return rows


def swatch_record(shade_id: str, **changes: object) -> dict[str, object]:
    record: dict[str, object] = {
        "shade_id": shade_id, "product_type": "foundation", "product_id": "PRD-01",
        "finish": "satin", "coverage": "medium", "claimed_undertone": "warm",
        "measured_undertone": "warm", "measured_lab": [62.0, 12.0, 18.0],
        "instrument": "spectrophotometer", "illuminant": "D65", "observer": "2",
        "swatch_photo_ids": ["PH-0001"], "oxidation_lab": [60.5, 12.5, 19.0],
        "oxidation_photo_id": "PH-0002", "skin_swatch_mst_steps": [3, 4, 5, 6, 7],
        "verifier_id": "X-02", "verified_date": "2026-10-20", "price": 24.0, "currency": "USD",
    }
    record.update(changes)
    return record


def catalogue_shade(shade_id: str, *, evidence: str = "in_hand", photo_only: bool = False,
                    status: str = "active", claim: str | None = None) -> dict[str, object]:
    fields: dict[str, object] = {
        "lab": {"source": "lab", "verified_date": "2026-10-01", "manufacturer_claim": False},
        "undertone": {"source": "panel", "verified_date": "2026-10-01",
                      "manufacturer_claim": False},
    }
    if claim is not None:
        fields["wear"] = {"source": "manufacturer", "verified_date": "2026-10-01",
                          "manufacturer_claim": True, "value": claim}
    return {"shade_id": shade_id, "product_type": "foundation", "status": status,
            "undertone_label": {"value": "warm", "evidence": evidence, "labeller_id": "X-03",
                                "date": "2026-10-02", "photo_only": photo_only},
            "fields": fields}


def write_json(folder: Path, name: str, data: Mapping[str, object]) -> None:
    (folder / name).write_text(json.dumps(data), encoding="utf-8")
