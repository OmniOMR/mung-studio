import { RefObject, useEffect } from "react";
import { getDefaultStore, useAtomValue } from "jotai";
import { SelectionStore } from "../../state/selection-store/SelectionStore";
import { Highlighter } from "./Highlighter";
import { JotaiStore } from "../../state/JotaiStore";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { Zoomer } from "../Zoomer";

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

  ///////////////////////
  // Mouse interaction //
  ///////////////////////

  /**
   * React hook that attaches the selector to an SVG element, so that it
   * starts reacting to mouse events.
   */
  public useHighlighter(svgRef: RefObject<SVGSVGElement | null>) {
    useEffect(() => {
      if (svgRef.current === null) return;
      const svg = svgRef.current;

      const listener = this.onMouseDown.bind(this);

      svg.addEventListener("mousedown", listener);
      return () => {
        svg.removeEventListener("mousedown", listener);
      };
    }, []);
  }

  private onMouseDown(e: MouseEvent) {
    const highlightedNode = this.highlighter.highlightedNode;

    // click on the backgorund de-selects
    if (highlightedNode === null) {
      this.selectionStore.clearSelection();
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
}

export interface SelectorComponentProps {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly selector: Selector;
}

export function SelectorComponent(props: SelectorComponentProps) {
  props.selector.useHighlighter(props.svgRef);

  return <></>;
}
