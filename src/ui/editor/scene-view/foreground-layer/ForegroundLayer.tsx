import { useContext, useEffect, useMemo, useRef } from "react";
import { NodeEditorOverlay } from "./NodeEditorOverlay";
import { Zoomer } from "../Zoomer";
import { Highlighter, HighlighterComponent } from "./Highlighter";
import { PrecedenceLinksToolOverlay } from "./PrecedenceLinksToolOverlay";
import { EditorTool } from "../../toolbelt/EditorTool";
import { useAtomValue } from "jotai";
import { Selector, SelectorComponent } from "./Selector";
import { SyntaxLinksToolOverlay } from "./SyntaxLinksToolOverlay";
import { NodeMaskCanvas } from "./NodeMaskCanvas";
import { EditorContext } from "../../EditorContext";

export interface ForegroundLayerProps {
  readonly zoomer: Zoomer;
}

export function ForegroundLayer(props: ForegroundLayerProps) {
  const {
    selectionStore,
    notationGraphStore,
    editorStateStore,
    toolbeltController,
    classVisibilityStore,
  } = useContext(EditorContext);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const highlighter = useMemo(
    () =>
      new Highlighter(notationGraphStore, classVisibilityStore, props.zoomer),
    [],
  );

  const selector = useMemo(
    () =>
      new Selector(
        notationGraphStore,
        classVisibilityStore,
        selectionStore,
        editorStateStore,
        highlighter,
        props.zoomer,
      ),
    [],
  );

  const currentTool = useAtomValue(toolbeltController.currentToolAtom);

  // bind zoomer to the SVG element
  props.zoomer.useZoomer(
    svgRef,
    () => toolbeltController.currentTool == EditorTool.Hand,
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
    <>
      {currentTool === EditorTool.NodeEditing && (
        <NodeMaskCanvas
          notationGraphStore={notationGraphStore}
          selectionStore={selectionStore}
          zoomer={props.zoomer}
        />
      )}
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
          {currentTool !== EditorTool.NodeEditing && (
            <>
              <HighlighterComponent svgRef={svgRef} highlighter={highlighter} />
              <SelectorComponent svgRef={svgRef} selector={selector} />
            </>
          )}

          {currentTool === EditorTool.NodeEditing && <NodeEditorOverlay />}

          {currentTool === EditorTool.SyntaxLinks && (
            <SyntaxLinksToolOverlay
              svgRef={svgRef}
              zoomer={props.zoomer}
              notationGraphStore={notationGraphStore}
              selectionStore={selectionStore}
            />
          )}

          {currentTool === EditorTool.PrecedenceLinks && (
            <PrecedenceLinksToolOverlay
              svgRef={svgRef}
              zoomer={props.zoomer}
              notationGraphStore={notationGraphStore}
              selectionStore={selectionStore}
            />
          )}
        </g>
      </svg>
    </>
  );
}
