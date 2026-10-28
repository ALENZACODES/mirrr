"""Playwright screenshots of local BELJOUR demo screens against approved PNGs.

Capture requires an explicit destination; comparison requires a separately
recorded manifest checksum. Captures never enter the repository or gate output.
Author: John Khan.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import shutil
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
SCREENS = {
    "home": "home.html",
    "trust": "trust.html",
    "studio": "studio.html",
    "commerce": "commerce.html",
    "index": "index.html",
}
VIEWPORTS = {"mobile": (390, 844), "desktop": (1280, 800)}


class VisualRunnerError(ValueError):
    """The browser capture lacks a local origin or an approved comparison."""


class SilentHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        return


def _library() -> Any:
    location = ROOT / "tests/realface/visual_pixels_g.py"
    spec = importlib.util.spec_from_file_location("visual_pixels_g", location)
    if spec is None or spec.loader is None:
        raise VisualRunnerError("visual comparison library is missing")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _serve(site: Path) -> tuple[ThreadingHTTPServer, threading.Thread]:
    if not site.is_dir() or site.is_symlink():
        raise VisualRunnerError("a verified local build directory is required")
    for path in SCREENS.values():
        if not (site / path).is_file():
            raise VisualRunnerError("build lacks a required demo screen")
    handler = partial(SilentHandler, directory=str(site))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, thread


def capture(site: Path) -> dict[str, bytes]:
    """One deterministic mobile screenshot per local page, with external requests blocked."""
    server, thread = _serve(site)
    base_url = f"http://127.0.0.1:{server.server_port}"
    screens: dict[str, bytes] = {}
    try:
        with sync_playwright() as driver:
            browser = driver.chromium.launch(
                executable_path=shutil.which("chromium") or None,
                args=["--no-sandbox"],
            )
            try:
                for viewport, (width, height) in VIEWPORTS.items():
                    context = browser.new_context(
                        viewport={"width": width, "height": height},
                        device_scale_factor=1,
                        locale="en-CA",
                        timezone_id="America/Toronto",
                        reduced_motion="reduce",
                        color_scheme="light",
                    )
                    for name, page_name in SCREENS.items():
                        page = context.new_page()
                        page.route("**/*", lambda route: route.continue_()
                                   if urlparse(route.request.url).netloc
                                   == urlparse(base_url).netloc
                                   else route.abort())
                        page.goto(f"{base_url}/{page_name}", wait_until="load", timeout=20000)
                        page.evaluate("document.fonts.ready")
                        page.add_style_tag(content=(
                            "*,*::before,*::after{"
                            "animation:none!important;transition:none!important}"
                        ))
                        screens[f"{name}_{viewport}"] = page.screenshot(
                            full_page=True, animations="disabled",
                        )
                        page.close()
                    context.close()
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)
    return screens


def _approval(text: str | None) -> str:
    if not text or re.fullmatch("[0-9a-f]{64}", text) is None:
        raise VisualRunnerError("the 64-hex external baseline checksum is required")
    return text


def run(
    *, site: Path, baseline: Path, capture_baseline: bool,
    approval: str | None = None,
) -> dict[str, Any]:
    library = _library()
    screens = capture(site)
    if capture_baseline:
        if baseline.exists() or baseline.is_symlink():
            raise VisualRunnerError("reference capture cannot overwrite prior evidence")
        baseline.mkdir(parents=True, exist_ok=False)
        for name, data in screens.items():
            (baseline / f"{name}.png").write_bytes(data)
        metadata = library.manifest(screens)
        payload = json.dumps(metadata, sort_keys=True, separators=(",", ":")).encode("utf-8")
        (baseline / "manifest.json").write_bytes(payload)
        return {
            "mode": "REFERENCE_CAPTURE_PENDING_APPROVAL",
            "baseline_digest": hashlib.sha256(payload).hexdigest(),
            "screen_count": len(screens),
            "release_quality": "UNPROVEN",
        }
    expected_digest = _approval(approval)
    raw = (baseline / "manifest.json").read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected_digest:
        raise VisualRunnerError("baseline checksum changed since operator approval")
    metadata = json.loads(raw)
    reference = {name: (baseline / f"{name}.png").read_bytes() for name in SCREENS}
    library.validate_manifest(metadata, reference)
    report = library.compare_set(reference, screens)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--capture-reference", action="store_true")
    group.add_argument("--compare", action="store_true")
    parser.add_argument("--approved-manifest-sha256")
    args = parser.parse_args(argv)
    try:
        if args.compare:
            _approval(args.approved_manifest_sha256)
        report = run(
            site=args.site, baseline=args.baseline,
            capture_baseline=args.capture_reference,
            approval=args.approved_manifest_sha256,
        )
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"visual regression: UNPROVEN: {type(exc).__name__}")
        return 2
    print(json.dumps(report, sort_keys=True))
    if report.get("visual_state") == "REGRESSION":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
