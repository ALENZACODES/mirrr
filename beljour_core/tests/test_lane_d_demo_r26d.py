"""Judge Mode demonstration boundary tests, independent of real provider units."""

from __future__ import annotations

import ast
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
D_REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"
FIVE_MODULES = {
    "web/src/layout/judge-five-edits.ts",
    "web/src/layout/judge-provider-mock.ts",
    "web/src/ui/shell/judge-five-edit-panel.ts",
    "web/src/ui/shell/judge-five-render.ts",
    "web/src/layout/subjects/pixel-guard.ts",
    "web/src/ui/shell/judge-isolation-panel.ts",
}


def test_all_five_edit_modules_are_registered_to_lane_d() -> None:
    tree = ast.parse(D_REGISTRY.read_text(encoding="utf-8"))
    ownership: object = None
    for node in tree.body:
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            if node.target.id == "LANE_D_R26D_CP2_MODULES":
                assert node.value is not None
                ownership = ast.literal_eval(node.value)
    assert isinstance(ownership, dict)
    assert set(ownership) == FIVE_MODULES
    for path, (owner, feature_ids) in ownership.items():
        assert owner == "D", path
        assert all(1 <= value <= 103 for value in feature_ids)
        assert (ROOT / path).is_file(), path


def test_five_edits_are_not_a_live_api_or_paid_network_client() -> None:
    for path in FIVE_MODULES:
        source = (ROOT / path).read_text(encoding="utf-8")
        assert "fetch(" not in source, path
        assert "XMLHttpRequest(" not in source, path
        assert "WebSocket(" not in source, path
        assert "stripe" not in source.lower(), path
        assert "localStorage." not in source, path
        assert "sessionStorage." not in source, path


def test_mock_response_declares_zero_units_and_no_image_transfer() -> None:
    source = (ROOT / "web/src/layout/judge-provider-mock.ts").read_text(encoding="utf-8")
    assert 'readonly providerCalls: 0' in source
    assert 'readonly unitsSpent: 0' in source
    assert 'readonly sendsImage: false' in source
    assert '"mock-only"' in source
    assert "from \"../api" not in source


def test_five_edit_contract_has_exactly_five_named_layers() -> None:
    source = (ROOT / "web/src/layout/judge-five-edits.ts").read_text(encoding="utf-8")
    for label in (
        'id: "hair-colour"',
        'id: "hair-highlight"',
        'id: "cheek-colour"',
        'id: "lip-colour"',
        'id: "eyeliner"',
    ):
        assert source.count(label) == 1
    assert "hasProviderEvidence: false" in source
    assert "labelsAreIllustrative: true" in source
