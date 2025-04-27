import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";
import { NodeEditorOverlay } from "./NodeEditorOverlay";
import { Zoomer } from "../Zoomer";
import { Highlighter, HighlighterComponent } from "./Highlighter";
import { PrecedenceLinksToolOverlay } from "./PrecedenceLinksToolOverlay";
import { EditorTool, EditorStateStore } from "../../state/EditorStateStore";
import { useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { Selector, SelectorComponent } from "./Selector";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../../state/selection-store/SelectionStore";
import { SyntaxLinksToolOverlay } from "./SyntaxLinksToolOverlay";

export interface ForegroundLayerProps {
  readonly zoomer: Zoomer;
  readonly selectionStore: SelectionStore;
  readonly notationGraphStore: NotationGraphStore;
  readonly editorStateStore: EditorStateStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function ForegroundLayer(props: ForegroundLayerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const highlighter = useMemo(
    () =>
      new Highlighter(
        props.notationGraphStore,
        props.classVisibilityStore,
        props.zoomer,
      ),
    [],
  );

  const selector = useMemo(
    () =>
      new Selector(
        props.notationGraphStore,
        props.classVisibilityStore,
        props.selectionStore,
        props.editorStateStore,
        highlighter,
        props.zoomer,
      ),
    [],
  );

  const currentTool = useAtomValue(props.editorStateStore.currentToolAtom);

  // bind zoomer to the SVG element
  props.zoomer.useZoomer(
    svgRef,
    () => props.editorStateStore.currentTool == EditorTool.Hand,
  );

  // determine the mouse cursor type
  const isGrabbing = useAtomValue(props.zoomer.isGrabbingAtom);
  let cursor = "default";
  if (currentTool === EditorTool.Hand) cursor = "grab";
  if (isGrabbing) cursor = "grabbing";

  // determine whether the highlighter and selector is enabled
  useEffect(() => {
    let isEnabled = true;
    if (currentTool === EditorTool.Hand) isEnabled = false;

    highlighter.setIsNodeHighlightingEnabled(isEnabled);
    selector.isEnabled = isEnabled;
  }, [currentTool]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "none",
        cursor: cursor,
      }}
    >
      {/* This <g> element is what the zoomer applies transform to */}
      <g>
        <HighlighterComponent svgRef={svgRef} highlighter={highlighter} />

        <SelectorComponent svgRef={svgRef} selector={selector} />

        {currentTool === EditorTool.NodeEditing && (
          <NodeEditorOverlay selectionStore={props.selectionStore} />
        )}

        {currentTool === EditorTool.SyntaxLinks && (
          <SyntaxLinksToolOverlay
            svgRef={svgRef}
            zoomer={props.zoomer}
            notationGraphStore={props.notationGraphStore}
            selectionStore={props.selectionStore}
          />
        )}

        {currentTool === EditorTool.PrecedenceLinks && (
          <PrecedenceLinksToolOverlay
            svgRef={svgRef}
            zoomer={props.zoomer}
            notationGraphStore={props.notationGraphStore}
            selectionStore={props.selectionStore}
          />
        )}
      </g>
    </svg>
  );
}
