import { atom, PrimitiveAtom } from "jotai";
import { Node } from "../../../mung/Node";

/**
 * How should nodes in the scene view be displayed
 */
export enum NodeDisplayMode {
  Bboxes = "Bboxes",
  PolygonsAndMasks = "PolygonsAndMasks",
  Hidden = "Hidden",
}

/**
 * List of modes the editor as a whole can be in
 */
export enum EditorTool {
  /**
   * The default mode, user can select nodes and view their details.
   */
  Pointer = "Pointer",

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

/**
 * Contans state that belongs to the editor
 * (what is visible, what editing mode is currently on, etc.)
 */
export class EditorStateStore {
  public nodeDisplayModeAtom: PrimitiveAtom<NodeDisplayMode> = atom(
    NodeDisplayMode.Bboxes,
  );

  public displaySyntaxLinksAtom: PrimitiveAtom<boolean> = atom(true);
  public displayPrecedenceLinksAtom: PrimitiveAtom<boolean> = atom(true);

  public currentToolAtom: PrimitiveAtom<EditorTool> = atom(EditorTool.Pointer);

  /**
   * Contains the currently highlighted atom.
   * Could be extracted into a store should nodes react by changing color.
   */
  public highlightedNodeAtom: PrimitiveAtom<Node | null> = atom(null);
}
