import * as d3 from "d3";
import { RefObject, useEffect, useRef } from "react";
import { customizeD3ZoomBehaviour } from "../customizeD3ZoomBehaviour";
import { NodeEditorOverlay } from "./NodeEditorOverlay";
import { SelectedNodeStore } from "../../state/SelectedNodeStore";
import { ZoomEventBus } from "../ZoomEventBus";
import { PointerInteractor } from "./PointerInteractor";
import { PrecedenceLinkEditingOverlay } from "./PrecedenceLinkEditingOverlay";
import { EditorMode, EditorStateStore } from "../../state/EditorStateStore";
import { useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { DefaultModeOverlay } from "./DefaultModeOverlay";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";

const IDENTITY_TRANSFORM = new d3.ZoomTransform(1, 0, 0);

export interface ForegroundLayerProps {
  readonly zoomEventBus: ZoomEventBus;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly notationGraphStore: NotationGraphStore;
  readonly editorStateStore: EditorStateStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function ForegroundLayer(props: ForegroundLayerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(IDENTITY_TRANSFORM);

  const editorState = useAtomValue(props.editorStateStore.editorModeAtom);

  useZoom(svgRef, transformRef, props.zoomEventBus);

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
      }}
    >
      <g>
        <PointerInteractor
          svgRef={svgRef}
          transformRef={transformRef}
          notationGraphStore={props.notationGraphStore}
          editorStateStore={props.editorStateStore}
          classVisibilityStore={props.classVisibilityStore}
        />

        {editorState === EditorMode.Default && (
          <DefaultModeOverlay
            svgRef={svgRef}
            editorStateStore={props.editorStateStore}
            selectedNodeStore={props.selectedNodeStore}
          />
        )}

        {editorState === EditorMode.NodeEditing && (
          <NodeEditorOverlay selectedNodeStore={props.selectedNodeStore} />
        )}

        {editorState === EditorMode.PrecedenceLinkEditing && (
          <PrecedenceLinkEditingOverlay
            svgRef={svgRef}
            transformRef={transformRef}
            editorStateStore={props.editorStateStore}
            notationGraphStore={props.notationGraphStore}
          />
        )}
      </g>
    </svg>
  );
}

function useZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  transformRef: RefObject<d3.ZoomTransform>,
  zoomEventBus: ZoomEventBus,
) {
  useEffect(() => {
    if (svgRef.current === null) return;

    const svgElement = d3.select(svgRef.current);
    const g = svgElement.select("g");
    const zoom = d3.zoom().on("zoom", zoomed);
    svgElement.call(zoom);
    customizeD3ZoomBehaviour(svgElement, zoom);

    function zoomed(event) {
      const { transform } = event as d3.D3ZoomEvent<any, any>;
      g.attr("transform", transform.toString());
      g.style("--scene-screen-pixel", 1.0 / transform.k);

      transformRef.current = transform;
      zoomEventBus.emitEvent(transform);
    }
  }, []);
}
