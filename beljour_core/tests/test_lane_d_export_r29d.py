"""Lane D r29d: scope, ownership and privacy boundary regression."""

from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLIENT_ROOT = ROOT / "web" / "src"
REGISTRY = ROOT / "api" / "plumb_api" / "arena" / "lane_registry" / "d.py"
PATHS = (
    "web/src/layout/continuous/export-ticket.ts",
    "web/src/layout/continuous/export-png.ts",
    "web/src/layout/continuous/export-controller.ts",
    "web/src/layout/continuous/export-receipt.ts",
    "web/src/ui/shell/continuous-export-panel.ts",
    "api/tests/test_lane_d_export_r29d.py",
    "web/test/helpers/synthetic-png.mjs",
    "web/test/continuous-export-controller-r29d.test.mjs",
    "web/test/continuous-export-png-r29d.test.mjs",
    "web/test/continuous-export-receipt-r29d.test.mjs",
    "web/test/continuous-export-ticket-r29d.test.mjs",
    "web/test/continuous-export-view-r29d.test.mjs",
    "web/test/continuous-export-interleavings-r29d.test.mjs",
)


def test_every_new_owned_module_has_a_registered_d_owner() -> None:
    tree = ast.parse(REGISTRY.read_text(encoding="utf-8"))
    assignments = {
        target.id: item.value
        for item in tree.body
        if isinstance(item, ast.AnnAssign)
        for target in [item.target]
        if isinstance(target, ast.Name)
    }
    module_map = assignments["LANE_D_R29D_CP1_MODULES"]
    assert isinstance(module_map, ast.Dict)
    registered: dict[str, str] = {}
    for key, value in zip(module_map.keys, module_map.values, strict=True):
        assert isinstance(key, ast.Constant)
        assert isinstance(value, ast.Tuple)
        assert isinstance(value.elts[0], ast.Constant)
        registered[str(key.value)] = str(value.elts[0].value)
    assert set(registered) == set(PATHS)
    assert all(owner == "D" for owner in registered.values())
    assert all((ROOT / path).is_file() for path in registered)


def test_registration_does_not_extend_pinned_shared_contributions() -> None:
    source = REGISTRY.read_text(encoding="utf-8")
    fragment = source.split("# --- Lane D r29d-cp1:", 1)[1]
    assert "CONTRIBUTIONS =" not in fragment
    assert "extras =" not in fragment
    assert "LaneContribution(" not in fragment
    assert "LANE_D_R29D_CP1_MODULES" in fragment


def test_client_render_export_never_calls_network_services() -> None:
    for path in PATHS:
        if not path.endswith(".ts"):
            continue
        content = (ROOT / path).read_text(encoding="utf-8")
        for prohibited in ("fetch(", "XMLHttpRequest", "WebSocket(", "sendBeacon("):
            assert prohibited not in content, (path, prohibited)
        assert "Authorization:" not in content
        assert "apiKey" not in content


def test_png_validator_rejects_metadata_and_oversized_buffers() -> None:
    source = (CLIENT_ROOT / "layout" / "continuous" / "export-png.ts").read_text(
        encoding="utf-8"
    )
    assert '"eXIf"' in source
    assert '"iTXt"' in source
    assert '"tEXt"' in source
    assert "MAX_PNG_BYTES" in source
    assert "MAX_PNG_PIXELS" in source
    assert "crcRange" in source


def test_export_controller_has_a_revision_and_privacy_guard() -> None:
    source = (CLIENT_ROOT / "layout" / "continuous" / "export-controller.ts").read_text(
        encoding="utf-8"
    )
    assert "stillCurrentExport" in source
    assert "protectedBystanders" in source
    assert "verifiedByBrowser: false" in source
    assert "photoStored: false" in source
    assert "operator-cancelled" in source
    assert "changed-during-export" in source


def test_optional_receipt_does_not_claim_release_acceptance() -> None:
    source = (CLIENT_ROOT / "layout" / "continuous" / "export-receipt.ts").read_text(
        encoding="utf-8"
    )
    assert "crypto.subtle.digest" in source
    assert "usedNetwork: false" in source
    assert "storesImages: false" in source
    assert "exactFileConfirmed: phase ===" in source
    assert "releaseApproved" not in source
    assert "photoName" not in source


def test_rendered_accessibility_controls_have_native_names() -> None:
    source = (CLIENT_ROOT / "ui" / "shell" / "continuous-export-panel.ts").read_text(
        encoding="utf-8"
    )
    assert 'picker.type = "file"' in source
    assert 'cancel.type = "button"' in source
    assert 'setAttribute("aria-live", "polite")' in source
    assert 'picker.value = ""' in source
    assert "onclick=" not in source


def test_legacy_shared_module_views_and_handoff_are_not_changed_here() -> None:
    exports = [ROOT / "api" / "plumb_api" / "arena" / "registry.py", ROOT / "HANDOFF.md"]
    assert all(path.is_file() for path in exports)
    touched = {"api/plumb_api/arena/lane_registry/d.py"}
    touched.update(PATHS)
    assert "api/plumb_api/arena/registry.py" not in touched
    assert "HANDOFF.md" not in touched
