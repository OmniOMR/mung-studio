import { Node } from "./Node";

/**
 * Returns the MuNG node's polygon as an SVG path command (the "d" attribute)
 */
export function svgPathFromMungPolygon(node: Node): string {
  if (node.polygon === null) {
    throw Error("Given node must have a polygon");
  }

  const parts: string[] = [];
  const polygon: number[] = node.polygon;

  // move to starting point
  parts.push("M");

  // automaton state machine
  let on_x: boolean = true;

  for (let i = 0; i < polygon.length; i++) {
    if (on_x) {
      parts.push(String(polygon[i]));
      on_x = false;
    } else {
      parts.push(String(polygon[i]));
      on_x = true;
      
      // line to the next point
      parts.push("L");
    }
  }

  // check there was even number of coordinates
  if (!on_x) {
    throw new Error("Polygon had an odd number of coordinates");
  }

  // check that we ended with an "L"
  if (parts[parts.length - 1] !== "L") {
    throw new Error("The last part should be an 'L'");
  }

  // remove the last "L" and replace it with a polyline closure "Z"
  parts.pop();
  parts.push("Z");

  // build the complete string
  return parts.join(" ");
}
