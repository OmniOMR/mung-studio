import { JSX } from "react";
import { Node } from "../../mung/Node";
import { Atom, atom, useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../model/ClassVisibilityStore";
import { NotationGraphStore } from "../model/notation-graph-store/NotationGraphStore";
import { ZoomController } from "./ZoomController";
import { JotaiStore } from "../model/JotaiStore";
import { SignalAtomWrapper } from "../model/SignalAtomWrapper";
import { IController } from "./IController";
import { EditorTool } from "../model/EditorTool";
import { ToolbeltController } from "./ToolbeltController";
import { StaffGeometryStore } from "../model/StaffGeometryStore";

/**
 * Contains logic and state related to node highlighting.
 * Highlighted object is one that is being hovered over, and is to be selected
 * or an action is to be performed with it upon clicking.
 */
export class HighlightController implements IController {
  public readonly controllerName = "HighlightController";

  private jotaiStore: JotaiStore;

  private readonly notationGraphStore: NotationGraphStore;
  private readonly classVisibilityStore: ClassVisibilityStore;
  private readonly zoomController: ZoomController;
  private readonly toolbeltController: ToolbeltController;
  private readonly staffGeometryStore: StaffGeometryStore;

  constructor(
    jotaiStore: JotaiStore,
    notationGraphStore: NotationGraphStore,
    classVisibilityStore: ClassVisibilityStore,
    zoomController: ZoomController,
    toolbeltController: ToolbeltController,
    staffGeometryStore: StaffGeometryStore,
  ) {
    this.jotaiStore = jotaiStore;
    this.notationGraphStore = notationGraphStore;
    this.classVisibilityStore = classVisibilityStore;
    this.zoomController = zoomController;
    this.toolbeltController = toolbeltController;
    this.staffGeometryStore = staffGeometryStore;

    // register event handlers
    this.notationGraphStore.onNodeUpdatedOrLinked.subscribe((metadata) =>
      this.onNodeUpdatedOrLinked(metadata.newValue),
    );
    this.notationGraphStore.onNodeRemoved.subscribe((removedNode) =>
      this.onNodeRemoved(removedNode),
    );
  }

  public isEnabledAtom: Atom<boolean> = atom((get) => {
    const currentTool = get(this.toolbeltController.currentToolAtom);
    if (currentTool === EditorTool.Hand) return false;
    if (currentTool === EditorTool.NodeEditing) return false;
    return true;
  });

  public get isEnabled(): boolean {
    return this.jotaiStore.get(this.isEnabledAtom);
  }

  ///////////
  // State //
  ///////////

  private signalAtom = new SignalAtomWrapper();
  private _highlightedNode: Node | null = null;

  /**
   * Returns the currently highlighted node or null if no node is highlighted
   * or highlighting is disabled
   */
  public get highlightedNode(): Node | null {
    if (!this.isEnabled) return null;
    return this._highlightedNode;
  }

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

  ///////////////////////////////
  // Reacting to scene changes //
  ///////////////////////////////

  /**
   * Called whenever a scene node is updated or linked
   */
  private onNodeUpdatedOrLinked(updatedNode: Node) {
    if (updatedNode.id !== this.highlightedNode?.id) {
      return;
    }

    // update the node value that we hold as "highlighted"
    this.setHighlightedNode(updatedNode);
  }

  /**
   * Called whenever a scene node is removed
   */
  private onNodeRemoved(removedNode: Node) {
    if (removedNode.id !== this.highlightedNode?.id) {
      return;
    }

    // blur the node
    this.setHighlightedNode(null);
  }

  ///////////////////////
  // Mouse interaction //
  ///////////////////////

  public onMouseMove(e: MouseEvent) {
    const t = this.zoomController.currentTransform;

    // TODO: get data from the MousePointerController instead,
    // to better handle edgecases
    const x = t.invertX(e.offsetX);
    const y = t.invertY(e.offsetY);

    const newHighlightedNode = this.getNodeUnderPointer(x, y);
    this.setHighlightedNode(newHighlightedNode);
  }

  //////////////////////////////
  // Pointer node interaction //
  //////////////////////////////

  /**
   * Given pointer coordinates in scene space, return the node that is being
   * highlighted (called on each mouse move)
   */
  private getNodeUnderPointer(x: number, y: number): Node | null {
    // NOTE: this is a simple iteration as there are only 2K rectangle objects;
    // This could be improved, either so that it respects masks, or that
    // it runs faster with some k-d trees or such.

    let highlightedNode: Node | null = null;

    // go through nodes bottom-up and end up with the last one we're hitting
    for (let node of this.notationGraphStore.nodesInSceneOrder) {
      // skip nodes that are invisible
      if (!this.classVisibilityStore.visibleClasses.has(node.className))
        continue;

      // skip nodes that don't have their bbox under the pointer
      // (this is the behaviour for 99% of nodes)
      if (node.left > x || node.left + node.width < x) continue;
      if (node.top > y || node.top + node.height < y) continue;

      // for stafflines and staffspaces be more strict in intersection
      if (node.className === "staffLine" || node.className === "staffSpace") {
        const scaleUp = node.className === "staffLine" ? 2 : 1; // easier to hit
        const lineY = this.staffGeometryStore.getYForX(node.id, x);
        const lineMass = this.staffGeometryStore.getMassForX(node.id, x);
        // skip node if the pointer is outside the "line with thickness"
        if (y < lineY - (scaleUp * lineMass) / 2) continue;
        if (y > lineY + (scaleUp * lineMass) / 2) continue;
      }

      // the node is securely under our pointer, store it in the accumulator
      highlightedNode = node;
    }

    // return the last (top-most) node
    return highlightedNode;
  }

  ///////////////
  // Rendering //
  ///////////////

  private computeStaffPositionNodePathData(node: Node): string {
    const stride = 30;
    let d = "";

    const addPoint = (first: boolean, x: number, factor: number) => {
      const y = this.staffGeometryStore.getYForX(node.id, x);
      const m = this.staffGeometryStore.getMassForX(node.id, x);
      d += first ? "M " : "L ";
      d += x + "," + (y + (factor * m) / 2) + " ";
    };

    // top line going left-to-right
    for (let x = node.left; x < node.left + node.width; x += stride) {
      addPoint(x === node.left, x, -1);
    }
    addPoint(false, node.left + node.width, -1);

    // bottom line going right-to-left
    for (let x = node.left + node.width; x >= node.left; x -= stride) {
      addPoint(false, x, +1);
    }
    addPoint(false, node.left, +1);

    d += "Z";

    return d;
  }

  public renderSVG(): JSX.Element | null {
    const highlightedNode = useAtomValue(this.highlightedNodeAtom);

    if (highlightedNode === null) {
      return null;
    }

    const isStaffPositionNode =
      highlightedNode.className === "staffLine" ||
      highlightedNode.className === "staffSpace";

    // render the highlight rectangle
    return (
      <>
        <text
          x={highlightedNode.left + highlightedNode.width}
          y={highlightedNode.top}
          fill="white"
          fontSize="calc(var(--scene-screen-pixel) * 16)"
          fontFamily="monospace"
          fontWeight="700"
          style={{
            transform:
              "translateY(calc(var(--scene-screen-pixel) * 15px))" +
              "translateX(calc(var(--scene-screen-pixel) * 10px))",
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.4)",
          }}
        >
          {highlightedNode.className}
        </text>
        {isStaffPositionNode && (
          <path
            d={this.computeStaffPositionNodePathData(highlightedNode)}
            fill="none"
            stroke="white"
            strokeWidth="calc(var(--scene-screen-pixel) * 2)"
          />
        )}
        {!isStaffPositionNode && (
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
        {highlightedNode.textTranscription && (
          <text
            x={highlightedNode.left}
            y={highlightedNode.top + highlightedNode.height}
            fill="white"
            fontSize="calc(var(--scene-screen-pixel) * 12)"
            fontFamily="monospace"
            fontWeight="400"
            style={{
              textShadow: "1px 1px 2px rgba(0, 0, 0, 0.4)",
            }}
          >
            {highlightedNode.textTranscription.split("\n").map((line, i) => (
              <tspan key={i} x={highlightedNode.left} dy="1.3em">
                {line}
              </tspan>
            ))}
          </text>
        )}
      </>
    );
  }
}
