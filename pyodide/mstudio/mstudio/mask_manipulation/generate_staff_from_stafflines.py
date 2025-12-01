from mung.node import Node
import numpy as np
import cv2


def generate_staff_from_stafflines(stafflines: list[Node]) -> Node:
    assert len(stafflines) == 5
    
    stafflines.sort(key=lambda line: line.top)
    top_line = stafflines[0]
    bottom_line = stafflines[-1]
    
    top_points = get_scene_points_for_line(top_line)
    bottom_points = get_scene_points_for_line(bottom_line)
    all_points = top_points + list(reversed(bottom_points))

    top = min(y for x, y in all_points)
    bottom = max(y for x, y in all_points)
    left = min(x for x, y in all_points)
    right = max(x for x, y in all_points)
    width = right - left
    height = bottom - top
    assert width > 0
    assert height > 0

    mask = np.zeros(shape=(height, width), dtype=np.uint8)
    all_local_points = [(x - left, y - top) for x, y in all_points]
    cv2.fillPoly(mask, [np.array(all_local_points, dtype=np.int32)], 1)

    return Node(
        id_=0, # not used anyways
        class_name="staff",
        top=top,
        left=left,
        width=width,
        height=height,
        mask=mask,
    )


def get_scene_points_for_line(line: Node) -> list[tuple[int, int]]:
    points: list[tuple[int, int]] = []
    for i in range(0, line.mask.shape[1]):
        pegs = get_column_pegs(line.mask[:, i] > 0)
        if len(pegs) == 1:
            points.append((int(line.left + i), int(line.top + pegs[0])))
    return points


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

