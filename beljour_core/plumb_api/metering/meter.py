"""Cost per edit: measured local compute per engine, YouCam units per edit, and a price table.

Three inputs, kept apart so no number is mixed with a guess:

* Local compute is measured here. Each probe prepares a code-drawn input once, then times one
  complete edit: a cold call, then `repeats` warm calls (wall clock and process CPU time), and
  a separate traced call for peak Python heap (tracemalloc; numpy buffers included). These are
  the Python reference engines on the machine that ran the meter; the browser mirrors in
  web/src run on the person's device and are not timed here, so their timing is NOT_RUN.
* Provider units per edit come from the unit table and caps the app already enforces
  (youcam/units.py, limits.py, config.py). They are what the server reserves before a call,
  not a measured bill; a cached result costs 0 units.
* Money comes from prices.json (CAD). Every price there is ASSUMED and editable; a price set to
  null shows NOT_SET. A cost is only computed from a measured or enforced quantity times a
  price, never estimated from nothing.

No photographs, no network and no provider calls are used. Author: John Khan.
"""
from __future__ import annotations

import ast
import hashlib
import json
import os
import platform
import time
import tracemalloc
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

NOT_RUN = "NOT_RUN"
NOT_SET = "NOT_SET"
RUN_FORMAT = "beljour-cost-run/1"
PRICE_FORMAT = "beljour-price-table/1"
API = Path(__file__).resolve().parents[2]
REPO = API.parent
PRICES = Path(__file__).resolve().parent / "prices.json"
DEFAULT_REPEATS = 7

Edit = Callable[[], object]


@dataclass(frozen=True)
class Probe:
    """One local edit, its engine sources (for staleness) and the feature rows it serves."""
    id: str
    label: str
    features: tuple[int, ...]
    sources: tuple[str, ...]
    prepare: Callable[[], tuple[Edit, int]]   # returns the edit and the pixels it renders


def _filter_look() -> tuple[Edit, int]:
    from plumb_api.filters import engine
    from plumb_api.filters.qa import fixtures as F
    from plumb_api.filters.recipe import registry

    recipe = registry.default().ranked()[0]
    face = F.portrait("medium", width=400, height=480, grain=3.0)
    centre = F.face_centre(face)
    cache = engine.LutCache()   # its own cache, so the cold call includes baking the look

    def edit() -> object:
        return engine.render(face.image, recipe, engine.Settings(), face.masks, face_centre=centre, cache=cache)
    return edit, 400 * 480


def _skin(tool: str, strength: float, **params: Any) -> Callable[[], tuple[Edit, int]]:
    def prepare() -> tuple[Edit, int]:
        from plumb_api.engines.core.refusal import Refusal
        from plumb_api.engines.skin.studio import render
        from plumb_api.engines.skin.synthetic import skin_face

        face = skin_face("medium", seed=3, width=400, height=480)

        def edit() -> object:
            result = render(tool, face.image, face.points, strength=strength, **params)
            if isinstance(result, Refusal):   # a refusal is not an edit; never time it as one
                raise RuntimeError(f"{tool} refused the drawn face: {result.code}")
            return result
        return edit, 400 * 480
    return prepare


def _part(values: dict[str, float]) -> Callable[[], tuple[Edit, int]]:
    def prepare() -> tuple[Edit, int]:
        from plumb_api.engines.proportions.synthetic import symmetric_face
        from plumb_api.engines.shape import parts

        width, height = 400, 500
        mesh = symmetric_face(width, height)
        yy, xx = np.mgrid[:height, :width]
        image = np.stack([(60 + (xx % 97)), (90 + (yy % 89)), ((xx + yy) % 251)], axis=-1).astype(np.uint8)

        def edit() -> object:
            return parts.render(image, mesh, values, opted_in=True)
        return edit, width * height
    return prepare


SKIN_SOURCES = ("api/plumb_api/engines/skin/studio.py", "api/plumb_api/engines/skin/common.py")
PROBES: tuple[Probe, ...] = (
    Probe("filter-look", "Filter look (first ranked look) on a drawn portrait", (),
          ("api/plumb_api/filters/engine.py",), _filter_look),
    Probe("skin-tone", "Tone evening and redness", (29,), (*SKIN_SOURCES, "api/plumb_api/engines/skin/tone.py"),
          _skin("tone", 60, redness=50)),
    Probe("skin-tan", "Tan add", (30,), (*SKIN_SOURCES, "api/plumb_api/engines/skin/tan.py"),
          _skin("tan", 60, direction="add", undertone="neutral")),
    Probe("skin-freckles", "Freckles", (104,), (*SKIN_SOURCES, "api/plumb_api/engines/skin/freckles.py"),
          _skin("freckles", 60, density=70, seed=7)),
    Probe("skin-matte", "Matte (shine control)", (105,), (*SKIN_SOURCES, "api/plumb_api/engines/skin/finish.py"),
          _skin("matte", 50)),
    Probe("skin-glow", "Skin glow", (106,), (*SKIN_SOURCES, "api/plumb_api/engines/skin/finish.py"),
          _skin("glow", 60, style="cassis")),
    Probe("part-nose", "Nose width", (40,), ("api/plumb_api/engines/shape/parts.py",), _part({"nose_width": 60.0})),
    Probe("part-lips", "Lip fullness", (38,), ("api/plumb_api/engines/shape/parts.py",), _part({"lip_fullness": 60.0})),
    Probe("part-eyes", "Eye size", (41,), ("api/plumb_api/engines/shape/parts.py",), _part({"eye_size": 50.0})),
)


def quantile(values: Sequence[float], q: float) -> float:
    """Linear interpolation between sorted samples (the Proof Wall's rule)."""
    ordered = sorted(values)
    if not ordered:
        raise ValueError("no samples")
    pos = (len(ordered) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(ordered) - 1)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (pos - lo)


def _timed(edit: Edit) -> tuple[float, float]:
    wall, cpu = time.perf_counter(), time.process_time()
    edit()
    return (time.perf_counter() - wall) * 1000.0, (time.process_time() - cpu) * 1000.0


def measure(edit: Edit, *, repeats: int = DEFAULT_REPEATS) -> dict[str, Any]:
    """Cold call, `repeats` warm calls and one traced call for peak heap."""
    if repeats < 1:
        raise ValueError("repeats must be at least 1")
    cold_ms, cold_cpu = _timed(edit)
    warm = [_timed(edit) for _ in range(repeats)]
    tracemalloc.start()
    try:
        edit()
        peak = tracemalloc.get_traced_memory()[1]
    finally:
        tracemalloc.stop()
    walls, cpus = [w for w, _ in warm], [c for _, c in warm]
    return {"cold_ms": round(cold_ms, 3), "cold_cpu_ms": round(cold_cpu, 3),
            "warm_p50_ms": round(quantile(walls, 0.5), 3), "warm_p95_ms": round(quantile(walls, 0.95), 3),
            "warm_cpu_p50_ms": round(quantile(cpus, 0.5), 3), "warm_samples": repeats,
            "peak_heap_kib": round(peak / 1024, 1)}


def source_digest(sources: Sequence[str], root: Path = REPO) -> str:
    """One SHA-256 over a probe's engine files, so a run can be shown stale after an edit."""
    h = hashlib.sha256()
    for rel in sources:
        h.update(rel.encode() + b"\0" + (root / rel).read_bytes() + b"\0")
    return h.hexdigest()


def platform_info() -> dict[str, Any]:
    return {"python": platform.python_version(), "numpy": np.__version__, "os": platform.system().lower(),
            "machine": platform.machine(), "cpu_count": os.cpu_count()}


def run(probes: Sequence[Probe] = PROBES, *, repeats: int = DEFAULT_REPEATS, note: str = "") -> dict[str, Any]:
    """Measure every probe. A probe whose engine raises is recorded as failed, not timed."""
    rows = []
    for probe in probes:
        row: dict[str, Any] = {"id": probe.id, "label": probe.label, "features": list(probe.features),
                               "sources": list(probe.sources), "source_sha256": source_digest(probe.sources)}
        try:
            edit, pixels = probe.prepare()
            row.update(measure(edit, repeats=repeats), pixels=pixels, status="measured")
        except Exception as exc:  # noqa: BLE001  any engine failure is recorded, never timed
            row.update(status="failed", error=f"{type(exc).__name__}: {exc}")
        rows.append(row)
    return {"format": RUN_FORMAT, "author": "John Khan", "measured_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "platform": platform_info(), "repeats": repeats, "note": note,
            "scope": "Python reference engines, code-drawn inputs, one process, no network", "probes": rows}


def read_prices(path: Path = PRICES) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("format") != PRICE_FORMAT or data.get("currency") != "CAD":
        raise ValueError("price table must be beljour-price-table/1 in CAD")
    for key, entry in data.get("prices", {}).items():
        cad = entry.get("cad")
        if cad is not None and (isinstance(cad, bool) or not isinstance(cad, (int, float)) or cad < 0):
            raise ValueError(f"price {key} must be a non-negative number or null")
        if entry.get("basis") != "ASSUMED":
            raise ValueError(f"price {key} must say basis ASSUMED until it comes from an invoice or contract")
    return data


def price(prices: dict[str, Any], key: str) -> float | None:
    entry = prices.get("prices", {}).get(key)
    return None if entry is None or entry.get("cad") is None else float(entry["cad"])


def money(quantity: float | None, rate: float | None) -> float | str:
    """quantity x rate in CAD, or why it can't be shown."""
    if quantity is None:
        return NOT_RUN
    if rate is None:
        return NOT_SET
    return round(quantity * rate, 6)


def compute_cost(run_row: dict[str, Any] | None, prices: dict[str, Any]) -> dict[str, Any]:
    """Server-side CAD per edit of a measured local edit: warm CPU time x the CPU-hour price."""
    cpu_ms = run_row.get("warm_cpu_p50_ms") if run_row and run_row.get("status") == "measured" else None
    hours = None if cpu_ms is None else cpu_ms / 3_600_000
    rate = price(prices, "server_cpu_hour")
    return {"server_cad_per_edit": money(hours, rate),
            "server_cad_per_1000_edits": money(None if hours is None else hours * 1000, rate),
            "browser_ms": NOT_RUN, "browser_cad_per_edit": NOT_RUN}


def module_constant(path: Path, name: str) -> Any:
    """A literal constant read from a module's source without importing it (the skin-match
    service imports the HTTP client, which a metering run does not need)."""
    for node in ast.parse(path.read_text(encoding="utf-8")).body:
        if isinstance(node, ast.Assign):
            targets, value = node.targets, node.value
        elif isinstance(node, ast.AnnAssign) and node.value is not None:
            targets, value = [node.target], node.value
        else:
            continue
        if any(isinstance(t, ast.Name) and t.id == name for t in targets):
            return ast.literal_eval(value)
    raise KeyError(f"{name} is not a literal in {path}")


SKIN_MATCH = API / "plumb_api" / "services" / "skin_match.py"


def provider_rows(prices: dict[str, Any], *, session_cap_public: int, session_cap_judge: int,
                  daily_unit_cap: int) -> list[dict[str, Any]]:
    """Units per edit for every provider action the app can send, under the caps it enforces."""
    from plumb_api.actions import ACTIONS
    from plumb_api.youcam import units

    calls: list[tuple[str, str, dict[str, Any], str]] = [
        (name, action.feature, {}, "ASSUMED" if action.assumed else "confirmed")
             for name, action in sorted(ACTIONS.items())]
    calls.append(("skin-match", module_constant(SKIN_MATCH, "FEATURE"),
                  {"dst_actions": list(module_constant(SKIN_MATCH, "DEFAULT_CONCERNS"))}, "confirmed"))
    rate = price(prices, "youcam_unit")
    rows = []
    for name, feature, payload, shape in calls:
        count = units.estimate(feature, payload)
        rows.append({
            "action": name, "feature": feature, "units_per_edit": count, "units_if_cached": 0,
            "unit_price_on_file": "unconfirmed" if feature in units.UNVERIFIED else "from the YouCam docs",
            "payload_shape": shape, "cad_per_edit": money(count, rate),
            "edits_per_public_session": session_cap_public // count if session_cap_public else None,
            "edits_per_judge_session": session_cap_judge // count if session_cap_judge else None,
            "edits_per_day": daily_unit_cap // count if daily_unit_cap else None,
            "server_compute": NOT_RUN,
        })
    return rows
