"""Lane D local replay ownership and privacy boundaries. Author: John Khan."""

from __future__ import annotations

import ast
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"
WEB = ROOT / "web/src/layout/continuous"
PANEL = ROOT / "web/src/ui/shell/continuous-offline-import-panel.ts"
STYLES = ROOT / "web/layout.css"
ENTRY = WEB / "mount.ts"
BLOCK = "# --- Lane D r32d-cp1:"


class TestLaneDLocalImport(unittest.TestCase):
    def test_only_one_lane_d_registry_block_is_added(self) -> None:
        code = REGISTRY.read_text(encoding="utf-8")
        self.assertEqual(code.count(BLOCK), 1)
        self.assertEqual(code.count("LANE_D_R32D_CP1_MODULES:"), 1)
        self.assertNotIn("CONTRIBUTIONS =", code.split(BLOCK)[1])
        self.assertNotIn("extras =", code.split(BLOCK)[1])
        self.assertNotIn("_LANE_B_", code.split(BLOCK)[1])

    def test_registry_keys_are_distinct_source_and_test_modules(self) -> None:
        tree = ast.parse(REGISTRY.read_text(encoding="utf-8"))
        names: list[str] = []
        for statement in tree.body:
            if not isinstance(statement, ast.AnnAssign):
                continue
            if not isinstance(statement.target, ast.Name):
                continue
            if statement.target.id != "LANE_D_R32D_CP1_MODULES":
                continue
            self.assertIsInstance(statement.value, ast.Dict)
            for item in statement.value.keys:
                self.assertIsInstance(item, ast.Constant)
                self.assertIsInstance(item.value, str)
                names.append(item.value)
        self.assertEqual(len(names), 15)
        self.assertEqual(len(set(names)), len(names))
        self.assertTrue(all((ROOT / name).is_file() for name in names))

    def test_registry_references_only_lane_d_modules(self) -> None:
        code = REGISTRY.read_text(encoding="utf-8").split(BLOCK, maxsplit=1)[1]
        code = code.split("# --- Lane D r33d-cp1:", maxsplit=1)[0]
        records = re.findall(r'"([^"\n]+\.(?:ts|mjs|py))": \("([A-Z])", \(([^)]*)\)\)', code)
        self.assertEqual(len(records), 15)
        for path, owner, numbers in records:
            self.assertEqual(owner, "D")
            self.assertTrue((ROOT / path).is_file())
            self.assertTrue(all(1 <= int(item.strip()) <= 103 for item in numbers.split(",") if item.strip()))

    def test_source_paths_include_no_shipped_round_suffix(self) -> None:
        for filename in [
            "offline-import-contract.ts",
            "offline-import-controller.ts",
            "offline-import-guide.ts",
            "offline-import-preparation.ts",
        ]:
            self.assertTrue((WEB / filename).exists())
            self.assertNotRegex(filename, r"r\d+[a-z]")
        self.assertTrue(PANEL.exists())

    def test_local_import_code_has_no_network_primitive(self) -> None:
        files = list(WEB.glob("offline-import-*.ts")) + [PANEL]
        self.assertEqual(len(files), 5)
        for source in files:
            code = source.read_text(encoding="utf-8")
            self.assertNotRegex(code, r"\bfetch\s*\(")
            self.assertNotRegex(code, r"\bXMLHttpRequest\b")
            self.assertNotRegex(code, r"\bWebSocket\b")
            self.assertNotRegex(code, r"\bsendBeacon\s*\(")
            self.assertNotRegex(code, r"\bapi\.\w+\s*\(")
            self.assertNotIn("localStorage", code)
            self.assertNotIn("sessionStorage", code)

    def test_manifest_parser_rejects_vendor_and_privacy_claims(self) -> None:
        code = (WEB / "offline-import-contract.ts").read_text(encoding="utf-8")
        for required in [
            '"operator-supplied-unverified"',
            "providerVerified !== false",
            "realFaceTested !== false",
            "unitsSpentByViewer !== 0",
            "OFFLINE_IMPORT_MAX_MANIFEST = 8192",
            "OFFLINE_IMPORT_MAX_PIXELS = 12_000_000",
        ]:
            self.assertIn(required, code)

    def test_reference_hash_is_compared_only_after_png_validation(self) -> None:
        code = (WEB / "offline-import-controller.ts").read_text(encoding="utf-8")
        validator = code.index("verifyPngBytes(bytes, manifest.width, manifest.height)")
        digest = code.index("this.hasher.digest(bytes)")
        URL = code.index("this.urls.create(pngBlob)")
        self.assertLess(validator, digest)
        self.assertLess(digest, URL)
        self.assertIn("sameOfflineImportAuthority", code)
        self.assertIn("this.dropPreview()", code)

    def test_report_has_no_image_or_name_fields(self) -> None:
        code = (WEB / "offline-import-contract.ts").read_text(encoding="utf-8")
        report = code.split("export function offlineImportEvidence", maxsplit=1)[1]
        self.assertIn("providerOriginVerified: false", report)
        self.assertIn("realFaceGatePassed: false", report)
        self.assertIn("imageUploaded: false", report)
        self.assertNotIn("fileName:", report)
        self.assertNotIn("imageBytes:", report)
        self.assertNotIn("sourceUrl:", report)

    def test_user_has_clear_and_accessible_controls(self) -> None:
        code = PANEL.read_text(encoding="utf-8")
        for required in [
            'input.type = "file"',
            'input.setAttribute("aria-label", label)',
            'input.setAttribute("autocomplete", "off")',
            'clear.disabled = status.phase === "disposed"',
            'guidance.setAttribute("aria-live", "polite")',
            'guidance.setAttribute("role", "status")',
        ]:
            self.assertIn(required, code)

    def test_client_mount_never_forwards_import_to_provider(self) -> None:
        code = ENTRY.read_text(encoding="utf-8")
        self.assertIn("new OfflineImportController", code)
        self.assertIn("renderOfflineImportPanel", code)
        self.assertIn("offlineImport.invalidate()", code)
        self.assertIn("offlineImport.dispose()", code)
        self.assertNotIn("options.youcam", code)

    def test_css_uses_french_palette_with_minimum_text_size(self) -> None:
        css = STYLES.read_text(encoding="utf-8")
        group = css.split("/* Lane D r32d:")[1]
        self.assertIn("color: #000091", group)
        self.assertNotRegex(group, r"#(?:E1000F|e1000f|990000|011F5B)\b")
        self.assertNotIn("font-size: 0.67rem", group)
        self.assertIn("min-height: 44px", group)

    def test_test_files_cover_success_refusal_and_stale_lifecycle(self) -> None:
        sources = sorted((ROOT / "web/test").glob("offline-import-*.test.mjs"))
        self.assertEqual(len(sources), 8)
        combined = "\n".join(file.read_text(encoding="utf-8") for file in sources)
        self.assertIn("mismatched PNG hash", combined)
        self.assertIn("identity lock", combined)
        self.assertIn("subject", combined)
        self.assertIn("provider", combined)
        self.assertIn("real-face", combined)
        self.assertIn("revok", combined)

    def test_source_does_not_change_box_production_capabilities(self) -> None:
        code = (WEB / "offline-import-guide.ts").read_text(encoding="utf-8")
        contract = (WEB / "offline-import-contract.ts").read_text(encoding="utf-8")
        self.assertIn("Provider origin remains unverified", contract)
        self.assertIn("Live provider and real-face quality remain NOT VERIFIED", code)
        self.assertIn("photoUploaded: false", code)


if __name__ == "__main__":
    unittest.main()
