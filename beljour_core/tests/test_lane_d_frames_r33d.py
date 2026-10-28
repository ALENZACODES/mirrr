"""Ownership and offline privacy checks for Lane D cached drawings. Author: John Khan."""

from __future__ import annotations

import ast
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"
FRAMES = ROOT / "web/src/layout/continuous"
PANEL = ROOT / "web/src/ui/shell/continuous-frame-panel.ts"
STYLE = ROOT / "web/layout.css"
MOUNT = FRAMES / "mount.ts"
BLOCK = "# --- Lane D r33d-cp1:"


class TestLaneDFrameCache(unittest.TestCase):
    def test_exact_ownership_block_is_appended(self) -> None:
        source = REGISTRY.read_text(encoding="utf-8")
        self.assertEqual(source.count(BLOCK), 1)
        self.assertEqual(source.count("LANE_D_R33D_CP1_MODULES:"), 1)
        fragment = source.split(BLOCK, maxsplit=1)[1]
        self.assertNotIn("CONTRIBUTIONS =", fragment)
        self.assertNotIn("extras =", fragment)
        self.assertNotIn("lane_b", fragment)

    def test_every_new_module_has_a_distinct_d_registration(self) -> None:
        tree = ast.parse(REGISTRY.read_text(encoding="utf-8"))
        declarations = [
            stmt for stmt in tree.body
            if isinstance(stmt, ast.AnnAssign)
            and isinstance(stmt.target, ast.Name)
            and stmt.target.id == "LANE_D_R33D_CP1_MODULES"
        ]
        self.assertEqual(len(declarations), 1)
        declaration = declarations[0]
        self.assertIsInstance(declaration.value, ast.Dict)
        keys = [node.value for node in declaration.value.keys if isinstance(node, ast.Constant)]
        self.assertEqual(len(keys), 18)
        self.assertEqual(len(keys), len(set(keys)))
        for name in keys:
            self.assertTrue((ROOT / name).is_file(), name)
            if name.endswith(".ts"):
                self.assertNotRegex(Path(name).name, r"-r\d+d")

    def test_owner_and_feature_ids_are_valid(self) -> None:
        source = REGISTRY.read_text(encoding="utf-8")
        parsed = ast.parse(source)
        declarations = [
            item for item in parsed.body
            if isinstance(item, ast.AnnAssign)
            and isinstance(item.target, ast.Name)
            and item.target.id == "LANE_D_R33D_CP1_MODULES"
        ]
        self.assertEqual(len(declarations), 1)
        fragment = ast.get_source_segment(source, declarations[0]) or ""
        records = re.findall(r'"([^"\n]+)": \("([A-Z])", \(([^)]*)\)\)', fragment)
        self.assertEqual(len(records), 18)
        for name, owner, feature_ids in records:
            self.assertEqual(owner, "D")
            self.assertTrue((ROOT / name).is_file())
            self.assertTrue(all(
                1 <= int(value.strip()) <= 103
                for value in feature_ids.split(",") if value.strip()
            ))

    def test_local_cache_cannot_use_network_or_persistent_photo_storage(self) -> None:
        modules = sorted(FRAMES.glob("frame-*.ts")) + [PANEL]
        self.assertEqual(len(modules), 7)
        for file in modules:
            code = file.read_text(encoding="utf-8")
            for unsafe in [
                r"\bfetch\s*\(", r"\bXMLHttpRequest\b", r"\bWebSocket\b",
                r"\bsendBeacon\s*\(", r"\blocalStorage\b", r"\bsessionStorage\b",
                r"\bindexedDB\b", r"\bprovider\.start\s*\(",
            ]:
                self.assertNotRegex(code, unsafe, file.name)

    def test_authority_covers_changes_that_make_frames_stale(self) -> None:
        source = (FRAMES / "frame-cache-contract.ts").read_text(encoding="utf-8")
        for required in [
            "state.sourceRevision", "state.selectedId", "state.identityLock",
            "state.permissions.local", "state.permissions.hair", "state.permissions.face",
            "state.permissions.mock", "state.levels", "state.applied",
            "state.appearanceCue", "state.mockMode", "drawn",
        ]:
            self.assertIn(required, source)

    def test_cache_has_a_strict_byte_limit_and_expiration(self) -> None:
        source = (FRAMES / "frame-memory.ts").read_text(encoding="utf-8")
        self.assertIn("this.byteLimit", source)
        self.assertIn("this.ttl", source)
        self.assertIn("old.frame.rgba.fill(0)", source)
        self.assertIn("this.prune()", source)
        self.assertIn("new Uint8ClampedArray(frame.rgba)", source)

    def test_render_reuses_bystander_protected_local_path(self) -> None:
        source = (FRAMES / "frame-render.ts").read_text(encoding="utf-8")
        self.assertIn("drawContinuousPreview", source)
        self.assertIn("result.protectedBystanders", source)
        self.assertIn("getImageData", source)
        self.assertIn("full.width = 0", source)
        self.assertIn("reduced.width = 0", source)

    def test_gallery_report_cannot_claim_provider_or_frozen_gate_pass(self) -> None:
        source = (FRAMES / "frame-report.ts").read_text(encoding="utf-8")
        for required in [
            "liveVerified: false", "realFaceVerified: false", "frozenGatePassed: false",
            "networkCalls: 0", "unitsSpent: 0", "verifiedFrameReport",
        ]:
            self.assertIn(required, source)
        self.assertNotIn("fileName:", source)
        self.assertNotIn("imageData:", source)

    def test_active_demo_preserves_separate_provider_adapter_boundary(self) -> None:
        source = MOUNT.read_text(encoding="utf-8")
        self.assertIn("new DrawnFrameController", source)
        self.assertIn("createDrawnFrameRenderer", source)
        self.assertIn("frames.invalidate()", source)
        self.assertIn("frames.dispose()", source)
        self.assertIn("renderContinuousFramePanel", source)
        self.assertIn("localTourTryon", source)
        self.assertNotIn("/api/tasks/start", source)

    def test_gallery_is_accessible_and_does_not_show_unverified_commerce(self) -> None:
        source = PANEL.read_text(encoding="utf-8")
        for required in [
            'type = "button"', 'setAttribute("aria-pressed"',
            'setAttribute("aria-label"', 'setAttribute("aria-live"',
            'setAttribute("role", "img")',
        ]:
            self.assertIn(required, source)
        self.assertNotIn("checkout", source.lower())
        self.assertNotIn("billing", source.lower())

    def test_french_blue_with_no_red_body_or_small_functional_text(self) -> None:
        source = STYLE.read_text(encoding="utf-8").split("/* Lane D: in-memory drawn-frame rehearsal.")[1]
        self.assertIn("#000091", source)
        self.assertNotRegex(source, r"(?i)#(?:e1000f|990000|011f5b)\b")
        self.assertNotRegex(source, r"font-size: (?:0\.[0-6]\d*|0\.7[0-4])rem")
        self.assertIn("min-block-size: 44px", source)

    def test_all_new_dom_and_controller_tests_exist(self) -> None:
        test_dir = ROOT / "web/test"
        paths = sorted(test_dir.glob("frame-*-r33d.test.mjs"))
        self.assertEqual(len(paths), 9)
        combined = "\n".join(file.read_text(encoding="utf-8") for file in paths)
        for required in ["provider", "identity lock", "subject", "cache", "report"]:
            self.assertIn(required, combined.lower())


if __name__ == "__main__":
    unittest.main()
