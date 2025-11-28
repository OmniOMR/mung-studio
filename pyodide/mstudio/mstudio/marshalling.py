import numpy as np
from typing import Any

JsProxy = Any # hack


#############
# Mask RGBA #
#############

def marshal_mask_rgba(mask: np.ndarray) -> tuple[int, int, np.ndarray]:
    """Prepare a mask to be sent back to javascript"""
    assert mask.dtype == np.uint8 # bytes
    assert len(mask.shape) == 3 # HxWxC
    assert mask.shape[2] == 4 # RGBA

    return (mask.shape[1], mask.shape[0], mask.flatten())

def unmarshal_mask_rgba(
        marshalled_mask: tuple[int, int, JsProxy]
) -> np.ndarray:
    """Receive a mask sent from javascript"""
    width, height, data = marshalled_mask

    mask = np.asarray(data.to_py(), dtype=np.uint8).reshape((height, width, 4))
    
    assert mask.dtype == np.uint8 # bytes
    assert len(mask.shape) == 3 # HxWxC
    assert mask.shape[2] == 4 # RGBA

    return mask
