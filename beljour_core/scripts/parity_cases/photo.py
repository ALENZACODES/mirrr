#!/usr/bin/env python3
"""R7 golden vectors: LS4-LS7 spike engines and the MI-GAN wrapper rules in two runtimes.

Everything is drawn or synthetic (figures, crowns, scenes, faces); images are sampled on a
stride so the file stays small. web/test/parity-r7.test.mjs recomputes every vector in
TypeScript and compares within 1/255 (bytes within one level; counts exactly, fibre
counts within one strand). --check recomputes in Python and refuses drift.
Face-mapping inspiration: MediaPipe Face Landmarker (mesh indices, runtime data) and
face-parsing.PyTorch (named regions); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from plumb_api.engines.beard import strands as beard  # noqa: E402
from plumb_api.engines.beard import synthetic as beard_synth
from plumb_api.engines.concealer import crown, shades  # noqa: E402
from plumb_api.engines.concealer import strands as fibre
from plumb_api.engines.concealer import synthetic as crown_synth
from plumb_api.engines.core.masks import ellipse  # noqa: E402
from plumb_api.engines.fill import learned  # noqa: E402
from plumb_api.engines.posture import fixes  # noqa: E402
from plumb_api.engines.posture import synthetic as figures
from plumb_api.engines.posture.render import approximate_person  # noqa: E402
from plumb_api.engines.posture.render import render as posture_render
from plumb_api.engines.repair import analyse as an  # noqa: E402
from plumb_api.engines.repair import denoise as dn
from plumb_api.engines.repair import restore
from plumb_api.engines.repair import synthetic as rs

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "parity/spikes-r7.json"
STRIDE = 7


def sample(image: np.ndarray, stride: int = STRIDE) -> list[int]:
    arr = np.asarray(image)
    flat = arr.reshape(-1) if arr.ndim == 2 else arr[..., :3].reshape(-1)
    return [int(v) for v in flat[::stride]]


def sample_mask(mask: np.ndarray, stride: int = STRIDE) -> list[float]:
    return [round(float(v), 6) for v in np.asarray(mask, dtype=np.float64).reshape(-1)[::stride]]


def r(v: float, n: int = 8) -> float:
    return round(float(v), n)


def posture_vectors() -> list[dict]:
    out = []
    for k, fig in enumerate(figures.cases()):
        plans = {}
        for fix, stops in fixes.plans_for(fig.controls).items():
            plans[fix] = {stop: {"after": {n: [r(v) for v in p.after.points[n]] for n in p.moves},
                                 "measure_before": r(p.measure_before), "measure_after": r(p.measure_after),
                                 "cap_scale": r(p.cap_scale)} for stop, p in stops.items()}
        out.append({"case": k, "params": fig.params, "image": sample(fig.image, 41), "person": sample_mask(fig.person, 37),
                    "approximate_person": sample_mask(approximate_person(fig.controls), 37), "plans": plans})
    fig = figures.front_figure(width=96, height=120, lean=5.0, shoulder_drop=3.0, seed=2)
    p = fixes.plan(fig.controls, "lean", "full")
    rendered = posture_render(fig.image, fig.person, p, fill="biharmonic")
    out.append({"case": "render", "params": fig.params, "fix": "lean", "stop": "full", "fill": "biharmonic",
                "strength_used": r(rendered.strength_used), "strip_pixels": rendered.metrics["strip_pixels"],
                "output": sample(rendered.image, 13)})
    return out


def fibre_vectors() -> dict:
    c = crown_synth.crown(160, 160, seed=4)
    h, w = c.image.shape[:2]
    cx, cy, rx, ry = c.thin
    region = ellipse(h, w, cx * w, cy * h, rx * w * 1.1, ry * h * 1.1)
    reading = crown.read(c.image, region)
    hair = shades.hair_colour(c.image, reading.split.hair)
    card = shades.shade_card(hair)
    renders = {}
    for product, level in (("fibres", "medium"), ("fibres", "full"), ("spray", "light"), ("powder", "medium")):
        o = fibre.render(c.image, region, reading.split.scalp, (22.0, 4.0, 6.0), amount=level, product=product)
        renders[f"{product}:{level}"] = {"fibres_used": o.metrics["fibres_used"], "covered_px": o.metrics["covered_px"],
                                         "target_px": o.metrics["target_px"], "fibre_lab": o.metrics["fibre_lab"],
                                         "output": sample(o.image, 23)}
    rng = fibre.XorShift32(5)
    seeds = fibre.poisson_seeds(c.scalp, np.ones((h, w)), 2.0, 40, rng)
    return {"size": [w, h], "seed": 4, "image": sample(c.image, 31), "scalp_share": r(float(c.scalp.mean())),
            "zones": [z.to_json() for z in reading.zones], "hair_lab": [r(v, 6) for v in hair],
            "card_top": [{"id": t["id"], "delta_e": r(t["delta_e"], 6)} for t in shades.match(hair)],
            "mix": None if card["mix"] is None else {k: card["mix"][k] for k in ("first", "second", "second_share")},
            "renders": renders, "seeds": [list(s) for s in seeds]}


def enhance_vectors() -> dict:
    clean = rs.scene(96, 80)
    noisy = rs.add_noise(clean, 12.0, 3)
    out = {"scene": sample(clean, 13), "noisy": sample(noisy, 13), "analysis": {}, "denoise": {}}
    cases = {"noisy": noisy, "blur": rs.blur(clean, 1.5), "motion": rs.motion_blur(clean, 7, 1),
             "block": rs.blocking(clean, 8.0), "cast": rs.cast(clean, (1.2, 1.0, 0.8)), "dark": rs.low_light(clean, 0.3)}
    for name, img in cases.items():
        a = an.analyse(img).to_json()
        out["analysis"][name] = {k: a[k] for k in ("noise_sigma", "laplacian_variance", "blur_sigma", "motion_coherence",
                                                  "blur_type", "blockiness", "mean_luminance", "grey_gains")}
    sigma = an.noise_sigma(an.luma255(noisy))
    for method in ("guided", "bilateral", "nlm"):
        img, _ = dn.denoise(noisy, sigma, method=method)
        out["denoise"][method] = sample(img, 13)
    e = restore.enhance(noisy, "natural")
    out["enhance"] = {"steps": e.steps, "output": sample(e.image, 13)}
    out["unsharp"] = sample(restore.unsharp(rs.blur(clean, 1.5), 1.5, 1.0), 13)
    out["psnr"] = r(rs.psnr(clean, noisy), 6)
    return out


def beard_vectors() -> dict:
    pts = beard_synth.face_points(180, 200)
    img = beard_synth.face_photo(pts, 180, 200, 3)
    styles = {}
    for style in beard.STYLES:
        o = beard.render(img, pts, style=style, density=3, colour=beard_synth.HAIR_LAB, neckline="low")
        styles[style] = {"strands": o.metrics["strands"], "area_px": o.metrics["area_px"],
                         "strand_lab": o.metrics["strand_lab"], "output": sample(o.image, 23)}
    return {"size": [180, 200], "points_probe": [[r(v) for v in pts[i]] for i in (0, 61, 152, 234, 291, 454, 468)],
            "photo": sample(img, 29), "styles": styles}


def migan_vectors() -> dict:
    holes = []
    for (w, h, cx, cy, rx, ry) in ((200, 150, 60, 40, 10, 6), (64, 56, 30, 25, 6, 6), (300, 400, 290, 395, 20, 12)):
        m = ellipse(h, w, cx, cy, rx, ry)
        box = learned.crop_box(m)
        holes.append({"size": [w, h], "ellipse": [cx, cy, rx, ry], "hole_box": learned.hole_box(m).to_json(),
                      "crop": box.to_json()})
    yy, xx = np.mgrid[0:30, 0:40]
    crop = np.stack([(xx * 6) % 256, (yy * 8) % 256, (xx + yy) * 3 % 256], -1).astype(np.uint8)
    hole = ((xx - 20) ** 2 + (yy - 15) ** 2 <= 36).astype(np.uint8)
    gen = learned.build_feeds(crop, hole, "generator-512")["input"]
    pipe = learned.build_feeds(crop, hole, "pipeline-uint8")
    tensor = (np.sin(np.arange(3 * 512 * 512) / 997.0).astype(np.float32).reshape(1, 3, 512, 512))
    decoded = learned.decode_output(tensor, "generator-512", 40, 30)
    return {"holes": holes, "generator_sum": r(float(gen.astype(np.float64).sum()), 4),
            "generator_probe": [r(float(v), 6) for v in gen.reshape(-1)[::40000]],
            "pipeline_image_probe": [int(v) for v in pipe["image"].reshape(-1)[::97]],
            "pipeline_mask_sum": int(pipe["mask"].astype(np.int64).sum()), "decoded": sample(decoded, 7)}


def build() -> dict:
    return {"format": "beljour-r7-parity/1", "author": "John Khan", "synthetic_only": True, "stride": STRIDE,
            "posture": posture_vectors(), "fibre": fibre_vectors(), "enhance": enhance_vectors(),
            "beard": beard_vectors(), "migan": migan_vectors()}
