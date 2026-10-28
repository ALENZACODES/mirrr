"""Original, portable lash-map diagrams without a photo or biometric trace.

Exports use relative eye-width units because a single portrait has no physical
scale reference. A technician must verify suitability and choose actual products.
Author: John Khan.
"""
from __future__ import annotations

import csv
import io
import math
from collections.abc import Mapping, Sequence
from typing import Any
from xml.sax.saxutils import escape

MAP_LABEL = "Lash map simulation — discuss with a qualified lash professional."
MAP_WARNING = "Relative lengths are visual estimates. No millimetre fit, product match or achievable result is promised."


def _finite(value: Any, name: str, low: float, high: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError(f"invalid map {name}")
    return float(value)


def validate_map(value: Mapping[str, Any]) -> dict[str, Any]:
    if value.get("side") not in ("right", "left"):
        raise ValueError("map must name a side")
    zones = value.get("zones")
    if not isinstance(zones, Sequence) or isinstance(zones, (str, bytes)) or len(zones) != 7:
        raise ValueError("map must have seven zones")
    output = []
    for index, zone in enumerate(zones):
        if not isinstance(zone, Mapping) or zone.get("zone") != index + 1:
            raise ValueError("map zone order is invalid")
        start = _finite(zone.get("start"), "start", 0, 1)
        end = _finite(zone.get("end"), "end", 0, 1)
        if abs(start - index / 7) > 1e-8 or abs(end - (index + 1) / 7) > 1e-8:
            raise ValueError("map zones must cover the measured eye once")
        fans = _finite(zone.get("fan_count"), "fan count", 1, 5)
        if fans != int(fans):
            raise ValueError("map fan count must be an integer")
        output.append({"zone": index + 1, "start": start, "end": end,
                       "length_eye_width": _finite(zone.get("length_eye_width"), "length", .005, .6),
                       "curl": _finite(zone.get("curl"), "curl", 0, 1), "fan_count": int(fans)})
    style = value.get("style", "")
    family = value.get("family", "")
    if not isinstance(style, str) or not isinstance(family, str) or len(style) > 40 or len(family) > 40:
        raise ValueError("map labels must be short text")
    warnings = value.get("warnings", [])
    if not isinstance(warnings, list) or len(warnings) > 16 or any(not isinstance(w, str) or len(w) > 500 for w in warnings):
        raise ValueError("map warnings must be a bounded text list")
    return {"side": value["side"], "style": style, "family": family, "zones": output,
            "warnings": list(warnings), "physical_mm": None}


def map_document(maps: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    if not 1 <= len(maps) <= 2:
        raise ValueError("a lash document needs one or two eye maps")
    rows = [validate_map(item) for item in maps]
    if len({row["side"] for row in rows}) != len(rows):
        raise ValueError("duplicate eye map")
    return {"format": "beljour-lash-map/1", "author": "John Khan", "label": MAP_LABEL,
            "warning": MAP_WARNING, "unit": "share_of_measured_eye_width", "eyes": rows,
            "photo_included": False, "face_coordinates_included": False, "simulation": True}


def _number(value: float) -> str:
    return f"{value:.3f}"


def lash_map_svg(maps: Sequence[Mapping[str, Any]]) -> str:
    document = map_document(maps)
    eyes = document["eyes"]
    height = 120 + 210 * len(eyes)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="760" height="{height}" viewBox="0 0 760 {height}" role="img" aria-labelledby="lash-title lash-desc">',
             f'<title id="lash-title">{escape(MAP_LABEL)}</title>',
             f'<desc id="lash-desc">{escape(MAP_WARNING)}</desc>',
             '<rect width="760" height="100%" fill="#ffffff"/>',
             '<g font-family="sans-serif" fill="#000091">',
             '<text x="28" y="32" font-size="20">Lash map simulation</text>',
             '<text x="28" y="56" font-size="13">Relative length / measured eye width. Not a millimetre prescription.</text>']
    for index, eye in enumerate(eyes):
        y = 86 + index * 210
        label = f'{eye["side"].capitalize()} eye · {eye["family"]} · {eye["style"]}'
        parts.append(f'<text x="28" y="{y}" font-size="16">{escape(label)}</text>')
        parts.append(f'<path d="M 70 {y + 96} Q 380 {y + 30} 690 {y + 96}" fill="none" stroke="#000091" stroke-width="2"/>')
        for zone in eye["zones"]:
            middle = (zone["start"] + zone["end"]) / 2
            x = 70 + 620 * middle
            root_y = y + 96 - 132 * middle * (1 - middle)
            length = zone["length_eye_width"] * 230
            for fan in range(zone["fan_count"]):
                lean = (fan - (zone["fan_count"] - 1) / 2) * 5
                path = f'M {_number(x)} {_number(root_y)} Q {_number(x + lean * .4)} {_number(root_y - length * .45)} {_number(x + lean)} {_number(root_y - length)}'
                parts.append(f'<path d="{path}" fill="none" stroke="#202030" stroke-width="1.4"/>')
            parts.append(f'<text x="{_number(x)}" y="{y + 124}" text-anchor="middle" font-size="13">{zone["zone"]}</text>')
            parts.append(f'<text x="{_number(x)}" y="{y + 145}" text-anchor="middle" font-size="13">{zone["length_eye_width"] * 100:.1f}%</text>')
            parts.append(f'<text x="{_number(x)}" y="{y + 165}" text-anchor="middle" font-size="12">curl {zone["curl"]:.2f}</text>')
        if eye["warnings"]:
            parts.append(f'<text x="28" y="{y + 192}" font-size="12" fill="#E1000F">Suitability warnings are included in the companion data.</text>')
    parts.extend([f'<text x="28" y="{height - 18}" font-size="12">Original diagram · John Khan · No photo or face coordinates included</text>', '</g>', '</svg>'])
    return "\n".join(parts)


def lash_map_csv(maps: Sequence[Mapping[str, Any]]) -> str:
    document = map_document(maps)
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(("simulation", "side", "zone", "start_eye_fraction", "end_eye_fraction", "length_eye_fraction", "curl", "fan_count"))
    for eye in document["eyes"]:
        for zone in eye["zones"]:
            writer.writerow(("yes", eye["side"], zone["zone"], f'{zone["start"]:.6f}', f'{zone["end"]:.6f}',
                             f'{zone["length_eye_width"]:.6f}', f'{zone["curl"]:.6f}', zone["fan_count"]))
    return output.getvalue()
