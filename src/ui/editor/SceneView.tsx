import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { SvgMungNode } from "./SvgMungNode";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { NotationGraphStore } from "./state/NotationGraphStore";
import { useAtomValue } from "jotai";
import { SvgEdgeNode } from "./SvgEdgeNode";
import { NodeEditorOverlay } from "./NodeEditorOverlay";

export interface SceneViewProps {
  readonly backgroundImageUrl: string | null;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

/**
 * The central surface of the editor. Displays the scene and its
 * contents visually. It provides visual navigation and interaction
 * with the scene to the user.
 */
export function SceneView(props: SceneViewProps) {
  const nodeList = useAtomValue(props.notationGraphStore.nodeListAtom);
  const edges = useAtomValue(props.notationGraphStore.edgesAtom);

  const svgRef = useRef<SVGSVGElement | null>(null);

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
    }
  }, []);

  return (
    <svg
      ref={svgRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#eee",
      }}
    >
      <defs>
        {/* Used by edges to render the arrow head */}
        {/* https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker */}
        <marker
          id="mung-edge-arrow-head"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>
      <g>
        <image
          x="0"
          y="0"
          href={props.backgroundImageUrl ?? undefined}
          style={{
            imageRendering: "pixelated",
          }}
        />
        {nodeList.map((nodeId) => (
          <SvgMungNode
            key={nodeId}
            nodeId={nodeId}
            notationGraphStore={props.notationGraphStore}
            selectedNodeStore={props.selectedNodeStore}
            classVisibilityStore={props.classVisibilityStore}
          />
        ))}
        {edges.map((edge) => (
          <SvgEdgeNode
            key={edge.id}
            edge={edge}
            notationGraphStore={props.notationGraphStore}
          />
        ))}
        <NodeEditorOverlay selectedNodeStore={props.selectedNodeStore} />
      </g>
    </svg>
  );
}

/**
 * Reconfigures the D3.js default zoom behaviour to be inkscape-like.
 */
function customizeD3ZoomBehaviour(
  svgElement: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  zoom: d3.ZoomBehavior<Element, unknown>,
) {
  // disable double-click zooming
  svgElement.on("dblclick.zoom", null);

  // mouse dragging will be done with the middle mouse button
  // or with the primary button while holding ctrl
  zoom.filter((event: MouseEvent) => {
    return (
      event.type === "wheel" ||
      event.type.startsWith("touch") ||
      (event.ctrlKey ? event.button == 0 : event.button == 1)
    );
  });

  // require CTRL key be pressed for wheel zooming
  const originalD3WheelZoomHandler = svgElement.on("wheel.zoom");
  svgElement.on("wheel.zoom", function (event: WheelEvent) {
    if (event.ctrlKey) {
      originalD3WheelZoomHandler?.call(this, event);
    }
  });

  // disable the fast zoom with the CTRL key
  // taken from the source code:
  // https://github.com/d3/d3-zoom/blob/main/src/zoom.js#L34
  zoom.wheelDelta(function (event: WheelEvent) {
    return (
      -event.deltaY *
      (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
    );
  });

  // wheel panning
  function panningDeltaScale(event: WheelEvent) {
    return event.deltaMode === 1 ? 25 : event.deltaMode ? 500 : 1;
  }
  svgElement.on("wheel.custom-pan", function (event: WheelEvent) {
    if (event.ctrlKey) return;
    const transform = svgElement.property("__zoom") as d3.ZoomTransform;
    const scale = (1 / transform.k) * panningDeltaScale(event);
    if (event.shiftKey) {
      zoom.translateBy(svgElement, -(event.deltaY + event.deltaX) * scale, 0);
    } else {
      zoom.translateBy(
        svgElement,
        -event.deltaX * scale,
        -event.deltaY * scale,
      );
    }
  });
}
