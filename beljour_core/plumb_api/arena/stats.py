"""Win rates and Elo with confidence intervals.

* Win rate: share of judgements won, with a Wilson score interval.
* Elo: a Bradley-Terry fit over all judgements of a filter (or slice), fitted by Hunter's
  minorisation-maximisation updates, put on the Elo scale (400 points = 10x odds) and
  anchored so the untouched original sits at 1000 when it took part (else the mean is 1000).
  Unlike running Elo updates, the fit does not depend on judging order.
* Intervals: a cluster bootstrap that resamples faces (all judgements of a face together),
  because judgements of the same face are not independent. Seeded, so reports reproduce.
A small prior (one virtual draw against an average player) keeps a slot with no wins or no
losses finite. Author: John Khan.
"""
from __future__ import annotations

import math
import random
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass

ELO_SCALE = 400.0 / math.log(10.0)
ANCHOR = 1000.0
PRIOR = 0.5  # virtual wins and losses against the average player


@dataclass(frozen=True)
class Rate:
    wins: int
    n: int
    low: float
    high: float

    @property
    def rate(self) -> float | None:
        return self.wins / self.n if self.n else None


def wilson(wins: int, n: int, z: float = 1.96) -> Rate:
    if n <= 0:
        return Rate(0, 0, 0.0, 1.0)
    p = wins / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return Rate(wins, n, max(0.0, centre - half), min(1.0, centre + half))


Game = tuple[str, str]  # (winner, loser)


def bradley_terry(games: Sequence[Game], *, iterations: int = 500, tol: float = 1e-10) -> dict[str, float]:
    """Strengths from (winner, loser) games. The virtual draws are against a fixed player of
    strength 1, which also pins the scale, so no renormalisation is needed."""
    players = sorted({p for g in games for p in g})
    if not players:
        return {}
    wins = {p: PRIOR for p in players}
    pair_n: dict[tuple[str, str], float] = {}
    for winner, loser in games:
        wins[winner] += 1
        key = (winner, loser) if winner < loser else (loser, winner)
        pair_n[key] = pair_n.get(key, 0.0) + 1
    strength = {p: 1.0 for p in players}
    for _ in range(iterations):
        new = {}
        for p in players:
            denom = 2 * PRIOR / (strength[p] + 1.0)  # virtual games against strength 1
            for (x, y), n in pair_n.items():
                if p == x:
                    denom += n / (strength[x] + strength[y])
                elif p == y:
                    denom += n / (strength[x] + strength[y])
            new[p] = wins[p] / denom if denom > 0 else strength[p]
        delta = max(abs(math.log(new[p]) - math.log(strength[p])) for p in players)
        strength = new
        if delta < tol:
            break
    return strength


def elo(strength: Mapping[str, float], anchor: str | None = "original") -> dict[str, float]:
    if not strength:
        return {}
    logs = {p: ELO_SCALE * math.log(s) for p, s in strength.items()}
    base = logs[anchor] if anchor in logs else sum(logs.values()) / len(logs)
    return {p: ANCHOR + v - base for p, v in logs.items()}


@dataclass(frozen=True)
class EloResult:
    rating: Mapping[str, float]
    low: Mapping[str, float]
    high: Mapping[str, float]
    games: int


def elo_with_ci(games_by_face: Mapping[str, Sequence[Game]], *, reps: int = 400, seed: int = 7,
                anchor: str | None = "original", level: float = 0.95) -> EloResult:
    """Elo per slot with a face-cluster bootstrap interval."""
    games = [g for gs in games_by_face.values() for g in gs]
    rating = elo(bradley_terry(games), anchor)
    if not rating:
        return EloResult({}, {}, {}, 0)
    faces = sorted(games_by_face)
    rng = random.Random(seed)
    draws: dict[str, list[float]] = {p: [] for p in rating}
    for _ in range(reps):
        sample = [g for _ in faces for g in games_by_face[faces[rng.randrange(len(faces))]]]
        boot = elo(bradley_terry(sample), anchor)
        for p in rating:
            if p in boot:
                draws[p].append(boot[p])
    lo_q, hi_q = (1 - level) / 2, 1 - (1 - level) / 2
    low = {p: _quantile(v, lo_q) if v else rating[p] for p, v in draws.items()}
    high = {p: _quantile(v, hi_q) if v else rating[p] for p, v in draws.items()}
    return EloResult(rating, low, high, len(games))


def _quantile(values: Sequence[float], q: float) -> float:
    s = sorted(values)
    pos = q * (len(s) - 1)
    i = int(math.floor(pos))
    j = min(i + 1, len(s) - 1)
    return s[i] + (s[j] - s[i]) * (pos - i)


def head_to_head(games: Iterable[Game], a: str, b: str) -> Rate:
    """How often `a` beat `b` in games between exactly those two."""
    wins = n = 0
    for winner, loser in games:
        if {winner, loser} == {a, b}:
            n += 1
            wins += winner == a
    return wilson(wins, n)


def expected_score(elo_a: float, elo_b: float) -> float:
    return 1.0 / (1.0 + 10 ** ((elo_b - elo_a) / 400.0))


def mean(values: Sequence[float]) -> float | None:
    return sum(values) / len(values) if values else None
