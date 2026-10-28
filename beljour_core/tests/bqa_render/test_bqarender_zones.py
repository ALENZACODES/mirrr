"""Zone and spill measurement on drawn faces with hand-made outputs, and quick suites.

Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from lab.bqa_render import zones
from lab.bqa_render.adapters import Product, RenderOutput
from lab.bqa_render.bench import Bench, TortureCase
from lab.bqa_render.faces import FaceSpec, SceneSpec, draw_scene, portrait
from lab.bqa_render.rows import parse_context


def painted(image: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int]) -> RenderOutput:
    out = image.copy()
    out[mask] = colour
    cover = mask.astype(np.float64)
    return RenderOutput("synthetic", "rendered", out, cover)


@pytest.fixture()
def bench() -> Bench:
    return Bench(parse_context({"run_id": "zones", "seed": 3}), limit=2, variants=1)


def test_lipstick_on_teeth_is_spill_unless_the_look_allows_it() -> None:
    scene = portrait("synthetic-z1", mouth_state="open")
    face = scene.subject
    out = painted(scene.image, face.masks["lips"] | face.masks["teeth"], (160, 30, 60))
    m = zones.measure(scene, face, Product.of("lipstick"), out)
    assert m.forbidden_px["teeth"] > 0 and not m.passes()
    allowed = Product("lipstick", (160, 30, 60), 0.5, "satin", teeth_allowed=True)
    m2 = zones.measure(scene, face, allowed, out)
    assert "teeth" not in m2.forbidden_px


def test_in_zone_paint_passes_and_parts_are_graded_separately() -> None:
    scene = portrait("synthetic-z2")
    face = scene.subject
    full = zones.measure(scene, face, Product.of("lipstick"),
                         painted(scene.image, face.masks["lips"], (160, 30, 60)))
    assert full.passes() and full.target_coverage > 0.9
    lower = zones.measure(scene, face, Product.of("lipstick"),
                          painted(scene.image, face.masks["lips_lower"], (160, 30, 60)))
    assert lower.spill_free and lower.target_coverage < 0.1 and not lower.passes()


def test_eyeball_spill_and_other_faces_are_caught() -> None:
    faces = (FaceSpec("F0", 0.27, 0.5, 0.2, 3), FaceSpec("F1", 0.73, 0.5, 0.2, 8))
    scene = draw_scene(SceneSpec("synthetic-z3", 512, 384, faces, 0, 1))
    me, other = scene.faces
    mask = me.masks["lid"] | me.masks["eye_white"] | other.masks["lid"]
    m = zones.measure(scene, me, Product.of("eyeshadow"), painted(scene.image, mask, (90, 40, 90)))
    assert m.forbidden_px["eye_white"] > 0
    assert m.other_face_px > 0 and m.harm_px > 0


def test_lens_and_background_counts() -> None:
    scene = portrait("synthetic-z4", glasses=True)
    face = scene.subject
    m = zones.measure(scene, face, Product.of("eyeshadow"),
                      painted(scene.image, face.masks["lens"], (90, 40, 90)))
    assert m.lens_px > 0
    hair = zones.measure(scene, face, Product.of("hair_colour"),
                         painted(scene.image, scene.background, (10, 200, 10)))
    assert hair.forbidden_px["background"] > 0


def test_unrendered_outputs_pass_only_without_harm() -> None:
    scene = portrait("synthetic-z5")
    refused = RenderOutput("synthetic", "refused", reason="too small")
    m = zones.measure(scene, scene.subject, Product.of("liner"), refused)
    assert m.passes() and m.changed_px == 0
    errored = RenderOutput("synthetic", "error")
    assert not zones.measure(scene, scene.subject, Product.of("liner"), errored).passes()


def test_log_measure_types_every_failure(bench: Bench) -> None:
    case = TortureCase("synthetic-z6", FaceSpec(mouth_state="open"))
    scene = bench.scene(case)
    face = scene.subject
    out = painted(scene.image, face.masks["teeth"] | face.masks["forehead"], (160, 30, 60))
    m = zones.measure(scene, face, Product.of("lipstick"), out)
    zones.log_measure(bench, "PRD-01", m, scene.image)
    kinds = {f.failure_type for f in bench.failures}
    assert {"teeth_spill", "zone_spill", "low_coverage"} <= kinds


def test_quick_suites_produce_valid_rows(bench: Bench) -> None:
    measured = zones.check_prd02(bench)["measured"]
    assert isinstance(measured, dict)
    assert measured["states_covered"] == measured["states_required"]
    for row in (zones.check_prd03(bench), zones.check_catc2(bench), zones.check_prd01(bench)):
        assert row["status"] in ("PASS", "FAIL", "UNPROVEN")
        groups = row["groups"]
        assert isinstance(groups, list)
        assert {g["value"] for g in groups} >= {"lipstick", "liner"}


def test_eye_placement_per_side() -> None:
    scene = portrait("synthetic-z7", eye_shape="hooded")
    face = scene.subject
    good = painted(scene.image, face.masks["lid"], (90, 40, 90))
    places = zones.eye_placement(scene, face, good)
    assert [p.side for p in places] == ["right", "left"] and all(p.correct for p in places)
    bad = painted(scene.image, face.masks["eye"] | face.masks["lid"], (90, 40, 90))
    assert not any(p.correct for p in zones.eye_placement(scene, face, bad))


def test_paint_on_a_hearing_aid_is_an_occluder_render(bench: Bench) -> None:
    case = TortureCase("synthetic-z8", FaceSpec(hearing_aid=True))
    scene = bench.scene(case)
    face = scene.subject
    out = painted(scene.image, face.masks["skin"] | face.masks["accessory"], (150, 110, 90))
    m = zones.measure(scene, face, Product.of("foundation"), out)
    assert m.forbidden_px["accessory"] > 0
    zones.log_measure(bench, "CAT-C2", m, scene.image)
    assert "occluder_render" in {f.failure_type for f in bench.failures}
