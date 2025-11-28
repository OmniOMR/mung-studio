///////////////
// Mask RGBA //
///////////////

/**
 * Prepare a mask to be sent to python
 */
export function marshalMaskRgb(
  mask: ImageData,
): [number, number, Uint8ClampedArray] {
  return [mask.width, mask.height, mask.data];
}

/**
 * Receive a mask sent back from python
 */
export function unmarshalMaskRgb(
  marshalledMask: [number, number, Uint8ClampedArray],
): ImageData {
  const [width, height, data] = marshalledMask;
  return new ImageData(new Uint8ClampedArray(data.buffer), width, height);
}
