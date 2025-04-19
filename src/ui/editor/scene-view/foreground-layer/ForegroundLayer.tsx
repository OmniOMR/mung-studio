import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { NodeEditorOverlay } from "./NodeEditorOverlay";
import { Zoomer } from "../Zoomer";
import { Highlighter, HighlighterComponent } from "./Highlighter";
import { PrecedenceLinkEditingOverlay } from "./PrecedenceLinkEditingOverlay";
import { EditorTool, EditorStateStore } from "../../state/EditorStateStore";
import { useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { Selector, SelectorComponent } from "./Selector";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../../state/selection-store/SelectionStore";

export interface ForegroundLayerProps {
  readonly zoomer: Zoomer;
  readonly selectionStore: SelectionStore;
  readonly notationGraphStore: NotationGraphStore;
  readonly editorStateStore: EditorStateStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function ForegroundLayer(props: ForegroundLayerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [highlighter, _1] = useState(
    () =>
      new Highlighter(
        props.notationGraphStore,
        props.classVisibilityStore,
        props.zoomer,
      ),
  );

  const [selector, _2] = useState(
    () =>
      new Selector(
        props.notationGraphStore,
        props.classVisibilityStore,
        props.selectionStore,
        highlighter,
        props.zoomer,
      ),
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

  // determine whether the highlighter is enabled
  useEffect(() => {
    let isHighlighterEnabled = true;
    if (currentTool === EditorTool.Hand) isHighlighterEnabled = false;
    highlighter.setIsNodeHighlightingEnabled(isHighlighterEnabled);
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

        {currentTool === EditorTool.PrecedenceLinks && (
          <PrecedenceLinkEditingOverlay
            svgRef={svgRef}
            zoomer={props.zoomer}
            editorStateStore={props.editorStateStore}
            notationGraphStore={props.notationGraphStore}
          />
        )}
      </g>
    </svg>
  );
}
