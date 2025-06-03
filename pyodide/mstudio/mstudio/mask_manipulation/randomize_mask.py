import numpy as np


def randomize_mask(current_mask: np.ndarray) -> np.ndarray:
    """Randomly flips pixels of current mask to transparent"""
    assert len(current_mask.shape) == 3 # WxHxC
    assert current_mask.shape[2] == 4 # RGBA
    
    stencil = np.random.rand(current_mask.shape[0], current_mask.shape[1]) > 0.5
    out_mask = current_mask.copy()
    out_mask[stencil,:] = 0 # set transparent black

    return out_mask


# python3 -m mstudio.mask_manipulation.randomize_mask
# print(randomize_mask(np.ones(dtype=np.uint8, shape=(8, 8, 4))))
