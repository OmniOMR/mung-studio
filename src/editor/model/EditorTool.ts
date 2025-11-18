/**
 * List of "modes" the editor as a whole can be in
 * (tools that can be selected or "picked-up")
 */
export enum EditorTool {
  /**
   * The default mode, user can select nodes and view their details.
   */
  Pointer = "Pointer",

  /**
   * Tool used to move around the scene by dragging with the mouse.
   * Selection and other interaction is disabled for this tool.
   */
  Hand = "Hand",

  /**
   * Mode for editing a single selected node
   * (TBD, not really designed yet)
   */
  NodeEditing = "NodeEditing",

  /**
   * Specialized mode for editing syntax links
   */
  SyntaxLinks = "SyntaxLinks",

  /**
   * Specialized mode for editing precedence links
   */
  PrecedenceLinks = "PrecedenceLinks",
}
