import { JSX } from "react";
import { Node } from "../../../mung/Node";
import { Atom, atom, useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../state/ClassVisibilityStore";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";
import { ZoomController } from "./ZoomController";
import { JotaiStore } from "../state/JotaiStore";
import { SignalAtomWrapper } from "../state/SignalAtomWrapper";
import { IController } from "./IController";
import { EditorTool } from "../toolbelt/EditorTool";
import { ToolbeltController } from "../toolbelt/ToolbeltController";

/**
 * Contains logic and state related to node highlighting.
 * Highlighted object is one that is being hovered over, and is to be selected
 * or an action is to be performed with it upon clicking.
 */
export class HighlightController implements IController {
  private jotaiStore: JotaiStore;

  private readonly notationGraphStore: NotationGraphStore;
  private readonly classVisibilityStore: ClassVisibilityStore;
  private readonly zoomer: ZoomController;
  private readonly toolbeltController: ToolbeltController;

  constructor(
    jotaiStore: JotaiStore,
    notationGraphStore: NotationGraphStore,
    classVisibilityStore: ClassVisibilityStore,
    zoomer: ZoomController,
    toolbeltController: ToolbeltController,
  ) {
    this.jotaiStore = jotaiStore;
    this.notationGraphStore = notationGraphStore;
    this.classVisibilityStore = classVisibilityStore;
    this.zoomer = zoomer;
    this.toolbeltController = toolbeltController;
  }

  ///////////
  // State //
  ///////////

  private signalAtom = new SignalAtomWrapper();
  private _isNodeHighlightingEnabled = true;
  private _highlightedNode: Node | null = null;

  /**
   * Returns the currently highlighted node or null if no node is highlighted
   * or highlighting is disabled
   */
  public get highlightedNode(): Node | null {
    if (!this._isNodeHighlightingEnabled) return null;
    return this._highlightedNode;
  }

  /**
   * Read-only atom that exposes whether the node highlighting is enabled
   */
  public readonly isNodeHighlightingEnabledAtom: Atom<boolean> = atom((get) => {
    this.signalAtom.subscribe(get);
    return this._isNodeHighlightingEnabled;
  });

  /**
   * Read-only atom that exposes the highlighted node
   */
  public readonly highlightedNodeAtom: Atom<Node | null> = atom((get) => {
    this.signalAtom.subscribe(get);
    return this.highlightedNode;
  });

  /**
   * Sets the currently highlighted node
   */
  public setHighlightedNode(node: Node | null) {
    // skip if no change
    if (this._highlightedNode?.id === node?.id) return;

    // change highlighted node
    this._highlightedNode = node;
    this.signalAtom.signal(this.jotaiStore.set);
  }

  /**
   * Sets whether node highlighting is enabled
   */
  public setIsNodeHighlightingEnabled(isEnabled: boolean) {
    // skip if no change
    if (this._isNodeHighlightingEnabled === isEnabled) return;

    // change the state
    this._isNodeHighlightingEnabled = isEnabled;
    this.signalAtom.signal(this.jotaiStore.set);
  }

  ///////////////////////
  // Mouse interaction //
  ///////////////////////

  public onMouseMove(e: MouseEvent) {
    if (!this._isNodeHighlightingEnabled) return;

    const t = this.zoomer.currentTransform;

    const x = t.invertX(e.offsetX);
    const y = t.invertY(e.offsetY);

    const newHighlightedNode = this.getNodeUnderPointer(x, y);
    this.setHighlightedNode(newHighlightedNode);
  }

  //////////////////////////////
  // Pointer node interaction //
  //////////////////////////////

  private getNodeUnderPointer(
    pointer_x: number,
    pointer_y: number,
  ): Node | null {
    // NOTE: this is a simple iteration as there are only 2K rectangle objects;
    // This could be improved, either so that it respects polygons, or that
    // it runs faster with some k-d trees or such.

    let highlightedNode: Node | null = null;

    for (let node of this.notationGraphStore.nodesInSceneOrder) {
      if (!this.classVisibilityStore.visibleClasses.has(node.className))
        continue;
      if (node.left > pointer_x || node.left + node.width < pointer_x) continue;
      if (node.top > pointer_y || node.top + node.height < pointer_y) continue;
      highlightedNode = node;
      // continue to get the last node (the most on-top node)
    }

    return highlightedNode;
  }

  ///////////////
  // Rendering //
  ///////////////

  public renderSVG(): JSX.Element | null {
    const currentTool = useAtomValue(this.toolbeltController.currentToolAtom);
    const highlightedNode = useAtomValue(this.highlightedNodeAtom);

    // highlighting is only visible when we are not editing nodes
    if (currentTool === EditorTool.NodeEditing) {
      return null;
    }

    // render the highlight rectangle
    return (
      <>
        {highlightedNode && (
          <rect
            x={highlightedNode.left}
            y={highlightedNode.top}
            width={highlightedNode.width}
            height={highlightedNode.height}
            fill="none"
            stroke="white"
            strokeWidth="calc(var(--scene-screen-pixel) * 2)"
          />
        )}
      </>
    );
  }
}
