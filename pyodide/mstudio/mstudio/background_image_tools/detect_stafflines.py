import numpy as np
import cv2


def detect_stafflines(region: np.ndarray) -> np.ndarray:
    """Detects stafflines in the given region of the background image"""
    assert len(region.shape) == 3 # WxHxC
    assert region.shape[2] == 4 # RGBA

    # get lightness of the original image
    image_hls = cv2.cvtColor(region, cv2.COLOR_RGB2HLS)
    lightness = image_hls[:,:,1]
    img = lightness

    # https://docs.opencv.org/3.4/db/df6/tutorial_erosion_dilatation.html

    # crunch away at black areas to get rid of them
    img = cv2.dilate(img, cv2.getStructuringElement(cv2.MORPH_RECT, (50, 1)))

    # grow black regions back to match line length to the original
    img = cv2.erode(img, cv2.getStructuringElement(cv2.MORPH_RECT, (50, 1)))

    # https://docs.opencv.org/4.x/d7/d4d/tutorial_py_thresholding.html
    # https://docs.opencv.org/4.x/d7/d1b/group__imgproc__misc.html#ga72b913f352e4a1b1b397736707afcde3
    img = cv2.adaptiveThreshold(
        img, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY,
        101, # threshold estimation region size (block size)
        10 # C (how much is subtracted from the mean to get the threshold)
    )

    # convert black regions (the ink) to white
    img = 255 - img

    # b/w to red+alpha mask
    out_region = np.zeros_like(region)
    out_region[:, :, 0] = img # red
    out_region[:, :, 3] = img # alpha

    return out_region
