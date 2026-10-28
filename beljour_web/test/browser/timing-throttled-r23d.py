#!/usr/bin/env python3
"""Optional R23d headless 4x CPU-throttled synthetic Canvas evidence.

Requires a separately installed, local Playwright and Chromium. No npm dependency,
photo, external network request, API credential or publication is required.
This is a browser approximation; it is not a three-year-old phone.
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import re
import threading
from pathlib import Path
from typing import Any

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Serve the already-built static folder without collecting visit logs."""

    def log_message(self, format_string: str, *args: object) -> None:
        return


def blocked_navigation_fallback(page: Any, dist: Path) -> dict[str, Any]:
    """Measure the exact compiled Canvas drawing function on about:blank.

    The sandbox blocks local HTTP/file URLs. This fallback still uses Chromium,
    the same built synthetic raster function and CDP CPU slowdown. It cannot
    inspect the deployed page or complete the keyboard navigation pass.
    """
    source = (dist / "js/diagnostics/timing-sampler.js").read_text(encoding="utf-8")
    match = re.search(r"export function drawTimingScene\([\s\S]*?\n}\n", source)
    if match is None:
        raise RuntimeError("Could not locate the built synthetic Canvas renderer")
    function_source = match.group(0).replace("export function", "function", 1)
    expression = """() => {
    %s
    const workloads = [[512, 640, 'preview'], [3000, 4000, 'full']];
    const output = { preview: [], full: [] };
    const canvas = document.createElement('canvas');
    for (const [width, height, category] of workloads) {
      for (let index = 0; index < 7; index += 1) {
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', {alpha: false});
        if (!context) throw new Error('Canvas unavailable');
        const before = performance.now();
        drawTimingScene(context, { width, height }, index);
        context.getImageData(0, 0, 1, 1);
        output[category].push(performance.now() - before);
      }
    }
    canvas.width = 0;
    canvas.height = 0;
    return output;
    }""" % function_source
    samples = page.evaluate(expression)

    def measure(values: list[float]) -> tuple[float, float]:
        ordered = sorted(values)
        return round(ordered[len(ordered) // 2], 2), round(ordered[-1], 2)

    preview_median, preview_p95 = measure(samples["preview"])
    full_median, full_p95 = measure(samples["full"])
    return {
        "type": "R23d built Canvas reference; browser page navigation blocked",
        "cpuThrottle": "4x CDP slowdown",
        "previewMedianMs": preview_median,
        "previewP95Ms": preview_p95,
        "full12MpMedianMs": full_median,
        "full12MpP95Ms": full_p95,
        "previewSamples": len(samples["preview"]),
        "fullSamples": len(samples["full"]),
        "keyboardHomeJudge": "UNVERIFIED (sandbox navigation blocked)",
        "outsideRequests": 0,
        "limitations": [
            "Synthetic pixels only; not a true phone, live editor, encoded export or 4G test",
            "Compiled drawTimingScene exercised in headless Chromium at 4x CPU throttle",
            "Pages navigation and keyboard-only browser acceptance not verified in this sandbox",
        ],
    }


def run(dist: Path, executable: str | None = None) -> dict[str, Any]:
    """Run real Chromium Canvas timing on synthetic pixels at 4x CPU slowdown."""
    if not (dist / "_headers").is_file() or not (dist / "home.html").is_file():
        raise RuntimeError("Run npm run build before the headless measurement")
    handler = functools.partial(QuietHandler, directory=str(dist))
    with http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        port = int(server.server_address[1])
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            with sync_playwright() as playwright:
                launch: dict[str, Any] = {"headless": True, "args": ["--no-sandbox"]}
                if executable:
                    launch["executable_path"] = executable
                browser = playwright.chromium.launch(**launch)
                try:
                    context = browser.new_context(
                        viewport={"width": 390, "height": 844},
                        device_scale_factor=1,
                        service_workers="block",
                    )
                    page = context.new_page()
                    errors: list[str] = []
                    outside: list[str] = []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda request: outside.append(request.url)
                            if not request.url.startswith(f"http://127.0.0.1:{port}/") else None)
                    cdp = context.new_cdp_session(page)
                    cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
                    try:
                        page.goto(
                            f"http://127.0.0.1:{port}/home.html?mode=testing&headless_cpu=4#timing",
                            wait_until="load",
                            timeout=30000,
                        )
                    except PlaywrightError as error:
                        if "ERR_BLOCKED_BY_ADMINISTRATOR" not in str(error):
                            raise
                        fallback = context.new_page()
                        fallback_cdp = context.new_cdp_session(fallback)
                        fallback_cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
                        return blocked_navigation_fallback(fallback, dist)
                    page.locator("#lg-timing-run").click(timeout=15000)
                    page.wait_for_function(
                        "document.querySelector('#lg-timing-json')?.textContent?.includes('beljour-device-timing/1')",
                        timeout=120000,
                    )
                    data = json.loads(page.locator("#lg-timing-json").text_content())
                    assert data["environment"] == "headless-cpu-throttled", data
                    assert data["cpuThrottleFactor"] == 4, data
                    assert data["source"] == "synthetic-canvas", data
                    assert len(data["limitations"]) >= 3
                    assert not errors, errors
                    assert not outside, outside
                    # Keyboard-only navigation on an actual narrow viewport.
                    page.goto(f"http://127.0.0.1:{port}/home.html", wait_until="load")
                    page.locator('a[href="#lg-main"]').focus()
                    page.keyboard.press("Enter")
                    assert page.evaluate("location.hash") == "#lg-main"
                    page.locator("#lg-judge-launch").focus()
                    page.keyboard.press("Enter")
                    page.locator("#lg-judge-title").wait_for(timeout=15000)
                    assert "Step 1" in page.locator("#lg-judge-root").inner_text()
                    page.keyboard.press("Escape")
                    assert page.locator("#lg-judge-root").is_hidden()
                    assert not errors, errors
                    return {
                        "type": "R23d browser rehearsal (not phone certification)",
                        "cpuThrottle": "4x CDP slowdown",
                        "viewport": "390x844",
                        "previewMedianMs": data["preview"]["medianMs"],
                        "previewP95Ms": data["preview"]["p95Ms"],
                        "full12MpMedianMs": data["full"]["medianMs"],
                        "full12MpP95Ms": data["full"]["p95Ms"],
                        "previewSamples": data["preview"]["count"],
                        "fullSamples": data["full"]["count"],
                        "keyboardHomeJudge": "passed",
                        "pageErrors": len(errors),
                        "outsideRequests": len(outside),
                        "limitations": data["limitations"],
                    }
                finally:
                    browser.close()
        finally:
            server.shutdown()
            worker.join(timeout=5)


def main() -> None:
    parser = argparse.ArgumentParser(description="Synthetic Canvas device timing on 4x throttled Chromium")
    parser.add_argument("--dist", type=Path, default=Path(__file__).resolve().parents[2] / "dist")
    parser.add_argument("--chromium", type=str, default=None)
    args = parser.parse_args()
    print(json.dumps(run(args.dist.resolve(), args.chromium), indent=2))


if __name__ == "__main__":
    main()
