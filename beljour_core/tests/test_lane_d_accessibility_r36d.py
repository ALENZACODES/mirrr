"""Lane D keyboard, focus, and local audit ownership. Author: John Khan."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "web"
REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"
MODULES = (
    "web/src/layout/continuous/focus-session.ts",
    "web/src/layout/continuous/keyboard-session.ts",
    "web/src/layout/continuous/accessibility-audit.ts",
    "web/src/layout/continuous/accessibility-report.ts",
    "web/src/layout/continuous/accessibility-session.ts",
    "web/src/layout/continuous/accessibility-delta.ts",
    "web/src/layout/continuous/header.ts",
    "web/src/ui/shell/continuous-keyboard-panel.ts",
)


class ClientAccessibilityTests(unittest.TestCase):
    def test_every_new_module_is_registered_with_lane_d(self) -> None:
        content = REGISTRY.read_text(encoding="utf-8")
        for module in MODULES:
            with self.subTest(module=module):
                self.assertTrue((ROOT / module).is_file())
                self.assertIn(f'"{module}": ("D",', content)

    def test_new_modules_cannot_call_network_or_provider_directly(self) -> None:
        patterns = (
            r"\bfetch\s*\(",
            r"\bXMLHttpRequest\b",
            r"\bWebSocket\s*\(",
            r"\bYouCamProvider\b",
            r"\blocalStorage\s*\.",
        )
        for module in MODULES:
            with self.subTest(module=module):
                source = (ROOT / module).read_text(encoding="utf-8")
                for pattern in patterns:
                    self.assertIsNone(re.search(pattern, source), pattern)

    def test_public_lockup_and_evidence_disclaimer_preserved(self) -> None:
        header = (WEB / "src/layout/continuous/header.ts").read_text(encoding="utf-8")
        self.assertIn("BELJOUR", header)
        self.assertIn("FULL BEAUTY STUDIO", header)
        self.assertIn("Your best day. Still you.", header)
        report = (WEB / "src/layout/continuous/accessibility-report.ts").read_text(
            encoding="utf-8"
        )
        self.assertIn('"not-tested"', report)
        self.assertIn("realFace", report)
        self.assertIn("screenReader", report)
        self.assertIn("physicalDevice", report)

    def test_new_source_lines_are_readable_and_under_800(self) -> None:
        for module in MODULES:
            with self.subTest(module=module):
                lines = (ROOT / module).read_text(encoding="utf-8").splitlines()
                self.assertLess(len(lines), 800)
                self.assertFalse([index for index, line in enumerate(lines, 1)
                                  if len(line) > 120])
                self.assertFalse([index for index, line in enumerate(lines, 1)
                                  if re.search(r";\s*\b(?:const|let|return|throw|if)\b", line)])

    def test_existing_mount_stays_within_source_file_limit(self) -> None:
        module = WEB / "src/layout/continuous/mount.ts"
        self.assertLess(module.read_text(encoding="utf-8").count("\n"), 800)

    def test_new_report_schema_never_claims_wcag_or_identity_certification(self) -> None:
        report = (WEB / "src/layout/continuous/accessibility-report.ts").read_text(
            encoding="utf-8"
        )
        self.assertNotIn('"passed"', report)
        self.assertNotIn('"certified"', report)
        self.assertIn("operator-local-observation", report)

    def test_no_new_module_owns_another_lanes_contribution_table(self) -> None:
        registry = REGISTRY.read_text(encoding="utf-8")
        self.assertIn("LANE_D_R35D_CP1_MODULES", registry)
        self.assertIn("LANE_D_R36D_CP1_MODULES", registry)
        for phrase in ("CONTRIBUTIONS =", "extras =", "features.json"):
            self.assertNotIn(phrase, registry.split("# --- Lane D r36d-cp1:")[-1])


if __name__ == "__main__":
    unittest.main()
