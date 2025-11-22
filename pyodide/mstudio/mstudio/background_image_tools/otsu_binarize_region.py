import numpy as np
import cv2


def otsu_binarize_region(region: np.ndarray) -> np.ndarray:
    """Applies otsu binarization to the given region of background image"""
    assert len(region.shape) == 3 # WxHxC
    assert region.shape[2] == 4 # RGBA

    # get lightness of the original image
    image_hls = cv2.cvtColor(region, cv2.COLOR_RGB2HLS)
    lightness = image_hls[:,:,1]

    # apply Otsu binarization (blur creates two distinc modalities - ink&paper
    # and Otsu finds the midpoint between the two to use as the threshold)
    # also, use bilateral filter blur to preserve edges instead of gaussian
    blurred_lightness = cv2.bilateralFilter(lightness, 5, 25, 25)
    found_threshold, binarized = cv2.threshold(
        blurred_lightness, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    # convert black regions (the ink) to white
    binarized = 255 - binarized

    # b/w to red+alpha mask
    out_region = np.zeros_like(region)
    out_region[:, :, 0] = binarized # red
    out_region[:, :, 3] = binarized # alpha

    return out_region
