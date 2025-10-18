import { atom, getDefaultStore, PrimitiveAtom } from "jotai";
import { JotaiStore } from "./JotaiStore";
import { AtomWithEvent } from "./AtomWithEvent";

/**
 * How should nodes in the scene view be displayed
 */
export enum NodeDisplayMode {
  Bboxes = "Bboxes",
  PolygonsAndMasks = "PolygonsAndMasks",
  Hidden = "Hidden",
}

/**
 * Contans state that belongs to the editor
 * (what is visible, what editing mode is currently on, etc.)
 */
export class EditorStateStore {
  private readonly jotaiStore: JotaiStore;

  constructor(jotaiStore: JotaiStore) {
    this.jotaiStore = jotaiStore;
  }

  //////////////////
  // View options //
  //////////////////

  // atom that manages display of nodes
  public readonly nodeDisplayModeAtom: PrimitiveAtom<NodeDisplayMode> = atom(
    NodeDisplayMode.PolygonsAndMasks,
  );

  // atom that manages display of syntax links
  private displaySyntaxLinksAtomWithEvent = AtomWithEvent.primitiveAtom(true);
  public get displaySyntaxLinksAtom() {
    return this.displaySyntaxLinksAtomWithEvent.atom;
  }
  public get displaySyntaxLinksChangeEvent() {
    return this.displaySyntaxLinksAtomWithEvent.event;
  }

  // atom that manages display of syntax links
  private displayPrecedenceLinksAtomWithEvent =
    AtomWithEvent.primitiveAtom(true);
  public get displayPrecedenceLinksAtom() {
    return this.displayPrecedenceLinksAtomWithEvent.atom;
  }
  public get displayPrecedenceLinksChangeEvent() {
    return this.displayPrecedenceLinksAtomWithEvent.event;
  }

  ///////////////////////
  // Selection options //
  ///////////////////////

  /**
   * Determines the current behaviour of the rectangle selection.
   * Lazy means a node has to be fully inside the rectangle to be selected.
   * Eager means a node can just barely touch the rectangle to be selected.
   */
  public readonly isSelectionLazyAtom: PrimitiveAtom<boolean> = atom(false);

  /**
   * Reads out the value of the isSelectionLazyAtom,
   * Lazy selection means only fully covered nodes by the selection rectangle
   * will become selected.
   */
  public get isSelectionLazy(): boolean {
    return this.jotaiStore.get(this.isSelectionLazyAtom);
  }
}
