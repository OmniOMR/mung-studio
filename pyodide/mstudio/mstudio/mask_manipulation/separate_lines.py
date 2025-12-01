import numpy as np
import cv2


def separate_lines(
        left: int,
        top: int,
        width: int,
        height: int,
        mask: np.ndarray,
        cut_lines: list[list[tuple[int, int]]]
) -> list[tuple[int, int, int, int, np.ndarray]]:
    """Slices a mask into sub-masks for individual stafflines using given cuts"""
    assert len(mask.shape) == 3 # WxHxC
    assert mask.shape[2] == 4 # RGBA

    # add the leading and trailing cut lines
    cut_lines.insert(0, [(0, 0), (width, 0)])
    cut_lines.append([(0, height), (width, height)])

    # go in pairs of cut lines and slice out the mask
    return [
        slice_out_a_mask(
            left=left,
            top=top,
            width=width,
            height=height,
            original_mask=mask,
            cut_polygon=a + list(reversed(b))
        )
        for a, b in zip(cut_lines, cut_lines[1:])
    ]


def slice_out_a_mask(
        left: int,
        top: int,
        width: int,
        height: int,
        original_mask: np.ndarray,
        cut_polygon: list[tuple[int, int]],
) -> tuple[int, int, int, int, np.ndarray]:
    cut_stencil = np.zeros(shape=(height, width), dtype=np.uint8)
    cv2.fillPoly(cut_stencil, [np.array(cut_polygon, dtype=np.int32)], 1)

    cut_mask = original_mask * cut_stencil[:, :, np.newaxis]
    
    return clamp_mask_to_content(left, top, cut_mask)


def clamp_mask_to_content(
        left: int,
        top: int,
        mask: np.ndarray,
) -> tuple[int, int, int, int, np.ndarray]:
    def get_bounds(counts: np.ndarray) -> tuple[int, int]:
        lower = 0
        for i in range(0, len(counts)):
            if counts[i] > 0:
                lower = i
                break
        upper = len(counts)
        for i in range(len(counts), 0, -1):
            if counts[i - 1] > 0:
                upper = i
                break
        
        if lower >= upper:
            print("WARNING: Clamping mask to content failed")
            return 0, len(counts)
        
        return lower, upper

    binary_alpha = mask[:, :, 3] > 0
    y1, y2 = get_bounds(binary_alpha.sum(axis=1))
    x1, x2 = get_bounds(binary_alpha.sum(axis=0))
    
    m = mask[y1:y2, x1:x2, :]

    return (
        left + x1,
        top + y1,
        m.shape[1],
        m.shape[0],
        m,
    )
