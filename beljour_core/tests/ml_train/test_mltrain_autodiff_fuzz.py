"""Random expression graphs: every seeded graph must pass the gradient check.

Graphs reuse intermediate nodes (so gradients fan in), mix broadcasting shapes and
chain smooth ops; inputs are kept in ranges where each op is differentiable.
Author: John Khan.
"""

from __future__ import annotations

import random
from collections.abc import Callable

import numpy as np
import pytest

from lab.ml.train import functional as F
from lab.ml.train import tensor as T
from lab.ml.train.gradcheck import gradcheck
from lab.ml.train.tensor import Tensor

UNARY: list[Callable[[Tensor], Tensor]] = [
    T.tanh,
    T.sigmoid,
    T.gelu,
    lambda x: T.exp(x * 0.3),
    lambda x: T.log(x * x + 1.0),
    lambda x: T.sqrt(x * x + 0.5),
    lambda x: F.softmax(x, axis=-1),
    lambda x: F.log_softmax(x, axis=0),
    lambda x: F.layer_norm(x, axes=1),
    lambda x: x.mean(axis=-1, keepdims=True) * x,
    lambda x: x.T.T,
]
BINARY: list[Callable[[Tensor, Tensor], Tensor]] = [
    T.add,
    T.sub,
    T.mul,
    lambda a, b: a / (b * b + 1.0),
    lambda a, b: a @ b.T,
    lambda a, b: T.concat([a, b], axis=1)[:, ::2],
]


def _random_graph(seed: int) -> tuple[Callable[[Tensor, Tensor], Tensor], int]:
    rng = random.Random(seed)
    plan = [(rng.random() < 0.5, rng.randrange(100), rng.randrange(100), rng.randrange(100))
            for _ in range(rng.randint(3, 7))]

    def graph(a: Tensor, b: Tensor) -> Tensor:
        nodes = [a, b, a * 0.5 + 1.0]
        for unary, i, j, k in plan:
            x = nodes[i % len(nodes)]
            if unary:
                out = UNARY[k % len(UNARY)](x)
            else:
                y = nodes[j % len(nodes)]
                out = BINARY[k % len(BINARY)](x, y)
                if out.shape != a.shape:
                    out = out.sum(axis=1, keepdims=True) + x
            nodes.append(out)
        return nodes[-1] + nodes[-2] * 0.5

    return graph, len(plan)


@pytest.mark.parametrize("seed", range(40))
def test_random_graphs_pass_gradcheck(seed: int) -> None:
    graph, _ = _random_graph(seed)
    rng = np.random.default_rng(seed)
    a = Tensor(rng.uniform(-1.0, 1.0, (3, 3)), requires_grad=True, dtype=np.float64)
    b = Tensor(rng.uniform(-1.0, 1.0, (3, 3)), requires_grad=True, dtype=np.float64)
    result = gradcheck(graph, [a, b], atol=1e-5, rtol=1e-3)
    assert result.ok, f"seed {seed}: {result.describe()}"


def test_graphs_are_reproducible_per_seed() -> None:
    first, size = _random_graph(3)
    second, size_again = _random_graph(3)
    a = Tensor(np.full((3, 3), 0.25), dtype=np.float64)
    b = Tensor(np.full((3, 3), -0.5), dtype=np.float64)
    assert size == size_again
    np.testing.assert_array_equal(first(a, b).data, second(a, b).data)
