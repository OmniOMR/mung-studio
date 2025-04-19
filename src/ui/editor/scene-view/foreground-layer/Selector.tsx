import { RefObject, useEffect, useRef } from "react";
import { getDefaultStore, useAtomValue } from "jotai";
import { SelectionStore } from "../../state/selection-store/SelectionStore";
import { Highlighter } from "./Highlighter";
import { JotaiStore } from "../../state/JotaiStore";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { Zoomer } from "../Zoomer";
import { Node } from "../../../../mung/Node";

/**
 * Contains logic for selecting and deselecting nodes.
 */
export class Selector {
  private jotaiStore: JotaiStore = getDefaultStore();

  private readonly notationGraphStore: NotationGraphStore;
  private readonly classVisibilityStore: ClassVisibilityStore;
  private readonly selectionStore: SelectionStore;
  private readonly highlighter: Highlighter;
  private readonly zoomer: Zoomer;

  constructor(
    notationGraphStore: NotationGraphStore,
    classVisibilityStore: ClassVisibilityStore,
    selectionStore: SelectionStore,
    highlighter: Highlighter,
    zoomer: Zoomer,
  ) {
    this.notationGraphStore = notationGraphStore;
    this.classVisibilityStore = classVisibilityStore;
    this.selectionStore = selectionStore;
    this.highlighter = highlighter;
    this.zoomer = zoomer;
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

  /**
   * React hook that attaches the selector to an SVG element, so that it
   * starts reacting to mouse events.
   */
  public useHighlighter(
    svgRef: RefObject<SVGSVGElement | null>,
    sweepRectangleRef: RefObject<SVGRectElement | null>,
  ) {
    useEffect(() => {
      if (svgRef.current === null) return;
      const svg = svgRef.current;
      this.sweepRectangle = sweepRectangleRef.current;

      const downListener = this.onMouseDown.bind(this);
      const moveListener = this.onMouseMove.bind(this);
      const upListener = this.onMouseUp.bind(this);

      svg.addEventListener("mousedown", downListener);
      svg.addEventListener("mousemove", moveListener);
      svg.addEventListener("mouseup", upListener);
      return () => {
        svg.removeEventListener("mousedown", downListener);
        svg.removeEventListener("mousemove", moveListener);
        svg.removeEventListener("mouseup", upListener);
      };
    }, []);
  }

  private onMouseMove(e: MouseEvent) {
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

  private onMouseUp(e: MouseEvent) {
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

  private onMouseDown(e: MouseEvent) {
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
      // do not deselect if the user is holding shift
      if (!e.shiftKey) {
        this.selectionStore.clearSelection();
      }

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

    this.sweepRectangle.style.display = "block";
    this.sweepRectangle.setAttribute("x", String(x));
    this.sweepRectangle.setAttribute("y", String(y));
    this.sweepRectangle.setAttribute("width", String(width));
    this.sweepRectangle.setAttribute("height", String(height));
  }

  private getNodesUnderSweepRectangle(): readonly Node[] {
    // NOTE: this is a simple iteration as there are only 2K rectangle objects;
    // This could be improved, either so that it respects polygons, or that
    // it runs faster with some k-d trees or such.

    const x_min = Math.min(this.sweepStartX, this.sweepEndX);
    const y_min = Math.min(this.sweepStartY, this.sweepEndY);
    const x_max = Math.max(this.sweepStartX, this.sweepEndX);
    const y_max = Math.max(this.sweepStartY, this.sweepEndY);

    // TODO: this should be available on-demand, not computed here
    const visibleClasses = this.classVisibilityStore.getVisibleClasses();

    let nodes: Node[] = [];

    for (let node of this.notationGraphStore.nodes) {
      if (!visibleClasses.has(node.className)) continue;
      if (node.left < x_min || node.left + node.width > x_max) continue;
      if (node.top < y_min || node.top + node.height > y_max) continue;
      nodes.push(node);
    }

    return nodes;
  }
}

/////////////////////
// React component //
/////////////////////

export interface SelectorComponentProps {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly selector: Selector;
}

export function SelectorComponent(props: SelectorComponentProps) {
  const sweepRectangleRef = useRef<SVGRectElement | null>(null);

  props.selector.useHighlighter(props.svgRef, sweepRectangleRef);

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
