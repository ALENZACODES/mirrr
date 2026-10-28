"""Optimisers, clipping, EMA and schedules checked against hand-computed updates.

Each expected value below is written out from the published update rule for
one or two steps on scalar or tiny vector parameters. Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
import pytest

from lab.ml.train import schedules as S
from lab.ml.train.modules import Linear, Parameter
from lab.ml.train.optim import (
    EMA,
    SGD,
    Adam,
    AdamW,
    build_optimizer,
    clip_grad_norm,
    global_grad_norm,
)


def _param(value: float | list[float]) -> Parameter:
    return Parameter(np.atleast_1d(np.array(value, dtype=np.float64)))


def _step(opt: SGD | Adam, p: Parameter, grad: float | list[float]) -> None:
    p.grad = np.atleast_1d(np.array(grad, dtype=np.float64))
    opt.step()


def test_plain_sgd() -> None:
    p = _param(1.0)
    opt = SGD([p], lr=0.1)
    _step(opt, p, 2.0)
    assert p.data[0] == pytest.approx(0.8)


def test_sgd_momentum_two_steps() -> None:
    p = _param(1.0)
    opt = SGD([p], lr=0.1, momentum=0.9)
    _step(opt, p, 1.0)  # buf = 1.0, p = 0.9
    _step(opt, p, 1.0)  # buf = 0.9 + 1.0 = 1.9, p = 0.9 - 0.19
    assert p.data[0] == pytest.approx(0.71)


def test_sgd_nesterov_two_steps() -> None:
    p = _param(1.0)
    opt = SGD([p], lr=0.1, momentum=0.9, nesterov=True)
    _step(opt, p, 1.0)  # buf = 1, g = 1 + 0.9 = 1.9, p = 0.81
    assert p.data[0] == pytest.approx(0.81)
    _step(opt, p, 1.0)  # buf = 1.9, g = 1 + 1.71 = 2.71, p = 0.81 - 0.271
    assert p.data[0] == pytest.approx(0.539)


def test_sgd_weight_decay_and_dampening() -> None:
    p = _param(2.0)
    opt = SGD([p], lr=0.5, weight_decay=0.1)
    _step(opt, p, 0.0)  # g = 0.2, p = 1.9
    assert p.data[0] == pytest.approx(1.9)
    q = _param(0.0)
    damp = SGD([q], lr=1.0, momentum=0.5, dampening=0.5)
    _step(damp, q, 1.0)  # buf = 1
    _step(damp, q, 1.0)  # buf = 0.5 + 0.5 = 1.0
    assert q.data[0] == pytest.approx(-2.0)
    with pytest.raises(ValueError, match="Nesterov"):
        SGD([q], lr=1.0, nesterov=True)


def test_adam_first_two_steps() -> None:
    p = _param(1.0)
    opt = Adam([p], lr=0.1, betas=(0.9, 0.999), eps=1e-8)
    _step(opt, p, 0.5)
    # Bias-corrected first step is lr * g / |g| = 0.1.
    assert p.data[0] == pytest.approx(0.9, abs=1e-7)
    _step(opt, p, -1.0)
    m = 0.9 * 0.05 + 0.1 * -1.0
    v = 0.999 * 0.00025 + 0.001 * 1.0
    first = 1.0 - 0.1 * 0.5 / (0.5 + 1e-8)
    expected = first - 0.1 * (m / (1 - 0.81)) / (math.sqrt(v / (1 - 0.999 ** 2)) + 1e-8)
    assert p.data[0] == pytest.approx(expected, rel=1e-9)


def test_adam_l2_versus_adamw_decoupled() -> None:
    p = _param(1.0)
    Adam_ = Adam([p], lr=0.1, weight_decay=0.5)
    _step(Adam_, p, 0.0)  # g = 0.5 -> normalised step of 0.1
    assert p.data[0] == pytest.approx(0.9, abs=1e-7)
    q = _param(1.0)
    w = AdamW([q], lr=0.1, weight_decay=0.5)
    _step(w, q, 0.0)  # decay: 1 - 0.05 = 0.95, then zero gradient leaves it
    assert q.data[0] == pytest.approx(0.95)
    with pytest.raises(ValueError, match="betas"):
        Adam([q], betas=(1.0, 0.9))


def test_optimizer_skips_missing_and_frozen_gradients() -> None:
    a, b = _param(1.0), _param(1.0)
    b.requires_grad = False
    opt = SGD([a, b], lr=1.0)
    b.grad = np.array([5.0])
    opt.step()
    assert a.data[0] == 1.0 and b.data[0] == 1.0
    opt.zero_grad()
    assert a.grad is None and b.grad is None


def test_optimizer_validation() -> None:
    with pytest.raises(ValueError, match="non-negative"):
        SGD([_param(1.0)], lr=-1.0)
    with pytest.raises(ValueError, match="empty"):
        SGD([], lr=1.0)
    with pytest.raises(ValueError, match="unknown optimizer"):
        build_optimizer("lion", [_param(1.0)], 0.1)
    assert isinstance(build_optimizer("adamw", [_param(1.0)], 0.1), AdamW)
    assert isinstance(build_optimizer("adam", [_param(1.0)], 0.1), Adam)
    assert isinstance(build_optimizer("sgd", [_param(1.0)], 0.1, nesterov=True), SGD)


@pytest.mark.parametrize("name", ["sgd", "adam", "adamw"])
def test_optimizer_state_round_trip_continues_identically(name: str) -> None:
    grads = [[0.3, -0.2], [0.1, 0.4], [-0.5, 0.2], [0.2, 0.2]]
    p1 = _param([1.0, -1.0])
    o1 = build_optimizer(name, [p1], 0.05, momentum=0.9)
    for g in grads:
        _step(o1, p1, g)  # type: ignore[arg-type]
    p2 = _param([1.0, -1.0])
    o2 = build_optimizer(name, [p2], 0.05, momentum=0.9)
    for g in grads[:2]:
        _step(o2, p2, g)  # type: ignore[arg-type]
    saved_state = o2.state_dict()
    saved_param = p2.data.copy()
    p3 = Parameter(saved_param)
    o3 = build_optimizer(name, [p3], 0.05, momentum=0.9)
    o3.load_state_dict(saved_state)
    assert o3.steps == 2
    for g in grads[2:]:
        _step(o3, p3, g)  # type: ignore[arg-type]
    np.testing.assert_array_equal(p1.data, p3.data)


def test_optimizer_state_load_rejects_mismatch() -> None:
    p = _param([1.0, 2.0])
    opt = SGD([p], lr=0.1, momentum=0.9)
    _step(opt, p, [1.0, 1.0])
    state = opt.state_dict()
    small = SGD([_param(1.0)], lr=0.1, momentum=0.9)
    with pytest.raises(ValueError, match="shape"):
        small.load_state_dict(state)
    state["state.5.momentum"] = np.zeros(2)
    with pytest.raises(ValueError, match="only 1 parameters"):
        SGD([_param([0.0, 0.0])], lr=0.1).load_state_dict(state)


def test_clip_grad_norm() -> None:
    a, b = _param([3.0]), _param([4.0])
    a.grad = np.array([3.0])
    b.grad = np.array([4.0])
    before = clip_grad_norm([a, b], 1.0)
    assert before == pytest.approx(5.0)
    assert global_grad_norm([a, b]) == pytest.approx(1.0, rel=1e-5)
    assert clip_grad_norm([a, b], 10.0) == pytest.approx(1.0, rel=1e-5)
    a.grad = np.array([np.nan])
    assert math.isnan(clip_grad_norm([a, b], 1.0))
    with pytest.raises(ValueError, match="max_norm"):
        clip_grad_norm([a], 0.0)


def test_ema_hand_computed_and_swap() -> None:
    layer = Linear(1, 1, np.random.default_rng(0), bias=False, dtype=np.float64)
    layer.weight.data[...] = 1.0
    ema = EMA(layer, decay=0.5)
    layer.weight.data[...] = 3.0
    ema.update()  # 0.5 * 1 + 0.5 * 3 = 2
    layer.weight.data[...] = 4.0
    ema.update()  # 0.5 * 2 + 0.5 * 4 = 3
    assert ema.shadow["weight"][0, 0] == pytest.approx(3.0)
    with ema.swapped() as averaged:
        assert averaged.parameters()[0].data[0, 0] == pytest.approx(3.0)
    assert layer.weight.data[0, 0] == 4.0
    other = Linear(1, 1, np.random.default_rng(1), bias=False)
    ema.copy_to(other)
    assert other.weight.data[0, 0] == pytest.approx(3.0)
    restored = EMA(layer, decay=0.5)
    restored.load_state_dict(ema.state_dict())
    assert restored.updates == 2 and restored.shadow["weight"][0, 0] == pytest.approx(3.0)
    with pytest.raises(KeyError, match="unknown parameter"):
        restored.load_state_dict({"updates": np.array(1), "shadow.nope": np.zeros(1)})
    with pytest.raises(ValueError, match="decay"):
        EMA(layer, decay=1.0)


def test_ema_warmup_decay() -> None:
    layer = Linear(1, 1, np.random.default_rng(0))
    ema = EMA(layer, decay=0.999, warmup=True)
    assert ema.current_decay() == pytest.approx(0.1)
    ema.update()
    assert ema.current_decay() == pytest.approx(2.0 / 11.0)


def test_cosine_with_warmup_values() -> None:
    sched = S.CosineWithWarmup(base_lr=1.0, total_steps=10, warmup_steps=2, min_lr=0.1)
    assert sched(0) == pytest.approx(0.5)
    assert sched(1) == pytest.approx(1.0)
    assert sched(2) == pytest.approx(1.0)
    assert sched(6) == pytest.approx(0.1 + 0.45 * (1 + math.cos(math.pi * 0.5)))
    assert sched(10) == pytest.approx(0.1)
    assert sched(50) == pytest.approx(0.1)
    assert S.CosineWithWarmup(1.0, 4, 4)(4) == 0.0
    for bad in ({"total_steps": 0}, {"warmup_steps": 20}, {"min_lr": 5.0}):
        args = {"base_lr": 1.0, "total_steps": 10, "warmup_steps": 0, "min_lr": 0.0} | bad
        with pytest.raises(ValueError):
            S.CosineWithWarmup(**args)


def test_step_multistep_exponential_constant() -> None:
    assert [S.StepDecay(1.0, 2, 0.5)(i) for i in range(5)] == [1.0, 1.0, 0.5, 0.5, 0.25]
    with pytest.raises(ValueError, match="step_size"):
        S.StepDecay(1.0, 0)
    ms = S.MultiStep(1.0, (2, 4), 0.1)
    assert [ms(i) for i in (0, 2, 3, 4)] == pytest.approx([1.0, 0.1, 0.1, 0.01])
    ex = S.Exponential(1e-4, 1.0, 5)
    assert ex(0) == pytest.approx(1e-4) and ex(4) == pytest.approx(1.0)
    assert ex(2) == pytest.approx(1e-2)
    assert S.Exponential(0.1, 1.0, 1)(3) == 0.1
    assert S.Constant(0.3)(99) == 0.3


def test_scheduler_drives_optimizer_and_resumes() -> None:
    p = _param(1.0)
    opt = SGD([p], lr=123.0)
    sched = S.Scheduler(opt, S.StepDecay(1.0, 1, 0.5))
    assert opt.lr == 1.0
    sched.step()
    sched.step()
    assert sched.lr == pytest.approx(0.25)
    other = S.Scheduler(SGD([p], lr=1.0), S.StepDecay(1.0, 1, 0.5))
    other.load_state_dict(sched.state_dict())
    assert other.count == 2 and other.lr == pytest.approx(0.25)


def test_build_schedule() -> None:
    assert isinstance(S.build_schedule("constant", 0.1, 10), S.Constant)
    assert isinstance(S.build_schedule("cosine", 0.1, 10, 2), S.CosineWithWarmup)
    assert isinstance(S.build_schedule("step", 0.1, 10, step_size=3), S.StepDecay)
    assert S.build_schedule("multistep", 1.0, 10, milestones=[1])(1) == pytest.approx(0.1)
    with pytest.raises(ValueError, match="unknown schedule"):
        S.build_schedule("cyclic", 0.1, 10)
