import { JSX, RefObject, useEffect, useRef } from "react";
import { getDefaultStore, useAtomValue } from "jotai";
import { SelectionStore } from "../state/selection-store/SelectionStore";
import { HighlightController } from "./HighlightController";
import { JotaiStore } from "../state/JotaiStore";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";
import { ClassVisibilityStore } from "../state/ClassVisibilityStore";
import { ZoomController } from "./ZoomController";
import { Node } from "../../../mung/Node";
import { EditorStateStore } from "../state/EditorStateStore";
import { IController } from "./IController";
import { ToolbeltController } from "../toolbelt/ToolbeltController";
import { EditorTool } from "../toolbelt/EditorTool";

/**
 * Contains logic for selecting and deselecting nodes.
 */
export class SelectionController implements IController {
  private jotaiStore: JotaiStore;

  private readonly notationGraphStore: NotationGraphStore;
  private readonly classVisibilityStore: ClassVisibilityStore;
  private readonly selectionStore: SelectionStore;
  private readonly editorStateStore: EditorStateStore;
  private readonly highlighter: HighlightController;
  private readonly zoomer: ZoomController;
  private readonly toolbeltController: ToolbeltController;

  constructor(
    jotaiStore: JotaiStore,
    notationGraphStore: NotationGraphStore,
    classVisibilityStore: ClassVisibilityStore,
    selectionStore: SelectionStore,
    editorStateStore: EditorStateStore,
    highlighter: HighlightController,
    zoomer: ZoomController,
    toolbeltController: ToolbeltController,
  ) {
    this.jotaiStore = jotaiStore;
    this.notationGraphStore = notationGraphStore;
    this.classVisibilityStore = classVisibilityStore;
    this.selectionStore = selectionStore;
    this.editorStateStore = editorStateStore;
    this.highlighter = highlighter;
    this.zoomer = zoomer;
    this.toolbeltController = toolbeltController;
  }

  ///////////
  // State //
  ///////////

  public isEnabled: boolean = true;

  private sweepRectangle: SVGRectElement | null = null;
  private isSweeping: boolean = false;
  private sweepStartX: number = 0;
  private sweepStartY: number = 0;
  private sweepEndX: number = 0;
  private sweepEndY: number = 0;

  ///////////////////////
  // Mouse interaction //
  ///////////////////////

  public onMouseMove(e: MouseEvent) {
    if (!this.isEnabled) return;
    if (!this.isSweeping) return;

    // pointer position
    const t = this.zoomer.currentTransform;
    const x = t.invertX(e.offsetX);
    const y = t.invertY(e.offsetY);

    // update the sweep rectangle
    this.sweepEndX = x;
    this.sweepEndY = y;

    this.updateSweepRectangle();
  }

  public onMouseUp(e: MouseEvent) {
    if (!this.isEnabled) return;
    if (e.button !== 0) return; // LMB only
    if (!this.isSweeping) return;

    // get nodes inside the rectangle and select them
    const nodes = this.getNodesUnderSweepRectangle();

    // select these nodes, or add them when holding shift
    if (e.shiftKey) {
      this.selectionStore.addNodesToSelection(nodes.map((n) => n.id));
    } else {
      this.selectionStore.changeSelection(nodes.map((n) => n.id));
    }

    this.isSweeping = false;
    this.updateSweepRectangle();
  }

  public onMouseDown(e: MouseEvent) {
    if (!this.isEnabled) return;
    if (e.button !== 0) return; // LMB only

    const highlightedNode = this.highlighter.highlightedNode;

    // pointer position
    const t = this.zoomer.currentTransform;
    const x = t.invertX(e.offsetX);
    const y = t.invertY(e.offsetY);

    // click on the backgorund de-selects
    // and initiates the sweep select
    if (highlightedNode === null) {
      // Do not deselect here. That happens on mouse up if there's nothing
      // under the pointer or the sweep rectangle.

      this.isSweeping = true;
      this.sweepStartX = x;
      this.sweepStartY = y;
      this.sweepEndX = x;
      this.sweepEndY = y;

      this.updateSweepRectangle();

      return;
    }

    // click on a node selects that node
    if (highlightedNode !== null) {
      // unless that node is already selected, then it de-selects
      if (this.selectionStore.selectedNodeIds.includes(highlightedNode.id)) {
        this.selectionStore.deselectNode(highlightedNode.id);
        return;
      }

      // select that node, or add it when holding shift
      if (e.shiftKey) {
        this.selectionStore.addNodeToSelection(highlightedNode.id);
      } else {
        this.selectionStore.changeSelection([highlightedNode.id]);
      }
      return;
    }
  }

  /////////////////////
  // Sweep rectangle //
  /////////////////////

  private updateSweepRectangle() {
    if (this.sweepRectangle === null) return;

    if (!this.isSweeping) {
      this.sweepRectangle.style.display = "none";
      return;
    }

    const x = Math.min(this.sweepStartX, this.sweepEndX);
    const y = Math.min(this.sweepStartY, this.sweepEndY);
    const width = Math.abs(this.sweepStartX - this.sweepEndX);
    const height = Math.abs(this.sweepStartY - this.sweepEndY);
    const dashed = !this.editorStateStore.isSelectionLazy;

    this.sweepRectangle.style.display = "block";
    this.sweepRectangle.setAttribute("x", String(x));
    this.sweepRectangle.setAttribute("y", String(y));
    this.sweepRectangle.setAttribute("width", String(width));
    this.sweepRectangle.setAttribute("height", String(height));
    this.sweepRectangle.setAttribute("stroke-dasharray", dashed ? "5" : "none");
  }

  private getNodesUnderSweepRectangle(): readonly Node[] {
    // NOTE: this is a simple iteration as there are only 2K rectangle objects;
    // This could be improved, either so that it respects polygons, or that
    // it runs faster with some k-d trees or such.

    const isLazy = this.editorStateStore.isSelectionLazy;

    const x_min = Math.min(this.sweepStartX, this.sweepEndX);
    const y_min = Math.min(this.sweepStartY, this.sweepEndY);
    const x_max = Math.max(this.sweepStartX, this.sweepEndX);
    const y_max = Math.max(this.sweepStartY, this.sweepEndY);

    let nodes: Node[] = [];

    for (let node of this.notationGraphStore.nodesInSceneOrder) {
      if (!this.classVisibilityStore.visibleClasses.has(node.className))
        continue;

      if (isLazy) {
        // node mus be fully inside the rectangle
        if (node.left < x_min || node.left + node.width > x_max) continue;
        if (node.top < y_min || node.top + node.height > y_max) continue;
      } else {
        // node can be just partially under the rectangle
        if (node.left + node.width < x_min || node.left > x_max) continue;
        if (node.top + node.height < y_min || node.top > y_max) continue;
      }
      nodes.push(node);
    }

    return nodes;
  }

  ///////////////
  // Rendering //
  ///////////////

  public renderSVG(): JSX.Element | null {
    const currentTool = useAtomValue(this.toolbeltController.currentToolAtom);
    const sweepRectangleRef = useRef<SVGRectElement | null>(null);

    useEffect(() => {
      this.sweepRectangle = sweepRectangleRef.current;
    }, []);

    // selection is only visible when we are not editing nodes
    if (currentTool === EditorTool.NodeEditing) {
      return null;
    }

    return (
      <>
        <rect
          ref={sweepRectangleRef}
          x={0}
          y={0}
          width={0}
          height={0}
          fill="color-mix(in srgb, var(--joy-palette-primary-400) 20%, transparent)"
          stroke="var(--joy-palette-primary-400)"
          strokeWidth="var(--scene-screen-pixel)"
          style={{
            display: "none",
          }}
        />
      </>
    );
  }
}
