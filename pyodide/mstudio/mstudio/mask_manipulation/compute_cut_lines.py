import numpy as np
from collections import Counter


def compute_cut_lines(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    """Computes cut lines for slicing stafflines into separate objects"""
    assert len(mask.shape) == 3 # WxHxC
    assert mask.shape[2] == 4 # RGBA

    STRIDE = 10
    cut_size_counter: Counter[int] = Counter()

    # get cuts every N pixels
    column_cuts: list[tuple[int, list[float]]] = []
    for i in range(0, mask.shape[1], STRIDE):
        cuts = get_column_cuts(mask[:, i, 3] > 0)
        if len(cuts) > 0:
            column_cuts.append((i, cuts))
            cut_size_counter.update({
                len(cuts): 1
            })
    
    target_cut_count = cut_size_counter.most_common(1)[0][0]
    column_cuts = [c for c in column_cuts if len(c[1]) == target_cut_count]

    if len(column_cuts) == 0:
        return []

    # add leading cut
    if column_cuts[0][0] != 0:
        column_cuts.insert(
            0,
            (0, column_cuts[0][1])
        )
    
    # add trailing cut
    if column_cuts[-1][0] != mask.shape[1] - 1:
        column_cuts.append(
            (mask.shape[1] - 1, column_cuts[-1][1])
        )
    
    # column cuts to cut lines
    cut_lines: list[list[tuple[int, int]]] = [
        [] for i in range(target_cut_count)
    ]
    for cut in column_cuts:
        for i in range(target_cut_count):
            cut_lines[i].append(
                (cut[0], int(cut[1][i]))
            )

    return cut_lines


def get_column_cuts(column: np.ndarray) -> list[float]:
    pegs = get_column_pegs(column)
    cuts = [(a + b) / 2 for a, b in zip(pegs, pegs[1:])]
    return cuts


def get_column_pegs(column: np.ndarray) -> list[float]:
    ups = []
    downs = []
    is_down = True

    for i, pixel in enumerate(column):
        if pixel and is_down:
            ups.append(i)
            is_down = False
        elif not pixel and not is_down:
            downs.append(i)
            is_down = True
    
    if not is_down:
        downs.append(len(column))
    
    assert len(ups) == len(downs)

    pegs = [(u + d) / 2 for u, d in zip(ups, downs)]
    
    return pegs
