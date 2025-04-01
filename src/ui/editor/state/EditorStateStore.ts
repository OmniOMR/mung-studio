import { atom, PrimitiveAtom } from "jotai";

/**
 * How should nodes in the scene view be displayed
 */
export enum NodeDisplayMode {
  Bboxes,
  PolygonsAndMasks,
  Hidden,
}

/**
 * How should links in the scene view be displayed
 */
export enum LinkDisplayMode {
  Arrows,
  Hidden,
}

/**
 * Contans state that belongs to the editor
 * (what is visible, what editing mode is currently on, etc.)
 */
export class EditorStateStore {
  public nodeDisplayModeAtom: PrimitiveAtom<NodeDisplayMode> = atom(
    NodeDisplayMode.Bboxes,
  );

  public linkDisplayModeAtom: PrimitiveAtom<LinkDisplayMode> = atom(
    LinkDisplayMode.Arrows,
  );
}
