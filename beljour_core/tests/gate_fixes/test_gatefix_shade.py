"""C16 item (d), shade_w6: newest finder path, mesh background mask, table coverage.

Pass definition: the gate check and the local shade service both measure
through engines/shade/measurement.py (find_reliable_shade on the extended
deep-shade table, background measured from the photo), so white balance is
grey-world instead of none; on a drawn grid of skin tones this accepts more
readings than the old find_shade path and never suggests a shade more than
1 L* lighter. The C16 mesh background (engines/shade/background.py) is kept
and tested on its own, but no product path calls it on main. Coverage:
every grid tone from L* 20 to 85 matches within delta-E 6 or is a listed table
gap (reported to Lane F, not invented). Drawn photos only. Author: John Khan.
"""
from __future__ import annotations

import io
import sys

import numpy as np
from gatefix_gates import REALFACE
from gatefix_meshes import drawn_photo, normalized, placed_face

from plumb_api.engines.core import regions
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade import finder, measurement
from plumb_api.engines.shade.background import background_from_mesh

if str(REALFACE) not in sys.path:
    sys.path.insert(0, str(REALFACE))

import feature_checks as fc  # noqa: E402

GRID_L = range(20, 90, 5)
GRID_A = (4, 8, 12, 16)
GRID_B = (8, 14, 20, 26)
# Combined-table gaps (best delta-E above 6.0), reported under CROSS-LANE REQUESTS.
KNOWN_GAPS = {
    (20, 4, 26), (20, 8, 26), (20, 12, 20), (20, 12, 26), (20, 16, 20), (20, 16, 26),
    (25, 4, 26), (25, 8, 26), (25, 12, 26), (25, 16, 26), (30, 16, 26), (35, 4, 8),
    (40, 4, 8), (40, 8, 8), (45, 4, 8), (45, 8, 8), (50, 4, 8), (50, 8, 8), (55, 4, 8),
    (55, 8, 8), (60, 4, 8), (60, 8, 8), (65, 4, 8), (65, 8, 8), (70, 4, 8), (75, 16, 26),
    (80, 4, 26), (80, 8, 26), (80, 12, 26), (80, 16, 26), (85, 4, 26), (85, 8, 26),
    (85, 12, 20), (85, 12, 26), (85, 16, 20), (85, 16, 26),
}
TONES = ((25, 10, 16), (35, 12, 20), (45, 12, 18), (55, 10, 16), (65, 9, 15), (75, 8, 14))
CASTS = ((1.0, 1.0, 1.0), (1.05, 1.0, 0.9), (0.92, 1.0, 1.06))


def lab_rgb(lab: tuple[float, float, float]) -> tuple[int, int, int]:
    rgb = cs.to_bytes(cs.lab_to_srgb(np.array([lab], dtype=np.float64)))[0]
    return int(rgb[0]), int(rgb[1]), int(rgb[2])


def drawn_skin(lab: tuple[float, float, float], cast: tuple[float, float, float],
               seed: int = 5) -> tuple[np.ndarray, np.ndarray]:
    points = placed_face(200, 250)
    photo = drawn_photo(500, 400, [(points, lab_rgb(lab))], ground=(128, 128, 128))
    noisy = photo.astype(np.float64) + np.random.default_rng(seed).normal(0, 3.0, photo.shape)
    return np.clip(np.rint(noisy * np.array(cast)), 0, 255).astype(np.uint8), points


def test_background_mask_is_geometry_outside_head_hair_and_neck() -> None:
    points = placed_face(200, 250, 0.6)
    mask = background_from_mesh(points, 500, 400)
    assert mask is not None
    oval = regions.region_mask("face_oval", points, 500, 400, normalized=False) > 0
    rows, cols = np.nonzero(oval)
    assert not mask[oval].any()
    middle = int(np.median(cols))
    assert not mask[rows.min() - 20, middle]
    assert not mask[rows.max() + 5:, middle].any()
    assert mask[:, :10].all()
    assert background_from_mesh(placed_face(200, 250, 1.6), 500, 400) is None


def test_gate_check_uses_the_reliable_path_with_grey_world() -> None:
    photo, points = drawn_skin((55, 10, 16), CASTS[1])
    row = fc.shade_w6(photo, points)
    assert row.measurements["white_mode"] == "grey_world"
    assert row.measurements["background_used"] is True
    assert row.measurements["reference_table"] == "extended"
    assert row.passed, row.measurements


def acceptance(use_new: bool) -> tuple[int, list[str]]:
    accepted, reasons = 0, []
    for lab in TONES:
        for cast in CASTS:
            photo, points = drawn_skin(lab, cast)
            if use_new:
                result = measurement.measure_shade(photo, points)
            else:
                result = finder.find_shade(photo, points)
            if result.refused:
                reasons.append(str(result.reason))
                continue
            accepted += 1
            assert result.best is not None and result.best["lighter_by"] <= 1.0
    return accepted, reasons


def test_new_path_accepts_more_drawn_readings_and_never_suggests_lighter() -> None:
    old, _ = acceptance(False)
    new, reasons = acceptance(True)
    assert new == len(TONES) * len(CASTS), reasons
    assert new > old


def test_reference_table_coverage_matches_or_is_a_listed_gap() -> None:
    table = finder.extended_reference_table()
    gaps = set()
    for lightness in GRID_L:
        for a in GRID_A:
            for b in GRID_B:
                matches = finder.match_shades([lightness, a, b], table)
                assert all(row["lighter_by"] <= 1.0 for row in matches)
                if matches and matches[0]["delta_e"] > 6.0:
                    gaps.add((lightness, a, b))
    assert gaps == KNOWN_GAPS


def test_local_shade_service_reads_with_the_new_path() -> None:
    from PIL import Image

    from plumb_api.services.local_features import shade_analysis

    photo, points = drawn_skin((45, 12, 18), CASTS[0])
    buffer = io.BytesIO()
    Image.fromarray(photo).save(buffer, format="PNG")
    found = shade_analysis(buffer.getvalue(), normalized(points, 400, 500).tolist())
    assert found["measurement"]["white"]["mode"] == "grey_world"
    assert found["measurement"]["refused"] is False
