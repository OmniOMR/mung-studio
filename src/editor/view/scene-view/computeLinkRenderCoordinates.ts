import { Node } from "../../../mung/Node";
import { StaffGeometryStore } from "../../model/StaffGeometryStore";

/**
 * Helper function that computes the scene-space coordinates for the starting
 * and ending points of a link (for rendering purposes). The function output
 * should be stable with respect to both end nodes not changing (in any way,
 * mask or other metadata).
 */
export function computeLinkCoordinates(
  fromNode: Node,
  toNode: Node,
  staffGeometryStore: StaffGeometryStore,
): LinkRenderCoordinates {
  // default behaviour - center to center
  let x1 = fromNode.left + fromNode.width / 2;
  let y1 = fromNode.top + fromNode.height / 2;
  let x2 = toNode.left + toNode.width / 2;
  let y2 = toNode.top + toNode.height / 2;

  // to stafflines/spaces - to the right and hit the line/space
  if (toNode.className === "staffLine" || toNode.className === "staffSpace") {
    if (fromNode.className !== "staff") {
      x2 = x1 + fromNode.width;
    }
    y2 = staffGeometryStore.getYForX(toNode.id, x2);
  }

  // to staves - directly up/down to the center of the staff
  if (toNode.className === "staff") {
    x2 = x1;
    y2 = staffGeometryStore.getYForX(toNode.id, x2);
  }

  return { x1, y1, x2, y2 };
}

export interface LinkRenderCoordinates {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}
