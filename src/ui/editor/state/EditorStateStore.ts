import {
  Atom,
  atom,
  getDefaultStore,
  PrimitiveAtom,
  WritableAtom,
} from "jotai";
import { Node } from "../../../mung/Node";
import { SignalAtomWrapper } from "./SignalAtomWrapper";
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
 * List of modes the editor as a whole can be in
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

/**
 * Contans state that belongs to the editor
 * (what is visible, what editing mode is currently on, etc.)
 */
export class EditorStateStore {
  private jotaiStore: JotaiStore = getDefaultStore();

  //////////////////
  // View options //
  //////////////////

  // atom that manages display of nodes
  public readonly nodeDisplayModeAtom: PrimitiveAtom<NodeDisplayMode> = atom(
    NodeDisplayMode.Bboxes,
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

  public get isDisplaySyntaxLinks(): boolean {
    return this.jotaiStore.get(this.displaySyntaxLinksAtom);
  }

  public get isDisplayPrecedenceLinks(): boolean {
    return this.jotaiStore.get(this.displayPrecedenceLinksAtom);
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

  /////////////////////
  // Tool management //
  /////////////////////

  // holds the selected editor tool value
  private _currentTool: EditorTool = EditorTool.Pointer;

  // used to refresh the current tool atom
  private readonly currentToolSignalAtom = new SignalAtomWrapper();

  /**
   * Returns the currently selected editor tool
   */
  public get currentTool(): EditorTool {
    return this._currentTool;
  }

  /**
   * Read-only atom that exposes the currently selected tool
   */
  public currentToolAtom: Atom<EditorTool> = atom<EditorTool>((get) => {
    this.currentToolSignalAtom.subscribe(get);
    return this._currentTool;
  });

  /**
   * Sets the currently used editor tool
   */
  public setCurrentTool(tool: EditorTool) {
    this._currentTool = tool;
    this.currentToolSignalAtom.signal(this.jotaiStore.set);
  }
}
