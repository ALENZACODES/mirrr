"""Data loading, augmentation, licence gate and drawn fixtures in lab.ml.train.

All images are drawn in code by lab.ml.train.fixtures. Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.train import data as D
from lab.ml.train import fixtures as FX


def _dataset(n: int = 10) -> D.ArrayDataset:
    x = np.arange(n * 2, dtype=np.float32).reshape(n, 2)
    y = np.arange(n, dtype=np.int64)
    return D.ArrayDataset([x, y], licence=D.synthetic_licence("unit test rows"))


def test_licence_gate_refuses_missing_and_bad_records() -> None:
    bare = D.ArrayDataset([np.zeros((4, 2))])
    with pytest.raises(D.LicenceError, match="no licence record"):
        D.DataLoader(bare, 2)
    bare.licence = D.LicenceRecord("scraped pages", "CC-BY-NC-4.0", commercial_use=False)
    with pytest.raises(D.LicenceError, match="allow list") as info:
        D.DataLoader(bare, 2)
    assert "not marked for commercial use" in str(info.value)
    bare.licence = D.LicenceRecord(" ", "MIT", commercial_use=True)
    with pytest.raises(D.LicenceError, match="empty source"):
        D.require_licence(bare)

    class Odd:
        licence = {"source": "x"}

    with pytest.raises(D.LicenceError, match="must be a LicenceRecord"):
        D.require_licence(Odd())


def test_licence_record_round_trip_and_validation() -> None:
    record = D.LicenceRecord("drawn", "CC0-1.0", True, url="local", attribution="John Khan")
    assert D.LicenceRecord.from_dict(record.to_dict()) == record
    with pytest.raises(D.LicenceError, match="missing fields"):
        D.LicenceRecord.from_dict({"source": "a"})
    with pytest.raises(D.LicenceError, match="true or false"):
        D.LicenceRecord.from_dict({"source": "a", "licence_id": "MIT", "commercial_use": "yes"})
    assert D.synthetic_licence("x").problems() == []


def test_dataloader_batches_and_drop_last() -> None:
    ds = _dataset(10)
    loader = D.DataLoader(ds, 4, shuffle=False)
    sizes = [len(b[0]) for b in loader]
    assert sizes == [4, 4, 2] and len(loader) == 3
    dropped = D.DataLoader(ds, 4, shuffle=False, drop_last=True)
    assert [len(b[0]) for b in dropped] == [4, 4] and len(dropped) == 2
    with pytest.raises(ValueError, match="no batches"):
        D.DataLoader(_dataset(3), 4, drop_last=True)
    with pytest.raises(ValueError, match="batch_size"):
        D.DataLoader(ds, 0)


def test_shuffle_is_seeded_per_epoch_and_covers_all_items() -> None:
    ds = _dataset(12)
    a = D.DataLoader(ds, 5, seed=3)
    b = D.DataLoader(ds, 5, seed=3)
    first_a = np.concatenate([batch[1] for batch in a])
    first_b = np.concatenate([batch[1] for batch in b])
    np.testing.assert_array_equal(first_a, first_b)
    assert sorted(first_a.tolist()) == list(range(12))
    second_a = np.concatenate([batch[1] for batch in a])
    assert a.epoch == 2
    assert not np.array_equal(first_a, second_a)
    other = np.concatenate([batch[1] for batch in D.DataLoader(ds, 5, seed=4)])
    assert not np.array_equal(first_a, other)


def test_batch_rebuild_is_exact_for_resume() -> None:
    ds = _dataset(9)
    loader = D.DataLoader(ds, 2, seed=1, augment=D.NoisePairs(0.5))
    full = list(loader.iter_epoch(3))
    resumed = list(loader.iter_epoch(3, start=2))
    assert [i for i, _ in resumed] == [2, 3, 4]
    for (i, batch), (j, again) in zip(full[2:], resumed, strict=True):
        assert i == j
        for left, right in zip(batch, again, strict=True):
            np.testing.assert_array_equal(left, right)
    with pytest.raises(IndexError):
        loader.batch(0, 99)


def test_dataset_without_take_uses_collate() -> None:
    class Rows:
        licence = D.synthetic_licence("rows")

        def __len__(self) -> int:
            return 5

        def __getitem__(self, index: int) -> tuple[np.ndarray, ...]:
            return (np.full(2, index, dtype=np.float32),)

    rows = Rows()
    assert isinstance(rows, D.Dataset)
    batches = list(D.DataLoader(rows, 2, shuffle=False))
    np.testing.assert_array_equal(batches[0][0], [[0, 0], [1, 1]])


def test_subset_and_split() -> None:
    ds = _dataset(10)
    train, val = D.split(ds, 0.8, seed=2)
    assert len(train) == 8 and len(val) == 2
    assert train.licence == ds.licence
    seen = sorted([int(train[i][1]) for i in range(8)] + [int(val[i][1]) for i in range(2)])
    assert seen == list(range(10))
    with pytest.raises(ValueError, match="fraction"):
        D.split(ds, 1.0)
    with pytest.raises(ValueError, match="different lengths"):
        D.ArrayDataset([np.zeros(3), np.zeros(4)])
    with pytest.raises(ValueError, match="at least one"):
        D.ArrayDataset([])


def test_augmentations_are_deterministic_per_generator() -> None:
    images = FX.portraits(4, size=16, seed=5)
    aug = D.build_augment(["crop", "flip", "noise"], sigma=0.2, padding=2)
    assert aug is not None
    one = aug((images,), np.random.default_rng(7))
    two = aug((images,), np.random.default_rng(7))
    assert len(one) == 2
    for left, right in zip(one, two, strict=True):
        np.testing.assert_array_equal(left, right)
    assert one[0].shape == images.shape
    assert float(one[0].min()) >= 0.0 and float(one[0].max()) <= 1.0
    assert D.build_augment([]) is None
    with pytest.raises(ValueError, match="unknown augmentation"):
        D.build_augment(["rotate"])
    with pytest.raises(ValueError, match="sigma"):
        D.NoisePairs(-1.0)


def test_paired_flip_keeps_pairs_aligned() -> None:
    clean = FX.portraits(6, size=8, seed=1)
    noisy = clean + 0.0
    out_noisy, out_clean = D.RandomFlip(p=0.5, paired=True)((noisy, clean),
                                                           np.random.default_rng(0))
    np.testing.assert_array_equal(out_noisy, out_clean)
    flipped = D.RandomFlip(p=1.0)((clean,), np.random.default_rng(0))[0]
    np.testing.assert_array_equal(flipped, clean[..., ::-1])


def test_shape_fixtures() -> None:
    images, labels = FX.shapes_dataset(12, size=24, seed=3)
    assert images.shape == (12, 3, 24, 24) and images.dtype == np.float32
    assert labels.shape == (12,) and set(labels.tolist()) <= {0, 1, 2, 3}
    assert float(images.min()) >= 0.0 and float(images.max()) <= 1.0
    again, _ = FX.shapes_dataset(12, size=24, seed=3)
    np.testing.assert_array_equal(images, again)
    for kind in FX.SHAPES:
        mask = FX.shape_mask(kind, 32, 0.5, 0.5, 0.3)
        assert 0 < int(mask.sum()) < 32 * 32
    with pytest.raises(ValueError, match="unknown shape"):
        FX.shape_mask("star", 8, 0.5, 0.5, 0.2)


def test_portrait_fixtures_have_structure() -> None:
    faces = FX.portraits(3, size=32, seed=9)
    assert faces.shape == (3, 3, 32, 32)
    assert not np.array_equal(faces[0], faces[1])
    centre = faces[:, :, 12:20, 12:20].std()
    assert float(centre) > 0.01
    noisy = FX.add_noise(faces, 0.1, seed=1)
    assert noisy.shape == faces.shape and float(np.abs(noisy - faces).mean()) > 0.01


def test_regression_problem_is_linear() -> None:
    x, y = FX.regression_problem(50, features=3, outputs=2, seed=4)
    design = np.hstack([x, np.ones((50, 1), dtype=np.float32)])
    coef, residual, *_ = np.linalg.lstsq(design, y, rcond=None)
    assert coef.shape == (4, 2)
    np.testing.assert_allclose(design @ coef, y, atol=1e-4)
