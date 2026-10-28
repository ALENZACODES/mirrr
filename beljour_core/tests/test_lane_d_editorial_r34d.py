"""Ownership and privacy of the editorial client finish. Author: John Khan."""

from __future__ import annotations

import ast
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"
MODULES = ROOT / "web/src/layout/editorial"
MOUNT = ROOT / "web/src/layout/continuous/mount.ts"
CSS = ROOT / "web/layout.css"
HANDOFF = ROOT / "HANDOFF-D-APPEND.md"
MARKER = "# --- Lane D r34d-cp1:"


class TestLaneDEditorial(unittest.TestCase):
    def test_ownership_section_is_append_only(self) -> None:
        source = REGISTRY.read_text(encoding="utf-8")
        self.assertEqual(source.count(MARKER), 1)
        fragment = source.split(MARKER, maxsplit=1)[1]
        self.assertNotIn("CONTRIBUTIONS =", fragment)
        self.assertNotIn("extras =", fragment)
        self.assertNotIn("lane_b", fragment)
        self.assertIn("Author: John Khan", fragment)

    def test_every_new_module_is_registered_once(self) -> None:
        tree = ast.parse(REGISTRY.read_text(encoding="utf-8"))
        declaration = [
            stmt for stmt in tree.body
            if isinstance(stmt, ast.AnnAssign)
            and isinstance(stmt.target, ast.Name)
            and stmt.target.id == "LANE_D_R34D_CP1_MODULES"
        ]
        self.assertEqual(len(declaration), 1)
        block = declaration[0]
        self.assertIsInstance(block.value, ast.Dict)
        names = [
            item.value for item in block.value.keys
            if isinstance(item, ast.Constant)
        ]
        self.assertEqual(len(names), 20)
        self.assertEqual(len(set(names)), len(names))
        for name in names:
            self.assertTrue((ROOT / name).is_file(), name)
            if name.endswith(".ts"):
                self.assertNotRegex(Path(name).name, r"-r\d+d")

    def test_owner_and_feature_ids_do_not_include_other_lanes(self) -> None:
        section = REGISTRY.read_text(encoding="utf-8").split(
            "LANE_D_R34D_CP1_MODULES:", maxsplit=1
        )[1].split("\n}\n", maxsplit=1)[0]
        entries = re.findall(r'"([^"\n]+)": \("([A-Z])", \(([^)]*)\)\)', section)
        self.assertEqual(len(entries), 20)
        for path, owner, ids in entries:
            self.assertEqual(owner, "D", path)
            values = [int(value.strip()) for value in ids.split(",") if value.strip()]
            self.assertTrue(values)
            self.assertTrue(all(1 <= value <= 103 for value in values))

    def test_no_new_external_communication_or_persistent_images(self) -> None:
        for source in sorted(MODULES.glob("*.ts")):
            body = source.read_text(encoding="utf-8")
            for pattern in (
                r"\bfetch\s*\(",
                r"\bXMLHttpRequest\b",
                r"\bWebSocket\b",
                r"\bsendBeacon\s*\(",
                r"\blocalStorage\b",
                r"\bsessionStorage\b",
                r"\bindexedDB\b",
                r"\binnerHTML\s*=",
            ):
                self.assertNotRegex(body, pattern, source.name)

    def test_illustration_system_is_only_three_review_kinds(self) -> None:
        art = (MODULES / "house-art.ts").read_text(encoding="utf-8")
        self.assertIn("portrait", art)
        self.assertIn("figure", art)
        self.assertIn("trust", art)
        self.assertIn('const NS = "http://www.w3.org/2000/svg";', art)
        self.assertIn("createElementNS", art)
        self.assertNotIn("document.write", art)
        self.assertNotIn("fetch(", art)

    def test_motion_is_optional_and_opacity_transform_only(self) -> None:
        motion = (MODULES / "motion.ts").read_text(encoding="utf-8")
        style = CSS.read_text(encoding="utf-8")
        self.assertIn("reducedMotion", motion)
        self.assertIn("saveData", motion)
        self.assertIn("documentHidden", motion)
        self.assertIn("@keyframes lg-ivy-page", style)
        frame = style.split("@keyframes lg-ivy-page", maxsplit=1)[1].split("}", maxsplit=1)[0]
        self.assertIn("opacity:", frame)
        self.assertIn("transform:", frame)
        self.assertNotIn("width:", frame)

    def test_evidence_page_does_not_pretend_release_pass(self) -> None:
        proof = (MODULES / "proof.ts").read_text(encoding="utf-8")
        for statement in (
            "externalQualityPassed: false",
            "liveProviderVerified: false",
            "frozen100kPassed: false",
            "Mock only",
            "Not verified",
        ):
            self.assertIn(statement, proof)
        self.assertNotIn("realFaceVerified: true", proof)

    def test_existing_demo_canvas_and_original_export_remain(self) -> None:
        mount = MOUNT.read_text(encoding="utf-8")
        self.assertIn("drawContinuousPreview", mount)
        self.assertIn("ContinuousExportController", mount)
        self.assertIn("createEditorialCover", mount)
        self.assertIn("renderProofExperience", mount)
        self.assertIn("applyEditorialMotion", mount)
        self.assertLess(len(mount.splitlines()), 800)

    def test_review_assets_are_not_in_build_copy_manifest(self) -> None:
        staging = (ROOT / "web/scripts/copy-static.mjs").read_text(encoding="utf-8")
        offline = (ROOT / "web/scripts/build-offline.mjs").read_text(encoding="utf-8")
        self.assertNotIn("editorial-review", staging)
        self.assertNotIn("editorial-review", offline)
        self.assertTrue((ROOT / "web/public/editorial-review/contact-sheet.png").is_file())

    def test_handoff_uses_private_lane_append_file(self) -> None:
        self.assertTrue(HANDOFF.is_file())
        self.assertIn("Lane D", HANDOFF.read_text(encoding="utf-8"))
        self.assertTrue((ROOT / "HANDOFF.md").is_file())


if __name__ == "__main__":
    unittest.main()
