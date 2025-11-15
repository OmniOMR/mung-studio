/**
 * Given two rectangles returns their intersection.
 * If the intersection is empty, the returned rectangle as zero dimensions.
 */
export function intersectRectangles(a: DOMRect, b: DOMRect): DOMRect {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const width = Math.max(0, right - left);

  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  const height = Math.max(0, bottom - top);

  return new DOMRect(left, top, width, height);
}
