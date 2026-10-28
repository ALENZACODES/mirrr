"""W98 Lighting Simulator (core engine CE-6): see a look in daylight, office and evening light.

1. Normalise on capture: estimate the scene white from a neutral patch or a grey-world
   region, then adapt every colour to D65 (Bradford), so stored Lab is illuminant-free.
2. Re-light on demand: each preset is a white point (CIE daylight locus, or the Planckian
   locus with an optional Duv offset for fluorescent tubes), an intensity, and how far the
   eye or camera adapts to it. Appearance = Bradford from D65 toward the preset white by
   (1 - adaptation), then intensity scaled by intensity ** (1 - exposure compensation).
3. Fail honestly: for each preset it reports every item's colour shift (CIEDE2000 from its
   daylight appearance) and checks pairs. A "match" pair (foundation vs skin) fails when
   it drifts apart; a "contrast" pair (lip vs skin) fails when it stops showing. A simulator
   that only flatters is a filter: this one can and does fail a look.

Limits stated in every report: colours are three numbers, not spectra, so metamerism (two
products matching in one light and not another for spectral reasons) is not modelled; and
screens are not colour-calibrated. Formulas: CIE daylight locus (CIE 15), Kim cubic Planckian
approximation (Kim et al. 2002), Bradford chromatic adaptation (Lam 1985); concept only, no code copied.
Mirrored in web/src/engines/shade/lighting.ts. Author: John Khan.
"""
from __future__ import annotations

import json
import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from . import colourspace as cs

LABEL = "Lighting simulation. Colours are estimates; your screen is not colour-calibrated."
CAVEAT = ("Screens are not colour-calibrated, so what you see is an estimate. Shifts are computed from colour "
          "values, not product spectra, so a product that matches in one light and not in another for spectral "
          "reasons is not caught here.")
VERSION = "lighting-w98/1"
BRADFORD = np.array([[0.8951, 0.2664, -0.1614],
                     [-0.7502, 1.7135, 0.0367],
                     [0.0389, -0.0685, 1.0296]], dtype=np.float64)
BRADFORD_INV = np.linalg.inv(BRADFORD)
PAIR_KINDS = ("match", "contrast")


@lru_cache(maxsize=1)
def presets_data() -> dict[str, Any]:
    return dict(json.loads(Path(__file__).with_name("lighting_presets.json").read_text(encoding="utf-8")))


def preset(preset_id: str) -> dict[str, Any]:
    for row in presets_data()["presets"]:
        if row["id"] == preset_id:
            return dict(row)
    raise ValueError(f"unknown lighting preset {preset_id!r}")


def preset_ids() -> tuple[str, ...]:
    return tuple(row["id"] for row in presets_data()["presets"])


def planckian_xy(cct: float) -> tuple[float, float]:
    """Kim et al. (2002) cubic approximation of the Planckian locus, 1667..25000 K."""
    if not math.isfinite(cct) or not 1667 <= cct <= 25000:
        raise ValueError("colour temperature must be 1667..25000 K")
    t = float(cct)
    if t <= 4000:
        x = -0.2661239e9 / t ** 3 - 0.2343589e6 / t ** 2 + 0.8776956e3 / t + 0.179910
    else:
        x = -3.0258469e9 / t ** 3 + 2.1070379e6 / t ** 2 + 0.2226347e3 / t + 0.240390
    if t <= 2222:
        y = -1.1063814 * x ** 3 - 1.34811020 * x ** 2 + 2.18555832 * x - 0.20219683
    elif t <= 4000:
        y = -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867
    else:
        y = 3.0817580 * x ** 3 - 5.87338670 * x ** 2 + 3.75112997 * x - 0.37001483
    return x, y


def daylight_xy(cct: float) -> tuple[float, float]:
    """CIE daylight locus, 4000..25000 K."""
    if not math.isfinite(cct) or not 4000 <= cct <= 25000:
        raise ValueError("daylight colour temperature must be 4000..25000 K")
    t = float(cct)
    if t <= 7000:
        x = -4.6070e9 / t ** 3 + 2.9678e6 / t ** 2 + 0.09911e3 / t + 0.244063
    else:
        x = -2.0064e9 / t ** 3 + 1.9018e6 / t ** 2 + 0.24748e3 / t + 0.237040
    return x, -3.000 * x * x + 2.870 * x - 0.275


def _xy_to_uv(x: float, y: float) -> tuple[float, float]:
    d = -2 * x + 12 * y + 3
    return 4 * x / d, 6 * y / d


def _uv_to_xy(u: float, v: float) -> tuple[float, float]:
    d = 2 * u - 8 * v + 4
    return 3 * u / d, 2 * v / d


def with_duv(cct: float, duv: float) -> tuple[float, float]:
    """Planckian chromaticity moved `duv` along the CIE 1960 normal (positive is greener)."""
    if not math.isfinite(duv) or abs(duv) > 0.02:
        raise ValueError("Duv must be within +/-0.02")
    x, y = planckian_xy(cct)
    if duv == 0:
        return x, y
    u0, v0 = _xy_to_uv(*planckian_xy(max(1667.0, cct - 1)))
    u1, v1 = _xy_to_uv(*planckian_xy(min(25000.0, cct + 1)))
    tu, tv = u1 - u0, v1 - v0
    norm = math.hypot(tu, tv)
    # Rising temperature runs left along the locus; rotate so positive Duv points up (green).
    nu, nv = tv / norm, -tu / norm
    if nv < 0:
        nu, nv = -nu, -nv
    u, v = _xy_to_uv(x, y)
    return _uv_to_xy(u + duv * nu, v + duv * nv)


def xy_to_white(x: float, y: float) -> np.ndarray:
    if not (math.isfinite(x) and math.isfinite(y)) or y <= 0:
        raise ValueError("invalid chromaticity")
    return np.array([x / y, 1.0, (1 - x - y) / y], dtype=np.float64)


def preset_white(row: Mapping[str, Any]) -> np.ndarray:
    locus = row["locus"]
    if locus == "d65":
        return cs.WHITE.copy()
    if locus == "daylight":
        return xy_to_white(*daylight_xy(float(row["cct"])))
    if locus == "planckian":
        return xy_to_white(*with_duv(float(row["cct"]), float(row.get("duv", 0.0))))
    raise ValueError(f"unknown locus {locus!r}")


def bradford(source_white: object, target_white: object, degree: float = 1.0) -> np.ndarray:
    """3x3 XYZ matrix adapting `source_white` toward `target_white` by `degree` (0 = none)."""
    if not math.isfinite(degree) or not 0 <= degree <= 1:
        raise ValueError("adaptation degree must be in 0..1")
    src = BRADFORD @ np.asarray(source_white, dtype=np.float64)
    dst = BRADFORD @ np.asarray(target_white, dtype=np.float64)
    if np.any(np.abs(src) < 1e-9):
        raise ValueError("source white is degenerate")
    gain = degree * dst / src + (1 - degree)
    return BRADFORD_INV @ np.diag(gain) @ BRADFORD


def estimate_white(pixels: object) -> np.ndarray | None:
    """Scene white (XYZ, Y = 1) from pixels assumed grey on average; None when unusable."""
    arr = cs.check_rgb(pixels).reshape(-1, 3)
    if len(arr) < 12:
        return None
    lin = cs.decode(arr).mean(axis=0)
    if float(np.min(lin)) <= 1e-6:
        return None
    xyz = cs.linear_to_xyz(lin)
    return xyz / xyz[1]


def neutralise_lab(lab: object, scene_white: object | None) -> np.ndarray:
    """Illuminant-free Lab: adapt from the estimated scene white to D65."""
    arr = np.asarray(lab, dtype=np.float64)
    if scene_white is None:
        return arr.copy()
    m = bradford(scene_white, cs.WHITE, 1.0)
    return cs.xyz_to_lab(cs.lab_to_xyz(arr) @ m.T)


def appearance_matrix(row: Mapping[str, Any]) -> np.ndarray:
    """XYZ (D65 appearance) to XYZ appearance under the preset, intensity included."""
    data = presets_data()
    adaptation = float(row["adaptation"])
    intensity = float(row["intensity"])
    if not 0 <= adaptation <= 1 or not 0 < intensity <= 4:
        raise ValueError("preset adaptation must be 0..1 and intensity 0..4")
    scale = intensity ** (1 - float(data["exposure_compensation"]))
    return bradford(cs.WHITE, preset_white(row), 1 - adaptation) * scale


def relight_lab(lab: object, preset_id: str) -> np.ndarray:
    m = appearance_matrix(preset(preset_id))
    return cs.xyz_to_lab(cs.lab_to_xyz(np.asarray(lab, dtype=np.float64)) @ m.T)


def relight_image(image: object, preset_id: str, *, scene_white: object | None = None) -> np.ndarray:
    """Whole-photo preview in linear light: neutralise to D65, then the preset's appearance."""
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
        raise ValueError("lighting preview needs a uint8 RGB or RGBA photo")
    m = appearance_matrix(preset(preset_id))
    if scene_white is not None:
        m = m @ bradford(scene_white, cs.WHITE, 1.0)
    rgb_m = cs.XYZ_TO_RGB @ m @ cs.RGB_TO_XYZ
    lin = cs.decode(img[..., :3]) @ rgb_m.T
    out = img.copy()
    out[..., :3] = cs.to_bytes(cs.encode(lin))
    return out


@dataclass(frozen=True)
class LookReport:
    presets: tuple[str, ...]
    items: dict[str, dict[str, Any]]
    pairs: list[dict[str, Any]]
    failures: list[str]

    @property
    def holds(self) -> bool:
        return not self.failures

    def to_json(self) -> dict[str, Any]:
        return {"format": "beljour-lighting-w98/1", "version": VERSION, "label": LABEL, "caveat": CAVEAT,
                "presets": list(self.presets), "items": self.items, "pairs": self.pairs,
                "verdict": "holds in every light shown" if self.holds else "fails: " + "; ".join(self.failures),
                "holds": self.holds, "failures": self.failures}


def simulate_look(items: Mapping[str, Sequence[float]], pairs: Sequence[Mapping[str, str]] = (), *,
                  presets: Sequence[str] | None = None, scene_white: object | None = None) -> LookReport:
    """Each item's appearance and shift per preset, and pass/fail for each declared pair."""
    if not items:
        raise ValueError("a look needs at least one item")
    chosen = tuple(presets) if presets is not None else tuple(presets_data()["shown_first"])
    if not chosen:
        raise ValueError("choose at least one lighting preset")
    for pid in chosen:
        preset(pid)
    rules = presets_data()["rules"]
    base = {name: neutralise_lab(np.asarray(lab, dtype=np.float64), scene_white) for name, lab in items.items()}
    for name, lab in base.items():
        if lab.shape != (3,) or not np.all(np.isfinite(lab)):
            raise ValueError(f"item {name!r} needs one finite Lab colour")
    out_items: dict[str, dict[str, Any]] = {}
    lit: dict[str, dict[str, np.ndarray]] = {}
    for name, lab in base.items():
        row: dict[str, Any] = {"daylight_lab": [round(float(v), 4) for v in lab], "by_preset": {}}
        for pid in chosen:
            shown = relight_lab(lab, pid)
            lit.setdefault(pid, {})[name] = shown
            shift = cs.delta_e(lab, shown)
            row["by_preset"][pid] = {"lab": [round(float(v), 4) for v in shown], "shift_delta_e": round(shift, 4),
                                     "large_shift": shift > float(rules["large_shift_delta_e"])}
        out_items[name] = row
    out_pairs: list[dict[str, Any]] = []
    failures: list[str] = []
    for pair in pairs:
        a, b, kind = pair.get("a"), pair.get("b"), pair.get("kind")
        if a not in base or b not in base or kind not in PAIR_KINDS:
            raise ValueError("pairs name two items and a kind of match or contrast")
        entry: dict[str, Any] = {"a": a, "b": b, "kind": kind, "by_preset": {}}
        for pid in chosen:
            de = cs.delta_e(lit[pid][a], lit[pid][b])
            ok = de <= float(rules["match_delta_e_max"]) if kind == "match" else de >= float(rules["contrast_delta_e_min"])
            entry["by_preset"][pid] = {"delta_e": round(de, 4), "passed": ok}
            if not ok:
                label = preset(pid)["label"]
                failures.append(f"{a} and {b} {'stop matching' if kind == 'match' else 'lose contrast'} in {label}"
                                f" (ΔE {de:.1f})")
        out_pairs.append(entry)
    return LookReport(chosen, out_items, out_pairs, failures)
