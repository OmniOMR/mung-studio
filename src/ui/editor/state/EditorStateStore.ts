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
export enum EditorMode {
  /**
   * The default mode, user can select nodes and view their details.
   */
  Default = "Default",

  /**
   * Mode for editing a single selected node
   * (TBD, not really designed yet)
   */
  NodeEditing = "NodeEditing",

  /**
   * Specialized mode for editing precedence links
   */
  PrecedenceLinkEditing = "PrecedenceLinkEditing",
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

  public editorModeAtom: PrimitiveAtom<EditorMode> = atom(EditorMode.Default);

  /**
   * Contains the currently highlighted atom.
   * Could be extracted into a store should nodes react by changing color.
   */
  public highlightedNodeAtom: PrimitiveAtom<Node | null> = atom(null);
}
