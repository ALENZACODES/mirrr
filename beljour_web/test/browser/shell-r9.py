"""R9 studio check in a real browser: every compare mode at 390 px and 1280 px, consent, keyboard,
phone tabs, demo tour and the live accessibility audit.

Not part of `npm test` (Playwright is not a repo dependency). Run it on a machine that has the
Python Playwright package and a Chromium, against a served build:

    cd web && npm run build && (cd dist && python3 -m http.server 8765 &)
    python3 test/browser/shell-r9.py --url http://127.0.0.1:8765/studio.html --out /tmp/r9-shots

It fails on: a console error, any request that leaves the local origin, horizontal page scroll,
a compare canvas wider than the window, a mode that doesn't paint, a dialog that leaks focus,
or an audit issue. Screenshots of every mode at both widths go to --out.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
import zlib
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

MODES = ["hold", "split-vertical", "split-horizontal", "split-diagonal", "side-by-side",
         "grid-2x2", "stop-grid", "flicker", "loupe", "difference"]
VIEWPORTS = [(390, 844), (1280, 800)]


def png(width: int, height: int) -> bytes:
    """A small drawn test image (gradient with a disc), no person in it."""
    rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            inside = (x - width / 2) ** 2 + (y - height / 2) ** 2 < (min(width, height) / 3) ** 2
            row += bytes([(x * 255) // width, 180 if inside else (y * 255) // height, 120])
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


def wait_painted(page, mode: str) -> None:
    page.wait_for_function(
        """(mode) => { const s = document.getElementById('shell-stage');
             return s.dataset.compare === mode && !s.hasAttribute('aria-busy'); }""", arg=mode, timeout=120_000)


def run(url: str, out: Path) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    origin = urlparse(url).netloc
    report: dict = {"url": url, "viewports": {}, "problems": []}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width, height in VIEWPORTS:
            tag = f"{width}x{height}"
            ctx = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1,
                                      reduced_motion="no-preference")
            page = ctx.new_page()
            errors: list[str] = []
            outside: list[str] = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("request", lambda r: outside.append(r.url) if urlparse(r.url).netloc not in (origin, "") and not r.url.startswith("data:") else None)
            page.goto(url)
            page.wait_for_selector("#shell-compare-modes [role=radio]")
            rows = {}
            page.evaluate("document.querySelector('#shell-sample').value = 'portrait'")
            page.click("#shell-load-sample")
            page.click("#shell-apply") if width > 660 else None
            if width <= 660:
                page.click("#shell-tab-edit")
                page.click("#shell-apply")
            for mode in MODES:
                page.click(f"[data-mode='{mode}']")
                wait_painted(page, mode)
                box = page.eval_on_selector("#shell-canvas", "c => { const r = c.getBoundingClientRect(); return {x: r.x, w: r.width, h: r.height, cw: c.width}; }")
                scroll = page.evaluate("document.documentElement.scrollWidth")
                rows[mode] = {"canvas_css_width": round(box["w"]), "canvas_left": round(box["x"]), "page_scroll_width": scroll}
                if box["x"] < -0.5 or box["x"] + box["w"] > width + 0.5:
                    report["problems"].append(f"{tag} {mode}: canvas spans {box['x']:.0f}..{box['x'] + box['w']:.0f} in a {width} px window")
                if scroll > width:
                    report["problems"].append(f"{tag} {mode}: page scrolls sideways ({scroll} px)")
                if box["w"] < 50:
                    report["problems"].append(f"{tag} {mode}: canvas too small ({box['w']:.0f} px)")
                page.screenshot(path=str(out / f"{tag}-{mode}.png"), full_page=False)
            # Keyboard: digits pick modes, arrows move the split line.
            page.click("body", position={"x": 2, "y": 300})
            page.keyboard.press("2")
            wait_painted(page, "split-vertical")
            page.focus("#shell-canvas")
            before = page.inner_text("#shell-measure")
            page.keyboard.press("ArrowRight")
            after = page.inner_text("#shell-measure")
            if before == after:
                report["problems"].append(f"{tag}: ArrowRight on the stage didn't move the split line")
            # Consent dialog: focus moves in, Escape closes, focus returns.
            if width <= 660:
                page.click("#shell-tab-edit")
            page.click("#shell-upload")
            page.wait_for_selector("#shell-consent:not([hidden])")
            inside = page.evaluate("document.getElementById('shell-consent').contains(document.activeElement)")
            if not inside:
                report["problems"].append(f"{tag}: focus did not move into the consent dialog")
            for _ in range(8):
                page.keyboard.press("Tab")
            if not page.evaluate("document.getElementById('shell-consent').contains(document.activeElement)"):
                report["problems"].append(f"{tag}: Tab left the consent dialog")
            page.keyboard.press("Escape")
            page.wait_for_selector("#shell-consent", state="hidden")
            if page.evaluate("document.activeElement && document.activeElement.id") != "shell-upload":
                report["problems"].append(f"{tag}: focus did not return to Open a photo")
            page.click("#shell-upload")
            page.click("#shell-consent-accept")
            if not page.inner_text("#shell-consent-error"):
                report["problems"].append(f"{tag}: consent accepted without the boxes ticked")
            page.check("#shell-consent-adult")
            page.check("#shell-consent-understood")
            with page.expect_file_chooser() as chooser:
                page.click("#shell-consent-accept")
            chooser.value.set_files(files=[{"name": "drawn.png", "mimeType": "image/png", "buffer": png(320, 240)}])
            page.wait_for_function("""() => document.getElementById('shell-source-name').textContent === 'Photo on this device'
                && document.getElementById('shell-precheck').dataset.verdict !== 'pending'""", timeout=60_000)
            rows["precheck"] = page.inner_text("#shell-precheck-summary")
            # Phone tabs show one panel at a time.
            if width <= 660:
                page.click("#shell-tab-layers")
                vis = page.evaluate("""() => ['tools','edit','layers','history'].map(id => {
                    const el = document.getElementById('shell-panel-' + id); return getComputedStyle(el).display !== 'none'; })""")
                rows["tabs_visible_after_layers"] = vis
                if vis != [False, False, True, False]:
                    report["problems"].append(f"{tag}: Layers tab shows panels {vis}")
            # Demo tour: ten scenes.
            if width <= 660:
                page.click("#shell-tab-edit")
            page.click("#shell-demo")
            page.wait_for_function("document.getElementById('shell-demo-label').textContent.startsWith('Scene 1 of 10')")
            for _ in range(3):
                page.click("#shell-demo-next")
            rows["demo"] = page.inner_text("#shell-demo-label")
            page.screenshot(path=str(out / f"{tag}-demo.png"))
            report["viewports"][tag] = rows
            if errors:
                report["problems"].append(f"{tag}: console errors {errors[:5]}")
            if outside:
                report["problems"].append(f"{tag}: requests left the origin {outside[:5]}")
            ctx.close()
        # Live accessibility audit after the views have built their controls.
        for width, height in VIEWPORTS:
            ctx = browser.new_context(viewport={"width": width, "height": height})
            page = ctx.new_page()
            warnings: list[str] = []
            page.on("console", lambda m: warnings.append(m.text) if m.type == "warning" else None)
            # Audit a populated page: two layers, so layer rows, settings and the strip exist.
            page.goto(url + ("&" if "?" in url else "?") + "audit=1#demo=stack-grid")
            page.wait_for_function("document.documentElement.dataset.audit !== undefined", timeout=60_000)
            count = int(page.evaluate("document.documentElement.dataset.audit"))
            report["viewports"][f"{width}x{height}"]["audit_issues"] = count
            if count:
                report["problems"].append(f"{width}x{height}: audit found {count}: {[w for w in warnings if '[audit]' in w][:6]}")
            ctx.close()
        # On-device only: the styling hand-off offers no way out to the provider.
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        page.goto(url)
        page.wait_for_selector("#shell-local-only")
        page.check("#shell-local-only")
        page.click("[data-tool='makeup']")
        page.click("#shell-guidance button")
        page.wait_for_selector("#shell-provider:not([hidden])")
        report["local_only_link_hidden"] = page.eval_on_selector("#shell-provider-continue", "a => a.hidden")
        if not report["local_only_link_hidden"]:
            report["problems"].append("on-device only: the styling link is still offered")
        ctx.close()
        # Reduced motion: flicker must not autoplay.
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
        page = ctx.new_page()
        page.goto(url)
        page.wait_for_selector("[data-mode='flicker']")
        page.click("[data-mode='flicker']")
        disabled = page.eval_on_selector("[data-control='play']", "b => b.disabled")
        report["reduced_motion_play_disabled"] = disabled
        if not disabled:
            report["problems"].append("reduced motion: flicker Play is enabled")
        ctx.close()
        browser.close()
    return report


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:8765/studio.html")
    ap.add_argument("--out", type=Path, default=Path("r9-browser"))
    args = ap.parse_args()
    report = run(args.url, args.out)
    print(json.dumps(report, indent=2))
    return 1 if report["problems"] else 0


if __name__ == "__main__":
    sys.exit(main())
