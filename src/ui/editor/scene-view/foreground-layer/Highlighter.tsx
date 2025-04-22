import { RefObject, useEffect } from "react";
import * as d3 from "d3";
import { Node } from "../../../../mung/Node";
import { Atom, atom, getDefaultStore, useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { Zoomer } from "../Zoomer";
import { JotaiStore } from "../../state/JotaiStore";
import { SignalAtomWrapper } from "../../state/SignalAtomWrapper";

/**
 * Contains logic and state related to node and link highlighting.
 * Highlighted object is one that is being hovered over, and is to be selected
 * or and action is to be performed with it upon clicking.
 */
export class Highlighter {
  private jotaiStore: JotaiStore = getDefaultStore();

  private readonly notationGraphStore: NotationGraphStore;
  private readonly classVisibilityStore: ClassVisibilityStore;
  private readonly zoomer: Zoomer;

  constructor(
    notationGraphStore: NotationGraphStore,
    classVisibilityStore: ClassVisibilityStore,
    zoomer: Zoomer,
  ) {
    this.notationGraphStore = notationGraphStore;
    this.classVisibilityStore = classVisibilityStore;
    this.zoomer = zoomer;
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

  /**
   * React hook that attaches the highlighter to an SVG element, so that it
   * starts reacting to mouse events.
   */
  public useHighlighter(svgRef: RefObject<SVGSVGElement | null>) {
    useEffect(() => {
      if (svgRef.current === null) return;
      const svg = svgRef.current;

      const listener = this.onMouseMove.bind(this);

      svg.addEventListener("mousemove", listener);
      return () => {
        svg.removeEventListener("mousemove", listener);
      };
    }, []);
  }

  private onMouseMove(e: MouseEvent) {
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

    // TODO: this should be available on-demand, not computed here
    const visibleClasses = this.classVisibilityStore.getVisibleClasses();

    let highlightedNode: Node | null = null;

    for (let node of this.notationGraphStore.nodesInSceneOrder) {
      if (!visibleClasses.has(node.className)) continue;
      if (node.left > pointer_x || node.left + node.width < pointer_x) continue;
      if (node.top > pointer_y || node.top + node.height < pointer_y) continue;
      highlightedNode = node;
      // continue to get the last node (the most on-top node)
    }

    return highlightedNode;
  }
}

/////////////////////
// React component //
/////////////////////

export interface HighlighterComponentProps {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly highlighter: Highlighter;
}

/**
 * Binds highlighter to the SVG foreground layer and renders the highlight rect
 */
export function HighlighterComponent(props: HighlighterComponentProps) {
  const highlightedNode = useAtomValue(props.highlighter.highlightedNodeAtom);

  props.highlighter.useHighlighter(props.svgRef);

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
