/**
 * List of tools available in the node editor
 */
export enum NodeTool {
  /**
   * The value used when the node editing mode is not enabled
   */
  None = "None",

  /**
   * Tool that paints more of the mask
   */
  Brush = "Brush",

  /**
   * Tool that erases the mask
   */
  Eraser = "Eraser",

  /**
   * Tool that draws a polygon, that once submitted is added to the mask
   */
  PolygonFill = "PolygonFill",

  /**
   * Tool that draws a polygon, that once submitted is subtracted from the mask
   */
  PolygonErase = "PolygonErase",
}
