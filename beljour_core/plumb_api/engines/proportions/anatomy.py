"""E10 anatomy table for the 478-point face mesh: midline, left/right pairs, named points and
the proportion references. The single editable source; `scripts/sync_r5_data.py`
generates `web/src/data/face/generated/anatomy.ts` from it.

* Left/right pairs for eyes, brows, lips and the face outline are *derived* from the R4
  contour loops in `engines/core/regions.py` (no second contour table): each loop is
  mirrored index by index (eyes, brows), around its corners (lips) or around its top
  and chin points (face outline).
* `FEATURE_PAIRS` is Plumb's hand-picked symmetry table (formerly typed into
  web/src/face/symmetry.ts), kept here so both languages read one copy.
* Pairs are (subject's right, subject's left); in a front photo the subject's right is
  on the image's left.

Face-mapping credits (licences.json "concepts"): runtime data from MediaPipe Face
Landmarker (mesh indices, Bucket A); concept only, no code copied: dlib and OpenFace
(landmark pairs grouped by facial part), Farkas anthropometry (midline, thirds and
fifths) and face-parsing.PyTorch (named facial regions), from publications and docs.
Measurements are geometry estimates on the mesh, not anthropometric or medical readings.
Author: John Khan.
"""
from __future__ import annotations

import math

from ..core import regions

PHI = (1 + math.sqrt(5)) / 2
MESH_POINTS = 478

MIDLINE: tuple[int, ...] = (10, 151, 9, 8, 168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 17, 18, 200, 199, 175, 152)

FEATURE_PAIRS: dict[str, tuple[tuple[int, int], ...]] = {
    "eyes": ((33, 263), (133, 362), (159, 386), (145, 374), (160, 387), (144, 373)),
    "brows": ((70, 300), (63, 293), (105, 334), (66, 296), (107, 336)),
    "mouth": ((61, 291), (40, 270), (37, 267), (91, 321), (84, 314)),
    "nose": ((98, 327), (129, 358), (64, 294), (48, 278)),
    "cheeks": ((50, 280), (205, 425), (123, 352), (116, 345)),
    "jaw": ((234, 454), (93, 323), (132, 361), (58, 288), (172, 397), (136, 365), (150, 379), (149, 378),
            (176, 400), (148, 377)),
}

LANDMARKS: dict[str, int] = {
    "mesh_top": 10, "brow_mid": 9, "nasion": 168, "nose_tip": 1, "subnasale": 2,
    "upper_lip_top": 0, "stomion_upper": 13, "stomion_lower": 14, "lower_lip_bottom": 17, "chin": 152,
    "right_face_edge": 234, "left_face_edge": 454,
    "right_eye_outer": 33, "right_eye_inner": 133, "left_eye_inner": 362, "left_eye_outer": 263,
    "right_ala": 129, "left_ala": 358, "right_mouth": 61, "left_mouth": 291,
    "right_pupil": 468, "left_pupil": 473,
}


def contour_pairs() -> dict[str, tuple[tuple[int, int], ...]]:
    """Left/right pairs derived from the canonical contour loops in regions.py."""
    lips = []
    for loop in (regions.LIPS_OUTER, regions.LIPS_INNER):
        n = len(loop)
        # loop starts at the subject's right corner, passes the lower lip midpoint at n/4,
        # the left corner at n/2 and the upper lip midpoint at 3n/4
        right = list(range(0, n // 4)) + list(range(3 * n // 4 + 1, n))
        lips += [(loop[k], loop[(n // 2 - k) % n]) for k in right]
    oval = regions.FACE_OVAL
    n = len(oval)
    # starts at the top midpoint (10); the chin (152) sits at n/2; positions 1..n/2-1 are
    # the subject's left side
    outline = [(oval[n - k], oval[k]) for k in range(1, n // 2)]
    return {
        "eyes": tuple(zip(regions.RIGHT_EYE, regions.LEFT_EYE, strict=True)),
        "brows": tuple(zip(regions.RIGHT_BROW, regions.LEFT_BROW, strict=True)),
        "lips": tuple(lips),
        "outline": tuple(outline),
        "irises": ((regions.RIGHT_IRIS[0], regions.LEFT_IRIS[0]),),
    }


def region_pairs() -> dict[str, tuple[tuple[int, int], ...]]:
    """The six symmetry regions of plan M20 plus the forehead, each a tuple of (right, left).

    The outline pairs run from the top (position 1) to the chin (position 17); the jaw is
    positions 8 to 17 (from the widest points, 234 / 454, down) and the forehead 1 to 7."""
    derived = contour_pairs()
    outline = derived["outline"]
    return {
        "brows": derived["brows"],
        "eyes": derived["eyes"],
        "nose": FEATURE_PAIRS["nose"],
        "mouth": derived["lips"],
        "cheeks": FEATURE_PAIRS["cheeks"],
        "jaw": outline[7:],
        "forehead": outline[:7],
    }


SYMMETRY_REGIONS = ("brows", "eyes", "nose", "mouth", "cheeks", "jaw", "forehead")

# Proportion ratios: key -> (label, what is measured, references by set). A reference of
# None means that set says nothing about the ratio. "classical" is the neoclassical canon
# (equal thirds, equal fifths, eye width = gap between the eyes = nose width, mouth width
# 1.5 x nose width, lips-to-chin 1 : 2); "golden" uses phi = 1.618... Faces vary; a
# difference from a reference is a measurement, never a problem to fix.
RATIOS: dict[str, tuple[str, str, dict[str, float | list[float] | None]]] = {
    "thirds": ("Face thirds", "upper face (mesh top to brows), middle (brows to nose base), lower (nose base to chin)",
               {"classical": [1 / 3, 1 / 3, 1 / 3], "golden": None}),
    "fifths": ("Face fifths", "face width split at the outer and inner eye corners",
               {"classical": [0.2, 0.2, 0.2, 0.2, 0.2], "golden": None}),
    "face_length_width": ("Face length to width", "mesh top to chin, over the face width at the outline's widest points",
                          {"classical": None, "golden": PHI}),
    "mouth_nose_width": ("Mouth to nose width", "mouth corner to corner, over nose width at the alae",
                         {"classical": 1.5, "golden": PHI}),
    "eye_width_gap": ("Eye width to eye gap", "mean eye width, over the gap between the inner corners",
                      {"classical": 1.0, "golden": None}),
    "nose_width_gap": ("Nose width to eye gap", "nose width at the alae, over the gap between the inner eye corners",
                       {"classical": 1.0, "golden": None}),
    "lips_chin": ("Nose-to-mouth to mouth-to-chin", "nose base to the lip line, over the lip line to the chin",
                  {"classical": 0.5, "golden": 1 / PHI}),
    "upper_lower_lip": ("Upper to lower lip", "upper lip height, over lower lip height",
                        {"classical": None, "golden": 1 / PHI}),
}
REFERENCE_SETS = ("golden", "classical", "custom")
