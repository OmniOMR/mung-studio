import * as d3 from "d3";
import { useRef } from "react";
import { NodeEditorOverlay } from "./NodeEditorOverlay";
import { Zoomer } from "../Zoomer";
import { NodeHighlighter } from "./NodeHighlighter";
import { PrecedenceLinkEditingOverlay } from "./PrecedenceLinkEditingOverlay";
import { EditorTool, EditorStateStore } from "../../state/EditorStateStore";
import { useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { DefaultModeOverlay } from "./DefaultModeOverlay";
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
  let isHighlighterEnabled = true;
  if (currentTool === EditorTool.Hand) isHighlighterEnabled = false;

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
        <NodeHighlighter
          svgRef={svgRef}
          zoomer={props.zoomer}
          isEnabled={isHighlighterEnabled}
          notationGraphStore={props.notationGraphStore}
          editorStateStore={props.editorStateStore}
          classVisibilityStore={props.classVisibilityStore}
        />

        {currentTool === EditorTool.Pointer && (
          <DefaultModeOverlay
            svgRef={svgRef}
            editorStateStore={props.editorStateStore}
            selectionStore={props.selectionStore}
          />
        )}

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
