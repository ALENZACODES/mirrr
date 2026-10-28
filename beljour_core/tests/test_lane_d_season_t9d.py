"""Season Book T9 Lane D registry and boundary checks. Author: John Khan."""

from __future__ import annotations

import ast
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"
SEASON_DIRECTORY = ROOT / "web/src/layout/season-book"


def registry_assignment(tree: ast.Module, name: str) -> ast.AnnAssign:
    for statement in tree.body:
        if isinstance(statement, ast.AnnAssign) and isinstance(statement.target, ast.Name):
            if statement.target.id == name:
                return statement
    raise AssertionError(f"No ownership dictionary {name}")


def registered_modules() -> dict[str, tuple[str, tuple[int, ...]]]:
    tree = ast.parse(REGISTRY.read_text(encoding="utf-8"))
    statement = registry_assignment(tree, "LANE_D_T9_CP1_MODULES")
    assert statement.value is not None
    result = ast.literal_eval(statement.value)
    assert isinstance(result, dict)
    return result


def test_staged_lane_d_registry_is_syntax_valid() -> None:
    compile(REGISTRY.read_text(encoding="utf-8"), str(REGISTRY), "exec")


def test_all_staged_module_paths_exist() -> None:
    modules = registered_modules()
    assert len(modules) == 15
    for module in modules:
        assert (ROOT / module).is_file(), module


def test_modules_are_lane_d_owned_without_new_shared_contributions() -> None:
    modules = registered_modules()
    assert all(entry[0] == "D" for entry in modules.values())
    assert all(all(1 <= number <= 103 for number in entry[1]) for entry in modules.values())
    tree = ast.parse(REGISTRY.read_text(encoding="utf-8"))
    contribution = registry_assignment(tree, "CONTRIBUTIONS")
    assert isinstance(contribution.value, ast.Tuple)
    assert contribution.value.elts == []


def test_season_source_never_calls_provider_or_fetch_directly() -> None:
    for module in SEASON_DIRECTORY.glob("*.ts"):
        source = module.read_text(encoding="utf-8")
        assert "fetch(" not in source
        assert "XMLHttpRequest" not in source
        assert "providers/youcam" not in source
        assert "localStorage." not in source
        assert "sessionStorage." not in source


def test_home_mount_requires_an_opted_in_public_source() -> None:
    entry = (SEASON_DIRECTORY / "index.ts").read_text(encoding="utf-8")
    assert 'await import("./surface.js")' in entry
    assert "registerSeasonBookPort" in entry
    assert "unregisterSeasonBookPort" in entry
    assert "registerSeasonBookPort(" not in (ROOT / "web/src/layout/home-view.ts").read_text(
        encoding="utf-8"
    )


@pytest.mark.parametrize(
    "filename",
    [
        "contracts.ts",
        "personal.ts",
        "alerts.ts",
        "controller.ts",
        "view.ts",
        "surface.ts",
        "index.ts",
    ],
)
def test_staged_module_files_below_800_lines(filename: str) -> None:
    assert len((SEASON_DIRECTORY / filename).read_text(encoding="utf-8").splitlines()) < 800


def test_old_internal_names_are_unchanged() -> None:
    source = (ROOT / "web/src/layout/my-looks.ts").read_text(encoding="utf-8")
    assert 'beljour-my-look/1' in source
    brand = (ROOT / "web/home.html").read_text(encoding="utf-8")
    assert "BELJOUR — FULL BEAUTY STUDIO" in brand
    assert "Your best day. Still you." in brand
