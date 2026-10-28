"""End-to-end golden controls and reviewed bystander masks on drawn pixels."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.proportions import golden, synthetic
from plumb_api.vision.box_first import FaceBox
from plumb_api.vision.face_region_audit import audit
from plumb_api.vision.face_session import FaceSession

WIDTH = 192
HEIGHT = 192


def image(tone: int) -> np.ndarray:
    assert tone in (1, 5, 10)
    rows, columns = np.indices((HEIGHT, WIDTH))
    result = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
    result[..., 0] = (columns // 2 + tone * 9).astype(np.uint8)
    result[..., 1] = (rows // 2 + tone * 5).astype(np.uint8)
    result[..., 2] = ((columns + rows) // 3 + tone * 7).astype(np.uint8)
    result[..., 3] = 193
    return result


def masks(primary: bool = True) -> tuple[np.ndarray, np.ndarray]:
    editable = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    protection = np.zeros_like(editable)
    if primary:
        editable[10:175, 15:153] = 1.0
        protection[:, 149:] = 1.0
    else:
        editable[15:180, 141:191] = 1.0
        protection[:, :149] = 1.0
    return editable, protection


def first_mesh() -> np.ndarray:
    return synthetic.symmetric_face(
        width=WIDTH, height=HEIGHT, face_width=100, face_length=115,
    )


def candidates() -> list[FaceBox]:
    return [
        FaceBox(24, 25, 105, 130, 0.95),
        FaceBox(148, 35, 37, 70, 0.98),
    ]


@pytest.mark.parametrize("tone", [1, 5, 10])
@pytest.mark.parametrize("level", [1.0, 2.0, 3.0, 5.0])
def test_full_editor_selected_person_keeps_all_bystander_pixels(
    tone: int, level: float,
) -> None:
    source = image(tone)
    session = FaceSession()
    state = session.new_photo(candidates(), WIDTH, HEIGHT)
    assert state.face_count == 2
    assert state.chosen == 0
    assert state.verified_region is False
    editable, protected = masks()
    assert session.provide_masks(state.revision, editable, [protected]).verified_region
    cache = golden.GoldenCache()
    plan = cache.get(first_mesh(), "synthetic-photo")
    assert isinstance(plan, golden.GoldenSnapshot)
    first = golden.render_preview(source, plan, level, editable, bystanders=(protected,))
    assert isinstance(first, golden.RenderResult)
    assert first.data.identity_lock is True
    assert first.data.max_move_iod <= .020000001
    applied = session.apply(state.revision, source, first.image)
    measured = audit(source, applied, editable, [protected])
    assert measured.passed
    assert measured.changed_bystanders == 0
    assert measured.changed_outside_selection == 0
    assert measured.changed_alpha == 0
    assert session.audit_counts() == measured.counts()
    assert np.array_equal(applied[:, 149:], source[:, 149:])
    assert np.array_equal(applied[..., 3], source[..., 3])
    assert np.array_equal(source, image(tone))
    if level == 1.0:
        assert np.array_equal(applied, source)
        assert first.data.distance_reduction == 0
    else:
        assert first.data.target_distance <= first.data.before_distance


def test_other_person_selection_clears_first_person_masks_and_receipt() -> None:
    source = image(5)
    session = FaceSession()
    initial = session.new_photo(candidates(), WIDTH, HEIGHT)
    first, bystander = masks()
    session.provide_masks(initial.revision, first, [bystander])
    plan = golden.prepare(first_mesh(), "first-person")
    assert isinstance(plan, golden.GoldenSnapshot)
    rendered = golden.render_preview(source, plan, 3, first, bystanders=(bystander,))
    assert isinstance(rendered, golden.RenderResult)
    session.apply(initial.revision, source, rendered.image)
    assert session.audit_counts() is not None
    selected = session.tap(.86, .42)
    assert selected.chosen == 1
    assert selected.verified_region is False
    assert session.audit_counts() is None
    with pytest.raises(ValueError, match="verified editable region"):
        session.apply(initial.revision, source, rendered.image)
    second, protect_first = masks(primary=False)
    session.provide_masks(initial.revision, second, [protect_first])
    new_mesh = first_mesh().copy()
    new_mesh[:, 0] += 50
    new_plan = golden.prepare(new_mesh, "second-person")
    assert isinstance(new_plan, golden.GoldenSnapshot)
    candidate = golden.render_preview(source, new_plan, 5, second, bystanders=(protect_first,))
    assert isinstance(candidate, golden.RenderResult)
    output = session.apply(initial.revision, source, candidate.image)
    assert np.array_equal(output[:, :149], source[:, :149])
    assert session.audit_counts()["changed_bystanders"] == 0


def test_changed_photo_cannot_reuse_the_old_person_or_ratio_map() -> None:
    session = FaceSession()
    initial = session.new_photo(candidates(), WIDTH, HEIGHT)
    first, bystander = masks()
    session.provide_masks(initial.revision, first, [bystander])
    cache = golden.GoldenCache()
    original = first_mesh()
    plan = cache.get(original, "version-1")
    assert isinstance(plan, golden.GoldenSnapshot)
    changed = original.copy()
    changed[61, 0] += 1
    assert isinstance(cache.get(changed, "version-1"), Refusal)
    next_photo = session.new_photo([], WIDTH, HEIGHT)
    assert next_photo.code == "no_face_found"
    assert session.audit_counts() is None
    with pytest.raises(ValueError, match="stale photo revision"):
        session.provide_masks(initial.revision, first, [bystander])
    with pytest.raises(ValueError, match="photo changed"):
        session.apply(initial.revision, image(5), image(5))


def test_no_face_never_claims_a_successful_preview() -> None:
    session = FaceSession()
    empty = session.new_photo([], WIDTH, HEIGHT)
    assert empty.chosen is None
    assert empty.code == "no_face_found"
    source = image(5)
    with pytest.raises(ValueError, match="no selected face"):
        session.apply(empty.revision, source, source)
    assert session.audit_counts() is None
