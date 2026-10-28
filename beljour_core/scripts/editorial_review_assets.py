"""Write the Lane D editorial review assets in web/public/editorial-review/ from the runtime code.

The three house drawings (portrait, figure, trust) and the empty Proof Wall sample are the
exact SVG strings the web code produces (houseArtMarkup and proofGraphicSvg in the built
web/dist), so the tests that compare them with the runtime artwork hold by construction.
The two PNGs are rasterised here from those same SVG strings with Pillow: a contact sheet of
the three drawings side by side, and the Proof Wall sample. The rasteriser handles only the
SVG subset these files use (rect; paths with absolute M, L, H, V, Q, C, Z; text with x, y,
fill, font-size and letter-spacing) and refuses anything else. Text uses Pillow's bundled
default font, so no font file is added; the PNGs are review previews, not the artwork itself.

These are review assets only: they are not copied into the deployed build or cached by the
service worker (web/scripts/copy-static.mjs and build-offline.mjs never name the folder).
Needs a built web/dist (cd web && npx tsc -p tsconfig.json).
Usage (repo root): python3 api/scripts/editorial_review_assets.py [--check]
Author: John Khan.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "web" / "public" / "editorial-review"
DIST = ROOT / "web" / "dist" / "js" / "layout" / "editorial"
KINDS = ("portrait", "figure", "trust")
EMPTY_PROOF = {"drawnLoaded": False, "subjectChosen": False, "localPermission": False, "editCount": 0,
               "requestedDownload": False, "mockTryon": False, "cacheFrames": 0}
SUPERSAMPLE = 4
SHEET_MARGIN = 24
CURVE_STEPS = 24


def runtime_svgs() -> dict[str, str]:
    """The SVG strings from the built web code, keyed by file stem."""
    script = (
        f"import {{ houseArtMarkup }} from {json.dumps((DIST / 'house-art.js').as_uri())};\n"
        f"import {{ proofGraphicSvg }} from {json.dumps((DIST / 'proof-graphic.js').as_uri())};\n"
        f"const out = Object.fromEntries({json.dumps(list(KINDS))}.map((k) => [k, houseArtMarkup(k)]));\n"
        f"out['proof-wall-sample'] = proofGraphicSvg({json.dumps(EMPTY_PROOF)});\n"
        "process.stdout.write(JSON.stringify(out));\n")
    done = subprocess.run(["node", "--input-type=module", "-e", script], capture_output=True, text=True, check=False)
    if done.returncode != 0:
        raise SystemExit(f"could not read the runtime artwork from web/dist (build the web code first):\n{done.stderr}")
    return dict(json.loads(done.stdout))


def _attrs(tag: str) -> dict[str, str]:
    return {k: html.unescape(v) for k, v in re.findall(r'([a-zA-Z:-]+)="([^"]*)"', tag)}


def _colour(value: str, opacity: float = 1.0) -> tuple[int, int, int, int] | None:
    if value in ("", "none"):
        return None
    if not re.fullmatch(r"#[0-9A-Fa-f]{6}", value):
        raise ValueError(f"unsupported colour {value!r}")
    return int(value[1:3], 16), int(value[3:5], 16), int(value[5:7], 16), round(255 * opacity)


def _subpaths(d: str) -> list[tuple[list[tuple[float, float]], bool]]:
    """Flatten a path of absolute M, L, H, V, Q, C and Z commands into polylines."""
    tokens = re.findall(r"[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?", d)
    out: list[tuple[list[tuple[float, float]], bool]] = []
    points: list[tuple[float, float]] = []
    x = y = 0.0
    i, command = 0, ""

    def take(n: int) -> list[float]:
        nonlocal i
        values = [float(t) for t in tokens[i:i + n]]
        if len(values) != n:
            raise ValueError(f"truncated path data in {d!r}")
        i += n
        return values

    while i < len(tokens):
        if tokens[i].isalpha():
            command = tokens[i]
            i += 1
            if command not in "MLHVQCZ":
                raise ValueError(f"unsupported path command {command!r}")
            if command == "Z":
                if points:
                    out.append((points, True))
                    x, y = points[0]
                points = []
                continue
        if command == "M":
            if points:
                out.append((points, False))
            x, y = take(2)
            points = [(x, y)]
            command = "L"
        elif command == "L":
            x, y = take(2)
            points.append((x, y))
        elif command == "H":
            (x,) = take(1)
            points.append((x, y))
        elif command == "V":
            (y,) = take(1)
            points.append((x, y))
        elif command in "QC":
            ctrl = take(4 if command == "Q" else 6)
            x0, y0 = x, y
            for k in range(1, CURVE_STEPS + 1):
                t, s = k / CURVE_STEPS, 1 - k / CURVE_STEPS
                if command == "Q":
                    px = s * s * x0 + 2 * s * t * ctrl[0] + t * t * ctrl[2]
                    py = s * s * y0 + 2 * s * t * ctrl[1] + t * t * ctrl[3]
                else:
                    px = s ** 3 * x0 + 3 * s * s * t * ctrl[0] + 3 * s * t * t * ctrl[2] + t ** 3 * ctrl[4]
                    py = s ** 3 * y0 + 3 * s * s * t * ctrl[1] + 3 * s * t * t * ctrl[3] + t ** 3 * ctrl[5]
                points.append((px, py))
            x, y = ctrl[-2], ctrl[-1]
        else:
            raise ValueError(f"path data must start with M in {d!r}")
    if points:
        out.append((points, False))
    return out


def rasterise(svg: str, scale: float = 1.0) -> Image.Image:
    """Render the supported SVG subset; anything else raises instead of being skipped."""
    root = re.match(r"<svg ([^>]*)>", svg)
    if not root:
        raise ValueError("not an SVG document")
    view = [float(v) for v in _attrs(root.group(1))["viewBox"].split()]
    k = scale * SUPERSAMPLE
    size = (round(view[2] * k), round(view[3] * k))
    canvas = Image.new("RGBA", size, (255, 255, 255, 255))
    for tag in re.findall(r"<(rect|path|text)\b([^>]*?)/?>(?:([^<]*)</text>)?", svg):
        name, raw, content = tag
        a = _attrs(raw)
        layer = Image.new("RGBA", size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        if name == "rect":
            fill = _colour(a.get("fill", "#000000"))
            if fill:
                draw.rectangle((float(a.get("x", 0)) * k, float(a.get("y", 0)) * k,
                                (float(a.get("x", 0)) + float(a["width"])) * k,
                                (float(a.get("y", 0)) + float(a["height"])) * k), fill=fill)
        elif name == "path":
            fill = _colour(a.get("fill", "#000000"), float(a.get("fill-opacity", 1)))
            stroke = _colour(a.get("stroke", "none"))
            width = float(a.get("stroke-width", 1)) * k
            for points, _closed in _subpaths(a["d"]):
                scaled = [(px * k, py * k) for px, py in points]
                if fill and len(scaled) >= 3:
                    draw.polygon(scaled, fill=fill)
                if stroke:
                    draw.line(scaled, fill=stroke, width=max(1, round(width)), joint="curve")
                    r = width / 2
                    for px, py in (scaled[0], scaled[-1]):
                        draw.ellipse((px - r, py - r, px + r, py + r), fill=stroke)
        else:
            fill = _colour(a.get("fill", "#000000"))
            font = ImageFont.load_default(float(a["font-size"]) * k)
            spacing = float(a.get("letter-spacing", 0)) * k
            cx, cy = float(a["x"]) * k, float(a["y"]) * k
            for ch in html.unescape(content):
                draw.text((cx, cy), ch, font=font, fill=fill, anchor="ls")
                cx += font.getlength(ch) + spacing
        canvas = Image.alpha_composite(canvas, layer)
    out = canvas.convert("RGB")
    return out.resize((round(view[2] * scale), round(view[3] * scale)), Image.Resampling.LANCZOS)


def contact_sheet(svgs: dict[str, str]) -> Image.Image:
    tiles = [rasterise(svgs[kind]) for kind in KINDS]
    w, h = tiles[0].size
    sheet = Image.new("RGB", (len(tiles) * w + (len(tiles) + 1) * SHEET_MARGIN, h + 2 * SHEET_MARGIN), (236, 236, 242))
    for index, tile in enumerate(tiles):
        sheet.paste(tile, (SHEET_MARGIN + index * (w + SHEET_MARGIN), SHEET_MARGIN))
    return sheet


def outputs() -> dict[str, bytes | Image.Image]:
    svgs = runtime_svgs()
    files: dict[str, bytes | Image.Image] = {f"{stem}.svg": text.encode("utf-8") for stem, text in svgs.items()}
    files["contact-sheet.png"] = contact_sheet(svgs)
    files["proof-wall-sample.png"] = rasterise(svgs["proof-wall-sample"], 0.5)
    return files


def main() -> int:
    ap = argparse.ArgumentParser(description="editorial review assets")
    ap.add_argument("--check", action="store_true", help="SVGs must match byte for byte; PNGs must exist at their sizes")
    args = ap.parse_args()
    files = outputs()
    problems: list[str] = []
    for name, value in files.items():
        path = OUT / name
        if args.check:
            if not path.is_file():
                problems.append(f"{name} is missing")
            elif isinstance(value, bytes) and path.read_bytes() != value:
                problems.append(f"{name} differs from the runtime artwork")
            elif isinstance(value, Image.Image):
                with Image.open(path) as found:
                    if found.size != value.size:
                        problems.append(f"{name} is {found.size}, expected {value.size}")
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(value, bytes):
            path.write_bytes(value)
        else:
            value.save(path, optimize=True)
    for line in problems:
        print("FAIL", line)
    print(f"editorial review assets: {len(files)} files, {'checked' if args.check else 'written'}, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
