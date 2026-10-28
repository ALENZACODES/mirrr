"""Lane D continuous web-demo boundary and ownership checks; no real images."""

from __future__ import annotations

import ast
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LANE = ROOT / "web/src/layout/continuous"
REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"


def test_all_registered_continuous_modules_exist() -> None:
    tree = ast.parse(REGISTRY.read_text(encoding="utf-8"))
    target = next(
        node
        for node in tree.body
        if isinstance(node, ast.AnnAssign)
        and isinstance(node.target, ast.Name)
        and node.target.id == "LANE_D_R27D_CP1_MODULES"
    )
    assert target.value is not None
    entries = ast.literal_eval(target.value)
    assert len(entries) == 11
    for path, (owner, ids) in entries.items():
        assert owner == "D"
        assert (ROOT / path).is_file()
        assert ids
        assert all(1 <= index <= 103 for index in ids)


def test_pro_command_names_are_exact_and_only_five() -> None:
    source = (LANE / "pro-commands.ts").read_text(encoding="utf-8")
    commands = re.findall(r'^  "(/(?:IDENTITYLOCK|CLEANUP|UPSCALE|STUDIOQUALITY|POSEONLY))",$', source, re.M)
    assert commands == ["/IDENTITYLOCK", "/CLEANUP", "/UPSCALE", "/STUDIOQUALITY", "/POSEONLY"]


def test_continuous_ui_never_calls_network_directly() -> None:
    sources = list(LANE.glob("*.ts"))
    sources.append(ROOT / "web/src/ui/shell/continuous-panels.ts")
    for path in sources:
        text = path.read_text(encoding="utf-8")
        assert not re.search(r"\bfetch\s*\(", text), path
        assert not re.search(r"\b(?:XMLHttpRequest|WebSocket|sendBeacon)\s*\(", text), path
        assert not re.search(r"\blocalStorage\s*\.", text), path


def test_no_shared_aggregate_registry_views_are_modified() -> None:
    source = REGISTRY.read_text(encoding="utf-8")
    assert "CONTRIBUTIONS: tuple[LaneContribution, ...] = ()" in source
    block = source.split("# --- Lane D r27d-cp1:", 1)[1]
    assert "CONTRIBUTIONS =" not in block
    assert "extras =" not in block
    assert "feature_rows =" not in block


def test_continuous_theme_and_install_route_avoid_inline_scripts() -> None:
    page = (ROOT / "web/home.html").read_text(encoding="utf-8")
    entry = (ROOT / "web/src/layout/judge-entry.ts").read_text(encoding="utf-8")
    assert 'href="#judge-full"' in page
    assert 'hash === "#judge-full"' in entry
    assert not re.search(r"<script(?![^>]*\bsrc=)", page)
    css = (ROOT / "web/layout.css").read_text(encoding="utf-8")
    assert "--lg-demo-blue: #000091;" in css
    assert "--lg-demo-red: var(--lg-french-rouge);" in css
    assert "--lg-demo-white: #FFFFFF;" in css
