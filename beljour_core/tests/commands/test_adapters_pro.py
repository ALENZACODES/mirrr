"""Port-only backend composition, preview/export dose and repair gate wiring.

Engine doubles do not import other lanes' private implementation modules.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from plumb_api.commands.adapters import ProEngineBindings
from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandUnavailable
from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.pro_plan import parse_pro_commands
from plumb_api.commands.repair_gate import FaceFixerGate, RegionEvidence
from plumb_api.commands.types import CommandName


def photo(value: int = 50) -> ImageFrame:
    return ImageFrame(8, 8, 4, bytes((value, value + 2, value + 4, 255)) * 64)


class RepairDouble:
    def __init__(self) -> None:
        self.calls: list[tuple[float, bool]] = []

    def cleanup(self, frame: ImageFrame, *, dose: float, preview: bool) -> ImageFrame:
        self.calls.append((dose, preview))
        content = bytearray(frame.pixels)
        content[0] += 1
        return ImageFrame(frame.width, frame.height, frame.channels, bytes(content))


class UpscaleDouble:
    def __init__(self) -> None:
        self.calls: list[tuple[int, bool]] = []

    def upscale(self, frame: ImageFrame, *, scale: int, preview: bool) -> ImageFrame:
        self.calls.append((scale, preview))
        return resize_reference(frame, frame.width * scale, frame.height * scale)


class StudioDouble:
    def __init__(self) -> None:
        self.calls: list[tuple[float, bool]] = []

    def correct(self, frame: ImageFrame, *, dose: float, preview: bool) -> ImageFrame:
        self.calls.append((dose, preview))
        return frame


class PoseDouble:
    def __init__(self) -> None:
        self.calls: list[tuple[float, bool]] = []

    def pose(self, frame: ImageFrame, *, dose: float, preview: bool) -> ImageFrame:
        self.calls.append((dose, preview))
        return frame


def test_ports_do_not_advertise_unimplemented_features() -> None:
    empty = ProEngineBindings()
    status = empty.availability
    assert not status.identity_ready
    assert not status.repair_ready
    assert not status.upscale_ready
    assert not status.studio_ready
    assert not status.pose_ready
    assert empty.handlers() == {}
    with pytest.raises(CommandUnavailable):
        empty.create_executor().run(parse_pro_commands("/cleanup"), photo())


def test_synthetic_test_embedder_never_counts_as_production_ready() -> None:
    bindings = ProEngineBindings(identity_embedder=DeterministicTestEmbedder())
    assert not bindings.availability.identity_ready
    with pytest.raises(CommandUnavailable) as failure:
        bindings.create_executor()
    assert failure.value.code == "test_model_forbidden"
    assert bindings.create_executor(allow_test_embedder=True) is not None


def test_repair_export_and_preview_share_level_dose() -> None:
    repair = RepairDouble()
    bindings = ProEngineBindings(repair=repair, identity_embedder=DeterministicTestEmbedder())
    runner = bindings.create_executor(allow_test_embedder=True)
    plan = parse_pro_commands("/cleanup level=1.0")
    runner.run(plan, photo(), quality="preview")
    runner.run(plan, photo(), quality="export")
    assert repair.calls == [(0.2, True), (0.2, False)]


def test_strength_maximum_is_full_dose_on_pose_and_studio() -> None:
    studio = StudioDouble()
    pose = PoseDouble()
    bindings = ProEngineBindings(studio=studio, pose=pose, identity_embedder=DeterministicTestEmbedder())
    result = bindings.create_executor(allow_test_embedder=True).run(
        parse_pro_commands("/studioquality level=5.0 /poseonly level=5.0"), photo(),
    )
    assert studio.calls == [(1.0, False)]
    assert pose.calls == [(1.0, False)]
    assert all(step.identity is not None for step in result.steps)


def test_upscale_receives_only_factor_and_render_quality() -> None:
    upscale = UpscaleDouble()
    bindings = ProEngineBindings(upscale=upscale, identity_embedder=DeterministicTestEmbedder())
    runner = bindings.create_executor(allow_test_embedder=True)
    result = runner.run(parse_pro_commands("/upscale 2x level=3.8"), photo())
    assert result.image.width == 16
    assert result.image.height == 16
    assert upscale.calls == [(2, False)]


def test_all_five_commands_have_a_guarded_chaining_surface() -> None:
    repair = RepairDouble()
    studio = StudioDouble()
    pose = PoseDouble()
    upscale = UpscaleDouble()
    bindings = ProEngineBindings(
        repair=repair,
        studio=studio,
        pose=pose,
        upscale=upscale,
        identity_embedder=DeterministicTestEmbedder(),
    )
    plan = parse_pro_commands(
        "/cleanup 1.2 /studioquality 2.4 /poseonly 3.6 /upscale 2x /identitylock 5.0",
    )
    runner = bindings.create_executor(allow_test_embedder=True)
    result = runner.run(plan, photo())
    assert len(result.steps) == 5
    assert all(item.identity is not None for item in result.steps)
    assert [item.command for item in result.steps] == [
        CommandName.CLEANUP, CommandName.STUDIOQUALITY, CommandName.POSEONLY,
        CommandName.UPSCALE, CommandName.IDENTITYLOCK,
    ]
    assert repair.calls == [(0.24, False)]
    assert studio.calls == [(0.48, False)]
    assert pose.calls == [(0.72, False)]
    assert upscale.calls == [(2, False)]


def test_face_fixer_receives_only_cleanup_output() -> None:
    repair = RepairDouble()
    pose = PoseDouble()
    regions = RegionEvidence(8, 8, skin=bytes([255]) * 64, protected=bytes(64))
    gate = FaceFixerGate(regions)
    bindings = ProEngineBindings(repair=repair, pose=pose, identity_embedder=DeterministicTestEmbedder())
    bindings.create_executor(allow_test_embedder=True, face_fixer=gate).run(
        parse_pro_commands("/poseonly 2.0 /cleanup 3.0"), photo(),
    )
    assert len(gate.reports) == 1
    assert gate.reports[0].status in ("fail", "unproven")
    assert gate.reports[0].realface_qualified is False


def test_no_library_is_loaded_by_an_empty_binding() -> None:
    bindings = ProEngineBindings()
    status = bindings.availability.public_metadata()
    assert status == {
        "identity_ready": False,
        "repair_ready": False,
        "upscale_ready": False,
        "studio_ready": False,
        "pose_ready": False,
    }
    assert not bindings.handlers()
