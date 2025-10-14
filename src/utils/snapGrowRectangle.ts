/**
 * Returns a copy of the rectangle with its size "ceiled" to the integer grid.
 * That is, it grows so that it has integer position and size.
 */
export function snapGrowRectangle(r: DOMRect): DOMRect {
  const top = Math.floor(r.top);
  const bottom = Math.ceil(r.bottom);
  const left = Math.floor(r.left);
  const right = Math.ceil(r.right);

  return new DOMRect(left, top, right - left, bottom - top);
}
