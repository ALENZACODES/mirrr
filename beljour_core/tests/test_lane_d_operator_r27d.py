"""Lane D operator-tour boundary and ownership tests, synthetic source only."""

from __future__ import annotations

import ast
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "web"
REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"
MODULES = (
    "web/src/layout/continuous/operator-contract.ts",
    "web/src/layout/continuous/operator-timer.ts",
    "web/src/layout/continuous/operator-state.ts",
    "web/src/layout/continuous/operator-report.ts",
    "web/src/layout/continuous/operator-script.ts",
    "web/src/layout/continuous/operator-preflight.ts",
    "web/src/layout/continuous/operator-accessibility.ts",
    "web/src/layout/continuous/operator-device.ts",
    "web/src/ui/shell/continuous-operator-panel.ts",
    "api/tests/test_lane_d_operator_r27d.py",
)


def cp3_registry_entries() -> dict[str, tuple[str, tuple[int, ...]]]:
    """Read the additive registry literal without executing any other lane."""
    tree = ast.parse(REGISTRY.read_text(encoding="utf-8"))
    matches = [
        node
        for node in tree.body
        if isinstance(node, ast.AnnAssign)
        and isinstance(node.target, ast.Name)
        and node.target.id == "LANE_D_R27D_CP3_MODULES"
    ]
    if len(matches) != 1 or matches[0].value is None:
        raise AssertionError("Expected one cp3 ownership literal")
    rows: dict[str, tuple[str, tuple[int, ...]]] = ast.literal_eval(matches[0].value)
    return rows


class LaneDOperatorSources(unittest.TestCase):
    def test_each_module_has_lane_d_owner(self) -> None:
        rows = cp3_registry_entries()
        self.assertEqual(set(rows), set(MODULES))
        for module, (owner, feature_ids) in rows.items():
            self.assertEqual(owner, "D")
            self.assertTrue((ROOT / module).is_file(), module)
            self.assertTrue(feature_ids)
            self.assertTrue(all(1 <= feature_id <= 103 for feature_id in feature_ids))

    def test_registry_preserves_shared_views(self) -> None:
        source = REGISTRY.read_text(encoding="utf-8")
        block = source.split("# --- Lane D r27d-cp3", 1)[-1]
        self.assertNotIn("CONTRIBUTIONS =", block)
        self.assertNotIn("extras =", block)
        self.assertEqual(block.count("LANE_D_R27D_CP3_MODULES:"), 1)
        self.assertEqual(block.count("def lane_d_r27d_cp3_ownership"), 1)

    def test_new_client_modules_never_call_network_directly(self) -> None:
        forbidden = re.compile(r"\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(")
        for path in MODULES:
            if not path.endswith(".ts"):
                continue
            content = (ROOT / path).read_text(encoding="utf-8")
            self.assertIsNone(forbidden.search(content), path)
            self.assertNotIn("localStorage.setItem", content)
            self.assertNotIn("sessionStorage.setItem", content)

    def test_operator_schema_cannot_claim_external_acceptance(self) -> None:
        source = (WEB / "src/layout/continuous/operator-report.ts").read_text(encoding="utf-8")
        self.assertIn("readonly providerVerified: false", source)
        self.assertIn("readonly realFaceVerified: false", source)
        self.assertIn("readonly frozenReleaseVerified: false", source)
        self.assertIn("readonly completeForSubmission: false", source)

    def test_public_links_never_depend_on_private_photo_identifiers(self) -> None:
        source = (WEB / "src/layout/continuous/operator-contract.ts").read_text(encoding="utf-8")
        self.assertIn("realDemoRoutes", source)
        self.assertIn("isSafeOperatorHref", source)
        self.assertIn("includes(\"?\")", source)
        self.assertNotIn("URLSearchParams", source)

    def test_source_and_permissions_revoke_stale_operator_checks(self) -> None:
        source = (WEB / "src/layout/continuous/mount.ts").read_text(encoding="utf-8")
        self.assertIn("operator.reset(subjects.revision)", source)
        self.assertIn("if (!enabled) operator.reset(state.snapshot.sourceRevision)", source)
        self.assertIn("operator.dispose()", source)
        self.assertIn("renderContinuousOperator", source)

    def test_css_uses_minimum_functional_text_size_and_no_rouge_border(self) -> None:
        css = (WEB / "layout.css").read_text(encoding="utf-8")
        part = css.split("/* Lane D continuous real-product rehearsal:", 1)[-1]
        self.assertIn("min-height: 44px", part)
        self.assertNotRegex(part, r"font-size:\s*0\.[0-6]rem")
        self.assertNotIn("#e1000f", part.lower())
        self.assertNotIn("#990000", part.lower())

    def test_new_node_regressions_are_present(self) -> None:
        tests = (
            "continuous-operator-clock-r27d.test.mjs",
            "continuous-operator-state-r27d.test.mjs",
            "continuous-operator-report-r27d.test.mjs",
            "continuous-operator-panel-r27d.test.mjs",
            "continuous-operator-preflight-r27d.test.mjs",
            "continuous-operator-a11y-r27d.test.mjs",
            "continuous-operator-device-r27d.test.mjs",
        )
        for test_name in tests:
            self.assertTrue((WEB / "test" / test_name).is_file(), test_name)


if __name__ == "__main__":
    unittest.main()
