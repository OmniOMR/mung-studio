/**
 * Converts class name to a hue value
 */
export function classNameToHue(className: string): number {
  let hash = 0,
    i,
    chr;
  if (className.length === 0) return hash;
  for (i = 0; i < className.length; i++) {
    chr = className.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash % 360;
}
