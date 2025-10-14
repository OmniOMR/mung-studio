/**
 * Given two rectangles returns their union.
 */
export function unionRectangles(a: DOMRect, b: DOMRect): DOMRect {
  const left = Math.min(a.left, b.left);
  const right = Math.max(a.right, b.right);
  const width = Math.max(0, right - left);

  const top = Math.min(a.top, b.top);
  const bottom = Math.max(a.bottom, b.bottom);
  const height = Math.max(0, bottom - top);

  return new DOMRect(left, top, width, height);
}
