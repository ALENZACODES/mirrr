"""Lane D offline provider-free cassette acceptance. Author: John Khan."""

from __future__ import annotations

import ast
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LANE_REGISTRY = ROOT / "api/plumb_api/arena/lane_registry/d.py"
CASSETTE = ROOT / "web/src/layout/continuous"
PANEL = ROOT / "web/src/ui/shell/continuous-cassette-panel.ts"


class TestOfflineCassette(unittest.TestCase):
    def test_registry_has_exact_new_modules(self) -> None:
        contents = LANE_REGISTRY.read_text(encoding="utf-8")
        tree = ast.parse(contents)
        block = next(
            node for node in tree.body
            if isinstance(node, ast.AnnAssign)
            and isinstance(node.target, ast.Name)
            and node.target.id == "LANE_D_R31D_CP1_MODULES"
        )
        self.assertIsInstance(block.value, ast.Dict)
        self.assertEqual(len(block.value.keys), 20)

    def test_registry_contains_no_new_shared_contribution(self) -> None:
        contents = LANE_REGISTRY.read_text(encoding="utf-8")
        block = contents.split("# --- Lane D r31d-cp1:", maxsplit=1)[1]
        self.assertNotIn("CONTRIBUTIONS =", block)
        self.assertNotIn("extras =", block)
        self.assertNotIn("_base_extras", block)

    def test_all_registered_cassette_files_exist(self) -> None:
        tree = ast.parse(LANE_REGISTRY.read_text(encoding="utf-8"))
        names: list[str] = []
        for node in tree.body:
            if not isinstance(node, ast.AnnAssign):
                continue
            if not isinstance(node.target, ast.Name):
                continue
            if node.target.id != "LANE_D_R31D_CP1_MODULES":
                continue
            self.assertIsInstance(node.value, ast.Dict)
            for key in node.value.keys:
                self.assertIsInstance(key, ast.Constant)
                self.assertIsInstance(key.value, str)
                names.append(key.value)
        self.assertEqual(len(names), len(set(names)))
        self.assertTrue(all((ROOT / name).is_file() for name in names))

    def test_cassette_modules_never_issue_a_request(self) -> None:
        files = list(CASSETTE.glob("cassette-*.ts"))
        files.append(PANEL)
        self.assertEqual(len(files), 8)
        for file in files:
            content = file.read_text(encoding="utf-8")
            self.assertNotRegex(content, r"\bfetch\s*\(")
            self.assertNotRegex(content, r"\bXMLHttpRequest\b")
            self.assertNotRegex(content, r"\bWebSocket\b")
            self.assertNotRegex(content, r"\bapi\.\w+\s*\(")
            self.assertNotIn("localStorage", content)
            self.assertNotIn("sessionStorage", content)

    def test_provider_flags_do_not_call_a_gateway(self) -> None:
        text = (CASSETTE / "cassette-routes.ts").read_text(encoding="utf-8")
        self.assertIn("providerScreensEnabled", text)
        self.assertIn("startsProviderTask: false", text)
        self.assertIn("carriesPhoto: false", text)
        self.assertIn("carriesConsent: false", text)
        self.assertIn("safeProviderRoute", text)
        self.assertNotIn("../providers/youcam", text)

    def test_every_recorded_card_has_only_zero_cost_mock_provenance(self) -> None:
        contents = (CASSETTE / "cassette-contract.ts").read_text(encoding="utf-8")
        self.assertEqual(contents.count("providerCalls: 0, unitsSpent: 0, containsPhoto: false"), 3)
        self.assertEqual(contents.count("testedOnRealFaces: false"), 4)
        self.assertIn("ILLUSTRATION · NOT A PROVIDER RESULT", contents)
        self.assertNotIn("data:image/", contents)

    def test_sample_bag_contains_no_checkout_or_payment(self) -> None:
        contents = (CASSETTE / "cassette-bag.ts").read_text(encoding="utf-8")
        self.assertIn("hasCheckout: false", contents)
        self.assertIn("hasPayment: false", contents)
        self.assertIn("keepsPhotos: false", contents)
        self.assertNotIn("stripe", contents.lower())
        self.assertNotIn("paypal", contents.lower())

    def test_all_public_source_paths_keep_their_fixed_local_prefix(self) -> None:
        paths = re.findall(
            r'"(web/src/(?:layout/continuous/cassette-[^" ]+|ui/shell/continuous-cassette-panel.ts))"',
            LANE_REGISTRY.read_text(encoding="utf-8").split("# --- Lane D r31d-cp1:")[-1],
        )
        self.assertEqual(len(paths), 8)
        for path in paths:
            self.assertTrue((ROOT / path).is_file())
            self.assertFalse(path.endswith(".js"))

    def test_full_wordmark_palette_is_french_and_does_not_introduce_a_logo(self) -> None:
        css = (ROOT / "web/layout.css").read_text(encoding="utf-8")
        theme = (CASSETTE / "contract.ts").read_text(encoding="utf-8")
        self.assertIn("--lg-demo-blue: #000091", css)
        self.assertIn("--lg-demo-red: var(--lg-french-rouge)", css)
        self.assertIn('blue: "#000091"', theme)
        self.assertIn('red: "#E1000F"', theme)
        self.assertIn(".lg-cassette-monogram", css)
        self.assertIn(".lg-demo-wordmark", css)
        self.assertIn("BELJOUR", (ROOT / "web/src/ui/shell/continuous-cassette-panel.ts").read_text(encoding="utf-8"))
        self.assertNotIn("Penn-inspired", css)

    def test_offline_report_refuses_live_or_real_face_verification(self) -> None:
        contents = (CASSETTE / "cassette-report.ts").read_text(encoding="utf-8")
        self.assertIn("productionProviderVerified: false", contents)
        self.assertIn("releaseGatePassed: false", contents)
        self.assertIn("realFaceTested: false", contents)
        self.assertIn("providerRequests: 0", contents)

    def test_existing_provider_adapter_is_not_changed(self) -> None:
        sources = list(CASSETTE.glob("cassette-*.ts"))
        for source in sources:
            contents = source.read_text(encoding="utf-8")
            self.assertNotRegex(contents, r"(?i)\bfrom\s+['\"].*providers/youcam")
            self.assertNotIn("/api/tasks/start", contents)


if __name__ == "__main__":
    unittest.main()
