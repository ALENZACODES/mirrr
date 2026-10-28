"""Lane D r30d drawn replay, privacy and ownership checks. Author: John Khan."""

from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = ROOT / "api" / "plumb_api" / "arena" / "lane_registry" / "d.py"
SEQUENCE = ROOT / "web" / "src" / "layout" / "continuous"
MODULES = (
    "web/src/layout/continuous/sequence-contract.ts",
    "web/src/layout/continuous/sequence-runner.ts",
    "web/src/layout/continuous/sequence-shotlist.ts",
    "web/src/ui/shell/continuous-sequence-panel.ts",
    "web/test/helpers/continuous-sequence-page.mjs",
    "web/test/continuous-sequence-runner-r30d.test.mjs",
    "web/test/continuous-sequence-panel-r30d.test.mjs",
    "web/test/continuous-sequence-shotlist-r30d.test.mjs",
    "web/test/continuous-sequence-e2e-r30d.test.mjs",
    "web/test/continuous-sequence-lifecycle-r30d.test.mjs",
    "api/tests/test_lane_d_sequence_r30d.py",
)


def registered_modules() -> dict[str, tuple[str, tuple[int, ...]]]:
    tree = ast.parse(REGISTRY_PATH.read_text(encoding="utf-8"))
    target = next(
        node.value
        for node in tree.body
        if isinstance(node, ast.AnnAssign)
        and isinstance(node.target, ast.Name)
        and node.target.id == "LANE_D_R30D_CP1_MODULES"
    )
    assert isinstance(target, ast.Dict)
    result: dict[str, tuple[str, tuple[int, ...]]] = {}
    for key, value in zip(target.keys, target.values, strict=True):
        assert isinstance(key, ast.Constant)
        assert isinstance(value, ast.Tuple)
        assert isinstance(value.elts[0], ast.Constant)
        assert isinstance(value.elts[1], ast.Tuple)
        ids: list[int] = []
        for item in value.elts[1].elts:
            assert isinstance(item, ast.Constant)
            assert isinstance(item.value, int)
            ids.append(item.value)
        result[str(key.value)] = (str(value.elts[0].value), tuple(ids))
    return result


def test_all_new_owned_modules_are_registered_and_present() -> None:
    owned = registered_modules()
    assert set(owned) == set(MODULES)
    for path, (owner, ids) in owned.items():
        assert owner == "D"
        assert ids
        assert set(ids).issubset(set(range(1, 104)))
        assert (ROOT / path).is_file(), path


def test_append_only_registry_block_does_not_change_pinned_views() -> None:
    source = REGISTRY_PATH.read_text(encoding="utf-8")
    new = source.split("# --- Lane D r30d-cp1:", maxsplit=1)[1]
    assert "LaneContribution(" not in new
    assert "CONTRIBUTIONS =" not in new
    assert "extras =" not in new
    assert "def lane_d_r30d_cp1_ownership" in new
    assert "HANDOFF.md" not in new


def test_owned_client_modules_do_not_start_network_requests() -> None:
    for path in MODULES:
        if not path.endswith((".ts", ".mjs")):
            continue
        if "/test/" in path:
            continue
        code = (ROOT / path).read_text(encoding="utf-8")
        for forbidden in (
            "fetch(",
            "XMLHttpRequest",
            "WebSocket(",
            "sendBeacon(",
            "EventSource(",
            "localStorage.setItem",
            "sessionStorage.setItem",
        ):
            assert forbidden not in code, (path, forbidden)


def test_no_video_auto_download_or_provider_operation_is_present() -> None:
    body = (SEQUENCE / "sequence-runner.ts").read_text(encoding="utf-8")
    assert "this.state.apply(item.effect)" in body
    assert "this.state.next()" in body
    assert "providerCalls: 0" in body
    assert "downloadRequested: false" in body
    assert "this.env.hidden()" in body
    assert "this.env.reducedMotion()" in body
    assert "this.clearTimer()" in body
    assert "options.tryon" not in body
    assert "startJudgeDownload" not in body


def test_replay_only_exposes_seven_checked_original_edit_categories() -> None:
    body = (SEQUENCE / "sequence-contract.ts").read_text(encoding="utf-8")
    for effect in (
        'effect: "hair"',
        'effect: "colour"',
        'effect: "concealer"',
        'effect: "appearance"',
        'effect: "ratio"',
        'effect: "turn"',
        'effect: "posture"',
    ):
        assert effect in body
    assert "providerCalls: 0" in body
    assert "liveEvidence: false" in body
    assert "selectedId: state.selectedId" in body


def test_shot_list_does_not_claim_real_face_or_pro_command_success() -> None:
    source = (SEQUENCE / "sequence-shotlist.ts").read_text(encoding="utf-8")
    assert "Frozen 100,000-face release gate: NOT VERIFIED" in source
    assert "Live YouCam: NOT VERIFIED" in source
    assert "Pro Command production execution: NOT VERIFIED" in source
    assert "No image, person identifier, provider key" in source
    assert 'format: "beljour-drawn-rehearsal/1"' in source


def test_replay_has_accessible_controls_and_no_inline_scripts() -> None:
    panel = (
        ROOT / "web" / "src" / "ui" / "shell" / "continuous-sequence-panel.ts"
    ).read_text(encoding="utf-8")
    assert 'setAttribute("aria-live", "polite")' in panel
    assert 'button.type = "button"' in panel
    assert "button.disabled = !enabled" in panel
    assert 'sequence-advance' in panel
    assert 'sequence-shotlist' in panel
    assert "onclick=" not in panel


def test_only_lane_d_paths_and_no_shared_handoff_updates_are_packaged() -> None:
    assert (ROOT / "HANDOFF.md").is_file()
    assert (ROOT / "HANDOFF-D-APPEND.md").is_file()
    forbidden = {"HANDOFF.md", "api/plumb_api/arena/registry.py"}
    assert set(MODULES).isdisjoint(forbidden)
    assert not any("/filters/" in path for path in MODULES)
