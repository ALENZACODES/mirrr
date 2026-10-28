"""Owner D release dashboard checks. Author: John Khan."""

from __future__ import annotations

import ast
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"
SOURCE = ROOT / "web/src/layout/release"


def ownership() -> dict[str, tuple[str, tuple[int, ...]]]:
    """Read the own-lane ownership table without importing another lane."""
    tree = ast.parse(REGISTRY.read_text(encoding="utf-8"))
    target = next(
        node
        for node in tree.body
        if isinstance(node, ast.AnnAssign)
        and isinstance(node.target, ast.Name)
        and node.target.id == "LANE_D_R28D_CP1_MODULES"
    )
    assert target.value is not None
    return ast.literal_eval(target.value)


def test_registered_sources_have_exact_lane_owner() -> None:
    rows = ownership()
    assert len(rows) == 10
    assert all(owner == "D" for owner, _ in rows.values())
    for filename, (_owner, feature_ids) in rows.items():
        assert (ROOT / filename).is_file(), filename
        assert feature_ids
        assert all(index in range(1, 104) for index in feature_ids)


def test_module_names_are_not_round_suffixed() -> None:
    rows = ownership()
    for filename in rows:
        if filename.endswith(".ts"):
            assert not re.search(r"-r\d+[a-z](?:-cp\d+)?\.ts$", filename)
            assert filename.startswith("web/src/layout/release/")


def test_no_fetch_or_remote_transport_outside_api_boundary() -> None:
    for filename in SOURCE.glob("*.ts"):
        text = filename.read_text(encoding="utf-8")
        assert not re.search(r"\bfetch\s*\(", text), filename
        assert not re.search(r"\bnew\s+XMLHttpRequest\b", text), filename
        assert not re.search(r"\bnew\s+WebSocket\b", text), filename
        assert not re.search(r"\bsendBeacon\s*\(", text), filename


def test_new_release_client_never_stores_photos() -> None:
    for filename in SOURCE.glob("*.ts"):
        text = filename.read_text(encoding="utf-8")
        assert not re.search(r"\blocalStorage\s*\.", text), filename
        assert not re.search(r"\bsessionStorage\s*\.", text), filename
        assert "document.cookie" not in text
        assert "indexedDB.open" not in text


def test_release_report_cannot_claim_provider_or_realface_acceptance() -> None:
    text = (SOURCE / "report.ts").read_text(encoding="utf-8")
    assert "providerVerified: false" in text
    assert "realFaceVerified: false" in text
    assert "independentVerified: false" in text
    assert "productionReady: false" in text
    assert "hasPhotographs: false" in text
    assert "validateSafeReleaseReport" in text


def test_imported_report_is_not_authoritative() -> None:
    text = (SOURCE / "import-review.ts").read_text(encoding="utf-8")
    assert "independentAccepted: false" in text
    assert "productionReady: false" in text
    assert "MAX_REPORT_BYTES = 32_768" in text
    assert "currentRevision() !== requestedRevision" in text


def test_real_routes_are_only_from_public_entry_point() -> None:
    text = (SOURCE / "catalogue.ts").read_text(encoding="utf-8")
    assert 'from "../judge-live-routes.js"' in text
    assert "realDemoRoute(route).href" in text
    assert "Untrusted release destination" in text


def test_browser_render_uses_native_event_handlers_only() -> None:
    source = (SOURCE / "view.ts").read_text(encoding="utf-8")
    assert 'element.addEventListener("click", callback)' in source
    assert 'importInput.addEventListener("change",' in source
    assert "innerHTML" not in source
    assert "outerHTML" not in source
    assert "insertAdjacentHTML" not in source


def test_continuous_demo_and_rehearsal_remain_available() -> None:
    source = (ROOT / "web/src/layout/judge-entry.ts").read_text(encoding="utf-8")
    assert 'browser.location.hash === "#judge-full"' in source
    assert 'browser.location.hash === "#judge"' in source
    assert 'browser.location.hash === "#judge-verify"' in source
    assert "mountContinuousDemo" in source
    assert "mountJudgeMode" in source
    assert "mountReleaseWorkspace" in source


def test_home_has_a_link_without_an_inline_script() -> None:
    source = (ROOT / "web/home.html").read_text(encoding="utf-8")
    assert 'id="lg-verify-launch"' in source
    assert 'href="#judge-verify"' in source
    assert not re.search(r"<script(?![^>]*\bsrc=)", source)


def test_css_is_accessible_on_mobile_without_decorative_red() -> None:
    source = (ROOT / "web/layout.css").read_text(encoding="utf-8")
    assert ".lg-release-workspace" in source
    assert "min-height: 44px" in source
    assert "prefers-reduced-motion: reduce" in source
    assert "border-left: 4px solid #000091" in source


def test_aggregate_registry_views_stay_unchanged() -> None:
    source = REGISTRY.read_text(encoding="utf-8")
    own = source.split("# --- Lane D r28d-cp1:", 1)[1]
    assert "CONTRIBUTIONS =" not in own
    assert "extras =" not in own
    assert "feature_rows =" not in own
    assert "module_universe =" not in own
