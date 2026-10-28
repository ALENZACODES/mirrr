"""Lane D ownership tests; no real faces or provider models are loaded."""

from __future__ import annotations

import ast
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REGISTRY_FILE = ROOT / "api/plumb_api/arena/lane_registry/d.py"
SUBJECT_PREFIXES = (
    "web/src/layout/subjects/",
    "web/src/ui/shell/subject-",
)


def registered_subject_paths() -> tuple[str, ...]:
    """Read the lane's own declaration without importing other lanes."""
    source = ast.parse(REGISTRY_FILE.read_text(encoding="utf-8"))
    for node in source.body:
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            if node.target.id != "LANE_D_R26D_CP1_MODULES":
                continue
            if node.value is None:
                break
            definition = ast.literal_eval(node.value)
            return tuple(sorted(definition))
    raise AssertionError("Missing Lane D subject ownership dictionary")


def test_every_subject_module_has_an_explicit_owner() -> None:
    paths = registered_subject_paths()
    expected = {
        "web/src/layout/subjects/contract.ts",
        "web/src/layout/subjects/selection.ts",
        "web/src/layout/subjects/discovery.ts",
        "web/src/layout/subjects/authority.ts",
        "web/src/ui/shell/subject-picker.ts",
        "web/src/ui/shell/subject-drawing.ts",
        "web/src/ui/shell/subject-render.ts",
    }
    assert set(paths) == expected
    for name in paths:
        assert (ROOT / name).is_file(), name


def test_client_subject_modules_never_call_fetch() -> None:
    for name in registered_subject_paths():
        source = (ROOT / name).read_text(encoding="utf-8")
        assert "fetch(" not in source, name
        assert "XMLHttpRequest(" not in source, name
        assert "WebSocket(" not in source, name


def test_lane_d_registry_keeps_shared_contributions_empty() -> None:
    tree = ast.parse(REGISTRY_FILE.read_text(encoding="utf-8"))
    mutations = [
        node for node in tree.body
        if isinstance(node, (ast.Assign, ast.AnnAssign))
        and any(
            target.id == "CONTRIBUTIONS"
            for target in (node.targets if isinstance(node, ast.Assign) else [node.target])
            if isinstance(target, ast.Name)
        )
    ]
    assert len(mutations) == 1
    assert isinstance(mutations[0], ast.AnnAssign)
    assert isinstance(mutations[0].value, ast.Tuple)
    assert not mutations[0].value.elts


def test_new_paths_are_only_under_owned_browser_directories() -> None:
    assert all(name.startswith(SUBJECT_PREFIXES) for name in registered_subject_paths())
    assert all("r26d" not in name for name in registered_subject_paths())
