'Texture-aware lipstick finish models for W55. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .shaders import add_gloss, blend_colour, matte, stain_asymmetry


@dataclass(frozen=True)
class Finish:
    name: str
    opacity: float
    gloss: float
    matte_amount: float
    stain_asymmetry: bool
    texture_floor: float

FINISHES = {'matte': Finish('matte', 0.76, 0.0, 0.9, False, 0.92), 'satin': Finish('satin', 0.7, 0.3, 0.28, False, 0.94), 'gloss': Finish('gloss', 0.58, 0.9, 0.0, False, 0.95), 'stain': Finish('stain', 0.52, 0.02, 0.0, True, 0.98)}

def finish(name: str) -> Finish:
    try:
        return FINISHES[name]
    except KeyError as exc:
        raise ValueError('unknown lipstick finish') from exc

def apply(image: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int], name: str, amount: float, two_tone_balance: float=0.5) -> tuple[np.ndarray, np.ndarray, dict[str, float | str]]:
    cfg = finish(name)
    active = mask
    if cfg.stain_asymmetry:
        active = stain_asymmetry(mask, two_tone_balance)
    out = blend_colour(image, active, colour, cfg.opacity * amount, cfg.texture_floor)
    if cfg.matte_amount:
        out = matte(out, active, cfg.matte_amount * amount)
    if cfg.gloss:
        out = add_gloss(out, active, cfg.gloss * amount)
    return (out, active, {'finish': cfg.name, 'opacity': cfg.opacity, 'gloss': cfg.gloss, 'matte_amount': cfg.matte_amount, 'texture_floor': cfg.texture_floor})

def line_energy(image: np.ndarray, mask: np.ndarray) -> float:
    """Gradient energy inside the lip support; useful for guarding against blur."""
    rgb = image[..., :3].astype(np.float64).mean(axis=2)
    gx = np.diff(rgb, axis=1, prepend=rgb[:, :1])
    gy = np.diff(rgb, axis=0, prepend=rgb[:1, :])
    energy = np.hypot(gx, gy)
    inside = mask > 0.1
    return float(np.mean(energy[inside])) if np.any(inside) else 0.0

def texture_retention(original: np.ndarray, result: np.ndarray, mask: np.ndarray) -> float:
    inside = mask > 0.1
    if np.count_nonzero(inside) < 8:
        return 1.0
    a = original[..., :3].astype(np.float64)[inside].mean(axis=1)
    b = result[..., :3].astype(np.float64)[inside].mean(axis=1)
    if np.std(a) < 1e-08 or np.std(b) < 1e-08:
        return 1.0
    return float(np.corrcoef(a, b)[0, 1])

def compare_finishes(image: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int], amount: float, two_tone_balance: float=0.5) -> dict[str, dict[str, float]]:
    rows: dict[str, dict[str, float]] = {}
    for name in FINISHES:
        rendered, active, _ = apply(image, mask, colour, name, amount, two_tone_balance)
        rows[name] = {'texture_retention': texture_retention(image, rendered, active), 'line_energy': line_energy(rendered, active), 'changed_fraction': float(np.mean(np.any(rendered[..., :3] != image[..., :3], axis=2)))}
    return rows
